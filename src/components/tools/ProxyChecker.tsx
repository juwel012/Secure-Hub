import React, { useState, useEffect } from 'react';
import { Globe, Activity, ShieldAlert, Copy, RefreshCw, Check, Zap, Shield, Terminal, AlertCircle, Search, Trash2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProxyResult {
  ip: string;
  status: 'success' | 'error';
  data?: any;
  message?: string;
  firstCheckedAt?: string;
}

const DetailRow: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = 'text-white' }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
    <span className={`text-[12px] font-bold ${color}`}>{value}</span>
  </div>
);

const ScenarioCard: React.FC<{ title: string; status: 'ALLOWED' | 'BLOCKED' | 'CAPTCHA'; active: boolean }> = ({ title, status, active }) => (
  <div className={`p-4 rounded-xl border ${active ? 'border-white/10 bg-white/5' : 'border-white/5 bg-transparent opacity-50'} flex flex-col gap-1`}>
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">{title}</span>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-cyber-cyan shadow-[0_0_8px_rgba(0,255,255,0.6)]" />}
    </div>
    <span className={`text-[12px] font-black tracking-widest ${
      status === 'ALLOWED' ? 'text-cyber-green' : status === 'BLOCKED' ? 'text-cyber-red' : 'text-cyber-amber'
    }`}>
      {status}
    </span>
  </div>
);

