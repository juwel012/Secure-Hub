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
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-4">
          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-cyan/5 rounded-full blur-[40px] -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyber-cyan/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-cyber-cyan/20 shadow-[0_0_20px_rgba(0,245,212,0.1)]">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-cyber-cyan" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Card <span className="text-cyber-cyan">Validator</span></h2>
                  <p className="text-[10px] font-black text-cyber-cyan/60 uppercase tracking-[0.3em]">Security Verification v4.0</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                High-precision validation engine for verifying virtual card integrity across multiple security gates and payment protocols.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 h-full">
            {[
              { label: 'Total Cards', val: stats.total, color: 'text-white', bg: 'bg-white/5', icon: Activity },
              { label: 'Live Cards', val: stats.live, color: 'text-cyber-green', bg: 'bg-cyber-green/10', icon: Check, glow: 'shadow-[0_0_20px_rgba(0,255,157,0.1)]' },
              { label: 'Dead Cards', val: stats.die, color: 'text-cyber-red', bg: 'bg-cyber-red/10', icon: XCircle },
              { label: 'Unknown', val: stats.unknown, color: 'text-cyber-amber', bg: 'bg-cyber-amber/10', icon: HelpCircle }
            ].map((s) => (
              <div key={s.label} className={`p-4 sm:p-6 glass rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 flex flex-col items-center justify-center text-center transition-all hover:border-white/10 ${s.glow || ''}`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${s.bg} rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3`}>
                  <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.color}`} />
                </div>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-xl sm:text-2xl font-black ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interface Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Card List</label>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${checking ? 'bg-cyber-cyan animate-pulse' : 'bg-slate-700'}`} />
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{checking ? 'Active' : 'Standby'}</span>
                </div>
              </div>
              <textarea
                placeholder="PASTE CARDS (NUMBER|MM|YYYY|CVV)"
                className="w-full h-[150px] sm:h-[300px] p-4 sm:p-6 bg-dark-800 border border-white/5 rounded-xl sm:rounded-2xl font-mono text-xs text-cyber-cyan placeholder:text-slate-700 focus:border-cyber-cyan focus:ring-4 focus:ring-cyber-cyan/10 outline-none transition-all resize-none custom-scrollbar"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={checking}
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Verification Gate</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(['AUTH', 'CCN', 'CVV', 'PAYATE', 'ALL'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGate(g)}
                    className={`py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                      gate === g 
                        ? 'bg-cyber-cyan text-dark-950 border-cyber-cyan shadow-lg shadow-cyber-cyan/20' 
                        : 'bg-white/5 text-slate-500 border-white/5 hover:border-cyber-cyan/30'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              {!checking ? (
                <button
                  onClick={onProcess}
                  disabled={!input.trim()}
                  className="flex-1 py-4 sm:py-5 bg-cyber-cyan hover:bg-cyber-cyan/90 text-dark-950 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 sm:gap-4 transition-all shadow-lg shadow-cyber-cyan/20 active:scale-[0.98] disabled:opacity-50"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-dark-950" />
                  Start Verification
                </button>
              ) : (
                <button
                  onClick={onStop}
                  className="flex-1 py-4 sm:py-5 bg-cyber-red hover:bg-cyber-red/90 text-white rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 sm:gap-4 transition-all shadow-lg shadow-cyber-red/20 active:scale-[0.98]"
                >
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Stop Verification
                </button>
              )}
              <button
                onClick={clearAll}
                className="p-4 sm:p-5 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-xl sm:rounded-2xl transition-all border border-white/5"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scan Logs */}
          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5">
            <div className="flex items-center gap-3 mb-4 sm:mb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Terminal className="w-4 h-4" /> Verification Logs
            </div>
            <div className="h-[100px] sm:h-[200px] overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-2">
              {scanLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-800 italic">
                  <Activity className="w-8 h-8 mb-2 opacity-10" />
                  <p className="opacity-30 uppercase tracking-widest">Awaiting Verification</p>
                </div>
              ) : (
                scanLogs.map((log, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className={`${log.startsWith('+') ? 'text-cyber-green' : log.startsWith('-') ? 'text-cyber-red' : log.startsWith('!') ? 'text-cyber-amber' : 'text-slate-400'}`}
                  >
                    <span className="opacity-30 mr-2">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                    {log}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Results Feed */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          {/* Live Section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-cyber-green rounded-full shadow-[0_0_10px_rgba(0,255,157,1)]" />
                <h3 className="text-[10px] font-black text-cyber-green uppercase tracking-[0.3em]">Live Cards</h3>
              </div>
              {liveCards.length > 0 && (
                <button 
                  onClick={copyLive}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] font-black text-cyber-green bg-cyber-green/10 px-4 py-2 rounded-full hover:bg-cyber-green/20 transition-all border border-cyber-green/20"
                >
                  <Copy className="w-3 h-3" /> Copy Live Cards ({liveCards.length})
                </button>
              )}
            </div>
            <div className="h-[250px] sm:h-[450px] glass border border-cyber-green/20 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 overflow-y-auto custom-scrollbar space-y-4">
              <AnimatePresence mode="popLayout">
                {liveCards.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-800">
                    <ShieldCheck className="w-12 h-12 sm:w-16 sm:h-16 mb-4 opacity-5" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-20">No Live Assets Detected</p>
                  </div>
                ) : (
                  liveCards.map((res, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 sm:p-6 bg-white/5 border border-white/5 hover:border-cyber-green/40 rounded-xl sm:rounded-2xl group transition-all relative overflow-hidden hover:shadow-[0_0_30px_rgba(0,255,157,0.1)]"
                    >
                      {/* Hover Glow */}
                      <div className="absolute inset-0 bg-cyber-green/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      
                      <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyber-green/10 rounded-lg sm:rounded-xl flex items-center justify-center text-cyber-green border border-cyber-green/20 group-hover:border-cyber-green/40 transition-colors shadow-[0_0_15px_rgba(0,255,157,0.1)]">
                            <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <span className="font-mono text-xs sm:text-sm font-black text-white tracking-widest group-hover:text-cyber-green transition-colors break-all">{res.raw}</span>
                        </div>
                        <button 
                          onClick={() => navigator.clipboard.writeText(res.raw)}
                          className="p-2 bg-dark-950 text-slate-500 hover:text-cyber-green rounded-lg transition-all border border-white/5 hover:border-cyber-green/30 opacity-0 group-hover:opacity-100 hidden sm:block"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 relative z-10">
                        <span className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest border border-white/5 group-hover:border-cyber-green/20 transition-colors">{res.brand}</span>
                        <span className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest border border-white/5 group-hover:border-cyber-green/20 transition-colors">{res.bank}</span>
                        <span className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest border border-white/5 group-hover:border-cyber-green/20 transition-colors">{res.country}</span>
                        <span className="ml-auto text-[10px] font-black text-cyber-green uppercase tracking-widest drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]">{res.message}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Dead Section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 px-4">
              <div className="w-2 h-2 bg-cyber-red rounded-full" />
              <h3 className="text-[10px] font-black text-cyber-red uppercase tracking-[0.3em]">Dead Cards</h3>
            </div>
            <div className="h-[150px] sm:h-[300px] glass border border-cyber-red/20 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 overflow-y-auto custom-scrollbar space-y-4">
              <AnimatePresence mode="popLayout">
                {dieCards.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-800">
                    <XCircle className="w-12 h-12 sm:w-16 sm:h-16 mb-4 opacity-5" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-20">No Dead Nodes</p>
                  </div>
                ) : (
                  dieCards.map((res, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 sm:p-4 bg-white/5 border border-white/5 rounded-lg sm:rounded-xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <XCircle className="w-4 h-4 text-cyber-red/40 shrink-0" />
                        <span className="font-mono text-[10px] sm:text-xs font-bold text-slate-500 tracking-widest truncate">{res.raw}</span>
                      </div>
                      <span className="text-[8px] sm:text-[9px] font-black text-cyber-red/40 uppercase tracking-widest shrink-0">{res.message}</span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Scanning Overlay */}
      <AnimatePresence>
        {checking && currentChecking && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 sm:bottom-12 left-1/2 -translate-x-1/2 z-50 glass border border-cyber-cyan/30 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 sm:gap-6 w-[90%] sm:w-auto"
          >
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-cyber-cyan rounded-full blur-md opacity-20 animate-pulse" />
              <RefreshCw className="w-5 h-5 sm:w-6 h-6 text-cyber-cyan animate-spin relative z-10" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] font-black text-cyber-cyan uppercase tracking-[0.2em]">Verifying Card...</span>
              <span className="text-[10px] sm:text-xs font-mono text-white truncate max-w-[200px] sm:max-w-[250px]">{currentChecking}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
