import React, { useState } from 'react';
import { ShieldCheck, Copy, Play, Trash2, Check, XCircle, HelpCircle, RefreshCw, Terminal, Activity, Zap, Shield, AlertCircle, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CheckedCard {
  raw: string;
  status: 'live' | 'die' | 'unknown';
  message: string;
  brand?: string;
  type?: string;
  bank?: string;
  country?: string;
  isFreeTrialEligible?: boolean;
  eligibleServices?: string[];
}

interface CCCheckerProps {
  state: {
    input: string;
    liveCards: CheckedCard[];
    dieCards: CheckedCard[];
    stats: { live: number; die: number; unknown: number; total: number };
    checking: boolean;
    currentChecking: string | null;
    scanLogs: string[];
    gate: 'AUTH' | 'CCN' | 'CVV' | 'PAYATE' | 'ALL';
  };
  setState: React.Dispatch<React.SetStateAction<{
    input: string;
    liveCards: CheckedCard[];
    dieCards: CheckedCard[];
    stats: { live: number; die: number; unknown: number; total: number };
    checking: boolean;
    currentChecking: string | null;
    scanLogs: string[];
    gate: 'AUTH' | 'CCN' | 'CVV' | 'PAYATE' | 'ALL';
  }>>;
  onProcess: () => void;
  onStop: () => void;
}

export const CCChecker: React.FC<CCCheckerProps> = ({ state, setState, onProcess, onStop }) => {
  const { input, liveCards, dieCards, stats, checking, currentChecking, scanLogs, gate } = state;

  const setInput = (val: string) => setState(prev => ({ ...prev, input: val }));
  const setGate = (val: 'AUTH' | 'CCN' | 'CVV' | 'PAYATE' | 'ALL') => setState(prev => ({ ...prev, gate: val }));

  const copyLive = () => {
    const text = liveCards.map(c => c.raw).join('\n');
    navigator.clipboard.writeText(text);
  };

  const clearAll = () => {
    setState(prev => ({
      ...prev,
      input: '',
      liveCards: [],
      dieCards: [],
      stats: { live: 0, die: 0, unknown: 0, total: 0 },
      scanLogs: []
    }));
  };

  return (
    <div className="p-4 sm:p-10 glass rounded-[2rem] sm:rounded-[3rem] shadow-2xl shadow-black/50 text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyber-cyan/10 rounded-full blur-[120px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyber-purple/10 rounded-full blur-[120px] -ml-48 -mb-48" />

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-8 sm:mb-12 gap-6 sm:gap-8">
          <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-cyber-cyan rounded-2xl blur-lg opacity-20 animate-pulse" />
              <div className="relative p-3 sm:p-5 bg-dark-900 rounded-2xl border border-cyber-cyan/30">
                <Cpu className="w-6 h-6 sm:w-10 sm:h-10 text-cyber-cyan" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">Extreme Premium Checker</h2>
              <p className="text-[8px] sm:text-xs font-black text-cyber-cyan uppercase tracking-[0.3em] mt-1">100% Accuracy Engine v4.0</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-dark-900/80 backdrop-blur-xl p-2 sm:p-3 rounded-2xl border border-white/5 w-full lg:w-auto">
            <div className="flex items-center gap-3 px-4 border-b sm:border-b-0 sm:border-r border-white/10 w-full sm:w-auto pb-2 sm:pb-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-cyber-cyan" />
              <span className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Gate</span>
            </div>
            <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
              {(['AUTH', 'CCN', 'CVV', 'PAYATE', 'ALL'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGate(g)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${
                    gate === g 
                      ? 'bg-cyber-cyan text-dark-950 border-cyber-cyan shadow-lg shadow-cyber-cyan/20' 
                      : 'bg-dark-800 text-slate-500 border-white/5 hover:border-cyber-cyan/30'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full lg:w-auto">
            {[
              { label: 'Total', val: stats.total, color: 'slate' },
              { label: 'Live', val: stats.live, color: 'cyber-green', pulse: true },
              { label: 'Die', val: stats.die, color: 'cyber-red' },
              { label: 'Unknown', val: stats.unknown, color: 'cyber-amber' }
            ].map((s) => (
              <div key={s.label} className={`px-3 sm:px-6 py-2 sm:py-4 bg-dark-900/50 border border-white/5 rounded-2xl text-center`}>
                <p className={`text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1`}>{s.label}</p>
                <p className={`text-sm sm:text-xl font-black ${s.color === 'cyber-green' ? 'text-cyber-green' : s.color === 'cyber-red' ? 'text-cyber-red' : s.color === 'cyber-amber' ? 'text-cyber-amber' : 'text-white'}`}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 p-6 bg-cyber-amber/5 border border-cyber-amber/20 rounded-[2rem] flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-cyber-amber shrink-0 mt-1" />
          <div>
            <p className="text-[10px] font-black text-cyber-amber uppercase tracking-widest mb-1">Disclaimer & Usage Note</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This tool is for **educational and testing purposes only**. Generated cards are simulated assets and will **NOT** work on real merchants (like Amazon, Audible, etc.) as they are not real financial instruments. Real-world payment gateways have strict security protocols that these simulated checks do not bypass.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* Input Section */}
          <div className="xl:col-span-12 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyber-cyan to-cyber-purple rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-25 transition duration-1000" />
                <div className="relative">
                  <div className="absolute top-5 left-6 flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Terminal className="w-4 h-4" /> Input Terminal
                  </div>
                  <textarea
                    placeholder="PASTE CARDS HERE (FORMAT: NUMBER|MM|YYYY|CVV)"
                    className="w-full h-[200px] sm:h-[300px] p-6 sm:p-12 pt-12 sm:pt-16 bg-dark-900/80 backdrop-blur-xl border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] focus:ring-2 focus:ring-cyber-cyan/50 outline-none transition-all resize-none font-mono text-xs sm:text-sm text-cyber-cyan placeholder:text-slate-700 custom-scrollbar"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={checking}
                  />
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyber-purple to-cyber-cyan rounded-[2.5rem] blur opacity-5 transition duration-1000" />
                <div className="relative h-[300px] bg-dark-950/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <Activity className="w-4 h-4" /> Live Scan Logs
                    </div>
                    {checking && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-pulse" />
                        <span className="text-[8px] font-black text-cyber-cyan uppercase tracking-widest">Active</span>
                      </div>
                    )}
                  </div>
                  <div className="h-[200px] overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-2">
                    {scanLogs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-800 italic">
                        System idle. Awaiting input...
                      </div>
                    ) : (
                      scanLogs.map((log, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }}
                          className={`${log.startsWith('+') ? 'text-cyber-green' : log.startsWith('-') ? 'text-cyber-red' : log.startsWith('!') ? 'text-cyber-amber' : 'text-slate-400'}`}
                        >
                          {log}
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-5">
              {!checking ? (
                <button
                  onClick={onProcess}
                  disabled={!input.trim()}
                  className="flex-[2] py-6 bg-cyber-cyan hover:bg-cyber-cyan/80 text-dark-950 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all disabled:opacity-50 shadow-lg shadow-cyber-cyan/20 active:scale-95"
                >
                  <Play className="w-6 h-6" />
                  Execute Deep Scan
                </button>
              ) : (
                <button
                  onClick={onStop}
                  className="flex-[2] py-6 bg-cyber-red hover:bg-cyber-red/80 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all shadow-lg shadow-cyber-red/20 active:scale-95"
                >
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  Stop Analysis
                </button>
              )}
              <button
                onClick={clearAll}
                className="flex-1 py-6 bg-dark-900 hover:bg-dark-800 text-slate-500 hover:text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] border border-white/5 transition-all active:scale-95"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="xl:col-span-6 space-y-6">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-cyber-green rounded-full animate-pulse shadow-[0_0_15px_rgba(0,255,157,1)]" />
                <h3 className="text-base font-black text-cyber-green uppercase tracking-[0.3em]">Live Approved</h3>
              </div>
              {liveCards.length > 0 && (
                <button 
                  onClick={copyLive}
                  className="flex items-center gap-2 text-[10px] font-black text-dark-950 bg-cyber-green px-6 py-3 rounded-full hover:bg-cyber-green/80 transition-all shadow-lg shadow-cyber-green/20 active:scale-95"
                >
                  <Copy className="w-4 h-4" /> Copy All Live Cards ({liveCards.length})
                </button>
              )}
            </div>
            <div className="h-[550px] bg-dark-900/60 border-2 border-cyber-green/20 rounded-[3rem] p-8 overflow-y-auto custom-scrollbar space-y-5 shadow-[inset_0_0_30px_rgba(0,255,157,0.05)]">
              <AnimatePresence initial={false}>
                {liveCards.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-800">
                    <ShieldCheck className="w-20 h-20 mb-6 opacity-5" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Awaiting Live Cards...</p>
                  </div>
                ) : (
                  liveCards.map((res, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 bg-cyber-green/5 border border-cyber-green/20 rounded-[1.5rem] group hover:bg-cyber-green/10 transition-all shadow-lg relative overflow-hidden"
                    >
                      {res.isFreeTrialEligible && (
                        <div className="absolute top-0 right-0 bg-cyber-green text-dark-950 text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                          Free Trial Eligible
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-cyber-green rounded-xl flex items-center justify-center text-dark-950 shadow-lg shadow-cyber-green/20">
                            <Check className="w-5 h-5" />
                          </div>
                          <span className="font-mono text-sm font-black text-cyber-green tracking-widest">{res.raw}</span>
                        </div>
                        <button 
                          onClick={() => navigator.clipboard.writeText(res.raw)}
                          className="p-3 bg-dark-950 text-slate-500 hover:text-cyber-green rounded-xl transition-all border border-white/5"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-cyber-green/10 rounded-md text-[9px] font-black text-cyber-green uppercase tracking-widest border border-cyber-green/20">{res.brand}</span>
                          <span className="px-3 py-1 bg-cyber-green/10 rounded-md text-[9px] font-black text-cyber-green uppercase tracking-widest border border-cyber-green/20">{res.bank}</span>
                          <span className="px-3 py-1 bg-cyber-green/10 rounded-md text-[9px] font-black text-cyber-green uppercase tracking-widest border border-cyber-green/20">{res.country}</span>
                        </div>
                        <span className="text-[10px] font-black text-cyber-green italic">{res.message}</span>
                      </div>
                      
                      {res.eligibleServices && res.eligibleServices.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {res.eligibleServices.map((service, idx) => (
                            <span key={idx} className="px-2 py-1 bg-dark-950/50 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest border border-white/5 flex items-center gap-1.5">
                              <div className="w-1 h-1 bg-cyber-green rounded-full" />
                              {service}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 p-4 bg-cyber-red/10 border border-cyber-red/30 rounded-xl">
                        <p className="text-[10px] text-cyber-red font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" /> Important: Simulation Only
                        </p>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          This card passed our <span className="text-cyber-cyan font-bold">{gate}</span> simulation. However, real websites (like the one in your screenshot) verify the CVV directly with the bank. Since this is a simulated card, the CVV will <span className="text-cyber-red font-bold underline">ALWAYS</span> show as invalid on real merchants.
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="xl:col-span-6 space-y-6">
            <div className="flex items-center gap-3 px-4">
              <div className="w-3 h-3 bg-cyber-red rounded-full shadow-[0_0_15px_rgba(255,51,102,1)]" />
              <h3 className="text-base font-black text-cyber-red uppercase tracking-[0.3em]">Declined / Dead</h3>
            </div>
            <div className="h-[550px] bg-dark-900/60 border-2 border-cyber-red/20 rounded-[3rem] p-8 overflow-y-auto custom-scrollbar space-y-5 shadow-[inset_0_0_30px_rgba(255,51,102,0.05)]">
              <AnimatePresence initial={false}>
                {dieCards.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-800">
                    <AlertCircle className="w-20 h-20 mb-6 opacity-5" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-20">No Dead Cards Detected</p>
                  </div>
                ) : (
                  dieCards.map((res, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 bg-cyber-red/5 border border-cyber-red/20 rounded-[1.5rem] group hover:bg-cyber-red/10 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-cyber-red/20 rounded-xl flex items-center justify-center text-cyber-red">
                            <XCircle className="w-5 h-5" />
                          </div>
                          <span className="font-mono text-sm font-bold text-slate-500 tracking-widest">{res.raw}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-cyber-red/10 rounded-md text-[9px] font-black text-cyber-red/60 uppercase tracking-widest border border-cyber-red/20">{res.brand || 'Unknown'}</span>
                        <span className="text-[10px] font-black text-cyber-red/60 italic">{res.message}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Current Scan Overlay */}
        <AnimatePresence>
          {checking && currentChecking && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-dark-900/90 backdrop-blur-2xl border border-cyber-cyan/30 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4"
            >
              <RefreshCw className="w-5 h-5 text-cyber-cyan animate-spin" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-cyber-cyan uppercase tracking-widest">Scanning Network</span>
                <span className="text-xs font-mono text-slate-300 truncate max-w-[200px]">{currentChecking}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
