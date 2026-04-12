import React, { useState } from 'react';
import { CreditCard, Copy, RefreshCw, Check, Zap, Shield, LayoutGrid, Cpu, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CCGeneratorProps {
  state: {
    results: string[];
  };
  setState: React.Dispatch<React.SetStateAction<{
    results: string[];
  }>>;
}

export const CCGenerator: React.FC<CCGeneratorProps> = ({ state, setState }) => {
  const { results } = state;
  const [bin, setBin] = useState('');
  const [month, setMonth] = useState('Random');
  const [year, setYear] = useState('Random');
  const [cvv, setCvv] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const setResults = (val: string[]) => setState(prev => ({ ...prev, results: val }));

  const generateLuhn = (prefix: string, length: number) => {
    let num = prefix;
    while (num.length < length - 1) {
      num += Math.floor(Math.random() * 10);
    }

    let sum = 0;
    let shouldDouble = true;
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num.charAt(i));
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return num + checkDigit;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1200));

    const premiumBins = [
      '559888', '453978', '489504', '549138', '527513', '440393', '414720',
      '371245', '378287',
      '601100', '644123'
    ];
    const prefix = bin.replace(/\D/g, '').slice(0, 6) || premiumBins[Math.floor(Math.random() * premiumBins.length)];
    
    const generated: string[] = [];
    
    for (let i = 0; i < quantity; i++) {
      const num = generateLuhn(prefix, prefix.startsWith('3') ? 15 : 16);
      const m = month === 'Random' ? String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') : month;
      const y = year === 'Random' ? String(new Date().getFullYear() + Math.floor(Math.random() * 5) + 1) : year;
      const c = cvv || String(Math.floor(Math.random() * (prefix.startsWith('3') ? 9000 : 900)) + (prefix.startsWith('3') ? 1000 : 100));
      generated.push(`${num}|${m}|${y}|${c}`);
    }
    setResults(generated);
    setGenerating(false);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(results.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Visual Card Preview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-5">
          <div className="relative group perspective-1000">
            <motion.div 
              initial={{ rotateY: -20, rotateX: 10 }}
              animate={{ rotateY: 0, rotateX: 0 }}
              className="relative w-full aspect-[1.586/1] glass rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.5)]"
            >
              {/* Card Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyber-purple/20 via-transparent to-cyber-cyan/20 opacity-50" />
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(0,245,212,0.05)_0%,transparent_70%)] animate-pulse" />
              
              <div className="relative z-10 flex justify-between items-start">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyber-cyan to-cyber-blue rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
                  <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-dark-950" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Virtual Matrix</p>
                  <p className="text-xs font-bold text-cyber-cyan">SECUREHUB PRO</p>
                </div>
              </div>

              <div className="relative z-10">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-2">Card Preview</p>
                <h3 className="text-2xl sm:text-3xl font-mono font-black tracking-[0.15em] text-white">
                  {bin.padEnd(6, 'X').slice(0, 4)} {bin.slice(4).padEnd(2, 'X')}XX XXXX XXXX
                </h3>
              </div>

              <div className="relative z-10 flex justify-between items-end">
                <div>
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Valid Thru</p>
                  <p className="text-lg font-mono font-bold text-white">{month === 'Random' ? 'XX' : month}/{year === 'Random' ? 'XXXX' : year}</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex -space-x-4">
                    <div className="w-10 h-10 rounded-full bg-cyber-purple/40 border border-white/20 backdrop-blur-md" />
                    <div className="w-10 h-10 rounded-full bg-cyber-cyan/40 border border-white/20 backdrop-blur-md" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-cyan/5 rounded-full blur-[40px] -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-cyber-cyan/10 rounded-xl flex items-center justify-center border border-cyber-cyan/20">
                  <Sparkles className="w-5 h-5 text-cyber-cyan" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Virtual Card <span className="text-cyber-cyan">Generator</span></h2>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Generate valid virtual card numbers for development, testing, and system verification using standard Luhn-compliant algorithms.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">BIN Matrix</label>
              <div className="relative group">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="400000"
                  className="w-full p-4 sm:p-5 bg-dark-800 border border-white/5 rounded-xl sm:rounded-2xl text-xl font-mono font-black text-cyber-cyan placeholder:text-slate-700 focus:border-cyber-cyan focus:ring-4 focus:ring-cyber-cyan/10 outline-none transition-all"
                  value={bin}
                  onChange={(e) => setBin(e.target.value)}
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <Shield className="w-5 h-5 text-cyber-cyan/30 group-focus-within:text-cyber-cyan transition-colors" />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {['559888', '453978', '489504', '549138', '527513', '371245'].map(b => (
                  <button
                    key={b}
                    onClick={() => setBin(b)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${
                      bin === b ? 'bg-cyber-cyan text-dark-950 border-cyber-cyan' : 'bg-white/5 border-white/5 text-slate-500 hover:border-cyber-cyan/30'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Expiry Month</label>
                <select 
                  className="w-full p-4 sm:p-5 bg-dark-800 border border-white/5 rounded-xl sm:rounded-2xl text-sm font-bold text-white appearance-none cursor-pointer focus:border-cyber-cyan outline-none transition-all"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                >
                  <option>Random</option>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Expiry Year</label>
                <select 
                  className="w-full p-4 sm:p-5 bg-dark-800 border border-white/5 rounded-xl sm:rounded-2xl text-sm font-bold text-white appearance-none cursor-pointer focus:border-cyber-cyan outline-none transition-all"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  <option>Random</option>
                  {Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + i)).map(y => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">CVV Code</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="RAND"
                  className="w-full p-4 sm:p-5 bg-dark-800 border border-white/5 rounded-xl sm:rounded-2xl text-sm font-bold text-white placeholder:text-slate-700 focus:border-cyber-cyan outline-none transition-all"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="w-full p-4 sm:p-5 bg-dark-800 border border-white/5 rounded-xl sm:rounded-2xl text-sm font-bold text-white focus:border-cyber-cyan outline-none transition-all"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-4 sm:py-5 bg-cyber-cyan hover:bg-cyber-cyan/90 text-dark-950 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-lg shadow-cyber-cyan/20 active:scale-[0.98] disabled:opacity-50"
            >
              {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-dark-950" />}
              {generating ? 'Forging Matrix...' : 'Initiate Neural Forge'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 px-4">
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <LayoutGrid className="w-4 h-4" /> Fabricated Identities
            </div>
            {results.length > 0 && (
              <button 
                onClick={copyAll}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] font-black text-cyber-cyan bg-cyber-cyan/10 px-4 py-2 rounded-full hover:bg-cyber-cyan/20 transition-all border border-cyber-cyan/20"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied Matrix' : 'Copy All Cards'}
              </button>
            )}
          </div>
          
          <div className="flex-1 glass border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 overflow-y-auto max-h-[400px] lg:max-h-[700px] custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-800 py-32">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Cpu className="w-10 h-10 opacity-20" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Awaiting Initialization</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {results.map((res, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group relative bg-white/5 border border-white/5 hover:border-cyber-cyan/40 p-5 rounded-2xl transition-all flex items-center justify-between shadow-sm hover:shadow-[0_0_20px_rgba(0,243,255,0.1)] overflow-hidden"
                    >
                      {/* Hover Glow */}
                      <div className="absolute inset-0 bg-cyber-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-8 h-8 bg-dark-900 rounded-lg flex items-center justify-center border border-white/5 group-hover:border-cyber-cyan/30 transition-colors">
                          <span className="text-[10px] font-black text-slate-500 group-hover:text-cyber-cyan transition-colors">{i + 1}</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-white tracking-wider group-hover:text-cyber-cyan/90 transition-colors">{res}</span>
                      </div>
                      <button 
                        onClick={() => navigator.clipboard.writeText(res)}
                        className="p-2.5 bg-dark-950 hover:bg-cyber-cyan/20 text-slate-500 hover:text-cyber-cyan rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-white/5 hover:border-cyber-cyan/30 relative z-10"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
