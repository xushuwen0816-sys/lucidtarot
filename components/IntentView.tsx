
import React, { useRef, useEffect, useState } from 'react';
import { Send, Sparkles, Check, ArrowRight, RotateCcw, Share2, MessageSquare, ThumbsUp, HelpCircle, Heart, Loader2, X, Shuffle, LayoutGrid, Flame, Droplets, Wind, Mountain, ChevronDown, ChevronUp } from 'lucide-react';
import { Spread, TarotReadingSession, TarotCard, ChatMessage, FeedbackType } from '../types';
import { recommendSpread, generateFullReading, chatWithTarot } from '../services/geminiService';
import { Button, Card, SectionTitle, LoadingSpinner, SimpleMarkdown, Modal, TarotCardImage } from './Shared';
import { generateTarotDeck } from './EnergyCheckView';

const SPREADS: Spread[] = [
    {
        id: 'inspiration_correspondence',
        name: '灵感对应',
        description: '连接表象与隐喻，寻找现实问题的灵性对应解法。',
        cardCount: 4,
        positions: [
            { id: 1, name: '表象', description: '现实中遇到的问题', x: 50, y: 80 },
            { id: 2, name: '隐喻', description: '潜意识的象征根源', x: 50, y: 20 },
            { id: 3, name: '连接', description: '整合转化的关键', x: 20, y: 50 },
            { id: 4, name: '启示', description: '灵性指引方向', x: 80, y: 50 }
        ]
    },
    {
        id: 'dream_decoder',
        name: '梦境解析',
        description: '解读梦境符号，链接潜意识讯息与清醒生活。',
        cardCount: 3,
        positions: [
            { id: 1, name: '梦境', description: '梦境的核心画面', x: 50, y: 20 },
            { id: 2, name: '讯息', description: '潜意识想要传达的', x: 25, y: 60 },
            { id: 3, name: '关联', description: '与现实生活的关联', x: 75, y: 60 }
        ]
    },
    {
        id: 'inner_compass',
        name: '内心指南针',
        description: '当感到迷茫时，重新校准内心的方向。',
        cardCount: 4,
        positions: [
            { id: 1, name: '北方', description: '理智与逻辑', x: 50, y: 20 },
            { id: 2, name: '南方', description: '激情与动力', x: 50, y: 80 },
            { id: 3, name: '东方', description: '新的启示', x: 80, y: 50 },
            { id: 4, name: '西方', description: '情感流动', x: 20, y: 50 }
        ]
    },
    {
        id: 'three_card_freestyle',
        name: '三张牌·自由解读',
        description: '无特定位置定义，依靠直觉读取三张牌的流动能量。',
        cardCount: 3,
        positions: [
            { id: 1, name: '牌一', description: '第一张牌', x: 20, y: 50 },
            { id: 2, name: '牌二', description: '第二张牌', x: 50, y: 50 },
            { id: 3, name: '牌三', description: '第三张牌', x: 80, y: 50 }
        ]
    },
    {
        id: 'three_card_time',
        name: '时间之流',
        description: '经典圣三角，解读过去、现在、未来的线性因果。',
        cardCount: 3,
        positions: [
            { id: 1, name: '过去', description: '过去的影响', x: 20, y: 50 },
            { id: 2, name: '现在', description: '当下的状态', x: 50, y: 50 },
            { id: 3, name: '未来', description: '未来的趋势', x: 80, y: 50 }
        ]
    },
    {
        id: 'four_elements',
        name: '四要素',
        description: '从火(行动)、水(情感)、风(思维)、土(物质)四个维度分析现状。',
        cardCount: 4,
        positions: [
            { id: 1, name: '火', description: '火：行动与热情', x: 50, y: 20 },
            { id: 2, name: '水', description: '水：情感与直觉', x: 80, y: 50 },
            { id: 3, name: '风', description: '风：思维与沟通', x: 20, y: 50 },
            { id: 4, name: '土', description: '土：物质与现实', x: 50, y: 80 }
        ]
    },
    {
        id: 'love_tree',
        name: '爱情之树',
        description: '深入分析关系现状、双方心境及未来走向。',
        cardCount: 5,
        positions: [
            { id: 1, name: '你', description: '你的状态', x: 20, y: 60 },
            { id: 2, name: '对方', description: '对方的状态', x: 80, y: 60 },
            { id: 3, name: '基础', description: '关系基础', x: 50, y: 80 },
            { id: 4, name: '阻碍', description: '挑战与阻碍', x: 50, y: 45 },
            { id: 5, name: '结果', description: '未来发展', x: 50, y: 20 }
        ]
    },
    {
        id: 'relationship_mirror',
        name: '关系镜面',
        description: '相互映射，看清对方眼中的你，以及你眼中的对方。',
        cardCount: 4,
        positions: [
            { id: 1, name: '你看对方', description: '你看对方', x: 25, y: 70 },
            { id: 2, name: '对方看你', description: '对方看你', x: 75, y: 70 },
            { id: 3, name: '你的需求', description: '你的真实需求', x: 25, y: 30 },
            { id: 4, name: '对方需求', description: '对方的真实需求', x: 75, y: 30 }
        ]
    },
    {
        id: 'ex_closure',
        name: '旧爱与和解',
        description: '分析分手原因、是否还有机会、以及如何疗愈。',
        cardCount: 5,
        positions: [
            { id: 1, name: '原因', description: '核心原因', x: 50, y: 80 },
            { id: 2, name: '你', description: '你的现状', x: 20, y: 50 },
            { id: 3, name: '对方', description: '对方现状', x: 80, y: 50 },
            { id: 4, name: '课题', description: '学到的课题', x: 50, y: 50 },
            { id: 5, name: '未来', description: '未来可能性', x: 50, y: 20 }
        ]
    },
    {
        id: 'choice',
        name: '二元选择',
        description: '面临两个选择（A或B）时，分析各自的发展趋势。',
        cardCount: 5,
        positions: [
            { id: 1, name: '现状', description: '当前处境', x: 50, y: 80 },
            { id: 2, name: '选择A', description: '选择A的过程', x: 25, y: 50 },
            { id: 3, name: '选择B', description: '选择B的过程', x: 75, y: 50 },
            { id: 4, name: '结果A', description: '选择A的结果', x: 25, y: 25 },
            { id: 5, name: '结果B', description: '选择B的结果', x: 75, y: 25 }
        ]
    },
    {
        id: 'career_star',
        name: '事业之星',
        description: '专注于职业发展、机遇与挑战的综合分析。',
        cardCount: 5,
        positions: [
            { id: 1, name: '现状', description: '职业现状', x: 50, y: 50 },
            { id: 2, name: '野心', description: '你的野心/目标', x: 50, y: 20 },
            { id: 3, name: '挑战', description: '面临的挑战', x: 80, y: 50 },
            { id: 4, name: '优势', description: '具备的优势', x: 20, y: 50 },
            { id: 5, name: '结果', description: '长期结果', x: 50, y: 80 }
        ]
    },
    {
        id: 'career_arrow',
        name: '事业之箭',
        description: '针对具体项目的执行策略与结果预测。',
        cardCount: 4,
        positions: [
            { id: 1, name: '目标', description: '目标', x: 50, y: 20 },
            { id: 2, name: '策略', description: '策略', x: 50, y: 40 },
            { id: 3, name: '隐因', description: '隐性因素', x: 50, y: 60 },
            { id: 4, name: '结果', description: '结果', x: 50, y: 80 }
        ]
    },
    {
        id: 'three_card_bms',
        name: '身心灵',
        description: '分析当下的身体状况、心智状态与灵性课题。',
        cardCount: 3,
        positions: [
            { id: 1, name: '身', description: '身体层面', x: 50, y: 80 },
            { id: 2, name: '心', description: '心智层面', x: 25, y: 40 },
            { id: 3, name: '灵', description: '灵性层面', x: 75, y: 40 }
        ]
    },
    {
        id: 'blind_spot',
        name: '盲点',
        description: '揭示你自己知道的、别人知道的、以及潜意识中谁都不知道的自己。',
        cardCount: 4,
        positions: [
            { id: 1, name: '公开自我', description: '公开的自我', x: 25, y: 25 },
            { id: 2, name: '隐藏自我', description: '隐藏的自我', x: 75, y: 25 },
            { id: 3, name: '盲点', description: '盲点的自我', x: 25, y: 75 },
            { id: 4, name: '未知', description: '未知的潜力', x: 75, y: 75 }
        ]
    },
    {
        id: 'chakra_7',
        name: '七脉轮',
        description: '从海底轮到顶轮，全方位扫描能量系统的堵塞与流动。',
        cardCount: 7,
        positions: [
            { id: 1, name: '海底轮', description: '海底轮 (生存)', x: 50, y: 90 },
            { id: 2, name: '本我轮', description: '本我轮 (创造)', x: 50, y: 78 },
            { id: 3, name: '太阳轮', description: '太阳轮 (意志)', x: 50, y: 66 },
            { id: 4, name: '心轮', description: '心轮 (爱)', x: 50, y: 54 },
            { id: 5, name: '喉轮', description: '喉轮 (表达)', x: 50, y: 42 },
            { id: 6, name: '眉心轮', description: '眉心轮 (直觉)', x: 50, y: 30 },
            { id: 7, name: '顶轮', description: '顶轮 (灵性)', x: 50, y: 18 }
        ]
    },
    {
        id: 'weekly_forecast',
        name: '本周运势',
        description: '针对接下来7天的能量概览、重点事件与建议。',
        cardCount: 3,
        positions: [
            { id: 1, name: '主题', description: '本周主题', x: 50, y: 20 },
            { id: 2, name: '挑战', description: '主要挑战', x: 25, y: 60 },
            { id: 3, name: '建议', description: '行动建议', x: 75, y: 60 }
        ]
    },
    {
        id: 'monthly_overview',
        name: '月度指引',
        description: '月初使用，规划一个月的重点方向。',
        cardCount: 4,
        positions: [
            { id: 1, name: '主题', description: '核心主题', x: 50, y: 20 },
            { id: 2, name: '情感', description: '情感运势', x: 20, y: 50 },
            { id: 3, name: '事业', description: '事业运势', x: 80, y: 50 },
            { id: 4, name: '健康', description: '健康建议', x: 50, y: 80 }
        ]
    },
    {
        id: 'birthday_return',
        name: '生日/太阳回归',
        description: '在生日当月使用，展望新一岁的成长课题。',
        cardCount: 5,
        positions: [
            { id: 1, name: '往昔', description: '过去一年的总结', x: 20, y: 50 },
            { id: 2, name: '主题', description: '新一岁的主题', x: 50, y: 20 },
            { id: 3, name: '礼物', description: '宇宙的礼物', x: 50, y: 50 },
            { id: 4, name: '挑战', description: '成长的挑战', x: 50, y: 80 },
            { id: 5, name: '建议', description: '核心建议', x: 80, y: 50 }
        ]
    },
    {
        id: 'celtic_cross',
        name: '凯尔特十字',
        description: '最经典的全面牌阵，用于深度解析复杂问题。',
        cardCount: 10,
        positions: [
            { id: 1, name: '核心', description: '核心现状', x: 38, y: 50 }, 
            { id: 2, name: '阻碍', description: '阻碍/挑战', x: 43, y: 55 }, 
            { id: 3, name: '潜意识', description: '潜意识/根源', x: 38, y: 72 },
            { id: 4, name: '过去', description: '过去的影响', x: 26, y: 50 },
            { id: 5, name: '显意识', description: '显意识/目标', x: 38, y: 28 },
            { id: 6, name: '未来', description: '即将发生', x: 50, y: 50 },
            { id: 7, name: '自我', description: '自我态度', x: 65, y: 72 },
            { id: 8, name: '环境', description: '环境影响', x: 65, y: 58 },
            { id: 9, name: '愿望恐惧', description: '希望与恐惧', x: 65, y: 44 },
            { id: 10, name: '结果', description: '最终结果', x: 65, y: 30 }
        ]
    },
    {
        id: 'horseshoe',
        name: '马蹄铁',
        description: '随着时间推移的发展过程，适合具体事件的演变。',
        cardCount: 7,
        positions: [
            { id: 1, name: '过去', description: '过去', x: 15, y: 20 },
            { id: 2, name: '现在', description: '现在', x: 15, y: 50 },
            { id: 3, name: '隐因', description: '隐因', x: 15, y: 80 },
            { id: 4, name: '阻碍', description: '阻碍', x: 50, y: 90 },
            { id: 5, name: '环境', description: '环境', x: 85, y: 80 },
            { id: 6, name: '建议', description: '建议', x: 85, y: 50 },
            { id: 7, name: '结果', description: '结果', x: 85, y: 20 }
        ]
    }
];

