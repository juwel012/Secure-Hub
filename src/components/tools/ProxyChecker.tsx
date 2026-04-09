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
        return [...newResults, ...filtered].slice(0, 100); // Keep last 100
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
                <Globe className="w-6 h-6 sm:w-10 sm:h-10 text-cyber-cyan" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">Proxy & IP Checker</h2>
              <p className="text-[10px] sm:text-sm font-black text-cyber-cyan uppercase tracking-[0.3em] mt-1 opacity-100">Intelligence Protocol v4.0</p>
            </div>
          </div>

          <div className="flex gap-3 w-full lg:w-auto justify-end">
            <button 
              onClick={() => setView(view === 'current' ? 'history' : 'current')}
              className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                view === 'history' 
                  ? 'bg-cyber-purple/20 text-cyber-purple border-cyber-purple/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                  : 'bg-dark-900/50 text-slate-500 border-white/5 hover:bg-cyber-purple/10 hover:text-cyber-purple'
              }`}
              title={view === 'current' ? "View Scan History" : "View Current Results"}
            >
              <History className="w-5 h-5" />
            </button>
            <button 
              onClick={view === 'current' ? clearResults : clearHistory}
              className="p-3 sm:p-4 bg-dark-900/50 hover:bg-cyber-red/10 text-slate-500 hover:text-cyber-red rounded-2xl border border-white/5 transition-all"
              title={view === 'current' ? "Clear Current Results" : "Clear Scan History"}
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={copyResults}
              className="p-3 sm:p-4 bg-dark-900/50 hover:bg-cyber-cyan/10 text-slate-500 hover:text-cyber-cyan rounded-2xl border border-white/5 transition-all"
              title="Copy Results"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="mb-8 p-6 bg-cyber-cyan/5 border border-cyber-cyan/20 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-cyber-cyan shrink-0 mt-1" />
            <div>
              <p className="text-[10px] font-black text-cyber-cyan uppercase tracking-widest mb-1">System Intelligence</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Choose your intelligence provider. Bulk checking supported (one IP per line).
              </p>
            </div>
          </div>
          
          <div className="flex bg-dark-900/80 p-1 rounded-2xl border border-white/20 w-full sm:w-auto backdrop-blur-md">
            <button
              onClick={() => setProvider('fraudlogix')}
              className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                provider === 'fraudlogix' ? 'bg-cyber-cyan text-dark-950 shadow-lg shadow-cyber-cyan/30' : 'text-slate-300 hover:text-white'
              }`}
            >
              Engine Alpha
            </button>
            <button
              onClick={() => setProvider('ipqs')}
              className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                provider === 'ipqs' ? 'bg-cyber-purple text-white shadow-lg shadow-cyber-purple/30' : 'text-slate-300 hover:text-white'
              }`}
            >
              Engine Beta
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-12 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyber-cyan to-cyber-purple rounded-[1.5rem] sm:rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-25 transition duration-1000" />
                <div className="relative">
                  <div className="absolute top-5 left-6 flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Terminal className="w-4 h-4" /> IP Terminal
                  </div>
                  <textarea
                    placeholder="ENTER IPs HERE (ONE PER LINE)"
                    className="w-full h-[200px] sm:h-[300px] p-6 sm:p-12 pt-12 sm:pt-16 bg-dark-900/80 backdrop-blur-xl border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] focus:ring-2 focus:ring-cyber-cyan/50 outline-none transition-all resize-none font-mono text-xs sm:text-sm text-cyber-cyan placeholder:text-slate-700 custom-scrollbar"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={checking}
                  />
                  <button
                    onClick={handleCheck}
                    disabled={checking || !input.trim()}
                    className="absolute bottom-6 right-6 px-8 py-4 bg-cyber-cyan hover:bg-cyber-cyan/80 text-dark-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-lg shadow-cyber-cyan/20 active:scale-95 disabled:opacity-50"
                  >
                    {checking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {checking ? 'Analyzing...' : 'Analyze IPs'}
                  </button>
                </div>
              </div>

              <div className="glass rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col h-[400px] sm:h-[500px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                    <Activity className="w-4 h-4 text-cyber-cyan" /> 
                    {view === 'current' ? 'Analysis Results' : 'Scan History'}
                  </h3>
                  <div className="flex bg-dark-900/50 p-1 rounded-xl border border-white/5">
                    <button 
                      onClick={() => setView('current')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'current' ? 'bg-cyber-cyan text-dark-950' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Current
                    </button>
                    <button 
                      onClick={() => setView('history')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-cyber-purple text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      History
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                  {((view === 'current' ? results : historyResults).length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                      <ShieldAlert className="w-12 h-12 mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        {view === 'current' ? 'Waiting for Input' : 'No History Found'}
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
                          className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
                            res.status === 'error' 
                              ? 'bg-cyber-red/10 border-cyber-red/20 text-cyber-red' 
                              : res.data?.is_proxy 
                                ? 'bg-cyber-amber/10 border-cyber-amber/20 text-cyber-amber' 
                                : 'bg-cyber-green/10 border-cyber-green/20 text-cyber-green'
                          } flex items-center justify-between`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-2.5 h-2.5 rounded-full ${
                              res.status === 'error' ? 'bg-cyber-red' : res.data?.is_proxy ? 'bg-cyber-amber' : 'bg-cyber-green'
                            } shadow-[0_0_8px_currentColor]`} />
                            <span className="font-mono text-sm font-bold text-white">{res.ip}</span>
                          </div>

                          {res.firstCheckedAt && (
                            <div className="hidden sm:block flex-1 text-center">
                              <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full inline-block border border-white/5">
                                Checked ago: {formatTimeAgo(res.firstCheckedAt)}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col items-end gap-1 flex-1">
                            <div className="text-[11px] font-black uppercase tracking-widest drop-shadow-md">
                              {res.status === 'error' ? (res.message || 'Error') : res.data?.is_proxy ? 'Proxy/VPN' : 'Clean'}
                            </div>
                            {res.firstCheckedAt && (
                              <div className="sm:hidden text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                {formatTimeAgo(res.firstCheckedAt)}
                              </div>
                            )}
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
                              <div className="p-6 bg-dark-900/50 border border-white/5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {/* Left Column */}
                                <div className="space-y-3">
                                  <DetailRow label="Risk Score" value={res.data.risk_score || 'Low'} color={res.data.risk_score === 'High' ? 'text-cyber-red' : 'text-cyber-green'} />
                                  {res.data.fraud_score !== undefined && (
                                    <DetailRow label="Fraud Score" value={res.data.fraud_score} color={res.data.fraud_score > 80 ? 'text-cyber-red' : 'text-cyber-green'} />
                                  )}
                                  <DetailRow label="VPN / Proxy" value={res.data.is_proxy ? 'TRUE' : 'FALSE'} color={res.data.is_proxy ? 'text-cyber-red' : 'text-cyber-green'} />
                                  <DetailRow label="TOR" value={res.data.is_tor ? 'TRUE' : 'FALSE'} color={res.data.is_tor ? 'text-cyber-red' : 'text-cyber-green'} />
                                  <DetailRow label="Data Center" value={res.data.is_datacenter ? 'TRUE' : 'FALSE'} color={res.data.is_datacenter ? 'text-cyber-red' : 'text-cyber-green'} />
                                  <DetailRow label="Search Engine Bot" value={res.data.is_bot ? 'TRUE' : 'FALSE'} color={res.data.is_bot ? 'text-cyber-red' : 'text-cyber-green'} />
                                  <DetailRow label="Masked Devices" value={res.data.is_masked ? 'TRUE' : 'FALSE'} color={res.data.is_masked ? 'text-cyber-red' : 'text-cyber-green'} />
                                  <DetailRow label="Abnormal Traffic" value={res.data.is_abnormal ? 'TRUE' : 'FALSE'} color={res.data.is_abnormal ? 'text-cyber-red' : 'text-cyber-green'} />
                                  <DetailRow label="Risk Events" value={res.data.risk_events || '0'} />
                                </div>
                                {/* Right Column */}
                                <div className="space-y-3">
                                  <DetailRow label="ASN" value={res.data.asn || 'N/A'} />
                                  <DetailRow label="Organization" value={res.data.organization || 'N/A'} />
                                  <DetailRow label="ISP" value={res.data.isp || 'N/A'} />
                                  <DetailRow label="City" value={res.data.city || 'N/A'} />
                                  <DetailRow label="Region" value={res.data.region || 'N/A'} />
                                  <DetailRow label="Country" value={res.data.country || 'N/A'} />
                                  <DetailRow label="Time Zone" value={res.data.timezone || 'N/A'} />
                                  <DetailRow label="Connection Type" value={res.data.connection_type || 'Residential'} />
                                </div>

                                {/* Security Scenarios Section */}
                                <div className="md:col-span-2 mt-6 pt-6 border-t border-white/5">
                                  <h4 className="text-[10px] font-black text-cyber-cyan uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Shield className="w-3 h-3" /> Security Policy Simulation
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <ScenarioCard 
                                      title="Block High/Extreme" 
                                      status={(res.data.risk_score === 'High' || res.data.risk_score === 'Extreme' || (res.data.fraud_score && res.data.fraud_score >= 80)) ? 'BLOCKED' : 'ALLOWED'} 
                                      active={true}
                                    />
                                    <ScenarioCard 
                                      title="Quarantine Medium" 
                                      status={(res.data.risk_score === 'Medium' || (res.data.fraud_score && res.data.fraud_score >= 40 && res.data.fraud_score < 80)) ? 'CAPTCHA' : 'ALLOWED'} 
                                      active={false}
                                    />
                                    <ScenarioCard 
                                      title="Strict Mode (Low Only)" 
                                      status={(res.data.risk_score !== 'Low' && !res.data.is_bot) ? 'BLOCKED' : 'ALLOWED'} 
                                      active={false}
                                    />
                                    <ScenarioCard 
                                      title="Block Proxies" 
                                      status={((res.data.is_proxy || res.data.is_vpn || res.data.is_tor) && !res.data.is_bot) ? 'BLOCKED' : 'ALLOWED'} 
                                      active={true}
                                    />
                                    <ScenarioCard 
                                      title="Geo-Blocking (CN/RU)" 
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
