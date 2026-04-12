import React, { useState, useEffect, useRef } from 'react';
import { Mail, Copy, RefreshCw, Check, User, LayoutGrid, Zap, Shield, Sparkles, Terminal, Search, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { faker } from '@faker-js/faker';

interface GmailResult {
  email: string;
  isValid: boolean;
  score: number;
  logs: string[];
}

interface GmailGeneratorProps {
  state: {
    results: GmailResult[];
  };
  setState: React.Dispatch<React.SetStateAction<{
    results: GmailResult[];
  }>>;
}

export const GmailGenerator: React.FC<GmailGeneratorProps> = ({ state, setState }) => {
  const { results } = state;
  const [quantity, setQuantity] = useState(5);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [searchMode, setSearchMode] = useState<'standard' | 'deep'>('deep');
  const [validationLogs, setValidationLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [validationLogs]);

  const setResults = (val: GmailResult[]) => setState(prev => ({ ...prev, results: val }));

  // Load used emails from localStorage to ensure uniqueness
  const getUsedEmails = (): Set<string> => {
    const stored = localStorage.getItem('cyber_forge_used_emails');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  };

  const saveUsedEmails = (emails: string[]) => {
    const used = getUsedEmails();
    emails.forEach(e => used.add(e));
    localStorage.setItem('cyber_forge_used_emails', JSON.stringify(Array.from(used)));
  };

  const commonFirstNames = ['john', 'david', 'michael', 'chris', 'alex', 'sarah', 'emma', 'james', 'robert', 'linda', 'jason', 'kevin', 'ryan', 'steve', 'mary', 'paul', 'mark', 'brian', 'eric', 'adam'];
  const commonLastNames = ['smith', 'jones', 'brown', 'johnson', 'williams', 'miller', 'davis', 'wilson', 'taylor', 'clark', 'white', 'moore', 'thompson', 'hill', 'walker', 'young', 'king', 'wright', 'scott', 'green'];

  const generateEmails = async () => {
    setGenerating(true);
    setValidationLogs(['Initializing Neural Validation Engine...', 'Establishing Secure Handshake with MX Nodes...']);
    setResults([]);
    
    const validatedBatch: GmailResult[] = [];
    const usedEmails = getUsedEmails();
    const maxAttempts = quantity * 100;
    let attempts = 0;

    while (validatedBatch.length < quantity && attempts < maxAttempts) {
      attempts++;
      
      let firstName = '';
      let lastName = '';

      if (searchMode === 'deep') {
        firstName = commonFirstNames[Math.floor(Math.random() * commonFirstNames.length)];
        lastName = commonLastNames[Math.floor(Math.random() * commonLastNames.length)];
      } else {
        firstName = faker.person.firstName().toLowerCase().replace(/[^a-z]/g, '');
        lastName = faker.person.lastName().toLowerCase().replace(/[^a-z]/g, '');
      }
      
      const year = faker.number.int({ min: 1980, max: 2005 });
      const shortNum = faker.number.int({ min: 1, max: 999 });
      
      const patterns = [
        `${firstName}.${lastName}`,
        `${firstName}${lastName}${year}`,
        `${firstName}.${lastName}${year}`,
        `${firstName}${lastName}${shortNum}`,
        `${firstName}.${lastName}${shortNum}`,
        `${firstName.charAt(0)}${lastName}${year}`,
        `${lastName}.${firstName}${shortNum}`,
        `${firstName}${lastName}`
      ];
      
      let username = patterns[Math.floor(Math.random() * patterns.length)];
      username = username.replace(/\.\.+/g, '.').replace(/^\.|\.$/g, '');
      
      if (username.length < 6) username += faker.string.numeric(6 - username.length);
      if (username.length > 30) username = username.substring(0, 30);
      
      const email = `${username}@gmail.com`;
      
      if (!usedEmails.has(email)) {
        setValidationLogs(prev => [...prev.slice(-10), `Scanning: ${email}...`]);
        
        try {
          const response = await fetch('/api/validate-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const data = await response.json();
          
          if (data.valid) {
            setValidationLogs(prev => [...prev, `[SUCCESS] ${email} verified.`]);
            validatedBatch.push({
              email,
              isValid: true,
              score: data.score,
              logs: data.logs
            });
            // Update results incrementally
            setResults([...validatedBatch]);
          }
        } catch (error) {
          console.error("Validation error:", error);
        }
      }
    }

    saveUsedEmails(validatedBatch.map(r => r.email));
    setValidationLogs(prev => [...prev, 'Validation Protocol Complete.']);
    setGenerating(false);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(results.map(r => r.email).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-4">
          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-amber/5 rounded-full blur-[40px] -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyber-amber/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-cyber-amber/20 shadow-[0_0_20px_rgba(255,184,0,0.1)]">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-cyber-amber" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Neural <span className="text-cyber-amber">Gmail</span></h2>
                  <p className="text-[10px] font-black text-cyber-amber/60 uppercase tracking-[0.3em]">Alias Matrix v3.0</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Advanced neural engine for generating and validating high-authority Gmail aliases using deep MX-record verification.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 h-full flex flex-col justify-center space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Batch Density</label>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <Shield className="w-4 h-4" /> Search Protocol
              </div>
              <div className="grid grid-cols-2 gap-2 p-1 bg-dark-950 rounded-xl border border-white/5">
                <button
                  onClick={() => setSearchMode('standard')}
                  className={`py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${searchMode === 'standard' ? 'bg-cyber-amber text-dark-950 shadow-[0_0_10px_rgba(255,184,0,0.3)]' : 'text-slate-500 hover:text-white'}`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setSearchMode('deep')}
                  className={`py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${searchMode === 'deep' ? 'bg-cyber-amber text-dark-950 shadow-[0_0_10px_rgba(255,184,0,0.3)]' : 'text-slate-500 hover:text-white'}`}
                >
                  Deep Search
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                {searchMode === 'deep' ? 'Deep Search uses high-frequency common name matrices to maximize hit rates on existing accounts.' : 'Standard mode uses randomized name seeds for unique alias generation.'}
              </p>
            </div>

            <button
              onClick={generateEmails}
              disabled={generating}
              className="w-full py-4 sm:py-5 bg-cyber-amber hover:bg-cyber-amber/90 text-dark-950 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-lg shadow-cyber-amber/20 active:scale-[0.98] disabled:opacity-50"
            >
              {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-dark-950" />}
              {generating ? 'Validating Matrix...' : 'Initiate Neural Scan'}
            </button>
          </div>

          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 space-y-4">
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Terminal className="w-4 h-4" /> Validation Terminal
            </div>
            <div className="h-24 sm:h-32 bg-dark-950/50 rounded-xl sm:rounded-2xl border border-white/5 p-4 font-mono text-[8px] overflow-y-auto custom-scrollbar text-cyber-amber/80">
              {validationLogs.map((log, i) => (
                <div key={i} className="mb-1 flex gap-2">
                  <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                  <span>{log}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          <div className="p-6 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 space-y-4">
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Shield className="w-4 h-4" /> Uniqueness Protocol
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every generated alias is cross-referenced against your local forge history to guarantee 100% unique identity strings.
            </p>
            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase">Stored Aliases</span>
                <span className="text-xs font-black text-cyber-amber">{getUsedEmails().size}</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('cyber_forge_used_emails');
                  setResults([]);
                  setValidationLogs(['Forge history purged. System ready.']);
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
              <LayoutGrid className="w-4 h-4 text-cyber-amber" /> Neural Verified Aliases
            </div>
            {results.length > 0 && (
              <button 
                onClick={copyAll}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] font-black text-cyber-amber bg-cyber-amber/10 px-4 py-2 rounded-full hover:bg-cyber-amber/20 transition-all border border-cyber-amber/20"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied Matrix' : 'Copy All Aliases'}
              </button>
            )}
          </div>
          
          <div className="flex-1 glass border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 overflow-y-auto max-h-[400px] lg:max-h-[700px] custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-800 py-32">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Mail className="w-10 h-10 opacity-20" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-30">
                    {generating ? 'Neural Validation in Progress...' : 'Awaiting Initialization'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.map((res, i) => (
                    <motion.div
                      key={res.email}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative bg-white/5 border border-white/5 hover:border-cyber-amber/40 p-5 rounded-2xl transition-all flex items-center justify-between shadow-sm hover:shadow-[0_0_20px_rgba(255,184,0,0.1)] overflow-hidden"
                    >
                      {/* Hover Glow */}
                      <div className="absolute inset-0 bg-cyber-amber/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      
                      <div className="flex items-center gap-4 overflow-hidden relative z-10">
                        <div className="w-10 h-10 bg-dark-900 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-cyber-amber transition-colors border border-white/5 group-hover:border-cyber-amber/30">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-sm font-bold text-white tracking-wider truncate group-hover:text-cyber-amber/90 transition-colors">{res.email}</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-cyber-green shadow-[0_0_5px_rgba(0,255,136,1)]" />
                            <span className="text-[8px] font-black text-cyber-green uppercase tracking-widest">Neural_Verified ({res.score}%)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 relative z-10">
                        <button 
                          onClick={() => navigator.clipboard.writeText(res.email)}
                          className="p-2.5 bg-dark-950 hover:bg-cyber-amber/20 text-slate-500 hover:text-cyber-amber rounded-xl transition-all border border-white/5 hover:border-cyber-amber/30"
                          title="Copy Alias"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a 
                          href={`https://accounts.google.com/signin/v2/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2F&service=mail&flowName=GlifWebSignIn&flowEntry=ServiceLogin&Email=${res.email}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 bg-cyber-amber/10 hover:bg-cyber-amber/20 text-cyber-amber rounded-xl transition-all border border-cyber-amber/20 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                        >
                          Check
                        </a>
                      </div>
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