interface ReadingViewProps {
  onComplete: (session: TarotReadingSession) => void;
  onSessionUpdate?: (session: TarotReadingSession) => void;
}

const ReadingView: React.FC<ReadingViewProps> = ({ onComplete, onSessionUpdate }) => {
  const [step, setStep] = useState<'question' | 'spread' | 'draw' | 'reading'>('question');
  const [question, setQuestion] = useState('');
  const [selectedSpread, setSelectedSpread] = useState<Spread | null>(null);
  const [recommendedSpreadIds, setRecommendedSpreadIds] = useState<string[]>([]);
  const [showAllSpreads, setShowAllSpreads] = useState(false);
  
  const [deck, setDeck] = useState(() => generateTarotDeck());
  const [isShuffling, setIsShuffling] = useState(false);
  const [hasShuffled, setHasShuffled] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  
  // State for Four Elements Special Logic
  const [elementalDecks, setElementalDecks] = useState<{ [key: string]: TarotCard[] }>({});
  const [elementalSelections, setElementalSelections] = useState<{ [key: string]: TarotCard | null }>({
      fire: null, water: null, air: null, earth: null
  });

  const [session, setSession] = useState<TarotReadingSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [focusedCard, setFocusedCard] = useState<TarotCard | null>(null);
  const deckScrollRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === 'reading') {
        setTimeout(() => {
            mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    }
  }, [step]);

  const handleQuestionSubmit = async () => {
      if(!question.trim()) return;
      setIsLoading(true);
      const recIds = await recommendSpread(question, SPREADS);
      setRecommendedSpreadIds(recIds);
      setShowAllSpreads(false); // Reset to showing only recommended initially
      setStep('spread');
      setIsLoading(false);
  };

  const handleSelectSpread = (spread: Spread) => {
      setSelectedSpread(spread);
      setStep('draw');
      setHasShuffled(false);
      setSelectedIndices([]);
      // Reset Elemental State
      setElementalDecks({});
      setElementalSelections({ fire: null, water: null, air: null, earth: null });
  };

  const shuffleArray = (array: TarotCard[]) => {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
          newArray[i].isReversed = Math.random() > 0.5;
      }
      return newArray;
  };

  const handleShuffle = () => {
      setIsShuffling(true);
      setSelectedIndices([]);
      setElementalSelections({ fire: null, water: null, air: null, earth: null });

      setTimeout(() => {
          if (selectedSpread?.id === 'four_elements') {
              // Special Logic: Four Elements
              const fullDeck = generateTarotDeck();
              const minorArcana = fullDeck.filter(c => !c.nameEn.toLowerCase().startsWith('ar'));
              
              const fire = shuffleArray(minorArcana.filter(c => c.nameEn.toLowerCase().startsWith('wa')));
              const water = shuffleArray(minorArcana.filter(c => c.nameEn.toLowerCase().startsWith('cu')));
              const air = shuffleArray(minorArcana.filter(c => c.nameEn.toLowerCase().startsWith('sw')));
              const earth = shuffleArray(minorArcana.filter(c => c.nameEn.toLowerCase().startsWith('pe')));

              setElementalDecks({ fire, water, air, earth });
              setHasShuffled(true);
              setIsShuffling(false);

          } else {
              // Standard Logic
              const newDeck = shuffleArray(deck);
              setDeck(newDeck);
              setIsShuffling(false);
              setHasShuffled(true);
          }
      }, 1000);
  };
  
  useEffect(() => {
      if (hasShuffled && deckScrollRef.current) {
          const container = deckScrollRef.current;
          setTimeout(() => {
            container.scrollTo({
                left: (container.scrollWidth - container.clientWidth) / 2,
                behavior: 'smooth'
            });
          }, 300);
      }
  }, [hasShuffled]);

  const handleCardClick = async (index: number) => {
      if (!selectedSpread) return;
      if (selectedIndices.includes(index) || selectedIndices.length >= selectedSpread.cardCount) return;
      
      const newIndices = [...selectedIndices, index];
      setSelectedIndices(newIndices);

      if (newIndices.length === selectedSpread.cardCount) {
          setIsGenerating(true);
          setTimeout(() => startReading(newIndices), 1000);
      }
  };

  const handleElementCardClick = (element: string, card: TarotCard) => {
      if (elementalSelections[element] || isGenerating) return;
      
      const newSelections = { ...elementalSelections, [element]: card };
      setElementalSelections(newSelections);

      if (newSelections.fire && newSelections.water && newSelections.air && newSelections.earth) {
          setIsGenerating(true);
          setTimeout(() => startElementalReading(newSelections), 1000);
      }
  };

  const startElementalReading = async (selections: { [key: string]: TarotCard | null }) => {
      if (!selectedSpread || !selections.fire || !selections.water || !selections.air || !selections.earth) return;
      
      const drawnCards = [
          { ...selections.fire, position: '火' },
          { ...selections.water, position: '水' },
          { ...selections.air, position: '风' },
          { ...selections.earth, position: '土' },
      ];

      await processReading(drawnCards);
  };

  const startReading = async (indices: number[]) => {
      if (!selectedSpread) return;
      
      const drawnCards = indices.map((deckIdx, i) => {
          const card = deck[deckIdx];
          return {
              ...card,
              position: selectedSpread.positions[i]?.name || `Position ${i+1}`
          };
      });

      await processReading(drawnCards);
  };

  const processReading = async (drawnCards: TarotCard[]) => {
      if (!selectedSpread) return;
      try {
          const result = await generateFullReading(question, selectedSpread, drawnCards);
          
          // MAP MEANINGS FROM AI RESULT TO CARDS
          const cardsWithMeanings = drawnCards.map((card, index) => ({
              ...card,
              meaning: result.cardMeanings?.[index] || ""
          }));

          const newSession: TarotReadingSession = {
              id: crypto.randomUUID(),
              date: Date.now(),
              question,
              spreadId: selectedSpread.id,
              spreadName: selectedSpread.name,
              cards: cardsWithMeanings,
              interpretation: result.interpretation,
              chatHistory: [],
              feedback: null
          };
          
          setSession(newSession);
          onComplete(newSession);
          setStep('reading');
      } catch (error) {
          console.error(error);
      } finally {
          setIsGenerating(false);
      }
  }

  const handleFeedback = (type: FeedbackType) => {
      if (!session) return;
      const updatedSession = { ...session, feedback: type };
      setSession(updatedSession);
      if (onSessionUpdate) onSessionUpdate(updatedSession);
  };

  const handleChatSubmit = async () => {
      if (!chatInput.trim() || !session) return;
      
      const userMsg: ChatMessage = { role: 'user', text: chatInput };
      const updatedHistory = [...session.chatHistory, userMsg];
      
      const sessionWithUser = { ...session, chatHistory: updatedHistory };
      setSession(sessionWithUser);
      if (onSessionUpdate) onSessionUpdate(sessionWithUser);

      setChatInput('');
      setIsChatting(true);

      const aiResponse = await chatWithTarot(updatedHistory, session.interpretation);
      const modelMsg: ChatMessage = { role: 'model', text: aiResponse };
      
      setSession(prev => {
          if (!prev) return null;
          const finalSession = { ...prev, chatHistory: [...updatedHistory, modelMsg] };
          if (onSessionUpdate) onSessionUpdate(finalSession);
          return finalSession;
      });
      setIsChatting(false);
  };
  
  useEffect(() => {
      // Intelligent auto-scroll:
      // Only scroll to bottom if:
      // 1. We are currently loading (isChatting is true)
      // 2. OR The last message was sent by the USER.
      // If the AI just finished a message (isChatting false, last msg model),
      // we do NOT auto-scroll to bottom, allowing user to read from the top of the new answer.
      const lastMessage = session?.chatHistory[session.chatHistory.length - 1];
      const shouldScroll = isChatting || (lastMessage?.role === 'user');

      if (shouldScroll) {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [session?.chatHistory, isChatting]);


  return (
    <div ref={mainScrollRef} className="w-full h-full flex flex-col relative overflow-y-auto no-scrollbar scroll-smooth">
      <SectionTitle title="灵感占卜" subtitle="潜意识链接" />
      
      {/* STEP 1: QUESTION */}
      {step === 'question' && (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in p-6">
              <div className="max-w-xl w-full space-y-8">
                  <div className="text-center space-y-4">
                      <h3 className="text-3xl font-serif text-white tracking-wide">心中所惑，此刻求解</h3>
                      <p className="text-lucid-dim font-serif">Deep breaths. Focus on your intention.</p>
                  </div>
                  
                  <div className="relative group">
                      <div className="absolute inset-0 bg-lucid-glow/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      <textarea 
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          placeholder="例如：TA对我是什么想法？这段关系的未来发展如何？我最近的事业运势怎样？"
                          className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-xl text-white placeholder-stone-600 focus:outline-none focus:border-lucid-glow/50 focus:border-lucid-glow/50 focus:ring-1 focus:ring-lucid-glow/30 transition-all resize-none shadow-2xl relative z-10 font-serif leading-relaxed"
                          rows={4}
                      />
                  </div>
                  
                  <div className="flex justify-center">
                      <Button 
                          onClick={handleQuestionSubmit}
                          disabled={!question.trim() || isLoading}
                          className="px-10 py-4 text-base rounded-full shadow-[0_0_30px_rgba(253,186,116,0.2)]"
                      >
                          {isLoading ? <LoadingSpinner /> : <span className="flex items-center">开始连接 <ArrowRight className="ml-2 w-4 h-4" /></span>}
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {/* STEP 2: SPREAD SELECTION */}
      {step === 'spread' && (
          <div className="flex-1 animate-fade-in pb-20 px-4">
               <div className="max-w-5xl mx-auto">
                   <h3 className="text-xl text-white font-serif mb-6 flex items-center gap-2">
                       <LayoutGrid className="w-5 h-5 text-lucid-glow" /> 选择牌阵
                   </h3>
                   
                   {/* Recommended Spreads Section */}
                   <div className="mb-12">
                       <div className="flex items-center gap-2 mb-4">
                           <Sparkles className="w-4 h-4 text-lucid-glow animate-pulse" />
                           <span className="text-xs font-bold text-lucid-glow tracking-widest uppercase">LUCID 推荐</span>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           {SPREADS.filter(s => recommendedSpreadIds.includes(s.id)).map(spread => (
                               <Card 
                                   key={spread.id} 
                                   onClick={() => handleSelectSpread(spread)}
                                   className="cursor-pointer hover:bg-white/10 group transition-all duration-300 relative overflow-hidden border-lucid-glow/50 ring-1 ring-lucid-glow/20 bg-lucid-glow/5"
                               >
                                   <div className="flex justify-between items-start mb-2">
                                       <h4 className="text-lg font-serif text-white group-hover:text-lucid-glow transition-colors">{spread.name}</h4>
                                       <span className="text-xs bg-black/30 px-2 py-1 rounded text-stone-400">{spread.cardCount} 张</span>
                                   </div>
                                   <p className="text-xs text-stone-400 leading-relaxed font-sans">{spread.description}</p>
                                   <div className="mt-4 h-24 relative bg-black/20 rounded border border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                                       {spread.positions.map(pos => (
                                           <div 
                                               key={pos.id}
                                               className="absolute w-4 h-6 bg-lucid-glow/30 border border-lucid-glow/50 rounded-sm"
                                               style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                                           ></div>
                                       ))}
                                   </div>
                               </Card>
                           ))}
                       </div>
                   </div>
                   
                   {/* Show All Toggle */}
                   <div className="flex flex-col items-center">
                       <button 
                           onClick={() => setShowAllSpreads(!showAllSpreads)}
                           className="flex items-center gap-2 text-stone-500 hover:text-white transition-colors text-sm py-2 px-4 rounded-full hover:bg-white/5 mb-6"
                       >
                           {showAllSpreads ? (
                               <>收起其他牌阵 <ChevronUp className="w-4 h-4" /></>
                           ) : (
                               <>查看全部牌阵 <ChevronDown className="w-4 h-4" /></>
                           )}
                       </button>
                   </div>

                   {/* Other Spreads Grid */}
                   {showAllSpreads && (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                           {SPREADS.filter(s => !recommendedSpreadIds.includes(s.id)).map(spread => (
                               <Card 
                                   key={spread.id} 
                                   onClick={() => handleSelectSpread(spread)}
                                   className="cursor-pointer hover:bg-white/10 group transition-all duration-300 relative overflow-hidden border-white/5 opacity-80 hover:opacity-100"
                               >
                                   <div className="flex justify-between items-start mb-2">
                                       <h4 className="text-lg font-serif text-white group-hover:text-lucid-glow transition-colors">{spread.name}</h4>
                                       <span className="text-xs bg-black/30 px-2 py-1 rounded text-stone-400">{spread.cardCount} 张</span>
                                   </div>
                                   <p className="text-xs text-stone-400 leading-relaxed font-sans">{spread.description}</p>
                                   <div className="mt-4 h-24 relative bg-black/20 rounded border border-white/5 opacity-50 group-hover:opacity-100 transition-opacity">
                                       {spread.positions.map(pos => (
                                           <div 
                                               key={pos.id}
                                               className="absolute w-4 h-6 bg-white/10 border border-white/20 rounded-sm"
                                               style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                                           ></div>
                                       ))}
                                   </div>
                               </Card>
                           ))}
                       </div>
                   )}
               </div>
          </div>
      )}

      {/* STEP 3: SHUFFLE & DRAW */}
      {step === 'draw' && selectedSpread && (
          isGenerating ? (
              // --- TRANSITION / LOADING STATE (REPLACES DECK) ---
              <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
                   <div className="relative">
                       <div className="absolute inset-0 bg-lucid-glow/20 blur-[60px] rounded-full animate-pulse-slow"></div>
                       <div className="w-24 h-24 relative mb-10 z-10">
                           <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-lucid-glow animate-spin"></div>
                           <div className="absolute inset-4 rounded-full border-b-2 border-l-2 border-white/50 animate-spin-slow"></div>
                           <div className="absolute inset-0 flex items-center justify-center">
                               <Sparkles className="w-8 h-8 text-lucid-glow animate-pulse" />
                           </div>
                       </div>
                   </div>
                   <h3 className="text-2xl font-serif text-white tracking-[0.3em] mb-4 drop-shadow-md animate-pulse">LUCID IS READING</h3>
                   <div className="flex items-center gap-2">
                       <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />
                       <p className="text-stone-400 font-serif italic tracking-wide text-sm">正在链接潜意识星图...</p>
                   </div>
              </div>
          ) : (
              // --- NORMAL DRAWING STATE ---
              <div className="flex-1 flex flex-col relative animate-fade-in">
                   {/* Header Info */}
                   <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start px-6 pt-2 pointer-events-none">
                       <div className="pointer-events-auto">
                           <Button variant="ghost" onClick={() => setStep('spread')} className="text-xs text-stone-500 hover:text-white pl-0">
                               <X className="w-4 h-4 mr-1" /> 更换牌阵
                           </Button>
                       </div>
                       <div className="text-right">
                           <h3 className="text-lg text-white font-serif">{selectedSpread.name}</h3>
                           {selectedSpread.id !== 'four_elements' && (
                               <p className="text-xs text-lucid-glow tracking-widest">{selectedIndices.length} / {selectedSpread.cardCount}</p>
                           )}
                       </div>
                   </div>

                   {/* Center Action Area */}
                   <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
                       {!hasShuffled && (
                           <div className="text-center animate-fade-in z-30">
                               <div 
                                   onClick={handleShuffle}
                                   className={`w-40 h-60 bg-gradient-to-br from-stone-800 to-stone-900 rounded-xl border border-white/20 shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-500 group relative overflow-hidden`}
                               >
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                                    <div className="text-center relative z-10">
                                        <Shuffle className={`w-8 h-8 text-lucid-glow mx-auto mb-4 ${isShuffling ? 'animate-spin' : ''}`} />
                                        <span className="text-sm tracking-[0.2em] text-white uppercase block">Shuffle</span>
                                    </div>
                               </div>
                               <p className="mt-6 text-stone-400 font-serif animate-pulse">
                                   {selectedSpread.id === 'four_elements' 
                                    ? '点击进行四元素洗牌...' 
                                    : '点击洗牌，注入你的能量...'}
                               </p>
                           </div>
                       )}

                       {/* DECK AREA */}
                       {hasShuffled && (
                           selectedSpread.id === 'four_elements' ? (
                               // --- FOUR ELEMENTS UI ---
                               <div className="w-full flex-1 flex flex-col justify-start items-center py-10 gap-2 overflow-y-auto px-4 pb-20 no-scrollbar">
                                   <ElementalDeckRow 
                                        element="fire" 
                                        title="🔥 火元素" 
                                        description="行动 · 热情 · 创造力"
                                        cards={elementalDecks.fire} 
                                        selectedCard={elementalSelections.fire}
                                        onSelect={(c) => handleElementCardClick('fire', c)}
                                   />
                                   <ElementalDeckRow 
                                        element="water" 
                                        title="💧 水元素" 
                                        description="情感 · 直觉 · 潜意识"
                                        cards={elementalDecks.water} 
                                        selectedCard={elementalSelections.water}
                                        onSelect={(c) => handleElementCardClick('water', c)}
                                   />
                                   <ElementalDeckRow 
                                        element="air" 
                                        title="🌬️ 风元素" 
                                        description="思维 · 沟通 · 逻辑"
                                        cards={elementalDecks.air} 
                                        selectedCard={elementalSelections.air}
                                        onSelect={(c) => handleElementCardClick('air', c)}
                                   />
                                   <ElementalDeckRow 
                                        element="earth" 
                                        title="🌱 土元素" 
                                        description="物质 · 现实 · 成果"
                                        cards={elementalDecks.earth} 
                                        selectedCard={elementalSelections.earth}
                                        onSelect={(c) => handleElementCardClick('earth', c)}
                                   />
                               </div>
                           ) : (
                               // --- STANDARD UI ---
                               <div className="w-full flex-1 relative flex flex-col justify-end min-h-[500px]">
                                   {/* Text Overlay - Moved down to avoid header overlap - Top-16 */}
                                   <div className="absolute top-16 w-full text-center pointer-events-none z-[200] transition-opacity duration-500" style={{ opacity: selectedIndices.length === selectedSpread.cardCount ? 0 : 1 }}>
                                       <p className="text-xl font-serif text-white tracking-widest drop-shadow-lg">
                                           {selectedIndices.length === 0 ? "请抽取第一张牌" : "继续抽取下一张"}
                                       </p>
                                       <p className="text-sm text-lucid-glow mt-2 font-serif">
                                           位置: {selectedSpread.positions[selectedIndices.length]?.name}
                                       </p>
                                   </div>

                                   <div ref={deckScrollRef} className="w-full overflow-x-auto overflow-y-hidden no-scrollbar px-4 pt-80 pb-36 flex justify-start items-end h-full">
                                       <div className="flex items-end min-w-max h-full relative mx-auto px-32"> 
                                           {deck.map((card, idx) => {
                                               const isSelected = selectedIndices.includes(idx);
                                               const centerIndex = 39; 
                                               const distFromCenter = idx - centerIndex;
                                               const arcLift = 80;
                                               const yDrop = Math.pow(Math.abs(distFromCenter), 2) / 16;
                                               const normalTranslateY = -1 * arcLift + yDrop;
                                               const normalRotate = distFromCenter * 1.1;

                                               return (
                                                   <div 
                                                       key={card.id}
                                                       onClick={() => handleCardClick(idx)}
                                                       style={{ 
                                                           transform: isSelected 
                                                               ? `translateY(-180px) rotate(0deg) scale(1.1)` 
                                                               : `translateY(${normalTranslateY}px) rotate(${normalRotate}deg)`,
                                                           zIndex: isSelected ? 100 : 80 - Math.abs(distFromCenter),
                                                           marginLeft: idx === 0 ? '0' : '-1.8rem',
                                                           aspectRatio: '1 / 1.714'
                                                       }}
                                                       className={`
                                                           w-16 md:w-24 rounded-lg cursor-pointer shadow-xl transition-all duration-300 origin-bottom
                                                           bg-stone-800 flex-shrink-0 relative overflow-hidden
                                                           ${!isSelected ? 'hover:-translate-y-16 hover:scale-110 hover:shadow-lucid-glow/50' : ''}
                                                           ${isSelected ? 'ring-2 ring-lucid-glow shadow-[0_0_30px_rgba(253,186,116,0.5)]' : ''}
                                                       `}
                                                   >
                                                       <TarotCardImage card={card} showBack={true} />
                                                       {isSelected && (
                                                           <div className="absolute inset-0 flex items-center justify-center bg-black/40 font-bold text-white text-lg">
                                                               {selectedIndices.indexOf(idx) + 1}
                                                           </div>
                                                       )}
                                                   </div>
                                               );
                                           })}
                                       </div>
                                   </div>
                               </div>
                           )
                       )}
                   </div>
              </div>
          )
      )}

      {/* STEP 4: RESULT */}
      {step === 'reading' && session && (
          <div className="flex-1 pb-20 px-4 pt-4 animate-fade-in">
              <div className="max-w-4xl mx-auto space-y-12">
                  
                  {/* GEOMETRIC SPREAD LAYOUT */}
                  <div className="relative w-full max-w-2xl mx-auto mb-10 overflow-x-auto custom-scrollbar md:overflow-visible">
                      <div className="min-w-[320px] md:min-w-0 h-[450px] md:h-[600px] relative bg-white/[0.02] border border-white/5 rounded-[2rem] shadow-2xl backdrop-blur-sm">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                          
                          {session.cards.map((card, i) => {
                              // Find position definition from original spread
                              const spreadDef = SPREADS.find(s => s.id === session.spreadId);
                              const pos = spreadDef?.positions[i] || { x: 50, y: 50, name: 'Pos' }; // Fallback
                              
                              return (
                                  <div 
                                      key={i}
                                      onClick={() => setFocusedCard(card)}
                                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group flex flex-col items-center hover:z-50 transition-all duration-500"
                                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                  >
                                      <div 
                                          className="w-16 md:w-24 relative shadow-lg rounded-md transition-transform group-hover:scale-110 group-hover:shadow-lucid-glow/40 group-hover:-translate-y-2 border border-white/10"
                                          style={{ aspectRatio: '1 / 1.714' }}
                                      >
                                          <TarotCardImage card={card} />
                                          <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-stone-900 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white font-bold z-10">
                                              {i + 1}
                                          </div>
                                      </div>
                                      <span className="absolute top-full mt-2 text-[9px] md:text-[10px] bg-black/60 px-2 py-0.5 rounded text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm pointer-events-none">
                                          {pos.name}
                                      </span>
                                  </div>
                              );
                          })}
                      </div>
                      <p className="text-center text-xs text-stone-500 mt-4 font-serif italic">点击卡牌查看大图与详情</p>
                  </div>

                  {/* Interpretation Content */}
                  <div className="space-y-8">
                       <SectionTitle title="解读报告" subtitle="INTERPRETATION" />
                       <Card className="bg-black/20 border-white/5 p-8 md:p-12 relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-lucid-glow/5 rounded-full blur-[100px] pointer-events-none"></div>
                           <div className="relative z-10 text-stone-300 font-serif leading-loose text-lg md:text-xl">
                               <SimpleMarkdown content={session.interpretation} />
                           </div>
                           
                           {/* Feedback Actions */}
                           <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                               <p className="text-xs text-stone-500 uppercase tracking-widest">这条解读给您什么样的感受?</p>
                               <div className="flex gap-4">
                                   <button 
                                       onClick={() => handleFeedback('accurate')}
                                       className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs transition-all duration-300 ${session.feedback === 'accurate' ? 'bg-lucid-glow text-stone-900 font-bold shadow-lg shadow-lucid-glow/20' : 'bg-white/5 hover:bg-white/10 text-stone-400'}`}
                                   >
                                       <ThumbsUp className="w-3.5 h-3.5" /> 准
                                   </button>
                                   <button 
                                       onClick={() => handleFeedback('comforted')}
                                       className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs transition-all duration-300 ${session.feedback === 'comforted' ? 'bg-lucid-accent text-stone-900 font-bold shadow-lg shadow-lucid-accent/20' : 'bg-white/5 hover:bg-white/10 text-stone-400'}`}
                                   >
                                       <Heart className="w-3.5 h-3.5" /> 治愈
                                   </button>
                                   <button 
                                       onClick={() => handleFeedback('confused')}
                                       className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs transition-all duration-300 ${session.feedback === 'confused' ? 'bg-stone-200 text-stone-900 font-bold shadow-lg' : 'bg-white/5 hover:bg-white/10 text-stone-400'}`}
                                   >
                                       <HelpCircle className="w-3.5 h-3.5" /> 困惑
                                   </button>
                               </div>
                           </div>
                       </Card>

                       {/* Chat Section */}
                       <div className="transition-all duration-500 w-full max-w-3xl mx-auto pt-8">
                           <h3 className="text-xl font-serif text-white mb-4 flex items-center gap-2 animate-fade-in">
                               <Sparkles className="w-5 h-5 text-lucid-glow" /> 追问 LUCID
                           </h3>
                           
                           <div className={`
                                flex flex-col transition-all duration-500 rounded-2xl
                                ${session.chatHistory.length > 0 ? 'bg-white/5 border border-white/10 p-6 min-h-[300px]' : 'bg-transparent border-0 p-0'}
                           `}>
                               <div className={`flex-1 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 ${session.chatHistory.length > 0 ? 'mb-6' : 'mb-0 hidden'}`}>
                                   {session.chatHistory.map((msg, idx) => (
                                       <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                           <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                                               msg.role === 'user' 
                                               ? 'bg-lucid-glow/10 text-white rounded-tr-sm border border-lucid-glow/10' 
                                               : 'bg-black/30 text-stone-300 rounded-tl-sm border border-white/5'
                                           }`}>
                                               <SimpleMarkdown content={msg.text} />
                                           </div>
                                       </div>
                                   ))}
                                   {isChatting && (
                                       <div className="flex justify-start">
                                            <div className="bg-black/30 rounded-2xl p-4 rounded-tl-sm border border-white/5 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce delay-75"></div>
                                                <div className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce delay-150"></div>
                                            </div>
                                       </div>
                                   )}
                                   <div ref={chatEndRef}></div>
                               </div>
                               
                               <div className="relative">
                                   <input 
                                       value={chatInput}
                                       onChange={(e) => setChatInput(e.target.value)}
                                       onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                                       placeholder="对解读有疑问？请告诉我..."
                                       className={`w-full bg-black/40 border border-white/10 rounded-full text-white focus:outline-none focus:border-lucid-glow/30 transition-all font-serif
                                           ${session.chatHistory.length > 0 ? 'py-3 pl-6 pr-14 text-sm' : 'py-3 pl-6 pr-14 text-base'} 
                                       `}
                                   />
                                   <button 
                                       onClick={handleChatSubmit}
                                       disabled={!chatInput.trim() || isChatting}
                                       className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-lucid-glow/20 hover:bg-lucid-glow text-lucid-glow hover:text-black rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                       <Send className="w-4 h-4" />
                                   </button>
                               </div>
                           </div>
                       </div>
                  </div>
              </div>
          </div>
      )}
      
      {/* CARD DETAIL MODAL */}
      <Modal isOpen={!!focusedCard} onClose={() => setFocusedCard(null)}>
          {focusedCard && (
              <div className="text-center">
                  <div 
                      className="w-48 mx-auto rounded-xl overflow-hidden shadow-2xl mb-6 relative"
                      style={{ aspectRatio: '1 / 1.714' }}
                  >
                      <TarotCardImage card={focusedCard} />
                  </div>
                  <h3 className="text-3xl font-serif text-white mb-2">{focusedCard.name}</h3>
                  <div className="flex justify-center gap-2 mb-6">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-stone-400 uppercase tracking-widest">{focusedCard.position}</span>
                      <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-widest ${focusedCard.isReversed ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          {focusedCard.isReversed ? '逆位' : '正位'}
                      </span>
                  </div>
                  {/* CHANGED: Display Card Meaning if available, otherwise nothing */}
                  {focusedCard.meaning && (
                    <p className="text-stone-300 font-serif leading-loose text-lg px-8">
                        {focusedCard.meaning}
                    </p>
                  )}
              </div>
          )}
      </Modal>
    </div>
  );
};

