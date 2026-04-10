import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, Copy, Check, Link as LinkIcon, Type, RefreshCw, Trash2, Share2, Plus, X, AlertTriangle, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QRSession {
  id: string;
  label: string;
  content: string;
  color: string;
  bgColor: string;
  createdAt: number;
}

export const QRCodeGenerator: React.FC = () => {
  const [sessions, setSessions] = useState<QRSession[]>(() => {
    const saved = localStorage.getItem('securehub_qr_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSession, setEditingSession] = useState<QRSession | null>(null);
  
  const [newLabel, setNewLabel] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState('#000000');
  const [newBgColor, setNewBgColor] = useState('#ffffff');
  
  const [toast, setToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('securehub_qr_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const openAddModal = () => {
    setEditingSession(null);
    setNewLabel('');
    setNewContent('');
    setNewColor('#000000');
    setNewBgColor('#ffffff');
    setShowAddModal(true);
  };

  const openEditModal = (session: QRSession) => {
    setEditingSession(session);
    setNewLabel(session.label);
    setNewContent(session.content);
    setNewColor(session.color);
    setNewBgColor(session.bgColor);
    setShowAddModal(true);
  };

  const saveSession = () => {
    if (!newContent) return;
    
    if (editingSession) {
      setSessions(prev => prev.map(s => s.id === editingSession.id ? {
        ...s,
        label: newLabel || s.label,
        content: newContent,
        color: newColor,
        bgColor: newBgColor
      } : s));
      setToast('Matrix Updated');
    } else {
      const newSession: QRSession = {
        id: Math.random().toString(36).substr(2, 9),
        label: newLabel || `Matrix ${sessions.length + 1}`,
        content: newContent,
        color: newColor,
        bgColor: newBgColor,
        createdAt: Date.now()
      };
      setSessions([newSession, ...sessions]);
      setToast('Matrix Generated');
    }
    
    setShowAddModal(false);
    setEditingSession(null);
    setTimeout(() => setToast(null), 2000);
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const downloadQR = (id: string) => {
    const svg = document.getElementById(`qr-svg-${id}`) as unknown as SVGSVGElement;
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 300, 300);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `matrix-${id}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const copyContent = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-3 bg-cyber-purple text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(168,85,247,0.3)] border border-cyber-purple/30"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="p-8 glass rounded-[2.5rem] border border-white/5 relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-purple/5 rounded-full blur-[40px] -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-cyber-purple/10 rounded-2xl flex items-center justify-center border border-cyber-purple/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                  <QrCode className="w-6 h-6 text-cyber-purple" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Secure <span className="text-cyber-purple">Matrix</span></h2>
                  <p className="text-[10px] font-black text-cyber-purple/60 uppercase tracking-[0.3em]">QR Code Generator v2.0</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Generate high-density secure matrix codes for encrypted data visualization and quick access.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="p-8 glass rounded-[2.5rem] border border-white/5 h-full flex flex-col justify-center space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-10 h-10 rounded-xl border-2 border-dark-950 bg-dark-800 flex items-center justify-center">
                        <QrCode className="w-4 h-4 text-cyber-purple/40" />
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {sessions.length} QR Codes Active
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={openAddModal}
                  className="px-8 py-4 bg-cyber-purple hover:bg-cyber-purple/90 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 transition-all shadow-lg shadow-cyber-purple/20 active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" /> New QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      {sessions.length === 0 ? (
        <div className="py-40 flex flex-col items-center justify-center text-center glass border border-white/5 rounded-[3rem]">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/5">
            <QrCode className="w-10 h-10 text-slate-700" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">No Active QR Codes Found</p>
          <button 
            onClick={openAddModal}
            className="mt-8 text-cyber-purple text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
          >
            + Create First QR Code
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass rounded-[2.5rem] border border-white/5 hover:border-cyber-purple/40 group relative flex flex-col overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(168,85,247,0.1)]"
              >
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-cyber-purple/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                
                <div className="p-6 flex items-start justify-between border-b border-white/5 relative z-10">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[10px] font-black text-white truncate pr-2 uppercase tracking-widest group-hover:text-cyber-purple transition-colors">{session.label}</h3>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => openEditModal(session)}
                      className="p-2.5 bg-white/5 hover:bg-cyber-purple/20 text-slate-500 hover:text-cyber-purple rounded-xl transition-all border border-white/5 hover:border-cyber-purple/30"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => deleteSession(session.id)}
                      className="p-2.5 bg-white/5 hover:bg-cyber-red/20 text-slate-500 hover:text-cyber-red rounded-xl transition-all border border-white/5 hover:border-cyber-red/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-8 flex flex-col items-center gap-8 relative z-10">
                  <div className="relative group/qr">
                    <div className="absolute -inset-8 bg-cyber-purple/20 rounded-[3rem] blur-3xl opacity-0 group-hover/qr:opacity-100 transition-opacity duration-700" />
                    <div className="relative bg-white p-5 rounded-[2.5rem] shadow-2xl group-hover/qr:scale-105 transition-transform duration-500 border-4 border-cyber-purple/10 group-hover:border-cyber-purple/30">
                      <QRCodeSVG
                        id={`qr-svg-${session.id}`}
                        value={session.content}
                        size={160}
                        fgColor={session.color}
                        bgColor={session.bgColor}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>

                  <div className="w-full space-y-4">
                    <div className="p-4 bg-dark-900/50 rounded-2xl border border-white/5 group-hover:border-cyber-purple/30 transition-colors">
                      <p className="text-[9px] font-mono text-cyber-purple truncate text-center group-hover:text-cyber-purple transition-colors drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]">{session.content}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => downloadQR(session.id)}
                        className="py-3.5 bg-cyber-purple/10 hover:bg-cyber-purple/20 text-cyber-purple rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-cyber-purple/20 hover:border-cyber-purple/40"
                      >
                        <Download className="w-3.5 h-3.5" /> Export
                      </button>
                      <button
                        onClick={() => copyContent(session.id, session.content)}
                        className="py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/5 group-hover:border-white/20"
                      >
                        {copiedId === session.id ? <Check className="w-3.5 h-3.5 text-cyber-cyan" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === session.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Info Section */}
      <div className="p-8 glass rounded-[2.5rem] border border-white/5 flex items-start gap-6">
        <div className="w-12 h-12 bg-cyber-purple/10 rounded-2xl flex items-center justify-center shrink-0 border border-cyber-purple/20">
          <AlertTriangle className="w-6 h-6 text-cyber-purple" />
        </div>
        <div>
          <p className="text-[10px] font-black text-cyber-purple uppercase tracking-[0.2em] mb-2">Secure Link Protocol</p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            QR codes are generated using high-density error correction algorithms. All generated codes are stored in your local cache for persistent access.
          </p>
        </div>
      </div>

      {/* Add/Edit Modal */}
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
              className="relative w-full max-w-md bg-dark-900 rounded-[3rem] border border-white/5 p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyber-purple/20 rounded-2xl flex items-center justify-center border border-cyber-purple/30 shadow-[0_0_15px_rgba(155,93,229,0.2)]">
                    {editingSession ? <Edit2 className="w-6 h-6 text-cyber-purple" /> : <Plus className="w-6 h-6 text-cyber-purple" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase hover-glitch cursor-default">
                      {editingSession ? 'Edit QR Code' : 'New QR Code'}
                    </h3>
                    <p className="text-[9px] font-black text-cyber-purple uppercase tracking-widest">Configuration Terminal</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">QR Label</label>
                  <input
                    type="text"
                    placeholder="e.g. SECURE_ACCESS_LINK"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full p-5 bg-dark-800 border border-white/5 rounded-2xl text-sm font-bold text-white placeholder:text-slate-700 focus:ring-2 focus:ring-cyber-purple/50 outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Content</label>
                  <textarea
                    placeholder="ENTER URL OR TEXT DATA..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full h-32 p-5 bg-dark-800 border border-white/5 rounded-2xl text-sm font-mono text-cyber-purple placeholder:text-slate-700 focus:ring-2 focus:ring-cyber-purple/50 outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">QR Color</label>
                    <div className="flex items-center gap-4 p-4 bg-dark-800 border border-white/5 rounded-2xl">
                      <input 
                        type="color" 
                        value={newColor} 
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-10 h-10 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden"
                      />
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{newColor}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Background</label>
                    <div className="flex items-center gap-4 p-4 bg-dark-800 border border-white/5 rounded-2xl">
                      <input 
                        type="color" 
                        value={newBgColor} 
                        onChange={(e) => setNewBgColor(e.target.value)}
                        className="w-10 h-10 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden"
                      />
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{newBgColor}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={saveSession}
                  disabled={!newContent}
                  className="w-full py-6 bg-cyber-purple hover:bg-cyber-purple/90 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-lg shadow-cyber-purple/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {editingSession ? 'Update QR Code' : 'Generate QR Code'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
