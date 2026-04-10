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
    }, 1000);
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 glass rounded-[2.5rem] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-cyan/5 rounded-full blur-[80px] -mr-32 -mt-32" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-cyber-cyan rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative w-16 h-16 bg-dark-900 rounded-2xl border border-cyber-cyan/30 flex items-center justify-center">
              <Timer className="w-8 h-8 text-cyber-cyan animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase">System <span className="text-cyber-cyan">Timer</span></h2>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-ping" />
                <span className="text-[10px] font-black text-cyber-green uppercase tracking-widest">Clock Stable</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Timers: {timers.length}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="relative group relative z-10"
        >
          <div className="absolute inset-0 bg-cyber-cyan rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative px-8 py-4 bg-cyber-cyan text-dark-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all active:scale-95">
            <Plus className="w-4 h-4" /> New Timer
          </div>
        </button>
      </div>

      {/* Timers Grid */}
      {timers.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center text-center glass rounded-[3rem] border border-white/5 border-dashed">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No Active Timers</h3>
          <p className="text-sm text-slate-600 mt-2 font-medium">Initialize a new timer to begin tracking</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {timers.map((timer) => {
              const remaining = getRemainingSeconds(timer);
              const progress = (remaining / timer.duration) * 100;
              
              return (
                <motion.div
                  key={timer.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className={`group relative glass p-6 rounded-[2rem] border transition-all duration-500 overflow-hidden ${
                    timer.status === 'completed' 
                      ? 'border-cyber-red/50 bg-cyber-red/5 shadow-[0_0_40px_rgba(255,59,48,0.2)]' 
                      : 'border-white/5 hover:border-cyber-cyan/40 hover:shadow-[0_0_30px_rgba(0,243,255,0.1)]'
                  }`}
                >
                  {/* Background Progress Fill */}
                  <div 
                    className={`absolute inset-0 opacity-[0.05] transition-all duration-1000 ${
                      timer.status === 'completed' ? 'bg-cyber-red' : 'bg-cyber-cyan'
                    }`}
                    style={{ height: `${progress}%`, top: `${100 - progress}%` }}
                  />
                  
                  {/* Scanline Effect */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            timer.status === 'running' ? 'bg-cyber-green animate-pulse shadow-[0_0_8px_rgba(0,255,159,0.8)]' : 
                            timer.status === 'paused' ? 'bg-cyber-amber shadow-[0_0_8px_rgba(255,184,0,0.8)]' : 
                            timer.status === 'completed' ? 'bg-cyber-red shadow-[0_0_8px_rgba(255,59,48,0.8)]' : 'bg-slate-600'
                          }`} />
                          <span className={`text-[8px] font-black uppercase tracking-widest ${
                            timer.status === 'completed' ? 'text-cyber-red' : 'text-slate-500'
                          }`}>
                            {timer.status === 'running' ? 'Active Sync' : 
                             timer.status === 'paused' ? 'Sync Paused' : 
                             timer.status === 'completed' ? 'Sync Terminated' : 'Standby'}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white truncate uppercase tracking-tight group-hover:text-cyber-cyan transition-colors">{timer.label}</h3>
                      </div>
                      <button 
                        onClick={() => deleteTimer(timer.id)}
                        className="p-1.5 bg-white/5 hover:bg-cyber-red/10 text-slate-500 hover:text-cyber-red rounded-lg transition-all border border-transparent hover:border-cyber-red/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col items-center justify-center py-2">
                      <div className="relative">
                        {/* Glow Effect */}
                        <div className={`absolute inset-0 rounded-full blur-2xl opacity-10 transition-all duration-500 ${
                          timer.status === 'completed' ? 'bg-cyber-red' : 'bg-cyber-cyan'
                        }`} />
                        
                        {/* Circular Progress (SVG) */}
                        <svg className="w-32 h-32 transform -rotate-90 relative z-10">
                          <circle
                            cx="64"
                            cy="64"
                            r="55"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            className="text-white/5"
                            strokeDasharray="4 4"
                          />
                          <motion.circle
                            cx="64"
                            cy="64"
                            r="55"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray="345"
                            initial={{ strokeDashoffset: 345 }}
                            animate={{ strokeDashoffset: 345 - (345 * progress) / 100 }}
                            transition={{ duration: 1, ease: "linear" }}
                            className={timer.status === 'completed' ? 'text-cyber-red' : 'text-cyber-cyan'}
                            strokeLinecap="round"
                            style={{ filter: `drop-shadow(0 0 8px ${timer.status === 'completed' ? 'rgba(255,59,48,0.5)' : 'rgba(0,243,255,0.5)'})` }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                          <span className={`text-3xl font-black font-mono tracking-tighter transition-all duration-300 ${
                            timer.status === 'completed' ? 'text-cyber-red animate-pulse drop-shadow-[0_0_15px_rgba(255,0,110,0.8)]' : 'text-white group-hover:text-cyber-cyan'
                          }`}>
                            {timer.status === 'completed' ? '00:00' : formatTime(remaining)}
                          </span>
                          <span className={`text-[7px] font-black uppercase tracking-widest mt-0.5 ${
                            timer.status === 'completed' ? 'text-cyber-red' : 'text-slate-500'
                          }`}>
                            {timer.status === 'completed' ? 'COMPLETED' : 'Remaining'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Status Report</p>
                        <p className={`text-[10px] font-bold ${timer.status === 'completed' ? 'text-cyber-red' : 'text-white'}`}>
                          {timer.status === 'completed' 
                            ? (timer.completedAt ? `COMPLETED ${formatTimeAgo(timer.completedAt)}` : 'COMPLETED')
                            : `Target: ${formatTime(timer.duration)}`
                          }
                        </p>
                      </div>
                      
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => resetTimer(timer.id)}
                          className="p-2.5 bg-dark-800 text-slate-400 rounded-lg hover:bg-white/5 transition-all active:scale-95 border border-white/5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        {timer.status === 'running' ? (
                          <button
                            onClick={() => pauseTimer(timer.id)}
                            className="p-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all active:scale-95 border border-white/10"
                          >
                            <Pause className="w-3.5 h-3.5 fill-current" />
                          </button>
                        ) : (
                          <button
                            onClick={() => startTimer(timer.id)}
                            className={`p-2.5 rounded-lg transition-all active:scale-95 shadow-lg ${
                              timer.status === 'completed' 
                                ? 'bg-cyber-red text-white shadow-cyber-red/20' 
                                : 'bg-cyber-cyan text-dark-950 shadow-cyber-cyan/20 hover:shadow-cyber-cyan/40'
                            }`}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
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

      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 glass rounded-[2.5rem] border border-white/5 flex items-start gap-6">
          <div className="w-12 h-12 bg-cyber-cyan/10 rounded-2xl flex items-center justify-center border border-cyber-cyan/20 shrink-0">
            <Shield className="w-6 h-6 text-cyber-cyan" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">Timer Integrity</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              All timer units are locked to system hardware timestamps. Persistence is maintained across session terminations, tab switches, and network re-initialization.
            </p>
          </div>
        </div>
        <div className="p-8 glass rounded-[2.5rem] border border-white/5 flex items-start gap-6">
          <div className="w-12 h-12 bg-cyber-purple/10 rounded-2xl flex items-center justify-center border border-cyber-purple/20 shrink-0">
            <Volume2 className="w-6 h-6 text-cyber-purple" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">Audio Feedback</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
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
              className="relative w-full max-w-md bg-dark-900 rounded-[3rem] border border-white/10 p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent" />
              
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyber-cyan/10 rounded-2xl flex items-center justify-center border border-cyber-cyan/20">
                    <Plus className="w-6 h-6 text-cyber-cyan" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase">New Timer Unit</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Timer Initialization</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unit Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. CORE-SESSION-01"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full p-5 bg-dark-800 border border-white/5 rounded-2xl text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyber-cyan focus:ring-4 focus:ring-cyber-cyan/10 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-center block">Minutes</label>
                    <div className="relative group">
                      <input
                        type="number"
                        min="0"
                        value={newMinutes}
                        onChange={(e) => setNewMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full p-6 bg-dark-800 border border-white/5 rounded-3xl text-3xl font-black text-cyber-cyan text-center focus:border-cyber-cyan focus:ring-4 focus:ring-cyber-cyan/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-center block">Seconds</label>
                    <div className="relative group">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={newSeconds}
                        onChange={(e) => setNewSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="w-full p-6 bg-dark-800 border border-white/5 rounded-3xl text-3xl font-black text-cyber-cyan text-center focus:border-cyber-cyan focus:ring-4 focus:ring-cyber-cyan/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={addTimer}
                  className="w-full py-5 bg-cyber-cyan hover:bg-cyber-cyan/90 text-dark-950 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg shadow-cyber-cyan/20 transition-all active:scale-[0.98] mt-4"
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
