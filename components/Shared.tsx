
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { TarotCard } from '../types';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'glass' | 'outline' }> = ({ className = '', variant = 'primary', ...props }) => {
  const baseStyles = "px-6 py-2.5 rounded-2xl font-serif text-sm tracking-wider transition-all duration-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden";
  
  const variants = {
    primary: "bg-gradient-to-r from-orange-500/80 to-rose-400/80 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:brightness-105",
    ghost: "bg-transparent text-lucid-dim hover:text-white hover:bg-white/5",
    glass: "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20",
    outline: "border border-white/10 text-lucid-glow hover:bg-white/5"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-3xl p-6 transition-all duration-700 hover:bg-white/[0.04] ${className}`}>
    {children}
  </div>
);

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-1.5 h-1.5 bg-lucid-glow/50 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
    <div className="w-1.5 h-1.5 bg-lucid-glow/50 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
    <div className="w-1.5 h-1.5 bg-lucid-glow/50 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
  </div>
);

export const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="w-full flex flex-col items-end justify-start mb-0 animate-fade-in select-none pt-0 px-4">
    <h2 className="text-2xl font-light font-serif text-white/90 tracking-wide mb-0.5 text-right drop-shadow-sm">
      {title}
    </h2>
    {subtitle && (
      <div className="flex items-center gap-2 opacity-70">
        <p className="text-lucid-dim font-serif text-[10px] tracking-[0.2em] uppercase text-right">{subtitle}</p>
        <div className="w-6 h-[1px] bg-lucid-glow/50 rounded-full"></div>
      </div>
    )}
  </div>
);

export const TabNav: React.FC<{ 
  tabs: { id: string; label: string; icon?: React.ElementType; badge?: boolean }[]; 
  activeTab: string; 
  onTabChange: (id: any) => void; 
}> = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex justify-center mb-0 relative z-50">
    <div className="flex items-center bg-white/[0.03] p-1 rounded-full border border-white/5 backdrop-blur-xl relative shadow-2xl scale-90 origin-top">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            relative px-5 py-2 rounded-full text-xs font-serif tracking-widest transition-all duration-500 z-10 flex items-center gap-2 group
            ${activeTab === tab.id ? 'text-white' : 'text-lucid-dim hover:text-white'}
          `}
        >
          {activeTab === tab.id && (
             <div className="absolute inset-0 bg-white/10 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10 -z-10 animate-fade-in"></div>
          )}
          {tab.icon && <tab.icon className={`w-3.5 h-3.5 transition-colors duration-300 ${activeTab === tab.id ? 'text-lucid-glow' : 'opacity-50 group-hover:opacity-80'}`} />}
          {tab.label}
          {tab.badge && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
        </button>
      ))}
    </div>
  </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title?: string }> = ({ isOpen, onClose, children, title }) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/90 backdrop-blur-xl transition-opacity animate-fade-in"
                onClick={onClose}
            ></div>
            <div className="relative bg-[#1C1917] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-fade-in scale-100 ring-1 ring-white/10">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-xl font-serif text-white tracking-wide">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-lucid-dim hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export const SimpleMarkdown: React.FC<{ content: any; className?: string }> = ({ content, className = "" }) => {
  if (!content) return null;
  let safeContent = "";
  if (typeof content === 'string') {
      safeContent = content;
  } else if (typeof content === 'object') {
      safeContent = content.text || content.content || JSON.stringify(content);
  } else {
      safeContent = String(content);
  }

  // Normalize newlines and ensure empty lines are preserved as blocks
  const lines = safeContent.replace(/\\n/g, '\n').split('\n');

  const parseLine = (line: string, index: number) => {
      const trimmed = line.trim();
      // If line is empty, render a spacer.
      if (!trimmed) return <div key={index} className="h-4" />; 
      
      // Header Level 4
      if (trimmed.match(/^#{4}\s+(.*)/) || trimmed.match(/^#{4}([^#].*)/)) {
          const text = trimmed.replace(/^#{4}\s*/, '');
          return <h4 key={index} className="text-xl font-bold text-lucid-glow mt-8 mb-4 tracking-wide pl-4 border-l-2 border-lucid-glow/50">{parseInline(text)}</h4>;
      }
      // Header Level 3
      if (trimmed.match(/^#{3}\s+(.*)/) || trimmed.match(/^#{3}([^#].*)/)) {
          const text = trimmed.replace(/^#{3}\s*/, '');
          return <h3 key={index} className="text-2xl font-bold text-white mt-10 mb-5 tracking-wide">{parseInline(text)}</h3>;
      }
      // Header Level 2
      if (trimmed.match(/^#{2}\s+(.*)/) || trimmed.match(/^#{2}([^#].*)/)) {
          const text = trimmed.replace(/^#{2}\s*/, '');
          return <h2 key={index} className="text-3xl font-bold text-white mt-12 mb-6 border-l-4 border-lucid-glow pl-4">{parseInline(text)}</h2>;
      }
      // Header Level 1
      if (trimmed.match(/^#{1}\s+(.*)/) || trimmed.match(/^#{1}([^#].*)/)) {
          const text = trimmed.replace(/^#{1}\s*/, '');
          return <h1 key={index} className="text-4xl font-bold text-white mt-14 mb-8">{parseInline(text)}</h1>;
      }
      
      // Lists
      if (trimmed.match(/^[-*]\s+(.*)/)) {
        return (
          <div key={index} className={`flex items-start gap-3 mb-2 ml-2 ${className}`}>
            <span className="text-lucid-glow mt-[0.6em] block w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></span>
            <span className="text-stone-300 leading-relaxed text-base md:text-lg">{parseInline(trimmed.replace(/^[-*]\s+/, ''))}</span>
          </div>
        );
      }
      
      if (trimmed.match(/^\d+\.\s+(.*)/)) {
        const match = trimmed.match(/^(\d+)\.\s+(.*)/);
        const num = match ? match[1] : '•';
        const text = match ? match[2] : trimmed;
        return (
          <div key={index} className={`flex items-start gap-3 mb-2 ml-2 ${className}`}>
             <span className="text-lucid-glow font-bold min-w-[1.5rem] text-right text-base md:text-lg">{num}.</span>
             <span className="text-stone-300 leading-relaxed text-base md:text-lg">{parseInline(text)}</span>
          </div>
        );
      }

      // Separator
      if (trimmed === '---' || trimmed === '***') return <hr key={index} className="border-white/10 my-8" />;
      
      // Paragraph
      // IMPORTANT: Added `last:mb-0` to fix the asymmetry in chat bubbles where bottom padding looked larger than top
      return <p key={index} className={`text-stone-300 leading-relaxed mb-4 last:mb-0 font-serif whitespace-pre-wrap text-base md:text-lg ${className}`}>{parseInline(trimmed)}</p>;
  };

  const parseInline = (text: string) => {
      // Improved regex to handle **bold** more reliably
      const parts = text.split(/(\*\*.*?\*\*)/g);
      
      return parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
               const content = part.slice(2, -2); // Remove delimiters
               if (!content.trim()) return part;
               return <strong key={i} className="text-white font-semibold tracking-wide text-shadow-sm">{content}</strong>;
          }
          return part;
      });
  };

  return <div className="markdown-content w-full">{lines.map((line, i) => parseLine(line, i))}</div>;
};

// --- IMAGE HANDLING HELPER ---
export const getCardImageUrl = (card: TarotCard) => {
    if (!card.nameEn) return "";
    
    const raw = card.nameEn.toLowerCase();
    
    if (raw.startsWith('ar')) {
        return `https://www.sacred-texts.com/tarot/pkt/img/${raw}.jpg`;
    }

    const suit = raw.substring(0, 2); 
    const rankNum = raw.substring(2); 
    
    let suffix = rankNum;
    if (rankNum === '01') suffix = 'ac';
    else if (rankNum === '11') suffix = 'pa';
    else if (rankNum === '12') suffix = 'kn';
    else if (rankNum === '13') suffix = 'qu';
    else if (rankNum === '14') suffix = 'ki';
    
    return `https://www.sacred-texts.com/tarot/pkt/img/${suit}${suffix}.jpg`;
};

export const TarotCardImage: React.FC<{ card: TarotCard; className?: string; showBack?: boolean }> = ({ card, className = "", showBack = false }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        setLoaded(false);
        setError(false);
    }, [card.nameEn]);
    
    const imageUrl = getCardImageUrl(card);

    return (
        <div className={`relative w-full h-full rounded-lg overflow-hidden shadow-xl bg-stone-800 border border-white/20 transition-transform duration-700 ${card.isReversed && !showBack ? 'rotate-180' : ''} ${className}`}>
            {!showBack && !error && imageUrl && (
                <img 
                    src={imageUrl} 
                    alt={card.name}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                    referrerPolicy="no-referrer"
                />
            )}
            
            {(!loaded || showBack || error) && (
                <div className={`absolute inset-0 bg-stone-900 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] ${showBack ? '' : 'animate-pulse'}`}>
                    <div className="w-full h-full opacity-30 bg-gradient-to-br from-orange-900 via-stone-900 to-black"></div>
                    <div className="absolute inset-2 border border-white/10 rounded opacity-50"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
                         <div className="w-8 h-8 md:w-12 md:h-12 border-2 border-lucid-glow rotate-45 mb-2"></div>
                         {!showBack && error && <span className="text-[8px] text-white/50">{card.name}</span>}
                    </div>
                </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
        </div>
    );
};