export const ProxyChecker: React.FC = () => {
  const [input, setInput] = useState(() => {
    return localStorage.getItem('securehub_proxy_input') || '';
  });
  const [provider, setProvider] = useState<'fraudlogix' | 'ipqs'>('fraudlogix');
  const [results, setResults] = useState<ProxyResult[]>(() => {
    const saved = localStorage.getItem('securehub_proxy_results');
    return saved ? JSON.parse(saved) : [];
  });
  const [historyResults, setHistoryResults] = useState<ProxyResult[]>(() => {
    const saved = localStorage.getItem('securehub_proxy_history_results');
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('securehub_proxy_history');
    return saved ? JSON.parse(saved) : {};
  });
  const [view, setView] = useState<'current' | 'history'>('current');
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  const [expandedIp, setExpandedIp] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('securehub_proxy_input', input);
  }, [input]);

  useEffect(() => {
    localStorage.setItem('securehub_proxy_results', JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    localStorage.setItem('securehub_proxy_history_results', JSON.stringify(historyResults));
  }, [historyResults]);

  useEffect(() => {
    localStorage.setItem('securehub_proxy_history', JSON.stringify(history));
  }, [history]);

  const handleCheck = async () => {
    const ips = input.split('\n').map(ip => ip.trim()).filter(ip => ip.length > 0);
    if (ips.length === 0) return;

    setChecking(true);
    try {
      const response = await fetch('/api/proxy-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ips, provider })
      });
      const data = await response.json();
      
      const now = new Date().toISOString();
      const newHistoryEntries: Record<string, string> = {};
      
      const newResults = (data.results || []).map((res: ProxyResult) => {
        const firstTime = history[res.ip] || now;
        
        if (!history[res.ip]) {
          newHistoryEntries[res.ip] = now;
        }
        
        return {
          ...res,
          firstCheckedAt: firstTime
        };
      });

      if (Object.keys(newHistoryEntries).length > 0) {
        setHistory(prev => ({ ...prev, ...newHistoryEntries }));
      }

      setResults(newResults);
      setHistoryResults(prev => {
        const filtered = prev.filter(p => !newResults.some(n => n.ip === p.ip));
        return [...newResults, ...filtered].slice(0, 100);
      });
      
      setView('current');
      if (newResults.length > 0) {
        setExpandedIp(newResults[0].ip);
      }
    } catch (error) {
      console.error('Proxy check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 5) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const clearResults = () => {
    setResults([]);
    setInput('');
    localStorage.removeItem('securehub_proxy_results');
    localStorage.removeItem('securehub_proxy_input');
  };

  const clearHistory = () => {
    setHistory({});
    setHistoryResults([]);
    localStorage.removeItem('securehub_proxy_history');
    localStorage.removeItem('securehub_proxy_history_results');
  };

  const copyResults = () => {
    const target = view === 'current' ? results : historyResults;
    const text = target.map(r => `${r.ip} | ${r.status === 'success' ? (r.data?.is_proxy ? 'PROXY' : 'CLEAN') : 'ERROR'}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="p-8 glass rounded-[2.5rem] border border-white/5 relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-cyan/5 rounded-full blur-[40px] -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-cyber-cyan/10 rounded-2xl flex items-center justify-center border border-cyber-cyan/20 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                  <Globe className="w-6 h-6 text-cyber-cyan" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Threat <span className="text-cyber-cyan">Intelligence</span></h2>
                  <p className="text-[10px] font-black text-cyber-cyan/60 uppercase tracking-[0.3em]">Network Intelligence v4.0</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Advanced threat intelligence engine for IP analysis, fraud detection, and network security auditing across global infrastructures.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="p-8 glass rounded-[2.5rem] border border-white/5 h-full flex flex-col justify-center space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Intelligence Provider</label>
                <div className="flex bg-dark-800 p-1 rounded-2xl border border-white/5">
                  <button
                    onClick={() => setProvider('fraudlogix')}
                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      provider === 'fraudlogix' ? 'bg-cyber-cyan text-dark-950 shadow-lg shadow-cyber-cyan/30' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    Provider Alpha
                  </button>
                  <button
                    onClick={() => setProvider('ipqs')}
                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      provider === 'ipqs' ? 'bg-cyber-purple text-white shadow-lg shadow-cyber-purple/30' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    Provider Beta
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setView(view === 'current' ? 'history' : 'current')}
                  className={`p-4 rounded-2xl border transition-all ${
                    view === 'history' 
                      ? 'bg-cyber-purple/20 text-cyber-purple border-cyber-purple/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                      : 'bg-white/5 text-slate-500 border-white/5 hover:bg-cyber-purple/10 hover:text-cyber-purple'
                  }`}
                >
                  <History className="w-5 h-5" />
                </button>
                <button 
                  onClick={view === 'current' ? clearResults : clearHistory}
                  className="p-4 bg-white/5 hover:bg-cyber-red/10 text-slate-500 hover:text-cyber-red rounded-2xl border border-white/5 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={copyResults}
                  className="p-4 bg-white/5 hover:bg-cyber-cyan/10 text-slate-500 hover:text-cyber-cyan rounded-2xl border border-white/5 transition-all"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interface Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyber-cyan to-cyber-purple rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-25 transition duration-1000" />
            <div className="relative glass rounded-[2.5rem] border border-white/5 overflow-hidden">
              <div className="absolute top-5 left-8 flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <Terminal className="w-4 h-4" /> Network Terminal
              </div>
              <textarea
                placeholder="ENTER IPs FOR ANALYSIS (ONE PER LINE)"
                className="w-full h-[400px] p-12 pt-16 bg-transparent outline-none transition-all resize-none font-mono text-sm text-cyber-cyan placeholder:text-slate-700 custom-scrollbar"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={checking}
              />
              <div className="absolute bottom-8 right-8">
                <button
                  onClick={handleCheck}
                  disabled={checking || !input.trim()}
                  className="px-8 py-4 bg-cyber-cyan hover:bg-cyber-cyan/90 text-dark-950 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 transition-all shadow-lg shadow-cyber-cyan/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {checking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {checking ? 'Analyzing...' : 'Start Analysis'}
                </button>
              </div>
            </div>
          </div>

          <div className="p-8 glass rounded-[2.5rem] border border-white/5 space-y-6">
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Shield className="w-4 h-4" /> Security Protocol
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              All intelligence queries are routed through encrypted secure tunnels to ensure anonymity and prevent IP blacklisting during analysis.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-6 px-4">
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Activity className="w-4 h-4 text-cyber-cyan" /> 
              {view === 'current' ? 'Analysis Feed' : 'Historical Archive'}
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setView('current')}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'current' ? 'bg-cyber-cyan text-dark-950' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Live
              </button>
              <button 
                onClick={() => setView('history')}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-cyber-purple text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Archive
              </button>
            </div>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[700px] pr-4 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {((view === 'current' ? results : historyResults).length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-40 glass border border-white/5 rounded-[3rem]">
                  <ShieldAlert className="w-12 h-12 mb-4 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-30">
                    {view === 'current' ? 'Awaiting Data Input' : 'Archive Empty'}
                  </p>
                </div>
              ) : (
                (view === 'current' ? results : historyResults).map((res, i) => (
                  <div key={i} className="space-y-2">
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setExpandedIp(expandedIp === res.ip ? null : res.ip)}
                      className={`p-6 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
                        res.status === 'error' 
                          ? 'bg-cyber-red/5 border-cyber-red/30 hover:shadow-[0_0_30px_rgba(255,59,48,0.1)]' 
                          : res.data?.is_proxy 
                            ? 'bg-cyber-amber/5 border-cyber-amber/30 hover:shadow-[0_0_30px_rgba(255,184,0,0.1)]' 
                            : 'bg-cyber-green/5 border-cyber-green/30 hover:shadow-[0_0_30px_rgba(0,255,157,0.1)]'
                      } flex items-center justify-between glass relative overflow-hidden group`}
                    >
                      {/* Hover Glow */}
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                        res.status === 'error' ? 'bg-cyber-red/5' : res.data?.is_proxy ? 'bg-cyber-amber/5' : 'bg-cyber-green/5'
                      }`} />
                      
                      <div className="flex items-center gap-6 relative z-10">
                        <div className={`w-3 h-3 rounded-full ${
                          res.status === 'error' ? 'bg-cyber-red' : res.data?.is_proxy ? 'bg-cyber-amber' : 'bg-cyber-green'
                        } shadow-[0_0_12px_currentColor] animate-pulse`} />
                        <span className="font-mono text-base font-bold text-white group-hover:text-white transition-colors">{res.ip}</span>
                      </div>

                      <div className="flex items-center gap-6 relative z-10">
                        {res.firstCheckedAt && (
                          <div className="hidden sm:block text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
                            {formatTimeAgo(res.firstCheckedAt)}
                          </div>
                        )}
                        <div className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg transition-all ${
                          res.status === 'error' ? 'text-cyber-red bg-cyber-red/10 border border-cyber-red/20' : res.data?.is_proxy ? 'text-cyber-amber bg-cyber-amber/10 border border-cyber-amber/20' : 'text-cyber-green bg-cyber-green/10 border border-cyber-green/20'
                        }`}>
                          {res.status === 'error' ? 'ERROR' : res.data?.is_proxy ? 'PROXY' : 'CLEAN'}
                        </div>
                      </div>
                    </motion.div>

                    <AnimatePresence>
                      {expandedIp === res.ip && res.status === 'success' && res.data && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-8 glass border border-white/5 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            <div className="space-y-4">
                              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Threat Assessment</p>
                              <div className="space-y-1">
                                <DetailRow label="Risk Score" value={res.data.risk_score || 'Low'} color={res.data.risk_score === 'High' ? 'text-cyber-red' : 'text-cyber-green'} />
                                {res.data.fraud_score !== undefined && (
                                  <DetailRow label="Fraud Score" value={res.data.fraud_score} color={res.data.fraud_score > 80 ? 'text-cyber-red' : 'text-cyber-green'} />
                                )}
                                <DetailRow label="VPN / Proxy" value={res.data.is_proxy ? 'TRUE' : 'FALSE'} color={res.data.is_proxy ? 'text-cyber-red' : 'text-cyber-green'} />
                                <DetailRow label="TOR Node" value={res.data.is_tor ? 'TRUE' : 'FALSE'} color={res.data.is_tor ? 'text-cyber-red' : 'text-cyber-green'} />
                                <DetailRow label="Data Center" value={res.data.is_datacenter ? 'TRUE' : 'FALSE'} color={res.data.is_datacenter ? 'text-cyber-red' : 'text-cyber-green'} />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Network Metadata</p>
                              <div className="space-y-1">
                                <DetailRow label="ASN" value={res.data.asn || 'N/A'} />
                                <DetailRow label="ISP" value={res.data.isp || 'N/A'} />
                                <DetailRow label="Location" value={`${res.data.city || 'N/A'}, ${res.data.country || 'N/A'}`} />
                                <DetailRow label="Timezone" value={res.data.timezone || 'N/A'} />
                                <DetailRow label="Connection" value={res.data.connection_type || 'Residential'} />
                              </div>
                            </div>

                            <div className="md:col-span-2 mt-4 pt-8 border-t border-white/5">
                              <h4 className="text-[10px] font-black text-cyber-cyan uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                <Shield className="w-4 h-4" /> Policy Simulation
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <ScenarioCard 
                                  title="Block High Risk" 
                                  status={(res.data.risk_score === 'High' || res.data.risk_score === 'Extreme' || (res.data.fraud_score && res.data.fraud_score >= 80)) ? 'BLOCKED' : 'ALLOWED'} 
                                  active={true}
                                />
                                <ScenarioCard 
                                  title="Proxy Filter" 
                                  status={((res.data.is_proxy || res.data.is_vpn || res.data.is_tor) && !res.data.is_bot) ? 'BLOCKED' : 'ALLOWED'} 
                                  active={true}
                                />
                                <ScenarioCard 
                                  title="Geo-Fence (CN/RU)" 
                                  status={['CN', 'RU'].includes(res.data.country_code) ? 'BLOCKED' : 'ALLOWED'} 
                                  active={true}
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