// Helper Component for Elements Row
const ElementalDeckRow: React.FC<{
    element: string;
    title: string;
    description: string;
    cards: TarotCard[];
    selectedCard: TarotCard | null;
    onSelect: (card: TarotCard) => void;
}> = ({ title, description, cards, selectedCard, onSelect }) => {
    // If selected, we show just the selected card.
    // If not, we show the scrollable deck.
    
    return (
        <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
             <div className="flex justify-between items-center px-2">
                 <div>
                    <h4 className={`text-sm font-serif font-bold ${selectedCard ? 'text-lucid-glow' : 'text-stone-300'}`}>{title}</h4>
                    <p className="text-[10px] text-stone-500">{description}</p>
                 </div>
                 {selectedCard && (
                     <div className="text-[10px] bg-lucid-glow/10 text-lucid-glow px-2 py-1 rounded border border-lucid-glow/20 flex items-center gap-1">
                         <Check className="w-3 h-3" /> 已选择
                     </div>
                 )}
             </div>

             {selectedCard ? (
                 <div className="flex justify-center py-2 animate-fade-in cursor-pointer" onClick={() => { /* maybe allow re-select? */ }}>
                      <div className="w-16 rounded shadow-lg relative" style={{ aspectRatio: '1 / 1.714' }}>
                          <TarotCardImage card={selectedCard} showBack={false} />
                      </div>
                 </div>
             ) : (
                 <div className="w-full overflow-x-auto no-scrollbar pb-2">
                     <div className="flex gap-2 min-w-max px-2">
                         {cards.map((card, i) => (
                             <div 
                                key={card.id}
                                onClick={() => onSelect(card)}
                                className="w-12 rounded bg-stone-800 shadow-md flex-shrink-0 cursor-pointer hover:-translate-y-2 transition-transform duration-200 border border-white/5 hover:border-lucid-glow/50"
                                style={{ aspectRatio: '1 / 1.714' }}
                             >
                                 <TarotCardImage card={card} showBack={true} />
                             </div>
                         ))}
                     </div>
                 </div>
             )}
        </div>
    );
};

export default ReadingView;
