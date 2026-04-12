import React, { useState } from 'react';
import { Monitor, Smartphone, Copy, RefreshCw, Check, LayoutGrid, Zap, Shield, Globe, Cpu, Tablet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserAgentGeneratorProps {
  state: {
    results: string[];
  };
  setState: React.Dispatch<React.SetStateAction<{
    results: string[];
  }>>;
}

export const UserAgentGenerator: React.FC<UserAgentGeneratorProps> = ({ state, setState }) => {
  const { results } = state;
  const [quantity, setQuantity] = useState(10);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [platform, setPlatform] = useState<'all' | 'windows' | 'mac' | 'linux' | 'android' | 'ios'>('all');
  const [browser, setBrowser] = useState<'all' | 'chrome' | 'firefox' | 'safari' | 'edge'>('all');

  const setResults = (val: string[]) => setState(prev => ({ ...prev, results: val }));

  // Load used UAs from localStorage to ensure uniqueness
  const getUsedUAs = (): Set<string> => {
    const stored = localStorage.getItem('cyber_forge_used_uas');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  };

  const saveUsedUAs = (uas: string[]) => {
    const used = getUsedUAs();
    uas.forEach(u => used.add(u));
    localStorage.setItem('cyber_forge_used_uas', JSON.stringify(Array.from(used)));
  };

  const generateUA = () => {
    setGenerating(true);
    setTimeout(() => {
      const generated = new Set<string>();
      const usedUAs = getUsedUAs();
      
      const platforms = {
        windows: [
          'Windows NT 10.0; Win64; x64',
          'Windows NT 11.0; Win64; x64',
          'Windows NT 10.0; WOW64',
          'Windows NT 10.0; Win64; x64; rv:123.0',
          'Windows NT 10.0; Win64; x64; Trident/7.0; .NET4.0C; .NET4.0E',
          'Windows NT 10.0; Win64; x64; rv:124.0',
          'Windows NT 11.0; Win64; x64; rv:125.0',
          'Windows NT 10.0; Win64; x64; rv:109.0'
        ],
        mac: [
          'Macintosh; Intel Mac OS X 10_15_7',
          'Macintosh; Intel Mac OS X 11_6_1',
          'Macintosh; Intel Mac OS X 12_6_3',
          'Macintosh; Intel Mac OS X 13_5_2',
          'Macintosh; Intel Mac OS X 14_3_1',
          'Macintosh; Intel Mac OS X 14_4_1',
          'Macintosh; Intel Mac OS X 13_6_6',
          'Macintosh; Intel Mac OS X 10_14_6',
          'Macintosh; Intel Mac OS X 10_13_6',
          'Macintosh; ARM Mac OS X 14_4_1'
        ],
        linux: [
          'X11; Linux x86_64',
          'X11; Ubuntu; Linux x86_64',
          'X11; Fedora; Linux x86_64',
          'X11; Debian; Linux x86_64',
          'X11; Linux x86_64; rv:109.0',
          'X11; Linux i686; rv:109.0',
          'X11; Linux x86_64; rv:124.0',
          'X11; Linux x86_64; rv:125.0'
        ],
        android: [
          'Linux; Android 14; SM-S918B',
          'Linux; Android 13; SM-A546B',
          'Linux; Android 14; Pixel 8 Pro',
          'Linux; Android 13; Pixel 7a',
          'Linux; Android 12; SM-G991B',
          'Linux; Android 11; M2012K11AC',
          'Linux; Android 13; CPH2451',
          'Linux; Android 14; HD1903',
          'Linux; Android 10; Redmi Note 9 Pro',
          'Linux; Android 13; SM-G990B',
          'Linux; Android 14; SM-S928B',
          'Linux; Android 13; SM-G998B',
          'Linux; Android 14; Pixel 7 Pro',
          'Linux; Android 12; Pixel 6'
        ],
        ios: [
          'iPhone; CPU iPhone OS 17_4_1 like Mac OS X',
          'iPhone; CPU iPhone OS 16_7_2 like Mac OS X',
          'iPad; CPU OS 17_3_1 like Mac OS X',
          'iPhone; CPU iPhone OS 15_8_1 like Mac OS X',
          'iPhone; CPU iPhone OS 17_2_1 like Mac OS X',
          'iPad; CPU OS 16_6 like Mac OS X',
          'iPhone; CPU iPhone OS 17_5 like Mac OS X',
          'iPad; CPU OS 17_4_1 like Mac OS X'
        ]
      };

      const chromeVersions = [
        '124.0.6367.60', '123.0.6312.122', '122.0.6261.128', '121.0.6167.184', 
        '120.0.6099.224', '119.0.6045.199', '118.0.5993.117', '117.0.5938.149'
      ];
      const firefoxVersions = [
        '125.0', '124.0', '123.0', '122.0', '121.0', '115.9.1', '109.0'
      ];
      const safariVersions = [
        '17.4.1', '17.3.1', '16.6', '15.6.1', '14.1.2'
      ];
      const edgeVersions = [
        '124.0.2478.51', '123.0.2420.81', '122.0.2365.92', '121.0.2277.128', '120.0.2210.144'
      ];

      const maxAttempts = quantity * 50;
      let attempts = 0;

      while (generated.size < quantity && attempts < maxAttempts) {
        attempts++;
        const pKey = platform === 'all' ? (Object.keys(platforms)[Math.floor(Math.random() * 5)] as keyof typeof platforms) : platform;
        const pString = platforms[pKey][Math.floor(Math.random() * platforms[pKey].length)];
        
        const bKey = browser === 'all' ? (['chrome', 'firefox', 'safari', 'edge'][Math.floor(Math.random() * 4)] as any) : browser;
        
        let ua = '';
        const cVer = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
        const fVer = firefoxVersions[Math.floor(Math.random() * firefoxVersions.length)];
        const sVer = safariVersions[Math.floor(Math.random() * safariVersions.length)];
        const eVer = edgeVersions[Math.floor(Math.random() * edgeVersions.length)];

        if (bKey === 'chrome') {
          ua = `Mozilla/5.0 (${pString}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${cVer} Safari/537.36`;
        } else if (bKey === 'firefox') {
          ua = `Mozilla/5.0 (${pString}; rv:${fVer}) Gecko/20100101 Firefox/${fVer}`;
        } else if (bKey === 'safari') {
          if (pKey === 'mac' || pKey === 'ios') {
            ua = `Mozilla/5.0 (${pString}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${sVer} Safari/605.1.15`;
          } else {
            ua = `Mozilla/5.0 (${pString}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${cVer} Safari/537.36`;
          }
        } else if (bKey === 'edge') {
          ua = `Mozilla/5.0 (${pString}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${cVer} Safari/537.36 Edg/${eVer}`;
        }

        if (!usedUAs.has(ua) && !generated.has(ua)) {
          generated.add(ua);
        }
      }

      const newBatch = Array.from(generated);
      saveUsedUAs(newBatch);
      setResults(newBatch);
      setGenerating(false);
    }, 800);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(results.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-4">
          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-cyan/5 rounded-full blur-[40px] -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyber-cyan/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-cyber-cyan/20 shadow-[0_0_20px_rgba(0,245,212,0.1)]">
                  <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-cyber-cyan" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">UA <span className="text-cyber-cyan">Forge</span></h2>
                  <p className="text-[10px] font-black text-cyber-cyan/60 uppercase tracking-[0.3em]">Identity Fabricator v2.0</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Generate high-fidelity, authentic User-Agent strings for cross-platform testing and identity masking.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 h-full flex flex-col justify-center space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Platform Matrix</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['all', 'windows', 'mac', 'linux', 'android', 'ios'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`py-2 text-[8px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl transition-all border ${
                        platform === p 
                        ? 'bg-cyber-cyan text-dark-950 border-cyber-cyan shadow-[0_0_15px_rgba(0,245,212,0.2)]' 
                        : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Browser Engine</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['all', 'chrome', 'firefox', 'safari', 'edge'] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => setBrowser(b)}
                      className={`py-2 text-[8px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl transition-all border ${
                        browser === b 
                        ? 'bg-cyber-cyan text-dark-950 border-cyber-cyan shadow-[0_0_15px_rgba(0,245,212,0.2)]' 
                        : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interface Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Batch Density</label>
                <span className="text-xs font-black text-cyber-cyan">{quantity}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full accent-cyber-cyan h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
              />
            </div>

            <button
              onClick={generateUA}
              disabled={generating}
              className="w-full py-4 sm:py-5 bg-cyber-cyan hover:bg-cyber-cyan/90 text-dark-950 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-lg shadow-cyber-cyan/20 active:scale-[0.98] disabled:opacity-50"
            >
              {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-dark-950" />}
              {generating ? 'Fabricating...' : 'Initiate Forge'}
            </button>
          </div>

          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Shield className="w-4 h-4" /> Uniqueness Protocol
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every generated User-Agent is cross-referenced against your local forge history to guarantee 100% unique identity strings.
            </p>
            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase">Stored Agents</span>
                <span className="text-xs font-black text-cyber-cyan">{getUsedUAs().size}</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('cyber_forge_used_uas');
                  setResults([]);
                  window.location.reload();
                }}
                className="w-full py-3 bg-white/5 hover:bg-cyber-red/10 text-slate-500 hover:text-cyber-red rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/5 hover:border-cyber-red/20"
              >
                Purge Forge History
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col">
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
                {copied ? 'Copied Matrix' : 'Copy All Agents'}
              </button>
            )}
          </div>
          
          <div className="flex-1 glass border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 overflow-y-auto max-h-[400px] lg:max-h-[600px] custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-800 py-32">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Globe className="w-10 h-10 opacity-20" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Awaiting Forge Initialization</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((ua, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.01 }}
                      className="group relative bg-white/5 border border-white/5 hover:border-cyber-cyan/40 p-4 rounded-xl transition-all flex items-center justify-between gap-4 overflow-hidden"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-dark-900 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-cyber-cyan transition-colors border border-white/5 shrink-0">
                          {ua.includes('Windows') || ua.includes('Macintosh') || ua.includes('Linux') ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-400 truncate group-hover:text-white transition-colors leading-relaxed">{ua}</span>
                      </div>
                      <button 
                        onClick={() => navigator.clipboard.writeText(ua)}
                        className="p-2 bg-dark-950 hover:bg-cyber-cyan/20 text-slate-500 hover:text-cyber-cyan rounded-lg transition-all border border-white/5 hover:border-cyber-cyan/30 shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
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
