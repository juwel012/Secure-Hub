import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Bell, BellOff, Volume2, Clock, Plus, Trash2, X, AlertTriangle } from 'lucide-react';
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

export const TimerTool: React.FC = () => {
  const [timers, setTimers] = useState<TimerSession[]>(() => {
    const saved = localStorage.getItem('securehub_timers');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [now, setNow] = useState(Date.now());
  const [newLabel, setNewLabel] = useState('');
  const [newMinutes, setNewMinutes] = useState(5);
  const [newSeconds, setNewSeconds] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ALARM_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

  // Persist timers to localStorage
  useEffect(() => {
    localStorage.setItem('securehub_timers', JSON.stringify(timers));
  }, [timers]);

  // Global tick to force re-renders and check for completions
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      
      setTimers(prev => {
        let changed = false;
        const updated = prev.map(t => {
          if (t.status === 'running' && t.targetTimestamp && currentTime >= t.targetTimestamp) {
            changed = true;
            if (soundEnabled) {
              audioRef.current?.play().catch(() => {});
            }
            return { ...t, status: 'completed', targetTimestamp: null, remainingAtPause: 0 };
          }
          return t;
        });
        return changed ? updated : prev;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const addTimer = () => {
    const duration = newMinutes * 60 + newSeconds;
    if (duration <= 0) return;
    
    const newTimer: TimerSession = {
      id: Math.random().toString(36).substr(2, 9),
      label: newLabel || `Timer ${timers.length + 1}`,
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
          targetTimestamp: Date.now() + (remaining * 1000),
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

  return (
    <div className="p-4 sm:p-10 glass rounded-[2rem] sm:rounded-[3rem] shadow-2xl shadow-black/50 text-white relative overflow-hidden">
      <audio ref={audioRef} src={ALARM_SOUND_URL} preload="auto" />
      
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyber-amber/10 rounded-full blur-[120px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyber-cyan/10 rounded-full blur-[120px] -ml-48 -mb-48" />

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-8 sm:mb-12 gap-6 sm:gap-8">
          <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-cyber-amber rounded-2xl blur-lg opacity-20 animate-pulse" />
              <div className="relative p-3 sm:p-5 bg-dark-900 rounded-2xl border border-cyber-amber/30">
                <Timer className="w-6 h-6 sm:w-10 sm:h-10 text-cyber-amber" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">Multi-Timer Suite</h2>
              <p className="text-[10px] sm:text-sm font-black text-cyber-amber uppercase tracking-[0.3em] mt-1 opacity-100">Background Persistent v2.0</p>
            </div>
          </div>

          <div className="flex gap-3 w-full lg:w-auto justify-end">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                soundEnabled 
                  ? 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/20' 
                  : 'bg-dark-900/50 text-slate-500 border-white/5'
              }`}
              title={soundEnabled ? "Mute Alarm" : "Unmute Alarm"}
            >
              {soundEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-4 bg-cyber-amber hover:bg-cyber-amber/80 text-dark-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-lg shadow-cyber-amber/20 active:scale-95"
            >
              <Plus className="w-4 h-4" /> New Timer
            </button>
          </div>
        </div>

        {timers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
            <Clock className="w-16 h-16 mb-6" />
            <p className="text-sm font-black uppercase tracking-[0.3em]">No active timers</p>
            <p className="text-xs mt-2">Click "New Timer" to start a session</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {timers.map((timer) => {
                const remaining = getRemainingSeconds(timer);
                const progress = (remaining / timer.duration) * 100;
                
                return (
                  <motion.div
                    key={timer.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`glass p-6 rounded-[2rem] border transition-all relative overflow-hidden ${
                      timer.status === 'completed' ? 'border-cyber-red/30 bg-cyber-red/5' : 'border-white/5'
                    }`}
                  >
                    {/* Progress Bar Background */}
                    <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full" />
                    <motion.div 
                      className={`absolute bottom-0 left-0 h-1 ${timer.status === 'completed' ? 'bg-cyber-red' : 'bg-cyber-amber'}`}
                      initial={{ width: '100%' }}
                      animate={{ width: `${progress}%` }}
                    />

                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-white truncate pr-2">{timer.label}</h3>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          {timer.status === 'completed' ? 'Session Ended' : `Total: ${formatTime(timer.duration)}`}
                        </p>
                      </div>
                      <button 
                        onClick={() => deleteTimer(timer.id)}
                        className="p-2 hover:bg-cyber-red/10 text-slate-500 hover:text-cyber-red rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className={`text-3xl font-black font-mono tracking-tighter ${
                          timer.status === 'completed' ? 'text-cyber-red animate-pulse' : 'text-white'
                        }`}>
                          {formatTime(remaining)}
                        </div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">
                          {remaining} Seconds Left
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {timer.status === 'idle' || timer.status === 'paused' || timer.status === 'completed' ? (
                          <button
                            onClick={() => startTimer(timer.id)}
                            className="p-3 bg-cyber-amber text-dark-950 rounded-xl hover:bg-cyber-amber/80 transition-all active:scale-95"
                          >
                            <Play className="w-4 h-4 fill-current" />
                          </button>
                        ) : (
                          <button
                            onClick={() => pauseTimer(timer.id)}
                            className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all active:scale-95"
                          >
                            <Pause className="w-4 h-4 fill-current" />
                          </button>
                        )}
                        <button
                          onClick={() => resetTimer(timer.id)}
                          className="p-3 bg-dark-800 text-slate-400 rounded-xl hover:bg-white/5 transition-all active:scale-95"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-10 p-6 bg-cyber-cyan/5 border border-cyber-cyan/20 rounded-2xl flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-cyber-cyan shrink-0 mt-1" />
          <div>
            <p className="text-[10px] font-black text-cyber-cyan uppercase tracking-widest mb-1">Background Persistence Active</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Timers are calculated using system timestamps. They will continue to "run" even if you switch tabs, minimize the browser, or refresh the page.
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
              className="relative w-full max-w-md bg-dark-900 rounded-[2.5rem] border border-white/5 p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyber-amber/20 rounded-xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-cyber-amber" />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">New Timer</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Label (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Work Session, Break"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full p-4 bg-dark-800 border border-white/5 rounded-2xl text-sm font-bold text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyber-amber/50 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Minutes</label>
                    <input
                      type="number"
                      min="0"
                      value={newMinutes}
                      onChange={(e) => setNewMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full p-4 bg-dark-800 border border-white/5 rounded-2xl text-2xl font-black text-cyber-amber text-center focus:ring-2 focus:ring-cyber-amber/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Seconds</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={newSeconds}
                      onChange={(e) => setNewSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-full p-4 bg-dark-800 border border-white/5 rounded-2xl text-2xl font-black text-cyber-amber text-center focus:ring-2 focus:ring-cyber-amber/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={addTimer}
                  className="w-full py-5 bg-cyber-amber hover:bg-cyber-amber/90 text-dark-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-cyber-amber/20 transition-all active:scale-[0.98]"
                >
                  Create Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
