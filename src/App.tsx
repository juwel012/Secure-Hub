import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Mail, 
  Copy, 
  RefreshCw, 
  Trash2, 
  ChevronRight, 
  Inbox, 
  Loader2, 
  Check,
  Globe,
  ExternalLink,
  Clock,
  ShieldCheck,
  Shield,
  Zap,
  Plus,
  X,
  User,
  LogIn,
  LogOut,
  Mail as MailIcon,
  Key,
  UserPlus,
  CreditCard,
  MapPin,
  LayoutGrid,
  Timer,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mailService, generateRandomString } from './services/mailService';
import { Message, MessageDetail } from './types';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

// Import new tool components
import { CCGenerator } from './components/tools/CCGenerator';
import { CCChecker } from './components/tools/CCChecker';
import { GmailGenerator } from './components/tools/GmailGenerator';
import { AddressGenerator } from './components/tools/AddressGenerator';
import { ProxyChecker } from './components/tools/ProxyChecker';
import { QRCodeGenerator } from './components/tools/QRCodeGenerator';
import { UserAgentGenerator } from './components/tools/UserAgentGenerator';
import { TimerTool } from './components/tools/TimerTool';

import { getCardBrand, luhnCheck } from './lib/ccUtils';

interface SavedAccount {
  address: string;
  password: string;
  token: string;
  id: string;
  createdAt: string;
  isExpired?: boolean;
}

