
import React, { useState, useEffect, useRef } from 'react';
import { generateDailyReading, generateDailyPractice } from '../services/geminiService';
import { TarotCard, DailyPractice, DailyRecord } from '../types';
import { Button, Card, SectionTitle, LoadingSpinner, TabNav, TarotCardImage, SimpleMarkdown } from './Shared';
import { CreditCard, Sun, Shuffle, RotateCcw, Sparkles, Loader2 } from 'lucide-react';

interface EnergyCheckViewProps {
    onSaveDaily: (record: DailyRecord) => void;
}

export const generateTarotDeck = (): TarotCard[] => {
    const majors = [
        { name: "愚者", nameEn: "ar00" }, { name: "魔术师", nameEn: "ar01" }, { name: "女祭司", nameEn: "ar02" }, 
        { name: "女皇", nameEn: "ar03" }, { name: "皇帝", nameEn: "ar04" }, { name: "教皇", nameEn: "ar05" }, 
        { name: "恋人", nameEn: "ar06" }, { name: "战车", nameEn: "ar07" }, { name: "力量", nameEn: "ar08" }, 
        { name: "隐士", nameEn: "ar09" }, { name: "命运之轮", nameEn: "ar10" }, { name: "正义", nameEn: "ar11" }, 
        { name: "倒吊人", nameEn: "ar12" }, { name: "死神", nameEn: "ar13" }, { name: "节制", nameEn: "ar14" }, 
        { name: "恶魔", nameEn: "ar15" }, { name: "高塔", nameEn: "ar16" }, { name: "星星", nameEn: "ar17" }, 
        { name: "月亮", nameEn: "ar18" }, { name: "太阳", nameEn: "ar19" }, { name: "审判", nameEn: "ar20" }, 
        { name: "世界", nameEn: "ar21" }
    ];

    const suits = [
        { name: "权杖", code: "wa" }, 
        { name: "圣杯", code: "cu" }, 
        { name: "宝剑", code: "sw" }, 
        { name: "星币", code: "pe" }
    ];
    
    const ranks = [
        { name: "一", code: "01" }, { name: "二", code: "02" }, { name: "三", code: "03" }, 
        { name: "四", code: "04" }, { name: "五", code: "05" }, { name: "六", code: "06" }, 
        { name: "七", code: "07" }, { name: "八", code: "08" }, { name: "九", code: "09" }, 
        { name: "十", code: "10" }, { name: "侍从", code: "11" }, { name: "骑士", code: "12" }, 
        { name: "王后", code: "13" }, { name: "国王", code: "14" }
    ];
    
    let deck: TarotCard[] = [];
    let idCounter = 0;

    majors.forEach(m => deck.push({ id: idCounter++, name: m.name, nameEn: m.nameEn, isReversed: false }));
    suits.forEach(suit => {
        ranks.forEach(rank => {
            deck.push({ 
                id: idCounter++, 
                name: `${suit.name}${rank.name}`, 
                nameEn: `${suit.code}${rank.code}`,
                isReversed: false 
            });
        });
    });
    return deck;
};

