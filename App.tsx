
import React, { useState, useEffect } from 'react';
import { AppView, TarotReadingSession, DailyRecord } from './types';
import { Sun, Sparkles, Key, ArrowRight, User, Wifi, AlertTriangle, CheckCircle, Server, CreditCard, Clock, Moon } from 'lucide-react';

// Components
import EnergyCheckView from './components/EnergyCheckView'; // Now Daily Tarot
import ReadingView from './components/IntentView'; // Repurposed as ReadingView
import HistoryView from './components/ArchiveView'; // Repurposed as HistoryView
import { Button, LoadingSpinner } from './components/Shared';

// Services
import { setAiConfig, hasApiKey, checkConnection } from './services/geminiService';

const App: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Auth & Config State
  const [provider, setProvider] = useState<'gemini' | 'siliconflow'>(() => {
    if (typeof localStorage !== 'undefined') {
       return (localStorage.getItem('lucid_provider') as 'gemini' | 'siliconflow') || 'gemini';
    }
    return 'gemini';
  });

  const [geminiKey, setGeminiKey] = useState(() => 
    typeof localStorage !== 'undefined' ? localStorage.getItem('lucid_key_gemini') || localStorage.getItem('lucid_api_key') || '' : ''
  );
  
  const [siliconflowKey, setSiliconflowKey] = useState(() => 
    typeof localStorage !== 'undefined' ? localStorage.getItem('lucid_key_siliconflow') || '' : ''
  );

  const [apiKeyInput, setApiKeyInput] = useState(() => {
      const p = typeof localStorage !== 'undefined' ? localStorage.getItem('lucid_provider') || 'gemini' : 'gemini';
      if (p === 'siliconflow') {
          return typeof localStorage !== 'undefined' ? localStorage.getItem('lucid_key_siliconflow') || '' : '';
      }
      return typeof localStorage !== 'undefined' ? localStorage.getItem('lucid_key_gemini') || localStorage.getItem('lucid_api_key') || '' : '';
  });
  
  const [userNameInput, setUserNameInput] = useState(() => 
    typeof localStorage !== 'undefined' ? localStorage.getItem('lucid_user_name') || '' : ''
  );

  useEffect(() => {
      if (provider === 'gemini') {
          setApiKeyInput(geminiKey);
      } else {
          setApiKeyInput(siliconflowKey);
      }
  }, [provider]);

  const handleKeyChange = (val: string) => {
      setApiKeyInput(val);
      if (provider === 'gemini') {
          setGeminiKey(val);
          localStorage.setItem('lucid_key_gemini', val);
          localStorage.setItem('lucid_api_key', val);
      } else {
          setSiliconflowKey(val);
          localStorage.setItem('lucid_key_siliconflow', val);
      }
  };
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // App View State
  const [currentView, setCurrentView] = useState<AppView>(AppView.DAILY);

  // Data State
  const [sessions, setSessions] = useState<TarotReadingSession[]>(() => {
      try {
          const saved = localStorage.getItem('lucid_tarot_sessions');
          return saved ? JSON.parse(saved) : [];
      } catch { return []; }
  });

  // Daily Records (kept lightly in localstorage logic, mainly for persistence if user leaves)
  const handleSaveDaily = (record: DailyRecord) => {
      // Just for logging or streak tracking if we added it later
      console.log("Daily Saved", record);
  };

  const handleReadingComplete = (session: TarotReadingSession) => {
      const updated = [session, ...sessions];
      setSessions(updated);
      localStorage.setItem('lucid_tarot_sessions', JSON.stringify(updated));
  };

  useEffect(() => {
      if (hasApiKey()) setIsAuthorized(true);
  }, []);

  const getEffectiveBaseUrl = () => {
    return '';
  };

  const handleStartSystem = () => {
    if (apiKeyInput.trim().length > 5) {
      setAiConfig(apiKeyInput.trim(), userNameInput.trim(), getEffectiveBaseUrl(), provider);
      setIsAuthorized(true);
    }
  };

  const handleTestConnection = async () => {
      if (apiKeyInput.trim().length < 5) return;
      setIsTesting(true);
      setTestResult(null);
      setErrorMessage("");
      
      setAiConfig(apiKeyInput.trim(), userNameInput.trim(), getEffectiveBaseUrl(), provider);
      
      const result = await checkConnection();
      if (result.success) {
          setTestResult('success');
      } else {
          setTestResult('error');
          setErrorMessage(result.message || "连接失败");
      }
      setIsTesting(false);
  };

  const navItems = [
    { view: AppView.DAILY, icon: Sun, label: '能量' },
    { view: AppView.READING, icon: Moon, label: '占卜' },
    { view: AppView.HISTORY, icon: Clock, label: '历史' },
  ];

  // AUTH SCREEN
  if (!isAuthorized) {
    return (
      <div className="h-[100dvh] text-lucid-text font-serif bg-lucid-bg flex flex-col items-center justify-center p-6 relative overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
         <div className="absolute inset-0 pointer-events-none">
             <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[#3F2E26] rounded-full blur-[150px] opacity-30 animate-pulse-slow"></div>
             <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#4C3A35] rounded-full blur-[120px] opacity-20"></div>
         </div>

         <div className="z-10 w-full max-w-md space-y-8 text-center animate-fade-in my-auto">
             <div className="flex flex-col items-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-lucid-glow/10 flex items-center justify-center shadow-[0_0_30px_rgba(253,186,116,0.15)] border border-lucid-glow/20">
                    <Sparkles className="w-8 h-8 text-lucid-glow" />
                 </div>
                 <h1 className="text-3xl font-serif text-white tracking-widest">LUCID TAROT</h1>
                 <p className="text-lucid-dim font-sans text-sm tracking-widest uppercase">潜意识指引系统</p>
             </div>

             <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl space-y-6 text-left">
                 
                 <div className="space-y-2">
                     <label className="text-xs text-lucid-glow uppercase tracking-wider font-bold flex items-center gap-2">
                         <User className="w-3 h-3" /> 您的名字
                     </label>
                     <input 
                        type="text"
                        value={userNameInput}
                        onChange={(e) => setUserNameInput(e.target.value)}
                        placeholder="请输入您的名字或昵称"
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lucid-glow/50 transition-all font-sans text-sm tracking-wide"
                     />
                 </div>
                 
                 <div className="space-y-3 pt-2 border-t border-white/5">
                     <label className="text-xs text-lucid-glow uppercase tracking-wider font-bold flex items-center gap-2">
                         <Server className="w-3 h-3" /> 模型服务商
                     </label>
                     <div className="grid grid-cols-2 gap-2 bg-black/20 p-1 rounded-xl">
                         <button
                            onClick={() => setProvider('gemini')}
                            className={`py-2 px-3 rounded-lg text-xs font-serif transition-all ${provider === 'gemini' ? 'bg-lucid-glow text-black shadow-lg' : 'text-stone-400 hover:text-white'}`}
                         >
                             Google Gemini
                         </button>
                         <button
                            onClick={() => setProvider('siliconflow')}
                            className={`py-2 px-3 rounded-lg text-xs font-serif transition-all ${provider === 'siliconflow' ? 'bg-indigo-500 text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}
                         >
                             硅基流动
                         </button>
                     </div>
                 </div>

                 <div className="space-y-2">
                     <label className="text-xs text-lucid-glow uppercase tracking-wider font-bold flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Key className="w-3 h-3" /> API 密钥
                         </div>
                     </label>
                     <input 
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => handleKeyChange(e.target.value)}
                        placeholder="请输入 API Key"
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lucid-glow/50 transition-all font-sans text-sm tracking-wide"
                     />
                 </div>
                 
                 <div className="flex justify-end mt-2">
                     <button 
                        onClick={handleTestConnection}
                        disabled={isTesting || apiKeyInput.length < 5}
                        className="text-[10px] flex items-center gap-1 bg-white/5 px-2 py-1 rounded hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
                     >
                        {isTesting ? <LoadingSpinner /> : <Wifi className="w-3 h-3" />}
                        {isTesting ? '连接中...' : '测试连通性'}
                     </button>
                 </div>

                 {testResult === 'success' && (
                     <div className="text-[10px] text-emerald-400 flex items-center gap-1 animate-fade-in mt-2 justify-center bg-emerald-500/10 py-1 rounded">
                         <CheckCircle className="w-3 h-3" /> 连接成功
                     </div>
                 )}
                 {testResult === 'error' && (
                     <div className="text-[10px] text-rose-400 flex items-center gap-1 animate-fade-in mt-2 justify-center bg-rose-500/10 py-1 rounded">
                         <AlertTriangle className="w-3 h-3" /> {errorMessage}
                     </div>
                 )}
                 
                 <Button 
                    onClick={handleStartSystem} 
                    disabled={apiKeyInput.length < 5}
                    variant="primary" 
                    className="w-full rounded-xl py-4 text-sm tracking-widest shadow-lg shadow-lucid-glow/20"
                 >
                    进入塔罗时空 <ArrowRight className="w-4 h-4 ml-2" />
                 </Button>
             </div>
         </div>
      </div>
    );
  }

  // MAIN APP
  return (
    // Use h-[100dvh] for mobile standalone support to avoid scrolling issues
    <div className="h-[100dvh] text-lucid-text font-serif selection:bg-lucid-glow/30 selection:text-white overflow-hidden relative bg-lucid-bg flex flex-col">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-[#3F2E26] rounded-full blur-[120px] opacity-40 animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#4C3A35] rounded-full blur-[100px] opacity-30 animate-float" style={{ animationDuration: '25s' }}></div>
      </div>

      <main className="relative z-10 w-full h-full flex flex-col md:flex-row">
        
        {/* Navigation - Order 2 on mobile means it's at the BOTTOM.
            Added pb-[env(safe-area-inset-bottom)] to respect Home Indicator on iOS.
        */}
        <nav className="order-2 md:order-1 w-full md:w-24 flex md:flex-col items-center md:items-center justify-between md:justify-start pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:py-8 z-50 transition-all duration-300 md:border-r border-white/5 bg-white/[0.01] backdrop-blur-md flex-shrink-0">
           <div 
             className="flex flex-col items-center mb-0 md:mb-10 opacity-90 hover:opacity-100 transition-opacity cursor-pointer md:mt-4 ml-6 md:ml-0"
             onClick={() => setIsAuthorized(false)}
             title="返回设置"
           >
             <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-lucid-glow/30 to-purple-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(253,186,116,0.2)] border border-white/5 group">
                 <Sparkles className="w-6 h-6 text-lucid-glow group-hover:scale-110 transition-transform duration-700" />
             </div>
           </div>

           <div className="flex md:flex-col gap-3 md:gap-6 mr-6 md:mr-0 md:mt-12">
             {navItems.map((item) => (
               <button
                 key={item.view}
                 onClick={() => setCurrentView(item.view)}
                 title={item.label}
                 className={`group flex flex-col items-center gap-1.5 relative transition-all duration-500 outline-none p-1 md:p-2 rounded-xl ${
                   currentView === item.view ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                 }`}
               >
                 <div className={`p-3.5 md:p-4 rounded-2xl transition-all duration-500 ease-out ${currentView === item.view ? 'bg-lucid-glow text-lucid-bg scale-100 shadow-[0_0_20px_rgba(253,186,116,0.3)]' : 'bg-white/5 text-white scale-90 hover:bg-white/10'}`}>
                   <item.icon className={`w-6 h-6 stroke-[1.5px]`} />
                 </div>
                 <span className="text-[10px] font-serif tracking-widest font-medium">{item.label}</span>
               </button>
             ))}
           </div>
        </nav>

        {/* Content - Order 1 on mobile means it's at the TOP.
            Added pt-[env(safe-area-inset-top)] to respect Notch on iOS.
        */}
        <div className="order-1 md:order-2 flex-1 relative overflow-hidden flex flex-col pt-[env(safe-area-inset-top)] md:pt-0">
           <div className="flex-1 w-full h-full p-0 md:p-6 max-w-6xl mx-auto flex flex-col">
              
              {currentView === AppView.DAILY && (
                <EnergyCheckView onSaveDaily={handleSaveDaily} />
              )}
              
              {currentView === AppView.READING && (
                <ReadingView onComplete={handleReadingComplete} />
              )}
              
              {currentView === AppView.HISTORY && (
                <HistoryView sessions={sessions} />
              )}

           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
