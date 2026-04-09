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
    await new Promise(r => setTimeout(r, 1200)); // Premium delay

    const premiumBins = [
      '559888', '453978', '489504', '549138', '527513', '440393', '414720', // Visa/MC
      '371245', '378287', // Amex
      '601100', '644123' // Discover
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
    <div className="p-4 sm:p-10 glass rounded-[2rem] sm:rounded-[3rem] shadow-2xl shadow-black/50 text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyber-cyan/10 rounded-full blur-[120px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyber-blue/10 rounded-full blur-[120px] -ml-48 -mb-48" />

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-8 sm:mb-12 gap-6 sm:gap-8">
          <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-cyber-cyan rounded-2xl blur-lg opacity-20 animate-pulse" />
              <div className="relative p-3 sm:p-5 bg-dark-900 rounded-2xl border border-cyber-cyan/30">
                <Sparkles className="w-6 h-6 sm:w-10 sm:h-10 text-cyber-cyan" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">Extreme Premium Gen</h2>
              <p className="text-[8px] sm:text-xs font-black text-cyber-cyan uppercase tracking-[0.3em] mt-1">Advanced Algorithm v4.0</p>
            </div>
          </div>
        </div>

        <div className="mb-8 p-6 bg-cyber-amber/5 border border-cyber-amber/20 rounded-[2rem] flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-cyber-amber shrink-0 mt-1" />
          <div>
            <p className="text-[10px] font-black text-cyber-amber uppercase tracking-widest mb-1">Disclaimer & Usage Note</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              These generated cards are **simulated assets** for testing and development. They are **NOT real credit cards** and will not work on real payment gateways (like Audible, Amazon, etc.).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            <div className="bg-dark-900/80 backdrop-blur-xl p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">Premium Bins</p>
              <div className="flex flex-wrap gap-2">
                {['559888', '453978', '489504', '549138', '527513', '371245'].map(b => (
                  <button
                    key={b}
                    onClick={() => setBin(b)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${
                      bin === b ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan' : 'bg-dark-800 border-white/5 text-slate-500 hover:border-cyber-cyan/30'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">BIN (First 6 Digits)</label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="400000"
                    className="w-full px-6 sm:px-8 py-4 sm:py-5 bg-dark-900/80 backdrop-blur-xl border border-white/5 rounded-2xl focus:ring-2 focus:ring-cyber-cyan/50 outline-none transition-all font-mono text-lg sm:text-xl font-bold text-cyber-cyan placeholder:text-slate-700"
                    value={bin}
                    onChange={(e) => setBin(e.target.value)}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <Shield className="w-6 h-6 text-cyber-cyan/30" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Month</label>
                  <select 
                    className="w-full px-6 sm:px-8 py-4 sm:py-5 bg-dark-900/80 backdrop-blur-xl border border-white/5 rounded-2xl focus:ring-2 focus:ring-cyber-cyan/50 outline-none transition-all font-bold text-slate-500 appearance-none cursor-pointer text-sm sm:text-base"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  >
                    <option>Random</option>
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Year</label>
                  <select 
                    className="w-full px-6 sm:px-8 py-4 sm:py-5 bg-dark-900/80 backdrop-blur-xl border border-white/5 rounded-2xl focus:ring-2 focus:ring-cyber-cyan/50 outline-none transition-all font-bold text-slate-500 appearance-none cursor-pointer text-sm sm:text-base"
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

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">CVV</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Random"
                    className="w-full px-8 py-5 bg-dark-900/80 backdrop-blur-xl border border-white/5 rounded-2xl focus:ring-2 focus:ring-cyber-cyan/50 outline-none transition-all font-bold text-slate-500 placeholder:text-slate-700"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="w-full px-8 py-5 bg-dark-900/80 backdrop-blur-xl border border-white/5 rounded-2xl focus:ring-2 focus:ring-cyber-cyan/50 outline-none transition-all font-bold text-slate-500"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-6 bg-cyber-cyan hover:bg-cyber-cyan/80 text-dark-950 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all shadow-lg shadow-cyber-cyan/20 active:scale-95 disabled:opacity-50 hover-glitch"
            >
              {generating ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-dark-950" />}
              {generating ? 'Processing Algorithm...' : 'Generate Premium Assets'}
            </button>
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-6 px-4">
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <LayoutGrid className="w-4 h-4" /> Output Feed
              </div>
              {results.length > 0 && (
                <button 
                  onClick={copyAll}
                  className="flex items-center gap-2 text-[10px] font-black text-cyber-cyan bg-cyber-cyan/10 px-4 py-2 rounded-full hover:bg-cyber-cyan/20 transition-all border border-cyber-cyan/20"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy All Results'}
                </button>
              )}
            </div>
            
            <div className="flex-1 bg-dark-900/40 border border-white/5 rounded-[2.5rem] p-8 overflow-y-auto max-h-[500px] custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {results.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-800 py-32">
                    <Cpu className="w-20 h-20 mb-6 opacity-5" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Ready for generation</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {results.map((res, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group bg-dark-900/80 border border-white/5 hover:border-cyber-cyan/30 p-5 rounded-2xl transition-all flex items-center justify-between shadow-sm"
                      >
                        <span className="font-mono text-sm font-bold text-cyber-cyan/80 tracking-wider">{res}</span>
                        <button 
                          onClick={() => navigator.clipboard.writeText(res)}
                          className="p-2.5 bg-dark-950 hover:bg-cyber-cyan/20 text-slate-500 hover:text-cyber-cyan rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-white/5 hover:border-cyber-cyan/30"
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
    </div>
  );
};
