
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
  cleaned = cleaned.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
  return cleaned;
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
export const recommendSpread = async (question: string, availableSpreads: Spread[]): Promise<string> => {
    const prompt = `
        User Question: "${question}"
        Available Spreads:
        ${availableSpreads.map(s => `- ID: ${s.id}, Name: ${s.name}, Desc: ${s.description}`).join('\n')}

        Based on the user's question, recommend the single most suitable spread ID from the list.
        Return ONLY the ID string.
    `;

    try {
        if (currentProvider === 'siliconflow') {
            return await callSiliconFlow("You are a Tarot expert.", prompt);
        } else {
            const response = await getAi().models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });
            return response.text?.trim() || availableSpreads[0].id;
        }
    } catch (e) {
        return availableSpreads[0].id;
    }
};

// 2. Interpret Reading
export const generateFullReading = async (
    question: string,
    spread: Spread,
    cards: TarotCard[]
): Promise<{ interpretation: string; cardMeanings: string[] }> => {
    
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

        Please provide a deep, healing, and empowering interpretation.
        
        Format requirements:
        1. **Overview**: A summary of the energy.
        2. **Card by Card**: Brief analysis of each card in its position.
        3. **Synthesis**: How the cards interact.
        4. **Guidance**: Actionable advice.

        Output strictly as JSON:
        {
            "interpretation": "The full markdown formatted text of the reading...",
            "cardMeanings": ["Short meaning for card 1", "Short meaning for card 2", ...] (One string per card, matching the order)
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
        
        const parsed = JSON.parse(cleanJsonString(jsonStr));
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
        const parsed = JSON.parse(cleanJsonString(jsonStr));
        
        const finalCards = drawnCards.map((c, i) => ({
            ...c,
            meaning: parsed.cardMeanings?.[i] || "Energy"
        }));

        return {
            guidance: sanitizeString(parsed.guidance),
            cards: finalCards
        };

    } catch (e) {
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
        1. **actionStep**: MUST be a **CONCRETE, PHYSICAL ACTION**. 
           - Bad: "Be happy today", "Think positive".
           - Good: "Drink a glass of warm lemon water at 8AM", "Write down 3 fears on a piece of paper and tear it up", "Walk barefoot on grass for 5 minutes".
           - It must be something the user can physically DO with their body or hands.
        
        JSON: { 
            "energyStatus": "Short poetic phrase (e.g. 静谧之海, 破茧成蝶)", 
            "todaysAffirmation": "One powerful sentence to reprogram the subconscious", 
            "actionStep": "One specific, physical, executable action with details (time/object/method)." 
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
        const parsed = JSON.parse(cleanJsonString(jsonStr));
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
        
        const parsed = JSON.parse(cleanJsonString(jsonStr));
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