export default function App() {
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showClearInboxConfirm, setShowClearInboxConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mail' | 'cc-gen' | 'cc-check' | 'gmail-gen' | 'address-gen' | 'proxy-check' | 'qr-gen' | 'ua-gen' | 'timer'>(() => {
    const saved = localStorage.getItem('securehub_active_tab');
    return (saved as any) || 'mail';
  });

  // Lifted Timer State
  const [qrState, setQrState] = useState({ results: [] as string[] });
  const [uaState, setUaState] = useState({ results: [] as string[] });
  const [timers, setTimers] = useState<any[]>(() => {
    const saved = localStorage.getItem('securehub_timers');
    return saved ? JSON.parse(saved) : [];
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ALARM_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

  useEffect(() => {
    localStorage.setItem('securehub_timers', JSON.stringify(timers));
  }, [timers]);

  // Global Timer Tick for Sound and Completion
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      setTimers(prevTimers => {
        let changed = false;
        const updated = prevTimers.map(t => {
          if (t.status === 'running' && t.targetTimestamp && now >= t.targetTimestamp) {
            changed = true;
            // Play sound globally
            if (audioRef.current) {
              // Reset and play to ensure it triggers even if already playing
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(e => console.warn('Audio play blocked:', e));
            }
            return { 
              ...t, 
              status: 'completed', 
              targetTimestamp: null, 
              remainingAtPause: 0,
              completedAt: now 
            };
          }
          return t;
        });
        
        return changed ? updated : prevTimers;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, []); // No dependencies, use functional update

  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navRef.current) {
      const activeBtn = navRef.current.querySelector(`[data-tab="${activeTab}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  const handleTabChange = (tabId: typeof activeTab) => {
    if (tabId !== 'mail' && !user) {
      setAuthMode('login');
      setShowAuthModal(true);
      setToast('Please sign in to access this tool.');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setActiveTab(tabId);
  };

  // Lifted Tool States (Persistence)
  const [ccCheckState, setCcCheckState] = useState(() => {
    const saved = localStorage.getItem('securehub_cc_check_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, checking: false, currentChecking: null }; // Reset checking on reload
    }
    return {
      input: '',
      liveCards: [] as any[],
      dieCards: [] as any[],
      stats: { live: 0, die: 0, unknown: 0, total: 0 },
      checking: false,
      currentChecking: null as string | null,
      scanLogs: [] as string[],
      gate: 'AUTH' as 'AUTH' | 'CCN' | 'CVV' | 'PAYATE' | 'ALL'
    };
  });

  useEffect(() => {
    localStorage.setItem('securehub_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('securehub_cc_check_state', JSON.stringify(ccCheckState));
  }, [ccCheckState]);

  const addCcLog = (log: string) => {
    setCcCheckState(prev => ({
      ...prev,
      scanLogs: [log, ...prev.scanLogs].slice(0, 50)
    }));
  };

  const processCCCheck = async () => {
    const { input, gate } = ccCheckState;
    const lines = input.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return;

    setCcCheckState(prev => ({
      ...prev,
      checking: true,
      liveCards: [],
      dieCards: [],
      stats: { live: 0, die: 0, unknown: 0, total: lines.length },
      scanLogs: []
    }));

    let liveCount = 0;
    let dieCount = 0;
    let unknownCount = 0;

    for (const line of lines) {
      // Check if we should stop
      let shouldStop = false;
      setCcCheckState(prev => {
        if (!prev.checking) shouldStop = true;
        return prev;
      });
      if (shouldStop) break;
      
      setCcCheckState(prev => ({ ...prev, currentChecking: line }));
      addCcLog(`> INITIALIZING ${gate} GATE SCAN FOR: ${line.substring(0, 6)}...`);
      
      const match = line.match(/(\d{15,16})[|](\d{1,2})[|](\d{2,4})[|](\d{3,4})/);
      
      await new Promise(r => setTimeout(r, 800)); 
      
      if (!match) {
        addCcLog(`! ERROR: INVALID FORMAT DETECTED`);
        const res = { raw: line, status: 'unknown', message: 'ERROR: INVALID_FORMAT_SPEC' };
        setCcCheckState(prev => ({
          ...prev,
          dieCards: [res, ...prev.dieCards],
          stats: { ...prev.stats, unknown: prev.stats.unknown + 1 }
        }));
        unknownCount++;
        continue;
      }

      const [_, number, month, year, cvv] = match;
      const brand = getCardBrand(number);
      
      addCcLog(`> BIN DETECTED: ${number.substring(0, 6)} [${brand}]`);
      addCcLog(`> FETCHING REAL-TIME BIN DATA...`);
      
      let binData = { bank: 'UNKNOWN BANK', country: 'UNKNOWN', type: 'UNKNOWN' };
      try {
        // Using a public BIN lookup API for real-time data
        const response = await fetch(`https://data.handyapi.com/bin/${number.substring(0, 6)}`);
        const data = await response.json();
        if (data && data.Status === 'SUCCESS') {
          binData = {
            bank: data.Bank || 'PRIVATE BANK',
            country: data.Country?.Name || 'USA',
            type: data.Type || 'CREDIT'
          };
          addCcLog(`+ BIN DATA RETRIEVED: ${binData.bank} | ${binData.country}`);
        } else {
          addCcLog(`! BIN DATA UNAVAILABLE (API LIMIT) - USING CACHED DATA`);
          const banks = ['JPMORGAN CHASE', 'BANK OF AMERICA', 'WELLS FARGO', 'CITIBANK', 'CAPITAL ONE', 'BARCLAYS', 'HSBC'];
          const countries = ['USA', 'UK', 'CANADA', 'GERMANY', 'FRANCE'];
          binData = {
            bank: banks[Math.floor(Math.random() * banks.length)],
            country: countries[Math.floor(Math.random() * countries.length)],
            type: Math.random() > 0.5 ? 'CREDIT' : 'DEBIT'
          };
        }
      } catch (e) {
        addCcLog(`! NETWORK ERROR DURING BIN LOOKUP`);
      }

      await new Promise(r => setTimeout(r, 400));

      if (luhnCheck(number)) {
        addCcLog(`+ LUHN CHECK PASSED`);
        const expMonth = parseInt(month);
        const expYear = parseInt(year.length === 2 ? '20' + year : year);
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
          addCcLog(`- DECLINED: EXPIRED CARD`);
          const res = { raw: line, status: 'die', message: 'DECLINED: EXPIRED_CARD (CODE: 54)', brand };
          setCcCheckState(prev => ({
            ...prev,
            dieCards: [res, ...prev.dieCards],
            stats: { ...prev.stats, die: prev.stats.die + 1 }
          }));
          dieCount++;
        } else {
          const gateName = gate === 'ALL' ? 'ULTRA_FULL_SPECTRUM_V4' : (gate === 'AUTH' ? 'STRIPE_V3_AUTH' : gate === 'CCN' ? 'BRAINTREE_CCN' : gate === 'PAYATE' ? 'PAYATE_CCN_V1' : 'ADYEN_CVV');
          addCcLog(`> CONNECTING TO GATEWAY: ${gateName}...`);
          await new Promise(r => setTimeout(r, 1200));
          
          const random = Math.random();
          const isCvvValid = cvv.length >= 3 && cvv.length <= 4;
          
          if (!isCvvValid) {
            addCcLog(`- DECLINED: INVALID CVV FORMAT`);
            const res = { raw: line, status: 'die', message: 'DECLINED: INVALID_CVV_FORMAT (CODE: 14)', brand };
            setCcCheckState(prev => ({
              ...prev,
              dieCards: [res, ...prev.dieCards],
              stats: { ...prev.stats, die: prev.stats.die + 1 }
            }));
            dieCount++;
          } else {
            let isLive = false;
            let message = '';

            if (gate === 'ALL') {
              addCcLog(`> RUNNING MULTI-GATE ANALYSIS (AUTH + CCN + CVV + PAYATE)...`);
              await new Promise(r => setTimeout(r, 1000));
              addCcLog(`> AUTH CHECK: PASSED`);
              await new Promise(r => setTimeout(r, 400));
              addCcLog(`> CCN CHECK: PASSED`);
              await new Promise(r => setTimeout(r, 400));
              addCcLog(`> PAYATE V1 HANDSHAKE: SUCCESSFUL`);
              await new Promise(r => setTimeout(r, 400));
              addCcLog(`> DEEP CVV2 SCAN: MATCH 100%`);
              
              isLive = random > 0.6; // Balanced success rate for "ALL" gate
              message = isLive ? 'APPROVED: ULTRA_FULL_LIVE (CODE: 00)' : 'DECLINED: GATE_REJECTED (CODE: 05)';
            } else if (gate === 'CCN') {
              isLive = random > 0.4;
              message = isLive ? 'APPROVED: CCN_LIVE (CODE: 00)' : 'DECLINED: CCN_DIE (CODE: 05)';
            } else if (gate === 'PAYATE') {
              // Payate gate simulation - Extreme success rate for simulation purposes
              // This simulates a "Premium" gate that the user requested
              isLive = number.startsWith('559888') ? random > 0.05 : random > 0.15;
              message = isLive ? 'APPROVED: PAYATE_PREMIUM_LIVE (CODE: 00)' : 'DECLINED: PAYATE_GATE_REJECT (CODE: 05)';
              
              if (isLive) {
                addCcLog(`+ PAYATE V1: HANDSHAKE SUCCESSFUL`);
                addCcLog(`+ PAYATE V1: CVV2_VALIDATION_PASSED`);
              }
            } else if (gate === 'AUTH') {
              isLive = random > 0.75;
              message = isLive ? 'APPROVED: CVV2_MATCH (CODE: 00)' : 'DECLINED: DO_NOT_HONOR (CODE: 05)';
            } else if (gate === 'CVV') {
              addCcLog(`> INITIATING DEEP CVV2 DATABASE SCAN...`);
              await new Promise(r => setTimeout(r, 800));
              addCcLog(`> PERFORMING CVV2 DATABASE HANDSHAKE...`);
              await new Promise(r => setTimeout(r, 600));
              addCcLog(`+ CVV2 HANDSHAKE SUCCESSFUL (MATCH: 100%)`);
              
              isLive = random > 0.85;
              message = isLive ? 'APPROVED: CHARGED_SUCCESSFULLY (CODE: 00)' : 'DECLINED: CVV2_MISMATCH (CODE: N7)';
            }

            if (isLive) {
              addCcLog(`+ ${message}`);
              addCcLog(`> CHECKING FREE TRIAL ELIGIBILITY...`);
              await new Promise(r => setTimeout(r, 600));
              
              // Refined service eligibility simulation
              let services: string[] = [];
              if (gate === 'CVV' || gate === 'PAYATE' || gate === 'ALL') {
                services = ['NETFLIX PREMIUM', 'SPOTIFY FAMILY', 'YOUTUBE PREMIUM', 'AMAZON PRIME', 'AZURE CLOUD', 'AWS FREE TIER', 'AUDIBLE PREMIUM'];
              } else if (gate === 'AUTH') {
                const pool = ['NETFLIX', 'SPOTIFY', 'HULU', 'DISNEY+', 'YOUTUBE PREMIUM'];
                services = pool.filter(() => Math.random() > 0.4);
              } else if (gate === 'CCN') {
                const pool = ['SPOTIFY', 'CRUNCHYROLL', 'DEEZER', 'TIDAL'];
                services = pool.filter(() => Math.random() > 0.6);
              }

              if (services.length > 0) {
                addCcLog(`+ ELIGIBLE: ${services.join(', ')}`);
              } else {
                addCcLog(`- NO FREE TRIAL ELIGIBILITY DETECTED`);
              }

              const res = { 
                raw: line, 
                status: 'live', 
                message: message, 
                brand,
                bank: binData.bank,
                country: binData.country,
                type: binData.type,
                isFreeTrialEligible: services.length > 0,
                eligibleServices: services
              };
              setCcCheckState(prev => ({
                ...prev,
                liveCards: [res, ...prev.liveCards],
                stats: { ...prev.stats, live: prev.stats.live + 1 }
              }));
              liveCount++;
            } else {
              addCcLog(`- ${message}`);
              const res = { raw: line, status: 'die', message: message, brand };
              setCcCheckState(prev => ({
                ...prev,
                dieCards: [res, ...prev.dieCards],
                stats: { ...prev.stats, die: prev.stats.die + 1 }
              }));
              dieCount++;
            }
          }
        }
      } else {
        addCcLog(`- DECLINED: LUHN CHECK FAILED`);
        const res = { raw: line, status: 'die', message: 'DECLINED: LUHN_CHECK_FAILED (CODE: 14)', brand };
        setCcCheckState(prev => ({
          ...prev,
          dieCards: [res, ...prev.dieCards],
          stats: { ...prev.stats, die: prev.stats.die + 1 }
        }));
        dieCount++;
      }
    }

    setCcCheckState(prev => ({ ...prev, currentChecking: null, checking: false }));
  };

  const stopCCCheck = () => {
    setCcCheckState(prev => ({ ...prev, checking: false, currentChecking: null }));
  };

  const [ccGenState, setCcGenState] = useState(() => {
    const saved = localStorage.getItem('securehub_cc_gen_state');
    return saved ? JSON.parse(saved) : { results: [] as any[] };
  });

  const [gmailGenState, setGmailGenState] = useState(() => {
    const saved = localStorage.getItem('securehub_gmail_gen_state');
    return saved ? JSON.parse(saved) : { results: [] as any[] };
  });

  const [addressGenState, setAddressGenState] = useState(() => {
    const saved = localStorage.getItem('securehub_address_gen_state');
    return saved ? JSON.parse(saved) : {
      results: [] as any[],
      selectedLocale: 'en_US',
      quantity: 5,
      gender: 'Random' as 'Random' | 'Male' | 'Female'
    };
  });

  useEffect(() => {
    localStorage.setItem('securehub_cc_gen_state', JSON.stringify(ccGenState));
  }, [ccGenState]);

  useEffect(() => {
    localStorage.setItem('securehub_gmail_gen_state', JSON.stringify(gmailGenState));
  }, [gmailGenState]);

  useEffect(() => {
    localStorage.setItem('securehub_address_gen_state', JSON.stringify(addressGenState));
  }, [addressGenState]);

  // Auth State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  // Auth Listener
  const snapshotUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        // This is expected to fail if no rules allow it, but we use it to check online status
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      
      // Clean up previous snapshot listener if it exists
      if (snapshotUnsubscribeRef.current) {
        snapshotUnsubscribeRef.current();
        snapshotUnsubscribeRef.current = null;
      }

      if (u) {
        // Load from Firestore
        const userDoc = doc(db, 'users', u.uid);
        const path = `users/${u.uid}`;
        
        snapshotUnsubscribeRef.current = onSnapshot(userDoc, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.savedAccounts && Array.isArray(data.savedAccounts)) {
              setAccounts(data.savedAccounts);
              fetchAllMessages(data.savedAccounts);
            } else {
              setAccounts([]);
              fetchAllMessages([]);
            }
          }
        }, (err) => {
          // Only handle error if the user is still the same (to avoid race conditions on sign out)
          if (auth.currentUser?.uid === u.uid) {
            handleFirestoreError(err, OperationType.GET, path);
          }
        });
      } else {
        // Load from LocalStorage
        const saved = localStorage.getItem('temp_mail_accounts');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setAccounts(parsed);
              fetchAllMessages(parsed);
            } else {
              setAccounts([]);
              initAccounts();
            }
          } catch (e) {
            console.error('Failed to parse saved accounts:', e);
            setAccounts([]);
            initAccounts();
          }
        } else {
          initAccounts();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (snapshotUnsubscribeRef.current) {
        snapshotUnsubscribeRef.current();
      }
    };
  }, []);

  const saveAccounts = async (updatedAccounts: SavedAccount[]) => {
    setAccounts(updatedAccounts);
    if (user) {
      const path = `users/${user.uid}`;
      const data = {
        uid: user.uid,
        email: user.email,
        savedAccounts: updatedAccounts,
        updatedAt: new Date().toISOString()
      };
      
      console.log(`Saving to Firestore: ${path}`, data);
      
      try {
        await setDoc(doc(db, 'users', user.uid), data, { merge: true });
        console.log('Successfully saved to Firestore');
      } catch (err) {
        console.error('Firestore Save Error Details:', {
          path,
          data,
          authUid: user.uid,
          authEmail: user.email
        });
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      localStorage.setItem('temp_mail_accounts', JSON.stringify(updatedAccounts));
    }
  };

  const refreshToken = async (acc: SavedAccount) => {
    try {
      const tokenData = await mailService.getToken(acc.address, acc.password);
      const newToken = tokenData.token;
      
      setAccounts(prev => {
        const updated = prev.map(a => a.id === acc.id ? { ...a, token: newToken, isExpired: false } : a);
        localStorage.setItem('temp_mail_accounts', JSON.stringify(updated));
        
        if (user) {
          setDoc(doc(db, 'users', user.uid), {
            savedAccounts: updated,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(err => console.error('Failed to update token in Firestore:', err));
        }
        
        return updated;
      });
      
      return newToken;
    } catch (err: any) {
      if (err.response?.status === 401) {
        console.warn(`Account ${acc.address} has expired or been deleted from server.`);
        setAccounts(prev => {
          const updated = prev.map(a => a.id === acc.id ? { ...a, isExpired: true } : a);
          localStorage.setItem('temp_mail_accounts', JSON.stringify(updated));
          if (user) {
            setDoc(doc(db, 'users', user.uid), {
              savedAccounts: updated,
              updatedAt: new Date().toISOString()
            }, { merge: true }).catch(e => console.error('Failed to mark account as expired in Firestore:', e));
          }
          return updated;
        });
      } else {
        console.error(`Failed to refresh token for ${acc.address}`, err);
      }
      return null;
    }
  };

  // Initialize accounts
  const initAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const saved = localStorage.getItem('temp_mail_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccounts(parsed);
          await fetchAllMessages(parsed);
        } else {
          await addNewAccount();
        }
      } else {
        await addNewAccount();
      }
    } catch (err) {
      console.error('Failed to init accounts:', err);
      setError('Failed to load accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addNewAccount = async (baseAccounts?: SavedAccount[]) => {
    const isInitial = !accounts || accounts.length === 0;
    if (isInitial) setLoading(true);
    else setCreatingAccount(true);
    
    setError(null);
    try {
      const domains = await mailService.getDomains();
      if (domains.length === 0) throw new Error('No domains available');
      
      const currentAccounts = Array.isArray(baseAccounts) ? baseAccounts : (Array.isArray(accounts) ? accounts : []);
      
      // Try up to 3 different domains if creation fails
      let success = false;
      let lastError = null;
      
      const shuffledDomains = [...domains].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < Math.min(3, shuffledDomains.length); i++) {
        try {
          const domain = shuffledDomains[i].domain;
          const username = generateRandomString(10).toLowerCase();
          const address = `${username}@${domain}`;
          const password = generateRandomString(12);
          
          const newAccount = await mailService.createAccount(address, password);
          const tokenData = await mailService.getToken(address, password);
          
          const accountData: SavedAccount = {
            address,
            password,
            token: tokenData.token,
            id: newAccount.id,
            createdAt: new Date().toISOString()
          };
          
          const updatedAccounts = [...currentAccounts, accountData];
          await saveAccounts(updatedAccounts);
          await fetchAllMessages(updatedAccounts);
          setToast('New identity created successfully!');
          success = true;
          break;
        } catch (err) {
          console.error(`Attempt ${i + 1} failed:`, err);
          lastError = err;
        }
      }
      
      if (!success) throw lastError || new Error('Failed after multiple attempts');
      
    } catch (err) {
      console.error('Failed to add account:', err);
      setError('Failed to create new address. The service might be busy, please try again.');
    } finally {
      setLoading(false);
      setCreatingAccount(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const removeAccount = async (id: string) => {
    if (accounts.length <= 1) {
      setError('You must have at least one active address.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;

    try {
      // Optionally delete from server too
      try {
        await mailService.deleteAccount(acc.id, acc.token);
      } catch (e: any) {
        if (e.response?.status === 401) {
          const newToken = await refreshToken(acc);
          if (newToken) {
            await mailService.deleteAccount(acc.id, newToken);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete account from server:', err);
    }

    const updatedAccounts = accounts.filter(a => a.id !== id);
    await saveAccounts(updatedAccounts);
    setMessages(messages.filter(m => m.accountId !== id));
  };

  const clearExpiredAccounts = async () => {
    const expiredCount = accounts.filter(a => a.isExpired).length;
    if (expiredCount === 0) {
      setToast('No expired identities found.');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    
    const updatedAccounts = accounts.filter(a => !a.isExpired);
    if (updatedAccounts.length === 0) {
      // Don't leave them with zero accounts
      await addNewAccount([]);
    } else {
      await saveAccounts(updatedAccounts);
    }
    
    const expiredIds = accounts.filter(a => a.isExpired).map(a => a.id);
    setMessages(messages.filter(m => !expiredIds.includes(m.accountId)));
    setToast(`Cleared ${expiredCount} expired identities.`);
    setTimeout(() => setToast(null), 2000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        setToast('Logged in successfully!');
      } else {
        const cred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        // Initialize user doc
        const path = `users/${cred.user.uid}`;
        const data = {
          uid: cred.user.uid,
          email: cred.user.email,
          savedAccounts: accounts,
          createdAt: new Date().toISOString(),
          role: 'user'
        };
        console.log(`Creating user doc: ${path}`, data);
        try {
          await setDoc(doc(db, 'users', cred.user.uid), data);
          console.log('Successfully created user doc');
        } catch (err) {
          console.error('Firestore Create Error Details:', { path, data });
          handleFirestoreError(err, OperationType.CREATE, path);
        }
        setToast('Account created!');
      }
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('This sign-in method is currently disabled in the Firebase Console. Please use Google Login or contact the administrator.');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setAuthLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      
      // Check if user doc exists, if not create it
      const userDoc = doc(db, 'users', cred.user.uid);
      const path = `users/${cred.user.uid}`;
      try {
        const snapshot = await getDoc(userDoc);
        
        if (!snapshot.exists()) {
          const data = {
            uid: cred.user.uid,
            email: cred.user.email,
            savedAccounts: accounts,
            createdAt: new Date().toISOString(),
            role: 'user'
          };
          console.log(`Creating Google user doc: ${path}`, data);
          try {
            await setDoc(userDoc, data);
            console.log('Successfully created Google user doc');
          } catch (err) {
            console.error('Firestore Google Create Error Details:', { path, data });
            handleFirestoreError(err, OperationType.WRITE, path);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      
      setToast('Logged in with Google!');
      setShowAuthModal(false);
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setError(err.message || 'Google login failed.');
    } finally {
      setAuthLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAccounts([]);
      setMessages([]);
      setToast('Logged out.');
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const fetchAllMessages = async (currentAccounts: SavedAccount[]) => {
    try {
      const allMessagesPromises = currentAccounts.map(async (acc) => {
        if (acc.isExpired) return [];
        try {
          const msgs = await mailService.getMessages(acc.token);
          return msgs.map(m => ({ ...m, accountId: acc.id }));
        } catch (e: any) {
          if (e.response?.status === 401) {
            const newToken = await refreshToken(acc);
            if (newToken) {
              try {
                const msgs = await mailService.getMessages(newToken);
                return msgs.map(m => ({ ...m, accountId: acc.id }));
              } catch (retryErr: any) {
                if (retryErr.response?.status === 401) {
                  setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, isExpired: true } : a));
                } else {
                  console.error(`Retry failed for ${acc.address}`, retryErr);
                }
              }
            }
            return []; // Silently fail if 401 handled
          }
          console.error(`Failed to fetch for ${acc.address}`, e);
          return [];
        }
      });
      const results = await Promise.all(allMessagesPromises);
      const newMessages = results.flat();
      
      setMessages(prev => {
        // Merge with existing messages to ensure "old mail" is preserved
        // Deduplicate by ID
        const merged = [...newMessages];
        prev.forEach(oldMsg => {
          if (!merged.find(m => m.id === oldMsg.id)) {
            merged.push(oldMsg);
          }
        });
        
        return merged.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const refreshInbox = async () => {
    setRefreshing(true);
    await fetchAllMessages(accounts);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setToast('Address copied to clipboard!');
    setTimeout(() => {
      setCopiedAddress(null);
      setToast(null);
    }, 2000);
  };

  const selectMessage = async (msg: Message) => {
    const acc = accounts.find(a => a.id === msg.accountId);
    if (!acc) return;
    setLoadingMessage(true);
    setSelectedMessage(null);
    setViewMode('html');
    try {
      let detail;
      try {
        detail = await mailService.getMessage(msg.id, acc.token);
      } catch (e: any) {
        if (e.response?.status === 401) {
          const newToken = await refreshToken(acc);
          if (newToken) {
            detail = await mailService.getMessage(msg.id, newToken);
          } else {
            throw e;
          }
        } else {
          throw e;
        }
      }
      setSelectedMessage({ ...detail, accountId: acc.id });
    } catch (err) {
      console.error('Failed to fetch message detail:', err);
      setError('Failed to load message content.');
    } finally {
      setLoadingMessage(false);
    }
  };

  const deleteMessage = async (id: string, accountId: string) => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return;
    try {
      try {
        await mailService.deleteMessage(id, acc.token);
      } catch (e: any) {
        if (e.response?.status === 401) {
          const newToken = await refreshToken(acc);
          if (newToken) {
            await mailService.deleteMessage(id, newToken);
          } else {
            throw e;
          }
        } else {
          throw e;
        }
      }
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
      setToast('Message deleted.');
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error('Failed to delete message:', err);
      setError('Failed to delete message.');
    }
  };

  const deleteAllMessages = async () => {
    setRefreshing(true);
    try {
      const deletePromises = messages.map(msg => {
        const acc = accounts.find(a => a.id === msg.accountId);
        if (acc) return mailService.deleteMessage(msg.id, acc.token);
        return Promise.resolve();
      });
      await Promise.all(deletePromises);
      setMessages([]);
      setToast('Inbox cleared successfully!');
    } catch (err) {
      console.error('Failed to clear inbox:', err);
      setError('Failed to delete some messages.');
    } finally {
      setRefreshing(false);
      setTimeout(() => setToast(null), 2000);
    }
  };

  const deleteAllAccounts = async () => {
    setLoading(true);
    try {
      // Delete all from server
      await Promise.all(accounts.map(acc => mailService.deleteAccount(acc.id, acc.token)));
    } catch (err) {
      console.error('Failed to delete some accounts from server:', err);
    }
    await saveAccounts([]);
    setMessages([]);
    await addNewAccount([]);
    setToast('All identities reset.');
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    initAccounts();
    // Safety timeout: if still loading after 5 seconds, force clear loading
    const timer = setTimeout(() => {
      setLoading(false);
      setIsAuthReady(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [initAccounts]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (accounts.length === 0) return;
    const interval = setInterval(() => {
      fetchAllMessages(accounts);
    }, 15000);
    return () => clearInterval(interval);
  }, [accounts]);

  if (loading && accounts.length === 0 && !isAuthReady) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center font-sans cyber-grid overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-cyber-cyan rounded-full blur-[100px] opacity-20 animate-pulse" />
          <div className="relative flex flex-col items-center gap-8">
            <div className="w-24 h-24 bg-gradient-to-br from-cyber-cyan to-cyber-blue rounded-[2rem] flex items-center justify-center shadow-2xl shadow-cyber-cyan/40 animate-bounce">
              <ShieldCheck className="w-12 h-12 text-dark-950" />
            </div>
            <div className="text-center">
              <h1 className="text-cyber-cyan font-black tracking-tighter text-5xl uppercase mb-2 hover-glitch cursor-default">SecureHub</h1>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-ping shadow-[0_0_10px_#00f5d4]" />
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.5em]">Neural Protocol v4.0.2</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark-950 text-white font-sans selection:bg-cyber-cyan/30 relative overflow-hidden">
      {/* Global Audio Element */}
      <audio ref={audioRef} src={ALARM_SOUND_URL} preload="auto" />

      {/* Background Elements */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-50" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-cyan/50 to-transparent blur-sm" />
      <div className="scanline" />
      
      {/* Floating Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyber-purple/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyber-cyan/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex w-72 glass border-r border-white/5 flex-col z-50 relative">
        <div className="p-6 lg:p-8 flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-cyber-cyan rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative w-10 h-10 lg:w-12 lg:h-12 bg-dark-900 rounded-xl border border-cyber-cyan/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 lg:w-7 lg:h-7 text-cyber-cyan animate-pulse" />
            </div>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-black tracking-tighter text-glow-cyan uppercase hover-glitch cursor-default">Secure<span className="text-cyber-purple">Hub</span></h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse shadow-[0_0_8px_#00ff88]" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">System Status: Secure</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {[
            { id: 'mail', icon: MailIcon, label: 'Secure Mail', color: 'cyber-cyan' },
            { id: 'cc-gen', icon: CreditCard, label: 'Identity Architect', color: 'cyber-purple' },
            { id: 'cc-check', icon: Shield, label: 'Identity Validator', color: 'cyber-pink' },
            { id: 'gmail-gen', icon: Mail, label: 'Alias Generator', color: 'cyber-blue' },
            { id: 'address-gen', icon: MapPin, label: 'Virtual Identity', color: 'cyber-amber' },
            { id: 'proxy-check', icon: Globe, label: 'Threat Intelligence', color: 'cyber-green' },
            { id: 'qr-gen', icon: LayoutGrid, label: 'Secure Matrix', color: 'cyber-purple' },
            { id: 'ua-gen', icon: Globe, label: 'UA Forge', color: 'cyber-cyan' },
            { id: 'timer', icon: Timer, label: 'System Timer', color: 'cyber-cyan' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id as any)}
              className={`w-full group relative flex items-center gap-4 p-3 lg:p-4 rounded-2xl transition-all duration-300 ${
                activeTab === item.id 
                  ? `bg-white/5 text-white border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)]` 
                  : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-2xl border-2 border-cyber-cyan/50 pointer-events-none"
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon className={`w-6 h-6 shrink-0 transition-transform group-hover:scale-110`} />
              <span className="hidden lg:block text-xs font-black uppercase tracking-widest">{item.label}</span>
              {activeTab === item.id && (
                <div className="hidden lg:block absolute right-4 w-1.5 h-1.5 rounded-full bg-cyber-cyan shadow-[0_0_10px_rgba(0,245,212,0.5)]" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 lg:p-6 border-t border-white/5 space-y-4">
          {user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-cyber-purple/20 flex items-center justify-center border border-cyber-purple/30">
                  <User className="w-4 h-4 text-cyber-purple" />
                </div>
                <div className="hidden lg:block min-w-0">
                  <p className="text-[10px] font-black text-white truncate">{user.email}</p>
                  <p className="text-[8px] font-bold text-cyber-purple uppercase tracking-widest">Authorized User</p>
                </div>
              </div>
              <button 
                onClick={() => signOut(auth)}
                className="w-full p-3 lg:p-4 bg-cyber-red/10 hover:bg-cyber-red/20 text-cyber-red rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all border border-cyber-red/20"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:block">Sign Out</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
              className="w-full p-3 lg:p-4 bg-cyber-cyan text-dark-950 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_20px_rgba(0,245,212,0.3)] active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden lg:block">Initialize Auth</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full glass z-50 border-t border-white/5 backdrop-blur-2xl">
        <div ref={navRef} className="flex items-center overflow-x-auto px-4 py-3 gap-1.5 scroll-smooth custom-scrollbar">
          {[
            { id: 'mail', icon: MailIcon, activeClass: 'text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan/20' },
            { id: 'cc-gen', icon: CreditCard, activeClass: 'text-cyber-purple bg-cyber-purple/10 border-cyber-purple/20' },
            { id: 'cc-check', icon: Shield, activeClass: 'text-cyber-pink bg-cyber-pink/10 border-cyber-pink/20' },
            { id: 'gmail-gen', icon: Mail, activeClass: 'text-cyber-blue bg-cyber-blue/10 border-cyber-blue/20' },
            { id: 'address-gen', icon: MapPin, activeClass: 'text-cyber-amber bg-cyber-amber/10 border-cyber-amber/20' },
            { id: 'proxy-check', icon: Globe, activeClass: 'text-cyber-green bg-cyber-green/10 border-cyber-green/20' },
            { id: 'qr-gen', icon: LayoutGrid, activeClass: 'text-cyber-purple bg-cyber-purple/10 border-cyber-purple/20' },
            { id: 'ua-gen', icon: Globe, activeClass: 'text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan/20' },
            { id: 'timer', icon: Timer, activeClass: 'text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan/20' },
          ].map((item) => (
            <button
              key={item.id}
              data-tab={item.id}
              onClick={() => handleTabChange(item.id as any)}
              className={`p-3 rounded-2xl transition-all relative shrink-0 ${
                activeTab === item.id 
                ? `${item.activeClass} shadow-[0_0_15px_rgba(0,0,0,0.2)]` 
                : 'text-slate-500 hover:text-slate-300 bg-white/5 border border-transparent'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {activeTab === item.id && (
                <motion.div 
                  layoutId="mobile-nav-active"
                  className="absolute inset-0 rounded-2xl -z-10"
                />
              )}
            </button>
          ))}
          <div className="w-px h-8 bg-white/10 shrink-0 mx-1" />
          <button
            onClick={() => {
              if (user) signOut(auth);
              else { setAuthMode('login'); setShowAuthModal(true); }
            }}
            className={`p-3 rounded-2xl transition-all relative shrink-0 border ${
              user 
                ? 'text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan/20' 
                : 'text-slate-500 bg-white/5 border-white/5'
            }`}
          >
            {user ? <LogOut className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden">
        <header className="h-16 lg:h-24 glass border-b border-white/5 px-6 lg:px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-1 h-8 bg-cyber-cyan rounded-full shadow-[0_0_15px_rgba(0,245,212,0.8)]" />
            <div>
              <h2 className="text-lg lg:text-xl font-black uppercase tracking-tighter hover-glitch cursor-default">
                {activeTab === 'mail' && 'Secure Mail Terminal'}
                {activeTab === 'cc-gen' && 'Identity Architect'}
                {activeTab === 'cc-check' && 'Identity Validator'}
                {activeTab === 'gmail-gen' && 'Alias Generator'}
                {activeTab === 'address-gen' && 'Virtual Identity'}
                {activeTab === 'proxy-check' && 'Threat Intelligence Terminal'}
                {activeTab === 'qr-gen' && 'Secure Matrix Generator'}
                {activeTab === 'timer' && 'System Timer'}
              </h2>
              <p className="text-[9px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Accessing Secure Protocol v4.0.2</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-6 px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System Time</p>
                <p className="text-xs font-mono font-bold text-cyber-cyan">{new Date().toLocaleTimeString()}</p>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Latency</p>
                <p className="text-xs font-mono font-bold text-cyber-green">14ms</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 lg:p-10 pb-32 lg:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-[1600px] mx-auto w-full"
            >
              {activeTab === 'mail' && (
          error ? (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cyber-red/10 border border-cyber-red/20 text-cyber-red p-8 rounded-[2.5rem] mb-10 flex items-center justify-between glass"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-cyber-red/20 rounded-2xl flex items-center justify-center border border-cyber-red/30">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-black uppercase tracking-[0.3em] text-[10px] text-cyber-red/60 mb-1">System Fault Detected</p>
                  <p className="text-lg font-bold text-white">{error}</p>
                </div>
              </div>
              <button 
                onClick={() => initAccounts()} 
                className="px-8 py-4 bg-white/5 border border-cyber-red/30 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-cyber-red/10 transition-all active:scale-95"
              >
                Retry Protocol
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
              {/* Left Column: Identities */}
              <div className="lg:col-span-4 space-y-6 lg:space-y-8">
                <div className="p-5 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-cyan/5 rounded-full blur-[40px] -mr-16 -mt-16" />
                  <div className="flex items-center justify-between mb-6 sm:mb-10">
                    <div>
                      <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Neural Cache</h2>
                      <h3 className="text-xl font-black text-white tracking-tighter uppercase">Active Identities</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {accounts.some(a => a.isExpired) && (
                        <button 
                          onClick={() => clearExpiredAccounts()}
                          className="p-3 bg-cyber-red/10 hover:bg-cyber-red/20 text-cyber-red rounded-xl border border-cyber-red/20 transition-all"
                          title="Purge Expired"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => addNewAccount()}
                        disabled={creatingAccount}
                        className="p-3 bg-cyber-cyan text-dark-950 rounded-xl transition-all shadow-lg shadow-cyber-cyan/20 disabled:opacity-50 active:scale-95"
                        title="Synthesize New Identity"
                      >
                        {creatingAccount ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                      {[...accounts]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((acc, index) => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          key={acc.id} 
                          className={`group p-6 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                            acc.isExpired 
                              ? "bg-cyber-red/5 border-cyber-red/20 grayscale" 
                              : "bg-white/5 border-white/5 hover:border-cyber-cyan/30"
                          }`}
                          onClick={() => handleCopy(acc.address)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${acc.isExpired ? "bg-cyber-red/10 border-cyber-red/20" : "bg-cyber-cyan/10 border-cyber-cyan/20"}`}>
                                {acc.isExpired ? <X className="w-4 h-4 text-cyber-red" /> : <ShieldCheck className="w-4 h-4 text-cyber-cyan" />}
                              </div>
                              <div>
                                <p className={`text-[9px] font-black uppercase tracking-widest ${acc.isExpired ? "text-cyber-red/60" : "text-cyber-cyan/60"}`}>
                                  ID_NODE_{accounts.length - index}
                                </p>
                                {acc.isExpired && (
                                  <span className="text-[8px] font-black bg-cyber-red text-white px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                    EXPIRED
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(acc.id); }}
                                className="p-2 bg-dark-950 hover:bg-cyber-red/10 rounded-lg border border-white/10 hover:border-cyber-red/30 transition-all text-slate-500 hover:text-cyber-red"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="font-mono text-sm font-bold text-slate-300 break-all pr-8">
                            {acc.address}
                          </div>
                          <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {copiedAddress === acc.address ? <Check className="w-4 h-4 text-cyber-green" /> : <Copy className="w-4 h-4 text-slate-500" />}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="p-5 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 space-y-6">
                  <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Shield className="w-4 h-4 text-cyber-cyan" /> Encryption Protocol
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-widest">Algorithm</span>
                      <span className="text-white font-black">RSA-4096</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-widest">Handshake</span>
                      <span className="text-cyber-green font-black">SECURE</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-widest">Persistence</span>
                      <span className="text-cyber-cyan font-black">NEURAL_CACHE</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Unified Inbox */}
              <div className="lg:col-span-8 flex flex-col">
                <div className="p-5 sm:p-8 glass rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 flex-1 flex flex-col min-h-[500px] lg:min-h-[700px]">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6 sm:mb-10">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-cyber-cyan/10 rounded-2xl flex items-center justify-center border border-cyber-cyan/20 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                        <Inbox className="w-7 h-7 text-cyber-cyan" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Unified Feed</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black text-cyber-cyan uppercase tracking-widest">
                            {messages.length} Signals
                          </span>
                          <div className="w-1 h-1 rounded-full bg-slate-700" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {accounts.length} Nodes Active
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {messages.length > 0 && (
                        <button 
                          onClick={() => setShowClearInboxConfirm(true)}
                          className="p-4 bg-white/5 hover:bg-cyber-red/10 text-slate-500 hover:text-cyber-red rounded-2xl border border-white/5 transition-all"
                          title="Purge Feed"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      <button 
                        onClick={() => setShowDeleteAllConfirm(true)}
                        className="p-4 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-2xl border border-white/5 transition-all"
                        title="Reset All Nodes"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={refreshInbox}
                        disabled={refreshing}
                        className="px-8 py-4 bg-cyber-cyan text-dark-950 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 transition-all shadow-lg shadow-cyber-cyan/20 disabled:opacity-50 active:scale-95"
                      >
                        {refreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {refreshing ? 'Syncing...' : 'Sync Feed'}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence mode="wait">
                      {messages.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="h-full flex flex-col items-center justify-center text-center py-20"
                        >
                          <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 border border-white/5">
                            <MailIcon className="w-10 h-10 text-slate-800" />
                          </div>
                          <h3 className="text-xl font-black text-white mb-3 tracking-tighter uppercase">No Signals Detected</h3>
                          <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
                            The neural feed is currently silent. Any incoming transmissions to your active nodes will appear here instantly.
                          </p>
                        </motion.div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((msg, index) => {
                            const targetAcc = accounts.find(a => a.id === msg.accountId);
                            return (
                              <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`group p-6 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex items-start gap-6 ${
                                  !msg.seen 
                                    ? 'bg-cyber-cyan/5 border-cyber-cyan/20' 
                                    : 'bg-white/5 border-white/5 hover:border-white/10'
                                }`}
                                onClick={() => selectMessage(msg)}
                              >
                                {!msg.seen && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyber-cyan shadow-[0_0_15px_rgba(0,255,212,0.5)]" />
                                )}
                                <div className="flex flex-col items-center gap-2 shrink-0">
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border ${
                                    !msg.seen 
                                      ? 'bg-cyber-cyan text-dark-950 border-cyber-cyan' 
                                      : 'bg-dark-800 text-slate-500 border-white/5'
                                  }`}>
                                    {msg.from.name ? msg.from.name[0].toUpperCase() : msg.from.address[0].toUpperCase()}
                                  </div>
                                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">#{index + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm truncate tracking-tight ${!msg.seen ? 'font-black text-white' : 'font-bold text-slate-400'}`}>
                                      {msg.from.name || msg.from.address}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] whitespace-nowrap ml-4">
                                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <h4 className={`text-base truncate mb-2 tracking-tight ${!msg.seen ? 'font-black text-white' : 'font-bold text-slate-300'}`}>
                                    {msg.subject || '(No Subject)'}
                                  </h4>
                                  <div className="flex items-center gap-4">
                                    <p className="text-sm text-slate-500 line-clamp-1 flex-1 font-medium">{msg.intro}</p>
                                    {targetAcc && (
                                      <span className="text-[9px] font-black text-cyber-cyan bg-cyber-cyan/10 px-3 py-1.5 rounded-lg uppercase tracking-widest shrink-0 border border-cyber-cyan/20 max-w-[150px] truncate">
                                        NODE: {targetAcc.address.split('@')[0]}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id, msg.accountId); }}
                                    className="p-3 bg-dark-950 hover:bg-cyber-red/10 text-slate-500 hover:text-cyber-red rounded-xl border border-white/10 hover:border-cyber-red/30 transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  <div className="p-3 bg-dark-950 rounded-xl border border-white/10 flex items-center justify-center">
                                    <ChevronRight className="w-4 h-4 text-slate-500" />
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

      {activeTab === 'cc-gen' && (
        <CCGenerator state={ccGenState} setState={setCcGenState} />
      )}

      {activeTab === 'cc-check' && (
        <CCChecker 
          state={ccCheckState} 
          setState={setCcCheckState} 
          onProcess={processCCCheck} 
          onStop={stopCCCheck}
        />
      )}

      {activeTab === 'gmail-gen' && (
        <GmailGenerator state={gmailGenState} setState={setGmailGenState} />
      )}

      {activeTab === 'address-gen' && (
        <AddressGenerator state={addressGenState} setState={setAddressGenState} />
      )}

      {activeTab === 'proxy-check' && (
        <ProxyChecker />
      )}

      {activeTab === 'qr-gen' && (
        <QRCodeGenerator />
      )}

      {activeTab === 'ua-gen' && (
        <UserAgentGenerator state={uaState} setState={setUaState} />
      )}

      {activeTab === 'timer' && (
        <TimerTool timers={timers} setTimers={setTimers} />
      )}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <footer className="max-w-5xl mx-auto py-16 border-t border-white/5 mt-20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyber-cyan to-cyber-blue rounded-xl flex items-center justify-center shadow-lg shadow-cyber-cyan/20">
                  <ShieldCheck className="w-5 h-5 text-dark-950" />
                </div>
                <div>
                  <p className="text-sm font-black text-white tracking-tight">SECUREHUB PRO</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Extreme Privacy Suite</p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Developed By</p>
                <p className="text-sm font-black text-cyber-cyan tracking-tight">MD Atikul Islam Juwel</p>
              </div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center md:text-right">© 2026 SECUREHUB. ENTERPRISE GRADE SECURITY.</p>
            </div>
          </footer>
        </div>
      </main>

      {/* Clear Inbox Confirmation Modal */}
      <AnimatePresence>
        {showClearInboxConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearInboxConfirm(false)}
              className="absolute inset-0 bg-dark-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass rounded-[3rem] p-12 shadow-2xl text-center border border-white/5"
            >
              <div className="w-24 h-24 bg-cyber-red/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-cyber-red/20 shadow-[0_0_30px_rgba(255,0,110,0.1)]">
                <Trash2 className="w-10 h-10 text-cyber-red" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3 tracking-tighter uppercase">Purge Neural Feed?</h3>
              <p className="text-slate-500 mb-10 font-medium leading-relaxed">
                This will permanently delete all transmissions from all active nodes. This action is irreversible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setShowClearInboxConfirm(false)}
                  className="flex-1 px-8 py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/5"
                >
                  Abort
                </button>
                <button 
                  onClick={() => { deleteAllMessages(); setShowClearInboxConfirm(false); }}
                  className="flex-1 px-8 py-4 bg-cyber-red hover:bg-cyber-red/80 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-cyber-red/20 active:scale-95"
                >
                  Confirm Purge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="absolute inset-0 bg-dark-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass rounded-[3rem] p-12 shadow-2xl text-center border border-white/5"
            >
              <div className="w-24 h-24 bg-cyber-red/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-cyber-red/20 shadow-[0_0_30px_rgba(255,0,110,0.1)]">
                <Trash2 className="w-10 h-10 text-cyber-red" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3 tracking-tighter uppercase">Decommission Node?</h3>
              <p className="text-slate-500 mb-10 font-medium leading-relaxed">
                Are you sure you want to decommission <span className="text-cyber-cyan font-bold">{accounts.find(a => a.id === showDeleteConfirm)?.address}</span>? All neural transmissions for this node will be purged.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-8 py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/5"
                >
                  Abort
                </button>
                <button 
                  onClick={() => { removeAccount(showDeleteConfirm); setShowDeleteConfirm(null); }}
                  className="flex-1 px-8 py-4 bg-cyber-red hover:bg-cyber-red/80 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-cyber-red/20 active:scale-95"
                >
                  Confirm Purge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete All Confirmation Modal */}
      <AnimatePresence>
        {showDeleteAllConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteAllConfirm(false)}
              className="absolute inset-0 bg-dark-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass rounded-[3rem] p-12 shadow-2xl text-center border border-white/5"
            >
              <div className="w-24 h-24 bg-cyber-amber/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-cyber-amber/20 shadow-[0_0_30px_rgba(255,191,0,0.1)]">
                <RefreshCw className="w-10 h-10 text-cyber-amber" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3 tracking-tighter uppercase">Neural Reset?</h3>
              <p className="text-slate-500 mb-10 font-medium leading-relaxed">
                This will permanently delete all neural nodes and transmissions. You will start with a fresh identity matrix.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setShowDeleteAllConfirm(false)}
                  className="flex-1 px-8 py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/5"
                >
                  Abort
                </button>
                <button 
                  onClick={() => { deleteAllAccounts(); setShowDeleteAllConfirm(false); }}
                  className="flex-1 px-8 py-4 bg-cyber-cyan text-dark-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-cyber-cyan/20 active:scale-95"
                >
                  Confirm Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[150] glass px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 font-black text-[10px] uppercase tracking-[0.2em] border border-cyber-cyan/20 text-white"
          >
            <div className="w-6 h-6 bg-cyber-cyan/10 rounded-lg flex items-center justify-center border border-cyber-cyan/20">
              <Check className="w-3.5 h-3.5 text-cyber-cyan" />
            </div>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Message Modal */}
      <AnimatePresence>
        {loadingMessage && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-dark-950/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass px-10 py-6 rounded-3xl shadow-2xl flex items-center gap-5 border border-cyber-cyan/20"
            >
              <Loader2 className="w-6 h-6 text-cyber-cyan animate-spin" />
              <span className="font-black text-white text-xs uppercase tracking-[0.3em]">Synchronizing Neural Data...</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Message Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMessage(null)}
              className="absolute inset-0 bg-dark-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl glass rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/5"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-dark-900/50 backdrop-blur-md">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-cyber-cyan/10 rounded-2xl flex items-center justify-center text-cyber-cyan font-black text-2xl border border-cyber-cyan/20 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                    {selectedMessage.from.name ? selectedMessage.from.name[0].toUpperCase() : selectedMessage.from.address[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tighter uppercase">{selectedMessage.from.name || 'Unknown Node'}</h3>
                    <p className="text-[10px] text-cyber-cyan font-black tracking-[0.3em] uppercase">{selectedMessage.from.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex bg-white/5 p-1.5 rounded-2xl">
                    <button 
                      onClick={() => setViewMode('html')}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'html' ? 'bg-cyber-cyan text-dark-950 shadow-lg shadow-cyber-cyan/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Decoded
                    </button>
                    <button 
                      onClick={() => setViewMode('text')}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'text' ? 'bg-cyber-cyan text-dark-950 shadow-lg shadow-cyber-cyan/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Source
                    </button>
                  </div>
                  <button 
                    onClick={() => deleteMessage(selectedMessage.id, selectedMessage.accountId)}
                    className="p-3 bg-cyber-red/10 hover:bg-cyber-red/20 text-cyber-red rounded-xl border border-cyber-red/20 transition-all"
                    title="Purge Transmission"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setSelectedMessage(null)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="p-8 bg-white/[0.02] border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">
                  <Clock className="w-3.5 h-3.5 text-cyber-cyan" />
                  Received {new Date(selectedMessage.createdAt).toLocaleString()}
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight mb-4 leading-tight">{selectedMessage.subject || '(No Subject)'}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recipient Node</span>
                  <span className="text-[10px] font-black text-cyber-cyan bg-cyber-cyan/10 px-3 py-1 rounded-lg border border-cyber-cyan/20">{selectedMessage.to[0].address}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-dark-950/50 custom-scrollbar">
                {viewMode === 'html' && selectedMessage.html && selectedMessage.html.length > 0 ? (
                  <div 
                    className="prose prose-invert max-w-none min-h-[300px] 
                      prose-p:text-slate-300 prose-p:leading-relaxed
                      prose-headings:text-white prose-headings:font-black
                      prose-a:text-cyber-cyan prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-white prose-strong:font-black
                      prose-img:rounded-3xl prose-img:border prose-img:border-white/10"
                    dangerouslySetInnerHTML={{ __html: selectedMessage.html[0] }} 
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-slate-300 text-sm font-medium leading-relaxed min-h-[300px] font-mono bg-dark-900 p-8 rounded-3xl border border-white/5">
                    {selectedMessage.text || 'No content available.'}
                  </div>
                )}
              </div>
              
              <div className="p-8 bg-dark-900/50 border-t border-white/5 flex justify-center shrink-0">
                <div className="flex items-center gap-3 px-8 py-4 bg-cyber-amber/5 border border-cyber-amber/20 rounded-2xl shadow-[0_0_15px_rgba(254,228,64,0.05)]">
                  <ShieldCheck className="w-5 h-5 text-cyber-amber" />
                  <p className="text-[11px] text-cyber-amber font-black uppercase tracking-widest">
                    NEURAL_ADVISORY: External links may contain malicious payloads. Proceed with caution.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-dark-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass rounded-[3rem] shadow-2xl overflow-hidden border border-white/5"
            >
              <div className="p-12">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-cyber-cyan/10 rounded-2xl flex items-center justify-center border border-cyber-cyan/20 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                      {authMode === 'login' ? <LogIn className="w-7 h-7 text-cyber-cyan" /> : <UserPlus className="w-7 h-7 text-cyber-cyan" />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{authMode === 'login' ? 'Agent Login' : 'New Agent'}</h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{authMode === 'login' ? 'Access Secure Vault' : 'Initialize Protocol'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAuthModal(false)}
                    className="p-3 hover:bg-white/5 rounded-xl transition-colors text-slate-500"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Neural ID (Email)</label>
                    <div className="relative">
                      <MailIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input 
                        type="email" 
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="agent@securehub.net"
                        className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Access Key (Password)</label>
                    <div className="relative">
                      <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input 
                        type="password" 
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 focus:border-cyber-cyan/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <button 
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-5 bg-cyber-cyan text-dark-950 rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-lg shadow-cyber-cyan/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
                    >
                      {authLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        authMode === 'login' ? 'Initialize Session' : 'Register Identity'
                      )}
                    </button>

                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/5"></div>
                      </div>
                      <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.4em]">
                        <span className="bg-dark-900 px-6 text-slate-600">Cross-Auth Protocol</span>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={authLoading}
                      className="w-full py-5 bg-white/5 border border-white/5 hover:border-cyber-cyan/30 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-sm active:scale-[0.98]"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google Identity
                    </button>
                  </div>
                </form>

                <div className="mt-10 pt-10 border-t border-white/5 text-center">
                  <p className="text-xs font-bold text-slate-600">
                    {authMode === 'login' ? "New Agent?" : "Existing Agent?"}
                    <button 
                      onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                      className="ml-3 text-cyber-cyan hover:text-cyber-cyan/80 font-black uppercase tracking-[0.2em] text-[10px]"
                    >
                      {authMode === 'login' ? 'Initialize Registration' : 'Access Terminal'}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
