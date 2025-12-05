
import { GoogleGenAI, Type } from "@google/genai";
import { TarotCard, TarotReadingSession, Spread, DailyPractice, ChatMessage, JournalEntry } from "../types";

// Initialize Gemini Client Lazily
let aiInstance: GoogleGenAI | null = null;
const SILICONFLOW_BASE_URL = 'https://api.siliconflow.cn/v1';

let dynamicApiKey = typeof localStorage !== 'undefined' ? localStorage.getItem('lucid_api_key') || '' : '';
let currentProvider: 'gemini' | 'siliconflow' = (typeof localStorage !== 'undefined' ? localStorage.getItem('lucid_provider') as any : 'gemini') || 'gemini';

// --- HELPER: DATA SANITIZATION ---
const cleanJsonString = (str: string): string => {
  if (!str) return "{}";
  let cleaned = str.trim();
  
  // Remove markdown code blocks markers if present
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');

  // Extract JSON substring by finding the first brace/bracket and matching the closing one
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  if (firstBrace === -1 && firstBracket === -1) return "{}";
  
  let startIndex = 0;
  let isObject = false;

  // Determine if we are looking for an object or array based on which comes first
  if (firstBrace !== -1 && firstBracket !== -1) {
      if (firstBrace < firstBracket) {
          startIndex = firstBrace;
          isObject = true;
      } else {
          startIndex = firstBracket;
          isObject = false;
      }
  } else if (firstBrace !== -1) {
      startIndex = firstBrace;
      isObject = true;
  } else {
      startIndex = firstBracket;
      isObject = false;
  }

  const openChar = isObject ? '{' : '[';
  const closeChar = isObject ? '}' : ']';
  
  let balance = 0;
  let endIndex = -1;
  let inString = false;
  let escape = false;

  // Iterate to find the matching closing bracket
  for (let i = startIndex; i < cleaned.length; i++) {
      const char = cleaned[i];
      
      if (escape) {
          escape = false;
          continue;
      }
      
      if (char === '\\') {
          escape = true;
          continue;
      }
      
      if (char === '"') {
          inString = !inString;
          continue;
      }
      
      if (!inString) {
          if (char === openChar) {
              balance++;
          } else if (char === closeChar) {
              balance--;
              if (balance === 0) {
                  endIndex = i;
                  break;
              }
          }
      }
  }

  // If we found a valid end index, slice it
  if (endIndex !== -1) {
      return cleaned.substring(startIndex, endIndex + 1);
  }
  
  // Fallback: If counting failed (e.g. incomplete JSON), try simplistic lastIndexOf
  const lastIndex = isObject ? cleaned.lastIndexOf('}') : cleaned.lastIndexOf(']');
  if (lastIndex > startIndex) {
      return cleaned.substring(startIndex, lastIndex + 1);
  }
  
  // If all else fails, return the cleaned string (might still fail parsing)
  return cleaned.substring(startIndex);
};

const sanitizeString = (val: any): string => {
  if (!val) return "";
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
      return val.text || val.content || val.value || val.name || val.title || val.description || val.message || JSON.stringify(val);
  }
  return String(val);
};

// --- CONFIGURATION ---

const getInitialBaseUrl = () => {
  if (typeof localStorage === 'undefined') return '';
  const stored = localStorage.getItem('lucid_base_url');
  return stored || '';
};

let dynamicBaseUrl = getInitialBaseUrl();
let userName = typeof localStorage !== 'undefined' ? localStorage.getItem('lucid_user_name') || '旅行者' : '旅行者';

export const setAiConfig = (key: string, name: string, baseUrl?: string, provider: 'gemini' | 'siliconflow' = 'gemini') => {
  dynamicApiKey = key;
  userName = name || '旅行者';
  currentProvider = provider;
  
  if (baseUrl && baseUrl.trim().length > 0) {
      let cleanUrl = baseUrl.trim();
      cleanUrl = cleanUrl.replace(/\/+$/, '');
      if (!/^https?:\/\//i.test(cleanUrl)) {
          cleanUrl = `https://${cleanUrl}`;
      }
      if (provider === 'siliconflow' && cleanUrl.includes('workers.dev')) {
          dynamicBaseUrl = SILICONFLOW_BASE_URL;
      } else {
          dynamicBaseUrl = cleanUrl;
      }
  } else {
      if (provider === 'siliconflow') {
          dynamicBaseUrl = SILICONFLOW_BASE_URL;
      } else {
          dynamicBaseUrl = ''; // Direct connection for Gemini
      }
  }
  
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('lucid_api_key', key);
    localStorage.setItem('lucid_user_name', userName);
    localStorage.setItem('lucid_provider', provider);
    localStorage.setItem('lucid_base_url', dynamicBaseUrl || '');
  }
  aiInstance = null; 
};

