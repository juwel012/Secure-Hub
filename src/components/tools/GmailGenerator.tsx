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
    await new Promise(r => setTimeout(r, 800));

    const generated = new Set<string>();
    const maxAttempts = quantity * 5;
    let attempts = 0;

    while (generated.size < quantity && attempts < maxAttempts) {
      attempts++;
      const firstName = faker.person.firstName().toLowerCase().replace(/[^a-z0-9]/g, '');
      const lastName = faker.person.lastName().toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const patterns = [
        `${firstName}${lastName}`,
        `${firstName}.${lastName}`,
        `${firstName}${lastName}${faker.number.int({ min: 10, max: 999 })}`,
        `${firstName}.${lastName}${faker.number.int({ min: 1, max: 99 })}`,
        `${firstName.charAt(0)}${lastName}${faker.number.int({ min: 100, max: 9999 })}`,
        `${firstName}${lastName.charAt(0)}${faker.number.int({ min: 1000, max: 99999 })}`
      ];
      
      let username = patterns[Math.floor(Math.random() * patterns.length)];
      
      // Gmail requires 6-30 characters
      if (username.length < 6) {
        username += faker.string.numeric(6 - username.length);
      }
      if (username.length > 30) {
        username = username.substring(0, 30);
      }
      
      const email = `${username}@gmail.com`;
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="p-8 glass rounded-[2.5rem] border border-white/5 relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-amber/5 rounded-full blur-[40px] -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-cyber-amber/10 rounded-2xl flex items-center justify-center border border-cyber-amber/20 shadow-[0_0_20px_rgba(255,184,0,0.1)]">
                  <Mail className="w-6 h-6 text-cyber-amber" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Alias <span className="text-cyber-amber">Generator</span></h2>
                  <p className="text-[10px] font-black text-cyber-amber/60 uppercase tracking-[0.3em]">Secure Alias Forge v4.0</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Generate high-integrity virtual email aliases for development, testing, and privacy across communication networks.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="p-8 glass rounded-[2.5rem] border border-white/5 h-full flex flex-col justify-center space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Batch Size</label>
              <span className="px-4 py-1 bg-cyber-amber/10 rounded-full text-xs font-black text-cyber-amber border border-cyber-amber/20">
                {quantity} ALIASES
              </span>
            </div>
            <div className="relative h-12 flex items-center">
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full accent-cyber-amber h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
              />
              <div className="absolute -bottom-4 left-0 w-full flex justify-between px-1">
                <span className="text-[8px] font-black text-slate-700">MIN_01</span>
                <span className="text-[8px] font-black text-slate-700">MAX_50</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interface Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 glass rounded-[2.5rem] border border-white/5 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <Shield className="w-4 h-4" /> Privacy Protocol
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                All generated aliases are created using randomized seeds to ensure privacy and zero traceability within virtual environments.
              </p>
            </div>

            <button
              onClick={generateEmails}
              disabled={generating}
              className="w-full py-5 bg-cyber-amber hover:bg-cyber-amber/90 text-dark-950 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-lg shadow-cyber-amber/20 active:scale-[0.98] disabled:opacity-50"
            >
              {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-dark-950" />}
              {generating ? 'Generating...' : 'Generate Aliases'}
            </button>
          </div>

          <div className="p-8 glass rounded-[2.5rem] border border-white/5">
            <div className="flex items-center gap-3 mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Sparkles className="w-4 h-4" /> Forge Status
            </div>
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${generating ? 'bg-cyber-amber animate-pulse shadow-[0_0_10px_rgba(255,184,0,1)]' : 'bg-slate-800'}`} />
              <span className="text-xs font-bold text-white">{generating ? 'GENERATING_ACTIVE' : 'FORGE_STANDBY'}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col">
          <div className="flex items-center justify-between mb-6 px-4">
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <LayoutGrid className="w-4 h-4" /> Generated Aliases
            </div>
            {results.length > 0 && (
              <button 
                onClick={copyAll}
                className="flex items-center gap-2 text-[10px] font-black text-cyber-amber bg-cyber-amber/10 px-4 py-2 rounded-full hover:bg-cyber-amber/20 transition-all border border-cyber-amber/20"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied All' : 'Copy All Aliases'}
              </button>
            )}
          </div>
          
          <div className="flex-1 glass border border-white/5 rounded-[2.5rem] p-8 overflow-y-auto max-h-[600px] custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-800 py-32">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Mail className="w-10 h-10 opacity-20" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Awaiting Initialization</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.map((res, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group relative bg-white/5 border border-white/5 hover:border-cyber-amber/40 p-5 rounded-2xl transition-all flex items-center justify-between shadow-sm hover:shadow-[0_0_20px_rgba(255,184,0,0.1)] overflow-hidden"
                    >
                      {/* Hover Glow */}
                      <div className="absolute inset-0 bg-cyber-amber/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      
                      <div className="flex items-center gap-4 overflow-hidden relative z-10">
                        <div className="w-10 h-10 bg-dark-900 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-cyber-amber transition-colors border border-white/5 group-hover:border-cyber-amber/30">
                          <User className="w-5 h-5" />
                        </div>
                        <span className="font-mono text-sm font-bold text-white tracking-wider truncate group-hover:text-cyber-amber/90 transition-colors">{res}</span>
                      </div>
                      <button 
                        onClick={() => navigator.clipboard.writeText(res)}
                        className="p-2.5 bg-dark-950 hover:bg-cyber-amber/20 text-slate-500 hover:text-cyber-amber rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-white/5 hover:border-cyber-amber/30 shrink-0 relative z-10"
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
