
import React, { useState } from 'react';
import { TarotReadingSession } from '../types';
import { SectionTitle, Card, Modal, SimpleMarkdown, TarotCardImage } from './Shared';
import { Calendar, Search, ChevronRight, MessageSquare } from 'lucide-react';

interface HistoryViewProps {
  sessions: TarotReadingSession[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ sessions }) => {
  const [selectedSession, setSelectedSession] = useState<TarotReadingSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter(s => 
      s.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.interpretation.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

                  {/* Chat History */}
                  {selectedSession.chatHistory.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                          <h4 className="text-sm text-stone-400 font-bold mb-4 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" /> 追问记录
                          </h4>
                          <div className="space-y-3">
                              {selectedSession.chatHistory.map((msg, i) => (
                                  <div key={i} className={`text-xs p-2 rounded-lg ${msg.role === 'user' ? 'bg-white/10 ml-8' : 'bg-black/20 mr-8 text-stone-400'}`}>
                                      <span className="opacity-50 block text-[9px] uppercase mb-1">{msg.role}</span>
                                      {msg.text}
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          )}
      </Modal>
    </div>
  );
};

export default HistoryView;
