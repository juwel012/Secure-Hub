import React, { useState } from 'react';
import { Mail, Copy, RefreshCw, Check, User, LayoutGrid, Zap, Shield, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { faker } from '@faker-js/faker';

interface GmailGeneratorProps {
  state: {
    results: string[];
  };
  setState: React.Dispatch<React.SetStateAction<{
    results: string[];
  }>>;
}

export const GmailGenerator: React.FC<GmailGeneratorProps> = ({ state, setState }) => {
  const { results } = state;
  const [quantity, setQuantity] = useState(10);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const setResults = (val: string[]) => setState(prev => ({ ...prev, results: val }));

  const generateEmails = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 800)); // Premium delay

    const generated = new Set<string>();
    while (generated.size < quantity) {
      const firstName = faker.person.firstName().toLowerCase();
      const lastName = faker.person.lastName().toLowerCase();
      const randomNum = Math.floor(Math.random() * 99);
      const email = `${firstName}${lastName}${randomNum}@gmail.com`;
      generated.add(email);
    }
    setResults(Array.from(generated));
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
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyber-amber/10 rounded-full blur-[120px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyber-amber/5 rounded-full blur-[120px] -ml-48 -mb-48" />

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-8 sm:mb-12 gap-6 sm:gap-8">
          <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-cyber-amber rounded-2xl blur-lg opacity-20 animate-pulse" />
              <div className="relative p-3 sm:p-5 bg-dark-900 rounded-2xl border border-cyber-amber/30">
                <Mail className="w-6 h-6 sm:w-10 sm:h-10 text-cyber-amber" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">Extreme Premium Gmail</h2>
              <p className="text-[8px] sm:text-xs font-black text-cyber-amber uppercase tracking-[0.3em] mt-1">USA Identity Engine v4.0</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            <div className="bg-dark-900/80 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-white/5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 ml-1">Generation Quantity</label>
              <div className="flex items-center gap-6 mb-10">
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="flex-1 accent-cyber-amber h-1.5 bg-dark-800 rounded-full appearance-none cursor-pointer"
                />
                <span className="w-14 h-14 bg-dark-800 rounded-2xl flex items-center justify-center font-black text-cyber-amber border border-white/5 shadow-inner text-lg">
                  {quantity}
                </span>
              </div>
              <button
                onClick={generateEmails}
                disabled={generating}
                className="w-full py-6 bg-cyber-amber hover:bg-cyber-amber/80 text-dark-950 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all shadow-lg shadow-cyber-amber/20 active:scale-95 disabled:opacity-50 hover-glitch"
              >
                {generating ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-dark-950" />}
                {generating ? 'Synthesizing...' : 'Generate Premium Gmails'}
              </button>
            </div>

            <div className="p-10 bg-gradient-to-br from-cyber-amber/10 to-cyber-amber/5 rounded-[2.5rem] border border-white/5 text-white relative overflow-hidden">
              <h3 className="font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-3 text-cyber-amber">
                <Shield className="w-4 h-4" /> Identity Protection
              </h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                Generate realistic Gmail addresses based on USA names for testing, development, or protecting your real identity.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-6 px-4">
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <LayoutGrid className="w-4 h-4" /> Output Feed
              </div>
              {results.length > 0 && (
                <button 
                  onClick={copyAll}
                  className="flex items-center gap-2 text-[10px] font-black text-cyber-amber bg-cyber-amber/10 px-4 py-2 rounded-full hover:bg-cyber-amber/20 transition-all border border-cyber-amber/20"
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
                    <Sparkles className="w-20 h-20 mb-6 opacity-5" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Ready for synthesis</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {results.map((res, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group bg-dark-900/80 border border-white/5 hover:border-cyber-amber/30 p-5 rounded-2xl transition-all flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-cyber-amber transition-colors">
                            <User className="w-5 h-5" />
                          </div>
                          <span className="font-mono text-sm font-bold text-cyber-amber/80 tracking-wider">{res}</span>
                        </div>
                        <button 
                          onClick={() => navigator.clipboard.writeText(res)}
                          className="p-2.5 bg-dark-950 hover:bg-cyber-amber/20 text-slate-500 hover:text-cyber-amber rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-white/5 hover:border-cyber-amber/30"
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
