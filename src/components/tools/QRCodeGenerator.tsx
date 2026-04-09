import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, Copy, Check, Link as LinkIcon, Type, RefreshCw, Trash2, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const QRCodeGenerator: React.FC = () => {
  const [input, setInput] = useState(() => localStorage.getItem('securehub_qr_input') || '');
  const [qrColor, setQrColor] = useState(() => localStorage.getItem('securehub_qr_color') || '#000000');
  const [bgColor, setBgColor] = useState(() => localStorage.getItem('securehub_qr_bg_color') || '#ffffff');
  const [size, setSize] = useState(() => Number(localStorage.getItem('securehub_qr_size')) || 256);
  const [includeMargin, setIncludeMargin] = useState(() => {
    const saved = localStorage.getItem('securehub_qr_margin');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    localStorage.setItem('securehub_qr_input', input);
  }, [input]);

  useEffect(() => {
    localStorage.setItem('securehub_qr_color', qrColor);
  }, [qrColor]);

  useEffect(() => {
    localStorage.setItem('securehub_qr_bg_color', bgColor);
  }, [bgColor]);

  useEffect(() => {
    localStorage.setItem('securehub_qr_size', size.toString());
  }, [size]);

  useEffect(() => {
    localStorage.setItem('securehub_qr_margin', JSON.stringify(includeMargin));
  }, [includeMargin]);

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size + (includeMargin ? 40 : 0);
      canvas.height = size + (includeMargin ? 40 : 0);
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, includeMargin ? 20 : 0, includeMargin ? 20 : 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `qrcode-${Date.now()}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const copyToClipboard = () => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearInput = () => {
    setInput('');
    setQrColor('#000000');
    setBgColor('#ffffff');
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
                <QrCode className="w-6 h-6 sm:w-10 sm:h-10 text-cyber-cyan" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">QR Code Generator</h2>
              <p className="text-[10px] sm:text-sm font-black text-cyber-cyan uppercase tracking-[0.3em] mt-1 opacity-100">Digital Identity Protocol</p>
            </div>
          </div>

          <div className="flex gap-3 w-full lg:w-auto justify-end">
            <button 
              onClick={clearInput}
              className="p-3 sm:p-4 bg-dark-900/50 hover:bg-cyber-red/10 text-slate-500 hover:text-cyber-red rounded-2xl border border-white/5 transition-all"
              title="Clear Input"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={copyToClipboard}
              className="p-3 sm:p-4 bg-dark-900/50 hover:bg-cyber-cyan/10 text-slate-500 hover:text-cyber-cyan rounded-2xl border border-white/5 transition-all"
              title="Copy Content"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-7 space-y-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyber-cyan to-cyber-purple rounded-[1.5rem] sm:rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-25 transition duration-1000" />
              <div className="relative">
                <div className="absolute top-5 left-6 flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <Type className="w-4 h-4" /> Content Terminal
                </div>
                <textarea
                  placeholder="ENTER TEXT OR URL HERE..."
                  className="w-full h-[150px] sm:h-[200px] p-6 sm:p-12 pt-12 sm:pt-16 bg-dark-900/80 backdrop-blur-xl border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] focus:ring-2 focus:ring-cyber-cyan/50 outline-none transition-all resize-none font-mono text-xs sm:text-sm text-cyber-cyan placeholder:text-slate-700 custom-scrollbar"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 text-cyber-cyan" /> Appearance
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Background</span>
                    <input 
                      type="color" 
                      value={bgColor} 
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 bg-transparent border-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 text-cyber-purple" /> Configuration
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-slate-400">Size</span>
                      <span className="text-xs font-black text-cyber-cyan">{size}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="128" 
                      max="512" 
                      step="32"
                      value={size} 
                      onChange={(e) => setSize(Number(e.target.value))}
                      className="w-full h-1.5 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-cyber-cyan"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div 
                      onClick={() => setIncludeMargin(!includeMargin)}
                      className={`w-10 h-5 rounded-full relative transition-all ${includeMargin ? 'bg-cyber-cyan' : 'bg-dark-800'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${includeMargin ? 'left-6' : 'left-1'}`} />
                    </div>
                    <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">Include Margin</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-5 flex flex-col items-center justify-center">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-br from-cyber-cyan/20 to-cyber-purple/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
              <div className="relative glass p-8 sm:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col items-center gap-8">
                <div className="bg-white p-4 rounded-2xl shadow-inner">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={input || 'placeholder'}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <QRCodeSVG
                        ref={qrRef}
                        value={input || 'https://securehub.pro'}
                        size={size > 300 ? 300 : size}
                        fgColor="#000000"
                        bgColor="#ffffff"
                        level="H"
                        includeMargin={includeMargin}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="flex flex-col gap-4 w-full">
                  <button
                    onClick={downloadQRCode}
                    disabled={!input}
                    className="w-full py-4 bg-cyber-cyan hover:bg-cyber-cyan/80 text-dark-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-cyber-cyan/20 active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={copyToClipboard}
                      disabled={!input}
                      className="flex-1 py-3 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/5 active:scale-95 disabled:opacity-50"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Link
                    </button>
                    <button
                      className="flex-1 py-3 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/5 active:scale-95 disabled:opacity-50"
                    >
                      <Share2 className="w-3 h-3" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {!input && (
              <p className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">
                Previewing Placeholder Protocol
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
