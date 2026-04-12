import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Bell, BellOff, Volume2, Clock, Plus, Trash2, X, AlertTriangle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TimerSession {
  id: string;
  label: string;
  duration: number; // in seconds
  targetTimestamp: number | null; // null if not running
  remainingAtPause: number | null; // used when paused
  isPaused: boolean;
  status: 'idle' | 'running' | 'paused' | 'completed';
}

interface TimerToolProps {
  timers: TimerSession[];
  setTimers: React.Dispatch<React.SetStateAction<TimerSession[]>>;
}

export const TimerTool: React.FC<TimerToolProps> = ({ timers, setTimers }) => {
  const [now, setNow] = useState(Date.now());
  const [newLabel, setNewLabel] = useState('');
  const [newMinutes, setNewMinutes] = useState(5);
  const [newSeconds, setNewSeconds] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Global tick to force re-renders
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const addTimer = () => {
    const duration = newMinutes * 60 + newSeconds;
    if (duration <= 0) return;
    
    const newTimer: TimerSession = {
      id: Math.random().toString(36).substr(2, 9),
      label: newLabel || `TIMER-UNIT-${timers.length + 1}`,
      duration,
      targetTimestamp: null,
      remainingAtPause: duration,
      isPaused: false,
      status: 'idle'
    };
    
    setTimers([...timers, newTimer]);
    setShowAddModal(false);
    setNewLabel('');
  };

  const startTimer = (id: string) => {
    setTimers(prev => prev.map(t => {
      if (t.id === id) {
        const remaining = t.status === 'completed' ? t.duration : (t.remainingAtPause || t.duration);
        return {
          ...t,
          status: 'running',
          targetTimestamp: now + (remaining * 1000),
          remainingAtPause: null,
          isPaused: false
        };
      }
      return t;
    }));
  };

  const pauseTimer = (id: string) => {
    setTimers(prev => prev.map(t => {
      if (t.id === id && t.targetTimestamp) {
        const remaining = Math.max(0, Math.ceil((t.targetTimestamp - Date.now()) / 1000));
        return {
          ...t,
          status: 'paused',
          targetTimestamp: null,
          remainingAtPause: remaining,
          isPaused: true
        };
      }
      return t;
    }));
  };

  const resetTimer = (id: string) => {
    setTimers(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'idle',
          targetTimestamp: null,
          remainingAtPause: t.duration,
          isPaused: false
        };
      }
      return t;
    }));
  };

  const deleteTimer = (id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  const getRemainingSeconds = (timer: TimerSession) => {
    if (timer.status === 'running' && timer.targetTimestamp) {
      return Math.max(0, Math.ceil((timer.targetTimestamp - now) / 1000));
    }
    return timer.remainingAtPause || 0;
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((now - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 sm:p-6 glass rounded-2xl sm:rounded-[2rem] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyber-cyan/5 rounded-full blur-[60px] -mr-24 -mt-24" />
        
        <div className="flex items-center gap-3 sm:gap-4 relative z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-cyber-cyan rounded-lg blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-dark-900 rounded-lg border border-cyber-cyan/30 flex items-center justify-center">
              <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-cyber-cyan animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-white uppercase">System <span className="text-cyber-cyan">Timer</span></h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-cyber-green animate-ping" />
                <span className="text-[8px] font-black text-cyber-green uppercase tracking-widest">Stable</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active: {timers.length}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto relative group relative z-10"
        >
          <div className="absolute inset-0 bg-cyber-cyan rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative px-5 py-3 bg-cyber-cyan text-dark-950 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95">
            <Plus className="w-3.5 h-3.5" /> New Unit
          </div>
        </button>
      </div>

      {/* Timers Container */}
      <div className="relative glass rounded-[2rem] border border-white/5 overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="relative z-10 p-2 sm:p-4">
          {timers.length === 0 ? (
            <div className="py-20 sm:py-32 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-slate-700" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-500 uppercase tracking-widest">No Active Units</h3>
              <p className="text-xs sm:text-sm text-slate-700 mt-2 font-medium">Initialize a new unit to begin tracking</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              <AnimatePresence mode="popLayout">
                {timers.map((timer) => {
                  const remaining = getRemainingSeconds(timer);
                  const progress = (remaining / timer.duration) * 100;
                  
                  return (
                    <motion.div
                      key={timer.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className={`group relative bg-dark-900/80 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-500 overflow-hidden shadow-lg ${
                        timer.status === 'completed' 
                          ? 'border-cyber-red/60 bg-cyber-red/10 shadow-[0_0_40px_rgba(255,59,48,0.2)]' 
                          : 'border-white/10 hover:border-cyber-cyan/50 hover:bg-dark-800/90 hover:shadow-[0_0_20px_rgba(0,243,255,0.1)]'
                      }`}
                    >
                      {/* Corner Accents */}
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10 rounded-br-lg" />

                      {/* Background Progress Fill */}
                      <div 
                        className={`absolute inset-0 opacity-[0.02] transition-all duration-1000 ${
                          timer.status === 'completed' ? 'bg-cyber-red' : 'bg-cyber-cyan'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                      
                      {/* Completion Alert Overlay */}
                      {timer.status === 'completed' && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.1, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="absolute inset-0 bg-cyber-red pointer-events-none z-0"
                        />
                      )}
                      
                      <div className="relative z-10 flex items-center gap-4">
                        {/* Progress Circle (Left) */}
                        <div className="relative flex-shrink-0">
                          <div className={`absolute inset-0 rounded-full blur-xl opacity-10 transition-all duration-500 ${
                            timer.status === 'completed' ? 'bg-cyber-red' : 'bg-cyber-cyan'
                          }`} />
                          
                          {timer.status === 'completed' && (
                            <motion.div 
                              animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
                              transition={{ duration: 0.3, repeat: Infinity }}
                              className="absolute inset-0 bg-cyber-red/20 rounded-full blur-2xl z-0"
                            />
                          )}
                          
                          <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90 relative z-10">
                            <circle
                              cx="32" cy="32" r="28"
                              stroke="currentColor" strokeWidth="1"
                              fill="transparent" className="text-white/5"
                              strokeDasharray="2 2"
                              style={{ cx: '50%', cy: '50%', r: '40%' }}
                            />
                            <motion.circle
                              cx="32" cy="32" r="28"
                              stroke="currentColor" strokeWidth="2"
                              fill="transparent" strokeDasharray="176"
                              initial={{ strokeDashoffset: 176 }}
                              animate={{ strokeDashoffset: 176 - (176 * progress) / 100 }}
                              transition={{ duration: 1, ease: "linear" }}
                              className={timer.status === 'completed' ? 'text-cyber-red' : 'text-cyber-cyan'}
                              strokeLinecap="round"
                              style={{ cx: '50%', cy: '50%', r: '40%', filter: `drop-shadow(0 0 6px ${timer.status === 'completed' ? 'rgba(255,59,48,0.4)' : 'rgba(0,243,255,0.4)'})` }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                            <span className={`text-xs sm:text-sm font-black font-mono tracking-tighter ${
                              timer.status === 'completed' ? 'text-cyber-red animate-pulse' : 'text-white'
                            }`}>
                              {timer.status === 'completed' ? '00:00' : formatTime(remaining)}
                            </span>
                          </div>
                        </div>

                        {/* Info (Middle) */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-1 h-1 rounded-full ${
                              timer.status === 'running' ? 'bg-cyber-green animate-pulse shadow-[0_0_8px_rgba(0,255,159,0.5)]' : 
                              timer.status === 'paused' ? 'bg-cyber-amber' : 
                              timer.status === 'completed' ? 'bg-cyber-red' : 'bg-slate-700'
                            }`} />
                            <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${
                              timer.status === 'completed' ? 'text-cyber-red' : 'text-slate-500'
                            }`}>
                              {timer.status === 'running' ? 'Active' : 
                               timer.status === 'paused' ? 'Paused' : 
                               timer.status === 'completed' ? 'Terminated' : 'Standby'}
                            </span>
                          </div>
                          <h3 className="text-xs sm:text-sm font-black text-white truncate uppercase tracking-tight mb-1 group-hover:text-cyber-cyan transition-colors">{timer.label}</h3>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="text-[6px] font-black text-slate-600 uppercase tracking-widest">Target</span>
                              <span className={`text-[8px] font-bold font-mono ${timer.status === 'completed' ? 'text-cyber-red/60' : 'text-slate-400'}`}>{formatTime(timer.duration)}</span>
                            </div>
                            <div className="w-px h-4 bg-white/5" />
                            <div className="flex flex-col">
                              <span className="text-[6px] font-black text-slate-600 uppercase tracking-widest">Status</span>
                              <span className={`text-[8px] font-bold uppercase ${timer.status === 'completed' ? 'text-cyber-red/60' : 'text-slate-400'}`}>
                                {timer.status === 'completed' ? 'Ended' : 'Syncing'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Controls (Right) */}
                        <div className="flex flex-col gap-2 items-end">
                          <button 
                            onClick={() => deleteTimer(timer.id)}
                            className="p-1.5 bg-white/5 hover:bg-cyber-red/10 text-slate-600 hover:text-cyber-red rounded-lg transition-all border border-transparent hover:border-cyber-red/20"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => resetTimer(timer.id)}
                              className="p-1.5 bg-dark-800 text-slate-500 rounded-lg hover:bg-white/5 transition-all border border-white/5"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                            {timer.status === 'running' ? (
                              <button
                                onClick={() => pauseTimer(timer.id)}
                                className="p-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all border border-white/10"
                              >
                                <Pause className="w-3 h-3 fill-current" />
                              </button>
                            ) : (
                              <button
                                onClick={() => startTimer(timer.id)}
                                className={`p-1.5 rounded-lg transition-all shadow-lg ${
                                  timer.status === 'completed' 
                                    ? 'bg-cyber-red text-white shadow-cyber-red/20' 
                                    : 'bg-cyber-cyan text-dark-950 shadow-cyber-cyan/20 hover:shadow-cyber-cyan/40'
                                }`}
                              >
                                <Play className="w-3 h-3 fill-current" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyber-cyan/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-cyber-cyan/20 shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-cyber-cyan" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest mb-2">Timer Integrity</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed font-medium">
              All timer units are locked to system hardware timestamps. Persistence is maintained across session terminations, tab switches, and network re-initialization.
            </p>
          </div>
        </div>
        <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyber-purple/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-cyber-purple/20 shrink-0">
            <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyber-purple" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest mb-2">Audio Feedback</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed font-medium">
              System alerts are broadcasted globally. Ensure system audio is enabled for critical completion notifications.
            </p>
          </div>
        </div>
      </div>

      {/* Add Timer Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-dark-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-dark-900 rounded-[2rem] sm:rounded-[3rem] border border-white/10 p-6 sm:p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent" />
              
              <div className="flex items-center justify-between mb-6 sm:mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyber-cyan/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-cyber-cyan/20">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-cyber-cyan" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">New Timer Unit</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Timer Initialization</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="space-y-6 sm:space-y-8">
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unit Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. CORE-SESSION-01"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full p-4 sm:p-5 bg-dark-800 border border-white/5 rounded-xl sm:rounded-2xl text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyber-cyan focus:ring-4 focus:ring-cyber-cyan/10 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-center block">Minutes</label>
                    <div className="relative group">
                      <input
                        type="number"
                        min="0"
                        value={newMinutes}
                        onChange={(e) => setNewMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full p-4 sm:p-6 bg-dark-800 border border-white/5 rounded-2xl sm:rounded-3xl text-2xl sm:text-3xl font-black text-cyber-cyan text-center focus:border-cyber-cyan focus:ring-4 focus:ring-cyber-cyan/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-center block">Seconds</label>
                    <div className="relative group">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={newSeconds}
                        onChange={(e) => setNewSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="w-full p-4 sm:p-6 bg-dark-800 border border-white/5 rounded-2xl sm:rounded-3xl text-2xl sm:text-3xl font-black text-cyber-cyan text-center focus:border-cyber-cyan focus:ring-4 focus:ring-cyber-cyan/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={addTimer}
                  className="w-full py-4 sm:py-5 bg-cyber-cyan hover:bg-cyber-cyan/90 text-dark-950 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg shadow-cyber-cyan/20 transition-all active:scale-[0.98] mt-4"
                >
                  Initialize Protocol
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