export const hasApiKey = () => {
  return !!(process.env.API_KEY || dynamicApiKey);
};

const getAi = () => {
    if (!aiInstance) {
        const key = process.env.API_KEY || dynamicApiKey;
        const config: any = { apiKey: key || '' };
        if (dynamicBaseUrl && dynamicBaseUrl !== SILICONFLOW_BASE_URL) {
            config.baseUrl = dynamicBaseUrl;
        }
        aiInstance = new GoogleGenAI(config);
    }
    return aiInstance;
};

// --- SiliconFlow Adapter ---

const callSiliconFlow = async (
    systemPrompt: string, 
    userPrompt: string | { role: string, content: string }[], 
    jsonMode: boolean = false
): Promise<string> => {
    const key = dynamicApiKey || process.env.API_KEY;
    if (!key) throw new Error("API Key missing");

    const messages = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    if (Array.isArray(userPrompt)) {
        messages.push(...userPrompt);
    } else {
        messages.push({ role: "user", content: userPrompt });
    }

    const baseUrl = dynamicBaseUrl || SILICONFLOW_BASE_URL;

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: "deepseek-ai/DeepSeek-V3", 
                messages: messages,
                stream: false,
                response_format: jsonMode ? { type: "json_object" } : undefined
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`SiliconFlow API Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    } catch (error: any) {
        console.error("SiliconFlow Call Failed:", error);
        throw error;
    }
};

export const checkConnection = async (): Promise<{ success: boolean; message?: string }> => {
    try {
        if (currentProvider === 'siliconflow') {
             await callSiliconFlow("", "Hello");
             return { success: true };
        } else {
            await getAi().models.generateContent({
                model: "gemini-2.5-flash",
                contents: "ping",
                config: { maxOutputTokens: 1 }
            });
            return { success: true };
        }
    } catch (error: any) {
        return { success: false, message: error.message || "连接失败" };
    }
};

// --- CORE TAROT SERVICES ---

// 1. Recommend Spread based on Question
export const recommendSpread = async (question: string, availableSpreads: Spread[]): Promise<string[]> => {
    const prompt = `
        User Question: "${question}"
        Available Spreads:
        ${availableSpreads.map(s => `- ID: ${s.id}, Name: ${s.name}, Desc: ${s.description}`).join('\n')}

        Based on the user's question, recommend the top 3 most suitable spread IDs.
        Return strictly a JSON array of strings, e.g.: ["id1", "id2", "id3"]
        Do not add markdown formatting.
    `;

    try {
        let text = "";
        if (currentProvider === 'siliconflow') {
            text = await callSiliconFlow("You are a Tarot expert. Output JSON array.", prompt, true);
        } else {
            const response = await getAi().models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            text = response.text || "[]";
        }
        
        const cleaned = cleanJsonString(text);
        try {
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.slice(0, 3);
            }
        } catch (parseError) {
             console.error("JSON Parse Error in recommendSpread:", parseError, "Cleaned text:", cleaned);
        }
        return [availableSpreads[0].id];
    } catch (e) {
        console.error("Recommend spread error", e);
        return [availableSpreads[0].id];
    }
};

// 2. Interpret Reading
export const generateFullReading = async (
    question: string,
    spread: Spread,
    cards: TarotCard[]
): Promise<{ interpretation: string; cardMeanings: string[] }> => {
    
    // Logic for spread-specific instructions
    let specialSpreadInstructions = "";
    if (spread.id === 'three_card_freestyle') {
        specialSpreadInstructions = `
        **SPECIAL LAYOUT RULES FOR 'three_card_freestyle'**:
        - This is a "Center + Wings" structure, NOT a timeline.
        - **Card 2 (Middle)** is the CORE/MAIN answer/theme. Focus heavily on this card.
        - **Card 1 (Left) and Card 3 (Right)** are AUXILIARY. They modify, support, or add detail to the core meaning of Card 2.
        - Do NOT interpret this spread as "Past, Present, Future". Interpret it as "Central Energy (2) flanked by Influences (1 & 3)".
        `;
    }

    const cardsDesc = cards.map((c, i) => {
        const pos = spread.positions[i];
        return `Position ${i+1} (${pos.name} - ${pos.description}): Card [${c.name}], ${c.isReversed ? 'Reversed' : 'Upright'}`;
    }).join('\n');

    const prompt = `
        You are a mystical and wise Tarot Reader named LUCID.
        User Name: ${userName}.
        Question: "${question}".
        Spread: ${spread.name} (${spread.description}).
        
        Cards Drawn:
        ${cardsDesc}

        **CRITICAL INTERPRETATION RULES**:
        1. **Subject Analysis**: 
           - If the user asks about **themselves** ("I", "me", "my"), the cards primarily reflect the **user's** internal state, subconscious, or actions.
           - If the user asks about **someone else** ("he", "she", "they", "specific person"), the cards likely reflect **that person's** thoughts, feelings, or situation (unless the position specifically says "Querent").
        
        2. **Gender & Archetypes**:
           - Pay close attention to Court Cards (King, Queen, Knight, Page) and Major Arcana archetypes (Emperor, Empress).
           - **Kings/Knights/Emperor**: Often represent Masculine energy, Men, Father figures, or Bosses.
           - **Queens/Empress/High Priestess**: Often represent Feminine energy, Women, or Mother figures.
           - **Pages**: Often represent Young people, Students, Children, or immature energy regardless of gender.
           - Use these archetypes to identify *who* the card is talking about in the context of the question (e.g., in a love reading, a King often represents the male partner).

        ${specialSpreadInstructions}

        Please provide a deep, healing, and empowering interpretation.
        
        Format requirements:
        1. **Overview**: A summary of the energy.
        2. **Card by Card**: Brief analysis of each card in its position.
        3. **Synthesis**: How the cards interact.
        4. **Guidance**: Actionable advice.

        Output strictly as JSON:
        {
            "interpretation": "The full markdown formatted text of the reading...",
            "cardMeanings": ["Specific meaning for card 1", "Specific meaning for card 2", ...] (MUST provide a specific string for EVERY card drawn. Do not omit.)
        }
        Language: Chinese (Warm, mystical, professional).
    `;

    try {
        let jsonStr = "";
        if (currentProvider === 'siliconflow') {
            jsonStr = await callSiliconFlow("You are a Tarot Reader. Output JSON.", prompt, true);
        } else {
            const response = await getAi().models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            jsonStr = response.text || "{}";
        }
        
        const cleaned = cleanJsonString(jsonStr);
        const parsed = JSON.parse(cleaned);
        return {
            interpretation: sanitizeString(parsed.interpretation),
            cardMeanings: Array.isArray(parsed.cardMeanings) ? parsed.cardMeanings.map(sanitizeString) : []
        };
    } catch (error) {
        console.error("Reading generation error", error);
        return {
            interpretation: "The stars are clouded. Please try interpreting the cards with your intuition.",
            cardMeanings: cards.map(() => "Energy unclear")
        };
    }
};

export const generateTarotReading = generateFullReading;

// 3. Chat with Tarot (Follow-up)
export const chatWithTarot = async (
    history: ChatMessage[], 
    readingContext: string
): Promise<string> => {
    const systemPrompt = `
        You are LUCID, a Tarot Reader. 
        Context of the reading:
        ${readingContext}
        
        Answer the user's follow-up questions based on the cards drawn and the interpretation.
        Be concise, wise, and comforting. Use Chinese.
    `;

    try {
        if (currentProvider === 'siliconflow') {
            const msgs = history.map(h => ({
                role: h.role === 'model' ? 'assistant' : 'user',
                content: h.text
            }));
            return await callSiliconFlow(systemPrompt, msgs);
        } else {
            // Gemini
             const contents = history.map((msg, index) => {
                let text = msg.text;
                if (index === 0 && msg.role === 'user') {
                  text = `${systemPrompt}\n\n[User]: ${text}`;
                }
                return {
                  role: msg.role === 'model' ? 'model' : 'user',
                  parts: [{ text: text }]
                };
            });
            const response = await getAi().models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents
            });
            return response.text || "Info retrieved.";
        }
    } catch (e) {
        return "Connection interrupted.";
    }
};

// 4. Daily Energy (Simplified)
export const generateDailyReading = async (
    drawnCards: TarotCard[]
): Promise<{ guidance: string, cards: TarotCard[] }> => {
    const prompt = `
        Daily Energy Check for ${userName}.
        Cards: ${drawnCards.map(c => `${c.position || 'Position'}: ${c.name} (${c.isReversed ? 'Rev' : 'Upr'})`).join(', ')}.
        
        **ROLE**: You are a PROFOUND SOUL MENTOR and SPIRITUAL GUIDE.
        
        **TASK**: Analyze the psychological and spiritual energy for the user today based on these cards.
        
        **CRITICAL STYLE GUIDELINES**:
        1. **Language**: Modern, grounded, conversational Chinese (大白话). 
        2. **Tone**: Mature, insightful, and empathetic. **DO NOT be childish, superficial, or overly "peppy".** Avoid clichés.
        3. **Content**: Focus on "Why this is happening" and "What the soul is learning". Dig deeper than surface level luck.
        4. Provide a clear, cohesive narrative that connects the Body, Mind, and Spirit cards.
        
        JSON Output:
        {
            "guidance": "A deep, insightful analysis of today's energy (approx 80-100 words). Focus on internal growth and awareness.",
            "cardMeanings": ["Insight for body energy", "Insight for mental state", "Insight for spiritual path"]
        }
    `;

    try {
        let jsonStr = "";
        if (currentProvider === 'siliconflow') {
             jsonStr = await callSiliconFlow("Deep Spiritual Mentor. JSON.", prompt, true);
        } else {
             const response = await getAi().models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
             jsonStr = response.text || "{}";
        }
        const cleaned = cleanJsonString(jsonStr);
        const parsed = JSON.parse(cleaned);
        
        const finalCards = drawnCards.map((c, i) => ({
            ...c,
            meaning: parsed.cardMeanings?.[i] || "Energy"
        }));

        return {
            guidance: sanitizeString(parsed.guidance),
            cards: finalCards
        };

    } catch (e) {
        console.error("Daily reading error", e);
        return {
            guidance: "Trust your intuition today.",
            cards: drawnCards.map(c => ({ ...c, meaning: "..." }))
        };
    }
};

export const generateDailyPractice = async (context: string): Promise<DailyPractice> => {
    const prompt = `
        Based on this tarot reading context: "${context}"
        Generate a daily practice for ${userName}.
        
        **REQUIREMENTS**:
        1. **actionStep**: MUST be a **SIMPLE, EASY-TO-EXECUTE MICRO-HABIT**.
           - **DO NOT** specify exact times (like "at 3pm"). 
           - **DO NOT** require specific items that might not be available (like "herbal tea", "candles").
           - **DO** focus on body awareness, breathing, simple observation, or mindset shifts.
           - Examples of GOOD actions: "Take 3 deep breaths when you feel stressed", "Look at the sky for 1 minute", "Stretch your arms up and release tension", "Write down one thing you are grateful for".
           - Keep it flexible and low-pressure.
        
        JSON: { 
            "energyStatus": "Short poetic phrase (e.g. 静谧之海, 破茧成蝶)", 
            "todaysAffirmation": "One powerful sentence to reprogram the subconscious", 
            "actionStep": "One simple, flexible, physical action." 
        }
        Language: Chinese.
    `;
    try {
        let jsonStr = "";
        if (currentProvider === 'siliconflow') {
            jsonStr = await callSiliconFlow("Action Coach. JSON.", prompt, true);
        } else {
            const response = await getAi().models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            jsonStr = response.text || "{}";
        }
        const cleaned = cleanJsonString(jsonStr);
        const parsed = JSON.parse(cleaned);
        return {
            energyStatus: sanitizeString(parsed.energyStatus),
            todaysAffirmation: sanitizeString(parsed.todaysAffirmation),
            actionStep: sanitizeString(parsed.actionStep)
        };
    } catch(e) {
        return { energyStatus: "Peace", todaysAffirmation: "I am calm.", actionStep: "Breathe deeply 3 times." };
    }
};

export const analyzeJournalEntry = async (content: string): Promise<JournalEntry['aiAnalysis'] | null> => {
    const prompt = `
        Analyze this journal entry for a spiritual self-discovery context.
        User's entry: "${content}"

        Provide a psychological and spiritual analysis.
        1. Emotional State: Key emotions detected (max 3).
        2. Blocks Identified: Any limiting beliefs or resistance? (max 3)
        3. High Self Traits: Positive qualities or wisdom showing through (max 3).
        4. Insight/Summary: Deep reflection on what this means (approx 50 words).
        5. Tomorrow's Advice: One actionable spiritual or mindset advice.

        Output JSON:
        {
            "emotionalState": ["..."],
            "blocksIdentified": ["..."],
            "highSelfTraits": ["..."],
            "summary": "...",
            "tomorrowsAdvice": "..."
        }
        Language: Chinese.
    `;

    try {
        let jsonStr = "";
        if (currentProvider === 'siliconflow') {
            jsonStr = await callSiliconFlow("Expert Psychologist/Healer. JSON.", prompt, true);
        } else {
            const response = await getAi().models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            jsonStr = response.text || "{}";
        }
        
        const cleaned = cleanJsonString(jsonStr);
        const parsed = JSON.parse(cleaned);
        return {
            emotionalState: parsed.emotionalState || [],
            blocksIdentified: parsed.blocksIdentified || [],
            highSelfTraits: parsed.highSelfTraits || [],
            summary: sanitizeString(parsed.summary),
            tomorrowsAdvice: sanitizeString(parsed.tomorrowsAdvice)
        };
    } catch (error) {
        console.error("Journal analysis error", error);
        return null;
    }
};