const EnergyCheckView: React.FC<EnergyCheckViewProps> = ({ onSaveDaily }) => {
  const [activeTab, setActiveTab] = useState<'tarot' | 'practice'>('tarot');
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [deck, setDeck] = useState(() => generateTarotDeck());
  const [isShuffling, setIsShuffling] = useState(false);
  const [hasShuffled, setHasShuffled] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isRevealing, setIsRevealing] = useState(false); 
  
  const [dailyReading, setDailyReading] = useState<{cards: TarotCard[], guidance: string} | null>(null);
  const [practice, setPractice] = useState<DailyPractice | null>(null);

  const deckScrollRef = useRef<HTMLDivElement>(null);
  const getTodayKey = () => new Date().toLocaleDateString('zh-CN');

  useEffect(() => {
      const saved = localStorage.getItem(`lucid_daily_${getTodayKey()}`);
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              setDailyReading(parsed.reading);
              setPractice(parsed.practice);
              if (parsed.reading) setHasShuffled(true);
          } catch(e) { console.error(e) }
      }
  }, []);

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

  const handleShuffle = () => {
      setIsShuffling(true);
      setDailyReading(null);
      setSelectedIndices([]);
      setIsRevealing(false);
      setPractice(null); 
      
      setTimeout(() => {
          const newDeck = [...deck];
          for (let i = newDeck.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
              newDeck[i].isReversed = Math.random() > 0.5; 
          }
          setDeck(newDeck);
          setIsShuffling(false);
          setHasShuffled(true);
      }, 1000);
  };

  const handleCardClick = async (index: number) => {
      if (selectedIndices.length >= 3 || selectedIndices.includes(index) || isRevealing || loading) return;
      
      const newSelected = [...selectedIndices, index];
      setSelectedIndices(newSelected);

      if (newSelected.length === 3) {
          setIsRevealing(true); 
          setLoading(true);

          // Wait a moment for visual effect then generate
          setTimeout(async () => {
              const drawnCards = newSelected.map((deckIndex, i) => {
                  const card = deck[deckIndex];
                  return {
                      ...card,
                      position: i === 0 ? '身' : i === 1 ? '心' : '灵'
                  };
              }); 
    
              try {
                  const result = await generateDailyReading(drawnCards);
                  setDailyReading(result);
                  
                  const context = `${result.guidance}. Cards: ${result.cards.map(c => c.name).join(', ')}`;
                  const prac = await generateDailyPractice(context);
                  setPractice(prac);
    
                  const record: DailyRecord = {
                      date: Date.now(),
                      reading: result,
                      practice: prac
                  };
                  
                  localStorage.setItem(`lucid_daily_${getTodayKey()}`, JSON.stringify(record));
                  onSaveDaily(record);
    
              } catch (error) {
                  console.error("Daily reading failed", error);
              } finally {
                  setLoading(false);
                  setIsRevealing(false);
              }
          }, 1000);
      }
  };

  const resetTarot = () => {
      setHasShuffled(false);
      setSelectedIndices([]);
      setDailyReading(null);
      setPractice(null);
      setIsRevealing(false);
      setDeck(generateTarotDeck()); 
      localStorage.removeItem(`lucid_daily_${getTodayKey()}`);
      
      if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  const positions = ['身', '心', '灵'];

  // --- TRANSITION VIEW ---
  if (loading || isRevealing) {
      return (
        <div className="w-full h-full flex flex-col">
            <SectionTitle title="每日能量" subtitle="频率校准" />
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
                <h3 className="text-2xl font-serif text-white tracking-[0.3em] mb-4 drop-shadow-md animate-pulse">CONNECTING</h3>
                <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />
                    <p className="text-stone-400 font-serif italic tracking-wide text-sm">正在解读今日能量场...</p>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <SectionTitle title="每日能量" subtitle="频率校准" />

      <TabNav 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
            { id: 'tarot', icon: CreditCard, label: '灵感塔罗' },
            { id: 'practice', icon: Sun, label: '今日指引' },
        ]}
      />

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-20 no-scrollbar animate-fade-in relative">
        {activeTab === 'tarot' && (
        <div className="w-full h-full flex flex-col">
            
            {/* 1. INITIAL / SHUFFLE STATE */}
            {!hasShuffled && !dailyReading && (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] px-4">
                    <div className="text-center animate-fade-in z-30">
                        <div 
                            onClick={handleShuffle}
                            className="w-40 h-60 bg-gradient-to-br from-stone-800 to-stone-900 rounded-xl border border-white/20 shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-500 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                            <div className="text-center relative z-10">
                                <Shuffle className={`w-8 h-8 text-lucid-glow mx-auto mb-4 ${isShuffling ? 'animate-spin' : ''}`} />
                                <span className="text-sm tracking-[0.2em] text-white uppercase block">Shuffle</span>
                            </div>
                        </div>
                        <p className="mt-6 text-stone-400 font-serif animate-pulse">点击洗牌，注入今日能量...</p>
                    </div>
                </div>
            )}

            {/* 2. DRAWING STATE - FULL WIDTH DECK */}
            {hasShuffled && !dailyReading && (
                <div className="w-full flex-1 relative flex flex-col justify-end min-h-[500px]">
                        {/* Text Overlay */}
                        <div className="absolute top-0 pt-2 w-full text-center pointer-events-none z-[200] transition-opacity duration-500" style={{ opacity: selectedIndices.length === 3 ? 0 : 1 }}>
                        <p className="text-xl font-serif text-white tracking-widest drop-shadow-lg">
                            {selectedIndices.length === 0 ? "请抽取第一张牌" : "继续抽取下一张"}
                        </p>
                        <p className="text-sm text-lucid-glow mt-2 font-serif">
                            位置: {positions[selectedIndices.length] || 'Completed'}
                        </p>
                        <p className="text-lucid-dim text-xs mt-1">{selectedIndices.length} / 3</p>
                    </div>
                    
                    {/* DECK SCROLL AREA - Increased Top Padding to prevent clipping, Decreased Bottom Padding to lower cards */}
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
            )}
            
            {/* 3. RESULT STATE */}
            {dailyReading && (
                <div className="w-full max-w-4xl mx-auto px-4 space-y-12 animate-fade-in pb-10">
                    <div className="flex flex-col md:flex-row justify-center gap-8 mt-8">
                        {dailyReading.cards.map((card, idx) => (
                            <div key={idx} className="relative w-full md:w-56 animate-fade-in flex flex-col items-center p-4 rounded-xl hover:bg-white/5 transition-colors">
                                <div 
                                    className="relative w-48 rounded-lg shadow-2xl transition-all duration-700 hover:scale-105 bg-black"
                                    style={{ aspectRatio: '1 / 1.714' }}
                                >
                                    <TarotCardImage card={card} />
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.2em] text-lucid-glow opacity-90 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full whitespace-nowrap z-10 border border-lucid-glow/20">
                                        {card.position}
                                    </span>
                                </div>
                                
                                <div className="mt-6 text-center w-full">
                                    <div className="flex items-center justify-center gap-2 mb-3">
                                        <h4 className="text-xl font-serif text-white tracking-wide">{card.name}</h4>
                                        <span className="text-[10px] text-stone-500 bg-white/10 px-1.5 py-0.5 rounded uppercase tracking-wider">{card.isReversed ? '逆' : '正'}</span>
                                    </div>
                                    <p className="text-sm text-stone-300 font-serif leading-loose opacity-90">
                                        {card.meaning}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Card className="bg-gradient-to-b from-white/5 to-transparent border-t border-white/10 mt-8 mx-auto max-w-3xl !p-12">
                        <h4 className="text-xl font-serif text-lucid-glow mb-8 text-center tracking-[0.3em] uppercase">✨ 宇宙讯息</h4>
                        <div className="text-stone-200 font-serif leading-loose text-justify text-xl md:text-2xl px-4 md:px-8 font-light">
                            <SimpleMarkdown content={dailyReading.guidance} />
                        </div>
                    </Card>
                    
                    <div className="text-center cursor-pointer relative z-10 pb-8">
                        <Button onClick={resetTarot} variant="ghost" className="text-stone-500 hover:text-white">
                            <RotateCcw className="w-4 h-4 mr-2" /> 重新抽取
                        </Button>
                    </div>
                </div>
            )}
        </div>
        )}

        {activeTab === 'practice' && (
        <div className="max-w-xl mx-auto px-4 py-6 animate-fade-in">
            {!practice ? (
                <div className="flex flex-col items-center justify-center text-center py-20 min-h-[40vh]">
                    <p className="text-stone-500 mb-6">请先抽取今日塔罗牌，获取今日指引。</p>
                    <Button onClick={() => setActiveTab('tarot')} variant="outline" className="px-8 py-3">前往抽取</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <Card className="text-center py-10">
                        <span className="text-xs font-sans tracking-widest text-stone-500 uppercase">今日能量</span>
                        <h2 className="text-3xl font-serif text-white mt-2 mb-6">{practice.energyStatus}</h2>
                        <div className="w-12 h-[1px] bg-white/10 mx-auto mb-6"></div>
                        <span className="text-xs font-sans tracking-widest text-lucid-accent/80 uppercase block mb-2">今日肯定语</span>
                        <p className="text-xl text-lucid-glow font-serif italic">"{practice.todaysAffirmation}"</p>
                    </Card>
                    <Card className="flex items-start gap-4">
                        <div className="p-2 bg-emerald-900/20 rounded-full text-emerald-400 mt-1"><Sun className="w-5 h-5" /></div>
                        <div>
                            <h4 className="text-base font-bold text-emerald-100 mb-1">今日微行动</h4>
                            <p className="text-stone-300 font-serif leading-relaxed">{practice.actionStep}</p>
                        </div>
                    </Card>
                </div>
            )}
        </div>
        )}
      </div>
    </div>
  );
};

export default EnergyCheckView;
