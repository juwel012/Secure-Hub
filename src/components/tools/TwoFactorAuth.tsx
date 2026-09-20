import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Key, 
  Copy, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  Clock, 
  Sparkles, 
  Trash2, 
  Bookmark, 
  BookmarkCheck, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  Clipboard, 
  Sliders, 
  ExternalLink,
  ChevronDown,
  Lock,
  QrCode,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as OTPAuth from 'otpauth';
import jsQR from 'jsqr';

export interface Saved2FAAccount {
  id: string;
  issuer: string;
  account: string;
  secret: string;
  digits: number;
  period: number;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  createdAt: number;
}

const DEFAULT_KEY = 'JBSWY3DPEHPK3PXP'; // Standard RFC 6238 demo key

export const TwoFactorAuth: React.FC = () => {
  const [rawInput, setRawInput] = useState<string>(DEFAULT_KEY);
  const [secret, setSecret] = useState<string>(DEFAULT_KEY);
  const [issuer, setIssuer] = useState<string>('SecureHub Demo');
  const [account, setAccount] = useState<string>('user@securehub.net');
  const [digits, setDigits] = useState<number>(6);
  const [period, setPeriod] = useState<number>(30);
  const [algorithm, setAlgorithm] = useState<'SHA1' | 'SHA256' | 'SHA512'>('SHA1');

  // Generator states
  const [currentCode, setCurrentCode] = useState<string>('------');
  const [nextCode, setNextCode] = useState<string>('------');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [progress, setProgress] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Drag & drop / Image upload states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [qrDecodedMessage, setQrDecodedMessage] = useState<string | null>(null);

  // Advanced settings toggles
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Vault / Saved Accounts
  const [vault, setVault] = useState<Saved2FAAccount[]>(() => {
    try {
      const saved = localStorage.getItem('securehub_2fa_vault');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [copiedVaultId, setCopiedVaultId] = useState<string | null>(null);
  const [vaultFilter, setVaultFilter] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save vault changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('securehub_2fa_vault', JSON.stringify(vault));
    } catch (e) {
      console.error('Failed to save 2FA vault', e);
    }
  }, [vault]);

  // Parse raw input (supports otpauth:// URI or base32 secret)
  const parseAndApplyKey = useCallback((input: string) => {
    const trimmed = input.trim();
    if (!trimmed) {
      setSecret('');
      setError('Enter a secret key or paste a QR code link.');
      return;
    }

    if (trimmed.toLowerCase().startsWith('otpauth://')) {
      try {
        const parsed = OTPAuth.URI.parse(trimmed);
        if (parsed instanceof OTPAuth.TOTP) {
          const cleanSec = parsed.secret.base32;
          setSecret(cleanSec);
          setIssuer(parsed.issuer || 'Unknown Issuer');
          setAccount(parsed.label || 'Account');
          setDigits(parsed.digits || 6);
          setPeriod(parsed.period || 30);
          setAlgorithm((parsed.algorithm as any) || 'SHA1');
          setError(null);
          return;
        }
      } catch (err: any) {
        console.warn('URI parsing fallback:', err);
      }
    }

    // Treat as raw secret
    const cleanedSecret = trimmed.replace(/[\s\-]/g, '').toUpperCase();
    if (!/^[A-Z2-7=]+$/.test(cleanedSecret)) {
      setError('Invalid Base32 characters detected. Secret should only contain letters A-Z and digits 2-7.');
      setSecret(cleanedSecret);
    } else {
      setError(null);
      setSecret(cleanedSecret);
    }
  }, []);

  // Sync raw input to secret
  useEffect(() => {
    parseAndApplyKey(rawInput);
  }, [rawInput, parseAndApplyKey]);

  // Decode QR code from image Blob/File
  const processImageFile = async (file: Blob) => {
    setIsProcessingImage(true);
    setQrDecodedMessage(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            setError('Canvas rendering error while decoding QR image.');
            setIsProcessingImage(false);
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
          });

          if (qrCode && qrCode.data) {
            const decoded = qrCode.data.trim();
            setRawInput(decoded);
            setQrDecodedMessage('QR Code successfully decoded and key loaded!');
            setTimeout(() => setQrDecodedMessage(null), 5000);
          } else {
            setError('No QR code could be found in this image. Please ensure the QR code is clearly visible.');
          }
        } catch (err: any) {
          setError(err?.message || 'Failed to process QR image.');
        } finally {
          setIsProcessingImage(false);
        }
      };
      img.onerror = () => {
        setError('Failed to load image file.');
        setIsProcessingImage(false);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Clipboard Paste Handler (text or image)
  const handlePasteEvent = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          processImageFile(file);
          return;
        }
      }
    }

    // Fallback to text if no image
    const text = e.clipboardData?.getData('text');
    if (text) {
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setRawInput(text);
      }
    }
  }, []);

  // Attach global paste listener
  useEffect(() => {
    window.addEventListener('paste', handlePasteEvent);
    return () => window.removeEventListener('paste', handlePasteEvent);
  }, [handlePasteEvent]);

  // Explicit Paste from Clipboard button
  const handleClipboardButtonClick = async () => {
    try {
      if (navigator.clipboard?.read) {
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            const imageType = item.types.find(t => t.startsWith('image/'));
            if (imageType) {
              const blob = await item.getType(imageType);
              processImageFile(blob);
              return;
            }
          }
        } catch {
          // fallback
        }
      }

      const text = await navigator.clipboard.readText();
      if (text) {
        setRawInput(text);
        setQrDecodedMessage('Key pasted from clipboard!');
        setTimeout(() => setQrDecodedMessage(null), 3000);
      } else {
        setError('Clipboard is empty or does not contain text/images.');
      }
    } catch {
      setError('Clipboard access was denied. Please paste directly using Ctrl+V or upload an image.');
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        processImageFile(file);
      } else {
        setError('Please drop an image file containing a QR code.');
      }
    } else {
      const text = e.dataTransfer.getData('text');
      if (text) {
        setRawInput(text);
      }
    }
  };

  // Live TOTP Tick Engine
  useEffect(() => {
    const updateCodes = () => {
      const nowMs = Date.now();
      const currentSeconds = Math.floor(nowMs / 1000);
      const step = period || 30;
      const remaining = step - (currentSeconds % step);
      const prog = (remaining / step) * 100;

      setSecondsRemaining(remaining);
      setProgress(prog);

      if (!secret) {
        setCurrentCode('------');
        setNextCode('------');
        return;
      }

      try {
        const totp = new OTPAuth.TOTP({
          issuer,
          label: account,
          algorithm,
          digits,
          period: step,
          secret: OTPAuth.Secret.fromBase32(secret)
        });

        const codeNow = totp.generate({ timestamp: nowMs });
        const codeNext = totp.generate({ timestamp: nowMs + (step * 1000) });

        setCurrentCode(codeNow);
        setNextCode(codeNext);
      } catch {
        setCurrentCode('ERROR');
        setNextCode('------');
      }
    };

    updateCodes();
    const interval = setInterval(updateCodes, 300);
    return () => clearInterval(interval);
  }, [secret, period, digits, algorithm, issuer, account]);

  // Copy code helper
  const copyToClipboard = (text: string) => {
    if (!text || text === '------' || text === 'ERROR') return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format code with space (e.g. 123 456 or 1234 5678)
  const formatCode = (code: string) => {
    if (!code || code.length < 6) return code;
    const mid = Math.ceil(code.length / 2);
    return `${code.slice(0, mid)} ${code.slice(mid)}`;
  };

  // Save current active key to vault
  const saveToVault = () => {
    if (!secret || currentCode === 'ERROR') {
      setError('Cannot save an invalid or empty 2FA key.');
      return;
    }
    const newAccount: Saved2FAAccount = {
      id: Math.random().toString(36).substr(2, 9),
      issuer: issuer.trim() || 'Custom Service',
      account: account.trim() || 'Authentication Key',
      secret,
      digits,
      period,
      algorithm,
      createdAt: Date.now()
    };
    setVault(prev => [newAccount, ...prev.filter(v => v.secret !== secret)]);
    setQrDecodedMessage('Account saved to Neural Vault!');
    setTimeout(() => setQrDecodedMessage(null), 3000);
  };

  const removeFromVault = (id: string) => {
    setVault(prev => prev.filter(v => v.id !== id));
  };

  const loadFromVault = (acc: Saved2FAAccount) => {
    setRawInput(acc.secret);
    setIssuer(acc.issuer);
    setAccount(acc.account);
    setDigits(acc.digits);
    setPeriod(acc.period);
    setAlgorithm(acc.algorithm);
    setQrDecodedMessage(`Loaded: ${acc.issuer}`);
    setTimeout(() => setQrDecodedMessage(null), 3000);
  };

  const getAccountCode = (acc: Saved2FAAccount) => {
    try {
      const totp = new OTPAuth.TOTP({
        issuer: acc.issuer,
        label: acc.account,
        algorithm: acc.algorithm,
        digits: acc.digits,
        period: acc.period,
        secret: OTPAuth.Secret.fromBase32(acc.secret)
      });
      return totp.generate();
    } catch {
      return '------';
    }
  };

  const timerColor = secondsRemaining <= 5 
    ? 'text-cyber-red stroke-cyber-red' 
    : secondsRemaining <= 10 
      ? 'text-cyber-amber stroke-cyber-amber' 
      : 'text-cyber-cyan stroke-cyber-cyan';

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 glass rounded-[2rem] border border-white/5 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-cyan/5 rounded-full blur-[80px] -mr-32 -mt-32" />
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-cyber-cyan rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity" />
            <div className="relative w-14 h-14 bg-dark-900 rounded-2xl border border-cyber-cyan/40 flex items-center justify-center shadow-[0_0_25px_rgba(0,245,212,0.2)]">
              <Key className="w-7 h-7 text-cyber-cyan animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black text-cyber-cyan bg-cyber-cyan/10 px-2.5 py-0.5 rounded-full border border-cyber-cyan/20 uppercase tracking-[0.2em]">
                RFC 6238 COMPLIANT
              </span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                TOTP PROTOCOL
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase hover-glitch">
              Neural <span className="text-cyber-cyan">2FA</span> Authenticator
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Real-time 2FA code generation via secret key, QR image upload, drag & drop, or clipboard paste.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10 w-full md:w-auto">
          <button
            onClick={handleClipboardButtonClick}
            className="flex-1 md:flex-none px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:border-cyber-cyan/40 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
            title="Paste text or image from clipboard"
          >
            <Clipboard className="w-4 h-4 text-cyber-cyan" />
            <span>Paste from Clipboard</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 md:flex-none px-4 py-3 bg-cyber-cyan text-dark-950 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(0,245,212,0.3)] active:scale-95 cursor-pointer"
            title="Upload QR Code file"
          >
            <Upload className="w-4 h-4" />
            <span>Upload QR Image</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processImageFile(e.target.files[0]);
              }
            }}
          />
        </div>
      </div>

      {/* Status Notifications */}
      <AnimatePresence>
        {qrDecodedMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-cyber-green/10 border border-cyber-green/30 rounded-2xl flex items-center gap-3 text-cyber-green text-xs font-bold shadow-[0_0_20px_rgba(0,255,136,0.1)]"
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>{qrDecodedMessage}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-cyber-red/10 border border-cyber-red/30 rounded-2xl flex items-center justify-between gap-3 text-cyber-red text-xs font-bold"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Code Card + Key Input & Dropzone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Live 2FA Code Display */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="p-6 sm:p-8 glass rounded-[2.5rem] border-2 border-white/10 hover:border-cyber-cyan/40 transition-all duration-500 relative overflow-hidden shadow-2xl bg-dark-900/80">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyber-cyan/10 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none" />
            
            {/* Corner Bracket Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyber-cyan/40 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyber-cyan/40 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyber-cyan/40 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyber-cyan/40 rounded-br-xl" />

            {/* Service & Account Info */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center text-cyber-cyan">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight truncate max-w-[180px]">
                    {issuer || 'Unknown Service'}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 truncate max-w-[180px]">
                    {account || 'Protected Account'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={saveToVault}
                  className="p-2.5 bg-white/5 hover:bg-cyber-cyan/20 hover:text-cyber-cyan text-slate-400 rounded-xl border border-white/10 transition-all cursor-pointer"
                  title="Save Account to Vault"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 6-Digit Code Display */}
            <div className="py-8 sm:py-10 text-center relative">
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">
                ACTIVE AUTHENTICATION CODE
              </div>

              <div className="flex items-center justify-center gap-3">
                <motion.span
                  key={currentCode}
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.25 }}
                  className="font-mono text-4xl sm:text-5xl font-black text-white tracking-[0.2em] select-all drop-shadow-[0_0_20px_rgba(0,245,212,0.3)]"
                >
                  {formatCode(currentCode)}
                </motion.span>
              </div>

              {/* Copy Code Button */}
              <div className="mt-6 flex items-center justify-center">
                <button
                  onClick={() => copyToClipboard(currentCode)}
                  disabled={currentCode === '------' || currentCode === 'ERROR'}
                  className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.25em] flex items-center gap-3 transition-all duration-300 active:scale-95 shadow-lg cursor-pointer ${
                    copied 
                      ? 'bg-cyber-green text-dark-950 shadow-cyber-green/30' 
                      : 'bg-cyber-cyan text-dark-950 hover:bg-cyber-cyan/90 shadow-cyber-cyan/20 hover:shadow-cyber-cyan/40'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>CODE COPIED!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>COPY CODE</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Countdown Ring & Metadata */}
            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Circular Progress Indicator */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      className="text-white/10"
                    />
                    <motion.circle
                      cx="24"
                      cy="24"
                      r="18"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      fill="transparent"
                      strokeDasharray={113}
                      animate={{ strokeDashoffset: 113 - (113 * progress) / 100 }}
                      transition={{ duration: 0.3, ease: 'linear' }}
                      strokeLinecap="round"
                      className={timerColor}
                    />
                  </svg>
                  <span className={`absolute text-xs font-mono font-black ${timerColor}`}>
                    {secondsRemaining}s
                  </span>
                </div>

                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Next Refresh In
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyber-cyan" />
                    <span>{secondsRemaining}s remaining</span>
                  </div>
                </div>
              </div>

              {/* Next Code Preview */}
              <div className="text-right">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Upcoming Code
                </div>
                <div className="text-xs font-mono font-bold text-slate-400">
                  {formatCode(nextCode)}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 glass rounded-xl border border-white/5 text-center">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Algorithm</span>
              <span className="text-xs font-mono font-bold text-cyber-cyan">{algorithm}</span>
            </div>
            <div className="p-3 glass rounded-xl border border-white/5 text-center">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Digits</span>
              <span className="text-xs font-mono font-bold text-cyber-purple">{digits} Digits</span>
            </div>
            <div className="p-3 glass rounded-xl border border-white/5 text-center">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Step Period</span>
              <span className="text-xs font-mono font-bold text-cyber-green">{period}s</span>
            </div>
          </div>
        </div>

        {/* Right Column: Key Input, Drag & Drop, Paste Options */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 sm:p-8 glass rounded-[2.5rem] border border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white tracking-tight uppercase">
                  2FA Secret Key or QR Code
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Enter key manually, paste from clipboard, or drag & drop a QR image.
                </p>
              </div>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                  showAdvanced 
                    ? 'bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-wider">Params</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Secret Key Input Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <label>Secret Key / otpauth:// URI</label>
                <span className="text-slate-600">Base32 standard</span>
              </div>
              <div className="relative">
                <textarea
                  rows={2}
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="e.g. JBSWY3DPEHPK3PXP or otpauth://totp/..."
                  className="w-full p-4 bg-dark-900 border border-white/10 rounded-2xl font-mono text-sm text-white placeholder:text-slate-600 focus:border-cyber-cyan focus:ring-2 focus:ring-cyber-cyan/20 outline-none transition-all uppercase resize-none"
                />
                {rawInput && (
                  <button
                    onClick={() => setRawInput('')}
                    className="absolute right-3 top-3 p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                    title="Clear key"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Advanced Parameters (collapsible) */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                        Issuer Name
                      </label>
                      <input
                        type="text"
                        value={issuer}
                        onChange={(e) => setIssuer(e.target.value)}
                        placeholder="Google, GitHub, Discord..."
                        className="w-full p-3 bg-dark-900 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-cyber-cyan outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                        Account / Label
                      </label>
                      <input
                        type="text"
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full p-3 bg-dark-900 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-cyber-cyan outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                        Digits
                      </label>
                      <select
                        value={digits}
                        onChange={(e) => setDigits(Number(e.target.value))}
                        className="w-full p-2.5 bg-dark-900 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-cyber-cyan outline-none"
                      >
                        <option value={6}>6 Digits (Default)</option>
                        <option value={8}>8 Digits</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                        Period
                      </label>
                      <select
                        value={period}
                        onChange={(e) => setPeriod(Number(e.target.value))}
                        className="w-full p-2.5 bg-dark-900 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-cyber-cyan outline-none"
                      >
                        <option value={30}>30s (Default)</option>
                        <option value={60}>60s</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                        Algorithm
                      </label>
                      <select
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value as any)}
                        className="w-full p-2.5 bg-dark-900 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-cyber-cyan outline-none"
                      >
                        <option value="SHA1">SHA-1 (Default)</option>
                        <option value="SHA256">SHA-256</option>
                        <option value="SHA512">SHA-512</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Drag & Drop Zone for QR Code */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer text-center relative overflow-hidden flex flex-col items-center justify-center gap-3 ${
                isDragging 
                  ? 'border-cyber-cyan bg-cyber-cyan/10 scale-[1.01] shadow-[0_0_30px_rgba(0,245,212,0.2)]' 
                  : 'border-white/10 hover:border-cyber-cyan/40 bg-dark-900/50 hover:bg-dark-900/80'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyber-cyan">
                {isProcessingImage ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-cyber-cyan" />
                ) : (
                  <QrCode className="w-6 h-6 text-cyber-cyan" />
                )}
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-wider text-white">
                  {isProcessingImage 
                    ? 'Decoding QR Code Image...' 
                    : isDragging 
                      ? 'Release to scan QR Code!' 
                      : 'Drag & Drop QR Code Image Here'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  or click to select file (PNG, JPG, WEBP) • or simply press <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[9px] text-cyber-cyan">Ctrl+V</kbd> to paste
                </p>
              </div>

              {imagePreview && (
                <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-[10px] text-slate-400">
                  <ImageIcon className="w-3.5 h-3.5 text-cyber-cyan" />
                  <span>Last Scanned Image</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                    }}
                    className="ml-2 hover:text-white text-slate-500 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Quick Helper Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-cyber-cyan" />
                <span>Quick Test Keys:</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setRawInput('JBSWY3DPEHPK3PXP');
                    setIssuer('Google Demo');
                    setAccount('demo@gmail.com');
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-[10px] font-mono border border-white/5 hover:border-cyber-cyan/30 transition-all cursor-pointer"
                >
                  Standard Demo
                </button>
                <button
                  onClick={() => {
                    setRawInput('HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ');
                    setIssuer('GitHub');
                    setAccount('octocat');
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-[10px] font-mono border border-white/5 hover:border-cyber-cyan/30 transition-all cursor-pointer"
                >
                  GitHub Sample
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Accounts Vault */}
      <div className="p-6 sm:p-8 glass rounded-[2.5rem] border border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyber-purple/10 border border-cyber-purple/30 flex items-center justify-center text-cyber-purple">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Neural 2FA Vault ({vault.length})
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Local Secure Cache • One-Click Copy
              </p>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={vaultFilter}
              onChange={(e) => setVaultFilter(e.target.value)}
              placeholder="Filter saved keys..."
              className="w-full px-4 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-xs font-bold text-white placeholder:text-slate-600 focus:border-cyber-purple outline-none transition-all"
            />
          </div>
        </div>

        {vault.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-white/5 border-dashed bg-white/[0.01]">
            <Lock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Vault is Empty</p>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
              Click the bookmark icon on any active 2FA code above to save it here for instant access without re-entering the secret.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vault
              .filter(acc => 
                acc.issuer.toLowerCase().includes(vaultFilter.toLowerCase()) || 
                acc.account.toLowerCase().includes(vaultFilter.toLowerCase())
              )
              .map((acc) => {
                const code = getAccountCode(acc);
                const isCopied = copiedVaultId === acc.id;

                return (
                  <motion.div
                    key={acc.id}
                    layout
                    className="p-5 bg-dark-900/80 rounded-2xl border border-white/10 hover:border-cyber-cyan/40 transition-all group relative overflow-hidden shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">
                          {acc.issuer}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {acc.account}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => loadFromVault(acc)}
                          className="p-1.5 text-slate-500 hover:text-cyber-cyan rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                          title="Load into active viewer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeFromVault(acc.id)}
                          className="p-1.5 text-slate-500 hover:text-cyber-red rounded-lg hover:bg-cyber-red/10 transition-all cursor-pointer"
                          title="Remove from vault"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Code Readout */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="font-mono text-2xl font-black text-cyber-cyan tracking-wider">
                        {formatCode(code)}
                      </span>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(code);
                          setCopiedVaultId(acc.id);
                          setTimeout(() => setCopiedVaultId(null), 2000);
                        }}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isCopied 
                            ? 'bg-cyber-green text-dark-950' 
                            : 'bg-white/5 hover:bg-cyber-cyan hover:text-dark-950 text-slate-300'
                        }`}
                        title="Copy code"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
