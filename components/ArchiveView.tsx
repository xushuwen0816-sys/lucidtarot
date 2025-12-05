
import React, { useState, useRef, useEffect } from 'react';
import { TarotReadingSession, ChatMessage } from '../types';
import { SectionTitle, Card, Modal, SimpleMarkdown, TarotCardImage } from './Shared';
import { Calendar, Search, ChevronRight, MessageSquare, Send, Sparkles } from 'lucide-react';
import { chatWithTarot } from '../services/geminiService';

interface HistoryViewProps {
  sessions: TarotReadingSession[];
  onSessionUpdate: (session: TarotReadingSession) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ sessions, onSessionUpdate }) => {
  const [selectedSession, setSelectedSession] = useState<TarotReadingSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Chat state for the active modal
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const filteredSessions = sessions.filter(s => 
      s.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.interpretation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // Intelligent Auto-scroll for Archive View:
    // Only scroll if loading (thinking) OR if the user just sent a message.
    // Do NOT scroll if the AI response just arrived.
    const lastMsg = selectedSession?.chatHistory[selectedSession.chatHistory.length - 1];
    
    if (selectedSession && chatEndRef.current && (isChatting || lastMsg?.role === 'user')) {
       chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedSession?.chatHistory, isChatting, selectedSession]);

  const handleChatSubmit = async () => {
      if (!chatInput.trim() || !selectedSession) return;
      
      const userMsg: ChatMessage = { role: 'user', text: chatInput };
      const updatedHistory = [...selectedSession.chatHistory, userMsg];
      
      // Update local and global state immediately for user message
      const updatedSessionUser = { ...selectedSession, chatHistory: updatedHistory };
      setSelectedSession(updatedSessionUser);
      onSessionUpdate(updatedSessionUser);

      setChatInput('');
      setIsChatting(true);

      try {
          // API Call
          const response = await chatWithTarot(updatedHistory, selectedSession.interpretation);
          const modelMsg: ChatMessage = { role: 'model', text: response };
          const finalHistory = [...updatedHistory, modelMsg];
          
          // Update local and global state with AI response
          const updatedSessionModel = { ...selectedSession, chatHistory: finalHistory };
          setSelectedSession(updatedSessionModel);
          onSessionUpdate(updatedSessionModel);
      } catch (error) {
          console.error("Chat error", error);
      } finally {
          setIsChatting(false);
      }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <SectionTitle title="解读历史" subtitle="灵魂足迹" />
      
      <div className="px-4 mb-4">
          <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-lucid-glow/30"
                  placeholder="搜索提问或解读关键词..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20 custom-scrollbar animate-fade-in">
          {filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-stone-500">
                  <p>暂无记录</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 gap-4">
                  {filteredSessions.map(session => (
                      <Card 
                          key={session.id} 
                          onClick={() => setSelectedSession(session)}
                          className="cursor-pointer hover:bg-white/10 transition-colors border-white/5 group"
                      >
                          <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-stone-400 uppercase tracking-wide">
                                      {session.spreadName}
                                  </span>
                                  <span className="text-[10px] text-stone-600 font-sans">
                                      {new Date(session.date).toLocaleString()}
                                  </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-stone-600 group-hover:text-lucid-glow transition-colors" />
                          </div>
                          <h4 className="text-lg font-serif text-white mb-2 leading-snug">{session.question}</h4>
                          <p className="text-sm text-stone-400 line-clamp-2 font-serif">{session.interpretation}</p>
                          
                          <div className="mt-4 flex gap-2">
                              {session.cards.slice(0, 5).map((c, i) => (
                                  <div 
                                      key={i} 
                                      className="w-8 rounded overflow-hidden shadow-sm relative border border-white/10"
                                      style={{ aspectRatio: '1 / 1.714' }}
                                  >
                                      <TarotCardImage card={c} className="w-full h-full" />
                                  </div>
                              ))}
                              {session.cards.length > 5 && (
                                  <div 
                                      className="w-8 flex items-center justify-center text-[10px] text-stone-600 border border-white/10 rounded"
                                      style={{ aspectRatio: '1 / 1.714' }}
                                  >
                                    ...
                                  </div>
                              )}
                          </div>
                      </Card>
                  ))}
              </div>
          )}
      </div>

      {/* DETAIL MODAL */}
      <Modal 
          isOpen={!!selectedSession} 
          onClose={() => setSelectedSession(null)} 
          title="解读回顾"
      >
          {selectedSession && (
              <div className="space-y-6 pb-6">
                  <div className="border-b border-white/10 pb-4">
                      <div className="text-xs text-stone-500 mb-1">{new Date(selectedSession.date).toLocaleString()}</div>
                      <h3 className="text-xl font-serif text-white">{selectedSession.question}</h3>
                      <div className="mt-2 text-xs text-lucid-glow border border-lucid-glow/20 px-2 py-1 inline-block rounded">
                          牌阵: {selectedSession.spreadName}
                      </div>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-wrap gap-4 justify-center py-4 bg-white/[0.02] rounded-xl">
                      {selectedSession.cards.map((card, i) => (
                          <div key={i} className="flex flex-col items-center w-24 text-center">
                              <div 
                                  className="w-16 relative mb-2 shadow-lg"
                                  style={{ aspectRatio: '1 / 1.714' }}
                              >
                                  <TarotCardImage card={card} />
                              </div>
                              <span className="text-[10px] text-white block">{card.name}</span>
                              <span className="text-[9px] text-stone-500 block">{card.position}</span>
                          </div>
                      ))}
                  </div>

                  {/* Text */}
                  <div className="text-stone-300 font-serif leading-loose text-sm">
                      <SimpleMarkdown content={selectedSession.interpretation} />
                  </div>

                  {/* Chat Section */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                      <h4 className="text-sm text-white font-bold mb-4 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-lucid-glow" /> 追问 LUCID
                      </h4>
                      
                      {/* Chat History Container */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 mb-4">
                          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 mb-4">
                              {selectedSession.chatHistory.map((msg, i) => (
                                   <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                          
                          {/* Chat Input */}
                          <div className="relative">
                               <input 
                                   value={chatInput}
                                   onChange={(e) => setChatInput(e.target.value)}
                                   onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                                   placeholder="继续追问..."
                                   className="w-full bg-black/40 border border-white/10 rounded-full py-3 pl-6 pr-14 text-sm text-white focus:outline-none focus:border-lucid-glow/30 transition-all font-serif"
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
          )}
      </Modal>
    </div>
  );
};

export default HistoryView;
