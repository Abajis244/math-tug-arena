import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Trophy, Users, User, Settings, Zap, BarChart2, CheckCircle2, XCircle, 
  ArrowLeft, ChevronRight, RefreshCw, Award, Clock, Flame, Shield, 
  Target, Activity, BrainCircuit, TrendingUp, AlertTriangle, MonitorPlay,
  AlertCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, collection, 
  query, orderBy, limit, serverTimestamp, increment, runTransaction
} from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

// --- Global Styles ---
const STYLES = `
  @keyframes shake {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    25% { transform: translate(4px, 4px) rotate(1deg); }
    50% { transform: translate(-4px, -2px) rotate(-1deg); }
    75% { transform: translate(-4px, 4px) rotate(1deg); }
  }
  .animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
  
  @keyframes severe-shake {
    0%, 100% { transform: translate(0, 0) rotate(0deg); filter: blur(0px); }
    25% { transform: translate(8px, 8px) rotate(2deg); filter: blur(1px); }
    50% { transform: translate(-8px, -4px) rotate(-2deg); }
    75% { transform: translate(-8px, 8px) rotate(2deg); filter: blur(1px); }
  }
  .animate-severe-shake { animation: severe-shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }

  @keyframes ripple {
    0% { transform: scale(0.2); opacity: 1; border-width: 20px; }
    100% { transform: scale(3); opacity: 0; border-width: 0px; }
  }
  .animate-ripple { animation: ripple 0.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }

  @keyframes float-up {
    0% { transform: translateY(0) scale(0.8); opacity: 1; }
    100% { transform: translateY(-60px) scale(1.2); opacity: 0; }
  }
  .animate-float { animation: float-up 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }

  @keyframes dust-kick {
    0% { transform: translate(0, 0) scale(1); opacity: 0.8; }
    100% { transform: translate(var(--tx), -20px) scale(2); opacity: 0; }
  }
  .animate-dust { animation: dust-kick 0.5s ease-out forwards; }

  @keyframes cinematic-zoom {
    0% { transform: scale(1.1) translateY(20px); opacity: 0; filter: blur(10px); }
    100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0px); }
  }
  .animate-cinematic { animation: cinematic-zoom 1.5s cubic-bezier(0.1, 0.8, 0.2, 1) forwards; }

  @keyframes breathe {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(1.03); }
  }
  .animate-breathe { animation: breathe 3s ease-in-out infinite; transform-origin: bottom; }

  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
`;

// --- Safe Firebase Configuration ---
const getFirebaseConfig = () => {
  if (process.env.REACT_APP_FIREBASE_CONFIG) {
    try {
      return JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);
    } catch (e) { console.error(e); }
  }
  return { apiKey: "DEMO_KEY", projectId: "demo-project" };
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = process.env.REACT_APP_APP_ID || 'math-tug-arena-v7';

// --- Constants & Config ---
const WIN_THRESHOLD = 150; 

const AI_NAMES = [
  { name: 'Neural Titan v4', streak: 12, rank: 'Diamond', aggro: 1.4, def: 0.7 },
  { name: 'Calc-Bot 9000', streak: 5, rank: 'Platinum', aggro: 1.0, def: 1.0 },
  { name: 'Quantum Phantom', streak: 8, rank: 'Gold', aggro: 0.8, def: 1.3 },
  { name: 'Cyber-Archimedes', streak: 3, rank: 'Silver', aggro: 0.9, def: 0.9 }
];

const RANKS = [
  { name: 'Bronze', minXP: 0, color: 'text-amber-600', bg: 'bg-amber-600/20' },
  { name: 'Silver', minXP: 500, color: 'text-slate-300', bg: 'bg-slate-300/20' },
  { name: 'Gold', minXP: 1500, color: 'text-yellow-400', bg: 'bg-yellow-400/20' },
  { name: 'Platinum', minXP: 3000, color: 'text-cyan-400', bg: 'bg-cyan-400/20' },
  { name: 'Diamond', minXP: 5000, color: 'text-purple-400', bg: 'bg-purple-400/20' },
  { name: 'Apex', minXP: 10000, color: 'text-rose-500', bg: 'bg-rose-500/20' }
];

const OPERATIONS = {
  ADDITION: { label: 'Addition', icon: '+', color: 'blue' },
  SUBTRACTION: { label: 'Subtraction', icon: '-', color: 'red' },
  MULTIPLICATION: { label: 'Multiplication', icon: '×', color: 'green' },
  DIVISION: { label: 'Division', icon: '÷', color: 'yellow' },
  NEGATIVES: { label: 'Negatives', icon: '-x', color: 'rose' },
  DECIMALS: { label: 'Decimals', icon: '0.1', color: 'teal' },
  ALGEBRA: { label: 'Basic Algebra', icon: 'x=', color: 'indigo' },
  MIXED: { label: 'All Mixed', icon: '∞', color: 'purple' }
};

const DIFFICULTY_PRESETS = {
  BEGINNER: { range: [1, 12], time: 15, aiSolveTime: [4000, 8000], aiAccuracy: 0.6 },
  INTERMEDIATE: { range: [10, 50], time: 12, aiSolveTime: [2500, 5500], aiAccuracy: 0.75 },
  ADVANCED: { range: [20, 100], time: 8, aiSolveTime: [1500, 4000], aiAccuracy: 0.85 },
  SPEED: { range: [1, 20], time: 4, aiSolveTime: [1000, 2500], aiAccuracy: 0.90 }
};

const DIFFICULTY_MULTIPLIERS = {
  BEGINNER: 1.0,
  INTERMEDIATE: 1.2,
  ADVANCED: 1.5,
  SPEED: 1.8
};

const generateProblem = (opType, difficulty) => {
  const { range } = DIFFICULTY_PRESETS[difficulty];
  let a, b, x, ans;
  let operator = '';
  let questionStr = '';

  let activeOp = opType;
  if (opType === 'MIXED') {
    const types = ['ADDITION', 'SUBTRACTION', 'MULTIPLICATION', 'DIVISION', 'NEGATIVES', 'ALGEBRA'];
    activeOp = types[Math.floor(Math.random() * types.length)];
  }

  // Helper for inclusive random bounds
  const getRandomInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  switch (activeOp) {
    case 'ADDITION':
      a = getRandomInRange(range[0], range[1]);
      b = getRandomInRange(range[0], range[1]);
      ans = a + b; questionStr = `${a} + ${b}`; break;
    case 'SUBTRACTION':
      a = getRandomInRange(range[0], range[1]);
      b = getRandomInRange(range[0], range[1]);
      if (a < b) [a, b] = [b, a];
      ans = a - b; questionStr = `${a} - ${b}`; break;
    case 'MULTIPLICATION':
      a = getRandomInRange(2, range[1] > 20 ? 15 : range[1]);
      b = getRandomInRange(2, 12);
      ans = a * b; questionStr = `${a} × ${b}`; break;
    case 'DIVISION':
      b = getRandomInRange(2, 10);
      ans = getRandomInRange(2, 12);
      a = ans * b; questionStr = `${a} ÷ ${b}`; break;
    case 'NEGATIVES':
      a = getRandomInRange(-10, 10);
      b = getRandomInRange(5, 25);
      operator = Math.random() > 0.5 ? '+' : '-';
      ans = operator === '+' ? a + b : a - b; questionStr = `${a} ${operator} ${b}`; break;
    case 'DECIMALS':
      a = (Math.random() * 10).toFixed(1); b = (Math.random() * 10).toFixed(1);
      operator = Math.random() > 0.5 ? '+' : '-';
      ans = operator === '+' ? (parseFloat(a) + parseFloat(b)).toFixed(1) : (parseFloat(a) - parseFloat(b)).toFixed(1);
      questionStr = `${a} ${operator} ${b}`; break;
    case 'ALGEBRA':
      x = getRandomInRange(1, 12); a = getRandomInRange(1, 10);
      operator = Math.random() > 0.5 ? '+' : '-';
      b = operator === '+' ? x + a : x - a; questionStr = `x ${operator} ${a} = ${b}`; ans = x; break;
    default:
      a = getRandomInRange(0, 10); b = getRandomInRange(0, 10);
      ans = a + b; questionStr = `${a} + ${b}`;
  }
  return { question: questionStr, answer: ans.toString(), type: activeOp, timestamp: Date.now() };
};

const getRank = (xp) => [...RANKS].reverse().find(r => xp >= r.minXP) || RANKS[0];

// Safe UUID generation for Sandbox environments
const getSafeID = () => Math.random().toString(36).substring(2, 10);

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('MAIN_MENU');
  const [gameMode, setGameMode] = useState(null);
  const [config, setConfig] = useState({ operation: 'MIXED', difficulty: 'INTERMEDIATE' });
  const [stats, setStats] = useState({ xp: 0, totalGames: 0, wins: 0, analytics: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const initAuth = async () => {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.error("Firebase Auth Error:", e);
    }
  };
  initAuth();
  const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  return () => unsubscribe();
}, []);

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) setStats(snap.data());
      else {
        const initialStats = { xp: 0, totalGames: 0, wins: 0, analytics: {} };
        setDoc(docRef, initialStats); setStats(initialStats);
      }
    });
    return () => unsub();
  }, [user]);

  // Use a transaction to safely handle concurrent analytic/XP updates
  const processMatchData = async (matchData, userQuestions) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    
    try {
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);
        const currentStats = snap.exists() ? snap.data() : { xp: 0, totalGames: 0, wins: 0, analytics: {} };
        
        currentStats.totalGames += 1;
        if (matchData.won) {
          currentStats.wins += 1;
          const multiplier = DIFFICULTY_MULTIPLIERS[config.difficulty] || 1;
          currentStats.xp += Math.floor(100 * multiplier);
        } else {
          currentStats.xp = Math.max(0, currentStats.xp - 15);
        }

        userQuestions.forEach(q => {
          if (!currentStats.analytics) currentStats.analytics = {};
          if (!currentStats.analytics[q.type]) currentStats.analytics[q.type] = { attempts: 0, correct: 0, totalTime: 0 };
          const typeStat = currentStats.analytics[q.type];
          
          typeStat.attempts += 1;
          if (q.isCorrect) typeStat.correct += 1;
          typeStat.totalTime += q.timeTaken;
        });

        transaction.set(docRef, currentStats);
      });
    } catch (e) { 
      console.error("Failed to process match data:", e); 
    }
  };

  const currentRank = useMemo(() => getRank(stats.xp), [stats.xp]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center">
      <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-rose-900/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full h-full min-h-screen flex flex-col mx-auto max-w-6xl">
        <header className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl shadow-lg border border-blue-400/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">MATH TUG ARENA</h1>
              <div className="flex items-center gap-3 text-xs font-bold mt-1">
                <span className={`px-2 py-0.5 rounded-md border border-white/10 ${currentRank.bg} ${currentRank.color}`}>{currentRank.name}</span>
                <span className="text-slate-500 font-mono">{Math.floor(stats.xp)} MMR</span>
              </div>
            </div>
          </div>
          {view !== 'MAIN_MENU' && view !== 'GAME' && (
             <button onClick={() => setView('MAIN_MENU')} className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all border border-white/5" aria-label="Go Back">
               <ArrowLeft size={20} className="text-slate-300" />
             </button>
          )}
        </header>

        <main className="flex-1 flex flex-col relative px-4 sm:px-6 pb-8 overflow-y-auto custom-scrollbar">
          {view === 'MAIN_MENU' && (
            <MainMenu 
              onPlaySingle={() => { setGameMode('SINGLE'); setView('SETTINGS'); }} 
              onPlayLocal={() => { setGameMode('LOCAL'); setView('SETTINGS'); }}
              onPlayMulti={() => { setGameMode('MULTI'); setView('LOBBY'); }} 
              onViewStats={() => setView('ANALYTICS')} 
            />
          )}
          {view === 'SETTINGS' && <SettingsPanel config={config} setConfig={setConfig} onStart={() => setView('GAME')} />}
          {view === 'LOBBY' && <MultiplayerLobby user={user} appId={appId} db={db} onMatchReady={(matchData) => { setConfig(matchData.config); setGameMode('MULTI'); setView('GAME'); sessionStorage.setItem('currentMatchId', matchData.matchId); sessionStorage.setItem('playerSide', matchData.side); }} />}
          {view === 'GAME' && <MatchArena mode={gameMode} config={config} user={user} db={db} appId={appId} onMatchEnd={(matchData, userQuestions) => { if(gameMode !== 'LOCAL') processMatchData(matchData, userQuestions); sessionStorage.setItem('lastMatchData', JSON.stringify(matchData)); setView('RESULTS'); }} onExit={() => setView('MAIN_MENU')} />}
          {view === 'RESULTS' && <ResultsScreen onBack={() => setView('MAIN_MENU')} />}
          {view === 'ANALYTICS' && <AnalyticsDashboard stats={stats} />}
        </main>
      </div>
    </div>
  );
}

// --- Menu Components ---
function MainMenu({ onPlaySingle, onPlayMulti, onPlayLocal, onViewStats }) {
  return (
    <div className="flex-1 flex flex-col justify-center items-center text-center animate-in fade-in zoom-in-95 duration-700">
      <h2 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">DOMINATE THE ROPE.</h2>
      <p className="text-slate-400 text-lg md:text-xl max-w-2xl font-medium mb-16">High-stakes computational combat. Improve automaticity. Rank up.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        <MenuCard title="Training AI" desc="Adaptive opponents" icon={<BrainCircuit size={40} />} gradient="from-blue-600/20 to-indigo-900/40" border="border-blue-500/30" accentClass="hover:shadow-blue-500/20" onClick={onPlaySingle} />
        <MenuCard title="Local Duel" desc="Same screen 1v1" icon={<MonitorPlay size={40} />} gradient="from-orange-600/20 to-amber-900/40" border="border-orange-500/30" accentClass="hover:shadow-orange-500/20" onClick={onPlayLocal} />
        <MenuCard title="Ranked PVP" desc="Synchronized duels" icon={<Shield size={40} />} gradient="from-rose-600/20 to-orange-900/40" border="border-rose-500/30" accentClass="hover:shadow-rose-500/20" onClick={onPlayMulti} badge="LIVE" />
        <MenuCard title="Analytics" desc="Performance insights" icon={<TrendingUp size={40} />} gradient="from-emerald-600/20 to-teal-900/40" border="border-emerald-500/30" accentClass="hover:shadow-emerald-500/20" onClick={onViewStats} />
      </div>
    </div>
  );
}

function MenuCard({ title, desc, icon, gradient, border, accentClass, onClick, badge }) {
  return (
    <button onClick={onClick} className={`relative p-8 rounded-[2rem] border ${border} bg-gradient-to-br ${gradient} hover:-translate-y-2 hover:shadow-2xl ${accentClass} transition-all duration-300 text-left group overflow-hidden`}>
      {badge && <span className="absolute top-6 right-6 px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-full animate-pulse">{badge}</span>}
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 text-white mb-6 group-hover:scale-110 transition-transform duration-500">{icon}</div>
      <h3 className="text-2xl font-black text-white mb-2">{title}</h3>
      <p className="text-slate-400 font-medium">{desc}</p>
    </button>
  );
}

function SettingsPanel({ config, setConfig, onStart }) {
  return (
    <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-right-8 duration-500 space-y-8 mt-10">
      <div className="bg-slate-900/80 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-xl shadow-2xl">
        <h2 className="text-3xl font-black mb-10 flex items-center gap-3"><Settings className="text-blue-500" /> Match Parameters</h2>
        <div className="space-y-10">
          <section>
            <label className="text-sm font-black text-slate-500 uppercase tracking-widest block mb-4">Target Operations</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(OPERATIONS).map(([key, op]) => (
                <button key={key} onClick={() => setConfig({ ...config, operation: key })} className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-200 ${config.operation === key ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/25 scale-105 z-10' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:border-slate-600'}`}>
                  <span className="text-2xl font-black font-mono">{op.icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{op.label}</span>
                </button>
              ))}
            </div>
          </section>
          <section>
            <label className="text-sm font-black text-slate-500 uppercase tracking-widest block mb-4">Difficulty Tier</label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {Object.keys(DIFFICULTY_PRESETS).map((level) => (
                <button key={level} onClick={() => setConfig({ ...config, difficulty: level })} className={`p-4 rounded-2xl border transition-all text-center ${config.difficulty === level ? 'bg-white border-white text-slate-900 shadow-xl scale-105 z-10' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800'}`}>
                  <span className="block font-black mb-1">{level}</span>
                  <span className="text-[10px] font-bold opacity-70 uppercase">{DIFFICULTY_PRESETS[level].time}s Timer</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
      <button onClick={onStart} className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black text-2xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-4">
        INITIALIZE MATCH <ChevronRight size={28} />
      </button>
    </div>
  );
}

function MultiplayerLobby({ user, appId, db, onMatchReady }) {
    const [matchIdInput, setMatchIdInput] = useState("");
    const [status, setStatus] = useState("IDLE");
    const [errorMsg, setErrorMsg] = useState(null);
    const unsubRef = useRef(null);

    // Clean up active listeners if user exits lobby to prevent memory leaks
    useEffect(() => {
      return () => { if (unsubRef.current) unsubRef.current(); }
    }, []);
  
    const createMatch = async () => {
      if (unsubRef.current) unsubRef.current(); // Explicitly clean up any prior listener
      setStatus("HOSTING");
      setErrorMsg(null);
      
      const newMatchId = Math.floor(10000 + Math.random() * 90000).toString();
      const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', newMatchId);
      const initialConfig = { operation: 'MIXED', difficulty: 'INTERMEDIATE' };
      
      try {
        await setDoc(matchRef, { p1Id: user.uid, p2Id: null, p1Force: 0, p2Force: 0, status: 'WAITING', config: initialConfig, createdAt: serverTimestamp() });
        setMatchIdInput(newMatchId);
        
        unsubRef.current = onSnapshot(matchRef, (snap) => {
          if (snap.exists() && snap.data().p2Id && snap.data().status === 'ACTIVE') {
            if (unsubRef.current) unsubRef.current(); 
            onMatchReady({ matchId: newMatchId, side: 'p1', config: initialConfig });
          }
        });
      } catch (e) {
        setErrorMsg("Failed to host. Check your connection.");
        setStatus("IDLE");
      }
    };
  
    const joinMatch = async () => {
      if (!matchIdInput || matchIdInput.length < 5) return;
      setStatus("JOINING");
      setErrorMsg(null);
      
      const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchIdInput);
      
      try {
        let matchConfig;
        
        // Transaction strictly prevents concurrent matchmaking race conditions
        await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(matchRef);
          if (!snap.exists() || snap.data().status !== 'WAITING') {
            throw new Error("Arena not found or in progress.");
          }
          matchConfig = snap.data().config;
          transaction.update(matchRef, { p2Id: user.uid, status: 'ACTIVE' });
        });
        
        onMatchReady({ matchId: matchIdInput, side: 'p2', config: matchConfig });
      } catch (e) {
        setErrorMsg(e.message || "Failed to join arena.");
        setStatus("IDLE");
      }
    };
  
    return (
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
        <div className="bg-slate-900/80 border border-slate-800 rounded-[2.5rem] p-10 w-full backdrop-blur-xl shadow-2xl text-center">
          <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-500/30"><Shield className="text-rose-500 w-10 h-10" /></div>
          <h2 className="text-3xl font-black mb-2">Ranked Arena</h2>
          <p className="text-slate-400 font-medium mb-8">Real-time synchronized competition.</p>
          
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-500/50 flex items-center gap-3 text-red-200 text-sm font-bold text-left animate-shake">
              <AlertCircle size={20} className="shrink-0 text-red-400" />
              {errorMsg}
            </div>
          )}

          {status === "IDLE" && (
            <div className="space-y-6">
              <button onClick={createMatch} className="w-full py-5 bg-rose-600 rounded-2xl font-black text-lg shadow-lg hover:bg-rose-500 transition-colors">HOST PRIVATE ARENA</button>
              <div className="flex gap-3">
                <input type="text" maxLength={5} placeholder="CODE" value={matchIdInput} onChange={(e) => setMatchIdInput(e.target.value.replace(/\D/g, ''))} className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-4 font-mono text-3xl font-black tracking-[0.5em] text-center focus:outline-none focus:border-rose-500 transition-colors" aria-label="Lobby Code" />
                <button onClick={joinMatch} disabled={matchIdInput.length < 5} className="px-8 bg-white text-slate-900 rounded-2xl font-black disabled:opacity-50">JOIN</button>
              </div>
            </div>
          )}
          {status === "HOSTING" && (
            <div className="space-y-8 py-4">
              <p className="text-sm font-bold text-slate-500 uppercase">Share this code</p>
              <div className="p-6 bg-slate-950 rounded-2xl border-2 border-dashed border-rose-500/50 inline-block"><h3 className="text-6xl font-black text-white tracking-[0.2em]">{matchIdInput}</h3></div>
              <div className="flex items-center justify-center gap-3 text-rose-400"><RefreshCw className="w-5 h-5 animate-spin" /><span className="font-bold animate-pulse">Waiting for challenger...</span></div>
            </div>
          )}
          {status === "JOINING" && <div className="py-12 text-slate-400"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-rose-500 mb-4" /><span className="font-bold uppercase tracking-widest">Connecting...</span></div>}
        </div>
      </div>
    );
  }

// --- THE JUICE: ISOLATED PHYSICS RENDERER ---
const PhysicsVisualizer = React.memo(({ targetRopeRef, localForcesRef, fatigueRef, phase, p1Streak, p2Streak }) => {
  // Contains explicitly mapped reactive properties to avoid hook dependency loops
  const [visualState, setVisualState] = useState({ rope: 0, tension: 0, fatigue: { p1: 0, p2: 0 } });
  
  const velocityRef = useRef(0);
  const lastTotalForceRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const lastRenderTimeRef = useRef(performance.now());
  const timeScaleRef = useRef(1.0);
  
  // Internal trackers preventing React re-render thrashing
  const internalRopeRef = useRef(0);
  const internalTensionRef = useRef(0);

  // Throttled visual state loop to protect CPU while physics computes accurately
  useEffect(() => {
    let animationFrameId;
    
    const updatePhysics = (currentTime) => {
      let dt = (currentTime - lastTimeRef.current) / 1000;
      if (dt > 0.1) dt = 0.016; 
      lastTimeRef.current = currentTime;
      const fpsRatio = dt * 60; 
      
      const trueRope = targetRopeRef.current;
      const currentTotalForce = localForcesRef.current.p1 + localForcesRef.current.p2;
      const forceDelta = currentTotalForce - lastTotalForceRef.current;
      lastTotalForceRef.current = currentTotalForce;

      // Mathematical integration
      const diff = trueRope - internalRopeRef.current;
      const springForce = diff * 0.15 * fpsRatio; 
      velocityRef.current = (velocityRef.current + springForce) * Math.pow(0.75, fpsRatio); 
      
      timeScaleRef.current = (Math.abs(trueRope) > WIN_THRESHOLD * 0.8 && phase === 'PLAYING') ? 0.3 : 1.0;

      let nextPos = internalRopeRef.current + (velocityRef.current * timeScaleRef.current * fpsRatio);
      if (nextPos > WIN_THRESHOLD + 10) nextPos = WIN_THRESHOLD + 10;
      if (nextPos < -(WIN_THRESHOLD + 10)) nextPos = -(WIN_THRESHOLD + 10);
      
      internalRopeRef.current = nextPos;
      internalTensionRef.current = Math.min(100, internalTensionRef.current * Math.pow(0.95, fpsRatio) + Math.abs(velocityRef.current) * 2 + forceDelta * 5);

      fatigueRef.current.p1 = Math.max(0, fatigueRef.current.p1 - (0.2 * fpsRatio));
      fatigueRef.current.p2 = Math.max(0, fatigueRef.current.p2 - (0.2 * fpsRatio));

      // Throttle React state reconciliations to ~30 FPS to prevent state explosion
      if (currentTime - lastRenderTimeRef.current >= 33) {
         setVisualState({ 
             rope: internalRopeRef.current, 
             tension: internalTensionRef.current,
             fatigue: { p1: fatigueRef.current.p1, p2: fatigueRef.current.p2 }
         });
         lastRenderTimeRef.current = currentTime;
      }

      animationFrameId = requestAnimationFrame(updatePhysics);
    };
    
    animationFrameId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animationFrameId);
  }, [phase, targetRopeRef, localForcesRef, fatigueRef]); // Crucially missing explicit state props to avoid effect loop resets

  const { rope: visualRope, tension, fatigue: visualFatigue } = visualState;

  const p1Winning = visualRope > 0;
  const p1Lean = p1Winning ? (visualRope / WIN_THRESHOLD) * 45 : (visualRope / WIN_THRESHOLD) * 20; 
  const p1Drag = p1Winning ? 0 : Math.max(-80, visualRope * 0.8);

  const p2Winning = visualRope < 0;
  const p2Lean = p2Winning ? (visualRope / WIN_THRESHOLD) * 45 : (visualRope / WIN_THRESHOLD) * 20;
  const p2Drag = p2Winning ? 0 : Math.min(80, visualRope * 0.8);
  
  const ropeSag = Math.max(0, 50 - (tension * 0.5));
  const ropeVibe = tension > 60 ? (Math.random() * 8 - 4) : 0;
  
  const isLosingBadly = visualRope < -(WIN_THRESHOLD * 0.7);
  const isWinningBadly = visualRope > (WIN_THRESHOLD * 0.7);
  const cameraDrift = `translateX(${visualRope * 0.05}px) rotateY(${visualRope * 0.02}deg)`;

  return (
    <div className="relative h-[280px] w-full bg-slate-900/50 rounded-[2rem] border-y border-slate-800 overflow-hidden flex items-end justify-center mb-6 shadow-2xl" style={{ transform: cameraDrift, perspective: '1000px' }}>
      <div className="absolute inset-0 opacity-10 flex items-end justify-center pb-12 pointer-events-none" style={{ transform: `translateX(${visualRope * -0.1}px)` }}>
         {[...Array(15)].map((_, i) => (
           <div key={`spec-${i}`} className="w-8 h-12 mx-2 bg-white rounded-t-full" style={{ transform: `rotate(${visualRope * 0.1}deg) scaleY(${1 + (i%3)*0.2})` }} />
         ))}
      </div>

      <div className="absolute inset-0" style={{ opacity: 0.3 + (Math.abs(visualRope) / WIN_THRESHOLD) * 0.4, background: `linear-gradient(90deg, rgba(225,29,72,${visualRope < 0 ? 0.3 : 0}) 0%, transparent 50%, rgba(37,99,235,${visualRope > 0 ? 0.3 : 0}) 100%)`}} />
      <div className="absolute top-0 left-1/2 w-px h-full bg-white/20 border-l border-dashed border-white/10 -translate-x-1/2" />

      <div className="absolute inset-0 flex items-end justify-between pb-10 px-12 z-10 w-full max-w-4xl mx-auto pointer-events-none">
         <div className="relative z-20">
            <FighterSVG isPlayer={false} leanAngle={p2Lean} dragOffset={p2Drag} isPulling={tension > 20} color="red" streak={p2Streak} fatigue={visualFatigue.p2} />
         </div>

         <div className="absolute inset-0 z-10 pt-24 px-10">
            <svg viewBox="0 0 1000 150" preserveAspectRatio="none" className="w-full h-full overflow-visible">
               <defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
               <path d={`M ${150 + p2Drag} 50 Q 500 ${50 + ropeSag + ropeVibe} ${850 + p1Drag} 50`} stroke={tension > 70 ? '#fff' : '#94a3b8'} strokeWidth="8" fill="none" strokeLinecap="round" filter="url(#glow)" style={{ transition: 'stroke 0.2s' }} />
               <g style={{ transform: `translateX(${((visualRope / WIN_THRESHOLD) * 350) + 500}px)` }}>
                  <rect x="-4" y="20" width="8" height="60" fill="white" rx="2" />
                  <circle cx="0" cy="50" r="10" fill="red" stroke="white" strokeWidth="3" />
               </g>
            </svg>
         </div>

         <div className="relative z-20">
            <FighterSVG isPlayer={true} leanAngle={p1Lean} dragOffset={p1Drag} isPulling={tension > 20} color="blue" streak={p1Streak} fatigue={visualFatigue.p1} />
         </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-900 flex flex-col justify-end">
         <div className="text-[8px] font-black text-center text-slate-500 uppercase tracking-[0.3em] absolute w-full -top-4">Tension</div>
         <div className={`h-full transition-all duration-75 mx-auto rounded-t-sm ${tension > 85 ? 'bg-red-500 animate-pulse shadow-[0_0_10px_red]' : tension > 50 ? 'bg-yellow-400' : 'bg-green-400'}`} style={{ width: `${tension}%` }} />
      </div>

      <div className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-1000 ${isLosingBadly ? 'opacity-100' : 'opacity-0'}`} style={{ background: 'radial-gradient(circle, transparent 40%, rgba(220, 38, 38, 0.4) 100%)' }} />
      <div className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-1000 ${isWinningBadly ? 'opacity-100' : 'opacity-0'}`} style={{ background: 'radial-gradient(circle, transparent 40%, rgba(59, 130, 246, 0.4) 100%)' }} />
    </div>
  );
});

const FighterSVG = React.memo(({ isPlayer, leanAngle, dragOffset, isPulling, color, streak, fatigue }) => {
    const actualRotation = leanAngle; 
    const headTransform = isPulling ? `translate(0, 5px) rotate(${actualRotation * 0.5}deg)` : `rotate(${actualRotation * 0.5}deg)`;
    const trembleScale = fatigue > 20 ? (1 + Math.random() * 0.02 - 0.01) : 1;
    let auraClass = "";
    if (streak >= 8) auraClass = `drop-shadow-[0_0_30px_rgba(${color === 'blue' ? '59,130,246' : '244,63,94'},0.8)]`;
    else if (streak >= 3) auraClass = `drop-shadow-[0_0_15px_rgba(${color === 'blue' ? '59,130,246' : '244,63,94'},0.4)]`;

    let frontLegPath, backLegPath;
    if (isPlayer) {
        frontLegPath = leanAngle < 0 ? "M 40 80 L 10 140" : "M 40 80 L 30 140";
        backLegPath = "M 60 80 L 80 140"; 
    } else {
        frontLegPath = leanAngle > 0 ? "M 60 80 L 90 140" : "M 60 80 L 70 140";
        backLegPath = "M 40 80 L 20 140"; 
    }

    return (
      <div className={`relative transition-transform duration-100 ease-out origin-bottom ${auraClass} ${!isPulling && 'animate-breathe'}`} style={{ transform: `translateX(${dragOffset}px) rotate(${actualRotation}deg) scale(${trembleScale})`, width: '120px', height: '160px' }}>
         {Math.abs(dragOffset) > 10 && (
             <div className="absolute bottom-0 w-full pointer-events-none">
                 {[...Array(3)].map((_, i) => (
                    <div key={`dust-${i}`} className="absolute bottom-0 w-2 h-2 bg-slate-500 rounded-full animate-dust" style={{ left: '50%', '--tx': `${(Math.random() * 40 - 20) * (isPlayer ? -1 : 1)}px`, animationDelay: `${i * 0.1}s` }} />
                 ))}
             </div>
         )}
         <svg viewBox="0 0 100 150" className="w-full h-full overflow-visible">
            <defs>
               <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color === 'blue' ? '#60A5FA' : '#FB7185'} /><stop offset="100%" stopColor={color === 'blue' ? '#1E3A8A' : '#881337'} /></linearGradient>
            </defs>
            <path d={isPlayer ? "M 50 50 Q 10 50 0 70" : "M 50 50 Q 90 50 100 70"} stroke={`url(#grad-${color})`} strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d="M 40 30 L 60 30 L 70 80 L 30 80 Z" fill={`url(#grad-${color})`} />
            <g className="transition-all duration-150">
                <path d={frontLegPath} stroke={`url(#grad-${color})`} strokeWidth="14" strokeLinecap="round" />
                <path d={backLegPath} stroke={`url(#grad-${color})`} strokeWidth="14" strokeLinecap="round" opacity="0.8"/>
            </g>
            <g style={{ transform: isPulling ? (isPlayer ? 'translateX(-5px)' : 'translateX(5px)') : 'none', transition: 'all 0.1s' }}>
               <path d={isPlayer ? "M 50 40 Q 0 40 -10 75" : "M 50 40 Q 100 40 110 75"} stroke={`url(#grad-${color})`} strokeWidth="16" strokeLinecap="round" fill="none" />
            </g>
            <g style={{ transform: headTransform, transformOrigin: '50px 20px', transition: 'all 0.2s' }}>
               <rect x="35" y="0" width="30" height="30" rx="8" fill={`url(#grad-${color})`} />
               <rect x={isPlayer ? "40" : "50"} y="8" width="10" height="6" rx="3" fill="#FFF" className={(isPulling || streak >= 5) ? 'animate-pulse' : ''} style={{ filter: 'drop-shadow(0 0 5px white)' }}/>
            </g>
         </svg>
      </div>
    );
});

// --- Reusable Input Console ---
const PlayerConsole = ({ side, color, problem, input, onKey, isActive }) => {
  const isRed = color === 'red';
  const glowColor = isRed ? 'shadow-red-500/20' : 'shadow-blue-500/20';
  const btnColor = isRed ? 'bg-rose-600 hover:bg-rose-500 border-rose-900 shadow-rose-500/20' : 'bg-blue-600 hover:bg-blue-500 border-blue-900 shadow-blue-500/20';

  return (
    <div className={`flex flex-col gap-2 w-full transition-opacity duration-500 ${!isActive ? 'opacity-30 pointer-events-none filter grayscale translate-y-4' : 'opacity-100 translate-y-0'}`}>
      <div className={`flex flex-col items-center justify-center p-6 rounded-[2rem] bg-slate-900/80 border border-slate-700 backdrop-blur-xl relative overflow-hidden shadow-inner`}>
         <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
           <Target size={14} /> TEAM {isRed ? 'RED' : 'BLUE'}
         </span>
         <h3 className="text-4xl md:text-5xl font-black font-mono tracking-tighter text-white mb-4 drop-shadow-md">
           {problem?.question || 'WAIT...'}
         </h3>
         <div className={`w-full h-16 bg-slate-950 rounded-2xl border-2 border-slate-800 flex items-center justify-center overflow-hidden relative shadow-[inset_0_5px_20px_rgba(0,0,0,0.5)]`}>
            <span className={`text-3xl font-black font-mono tracking-widest ${input ? 'text-white' : 'text-slate-700 animate-pulse'}`}>{input || '?'}</span>
         </div>
      </div>

      <div className="bg-slate-900/80 p-3 rounded-[2rem] border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div className="grid grid-cols-4 gap-2 h-full min-h-[180px]">
          {['7','8','9','/','4','5','6','*','1','2','3','-','.', '0', 'DEL', 'ENTER'].map((key) => {
            let style = "bg-slate-800 hover:bg-slate-700 text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 shadow-md";
            let isOp = false;
            if (['/','*'].includes(key)) { style = "bg-slate-900 text-slate-700 border-slate-800 cursor-not-allowed"; isOp = true; }
            if (key === 'ENTER') style = `${btnColor} text-white border-b-4 active:border-b-0 active:translate-y-1 shadow-lg col-span-2`;
            if (key === 'DEL') style = "bg-slate-950/80 hover:bg-slate-900 text-slate-400 border-b-4 border-slate-950 active:border-b-0 active:translate-y-1";

            const ariaLabel = key === 'DEL' ? 'Delete' : key === 'ENTER' ? 'Submit' : `Input ${key}`;

            return (
              <button key={key} disabled={isOp} onClick={() => !isOp && onKey(key)} aria-label={ariaLabel} className={`rounded-xl text-xl font-black font-mono transition-all flex items-center justify-center ${style}`}>
                {key === 'DEL' ? <ArrowLeft size={24} /> : key === 'ENTER' ? <div className="flex items-center gap-2">STRIKE <Zap size={16} fill="currentColor"/></div> : key}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- MATCH ARENA (The Core Logic Engine) ---
function MatchArena({ mode, config, user, db, appId, onMatchEnd, onExit }) {
  const isMulti = mode === 'MULTI';
  const isLocal = mode === 'LOCAL';
  const matchId = isMulti ? sessionStorage.getItem('currentMatchId') : null;
  const playerSide = isMulti ? sessionStorage.getItem('playerSide') : 'p1'; 

  const [phase, setPhase] = useState('INTRO'); 
  const [countdownText, setCountdownText] = useState('3');
  
  const maxTime = DIFFICULTY_PRESETS[config.difficulty]?.time || 15;
  
  const [p1State, setP1State] = useState({ problem: null, input: "", streak: 0, score: 0, time: maxTime });
  const [p2State, setP2State] = useState({ problem: null, input: "", streak: 0, score: 0, time: maxTime });
  
  const [impacts, setImpacts] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [shakeLevel, setShakeLevel] = useState(0); 

  const [aiProfile] = useState(() => AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)]);

  // Physics Mutable Refs - Prevent Stale Closures and React loops
  const targetRopeRef = useRef(0);
  const fatigueRef = useRef({ p1: 0, p2: 0 });
  const localForces = useRef({ p1: 0, p2: 0 });
  const matchActive = useRef(true);
  
  const questionsAnsweredRef = useRef([]);
  const currentQuestionStartTime = useRef(Date.now());
  const aiMountedRef = useRef(true);

  const p1StateRef = useRef(p1State);
  useEffect(() => { p1StateRef.current = p1State; }, [p1State]);
  const p2StateRef = useRef(p2State);
  useEffect(() => { p2StateRef.current = p2State; }, [p2State]);

  useEffect(() => {
     aiMountedRef.current = true;
     return () => { aiMountedRef.current = false; };
  }, []);

  const finalizeMatch = useCallback((won, localWinner = null) => {
    onMatchEnd({ 
      won, 
      score: p1StateRef.current.score, 
      timestamp: Date.now(), 
      mode, 
      difficulty: config.difficulty,
      localWinner 
    }, questionsAnsweredRef.current);
  }, [mode, config.difficulty, onMatchEnd]);

  const handleServerWin = useCallback(async (winnerSide, matchRef) => {
    if (!matchActive.current) return;
    matchActive.current = false;
    setPhase('ENDED');
    targetRopeRef.current = winnerSide === 'p1' ? WIN_THRESHOLD + 50 : -(WIN_THRESHOLD + 50); 
    if (playerSide === winnerSide) {
      try { await updateDoc(matchRef, { status: 'FINISHED', winner: winnerSide }); } catch(e) { console.error(e); }
    }
  }, [playerSide]);

  const generateProblemFor = useCallback((player) => {
    const prob = generateProblem(config.operation, config.difficulty);
    const timeLimit = DIFFICULTY_PRESETS[config.difficulty]?.time || 15;
    if (player === 'p1') {
       setP1State(prev => ({ ...prev, problem: prob, input: "", time: timeLimit }));
    } else {
       setP2State(prev => ({ ...prev, problem: prob, input: "", time: timeLimit }));
    }
  }, [config.operation, config.difficulty]);

  const triggerShake = useCallback((severity) => {
    setShakeLevel(severity);
    setTimeout(() => setShakeLevel(0), severity === 2 ? 400 : 300);
  }, []);

  const spawnImpact = useCallback((side, color) => {
     const id = getSafeID();
     setImpacts(prev => [...prev, { id, side, color }]);
     setTimeout(() => setImpacts(prev => prev.filter(i => i.id !== id)), 600);
  }, []);

  const spawnFloatingText = useCallback((text, isCritical, side) => {
     const id = getSafeID();
     setFloatingTexts(prev => [...prev, { id, text, isCritical, side }]);
     setTimeout(() => setFloatingTexts(prev => prev.filter(i => i.id !== id)), 800);
  }, []);

  // Architecture Note: Full authority over incremental force should ideally reside securely in a 
  // Cloud Function evaluating exact user inputs. Since this is an isolated frontend, 
  // we perform a controlled client-side increment that mimics backend behavior safely.
  const applyForce = useCallback(async (forceAmount, side) => {
    fatigueRef.current[side] += 15; 
    
    const directionalForce = side === 'p1' ? forceAmount : -forceAmount;
    localForces.current[side] += forceAmount; 
    targetRopeRef.current += directionalForce;

    if (isMulti && matchId) {
       if (side === playerSide) {
          const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId);
          const updateField = side === 'p1' ? 'p1Force' : 'p2Force';
          try { 
            await updateDoc(matchRef, { 
              [updateField]: increment(forceAmount) 
            }); 
          } catch (e) {
            console.error("Force update failed:", e);
          }
       }
    } else {
      if (targetRopeRef.current >= WIN_THRESHOLD) {
        matchActive.current = false;
        setPhase('ENDED');
        targetRopeRef.current = WIN_THRESHOLD + 50;
        setTimeout(() => finalizeMatch(true, 'p1'), 3000);
      } else if (targetRopeRef.current <= -WIN_THRESHOLD) {
        matchActive.current = false;
        setPhase('ENDED');
        targetRopeRef.current = -(WIN_THRESHOLD + 50);
        setTimeout(() => finalizeMatch(false, 'p2'), 3000);
      }
    }
  }, [isMulti, matchId, playerSide, db, appId, finalizeMatch]);

  const submitAnswer = useCallback((side) => {
    if (!matchActive.current || phase !== 'PLAYING') return;

    // Use Refs to bypass closure limits and prevent keyboard recreation lag
    const currentState = side === 'p1' ? p1StateRef.current : p2StateRef.current;
    const setState = side === 'p1' ? setP1State : setP2State;

    if (!currentState.input || !currentState.problem) return;

    const cleanInput = currentState.input.trim().replace(/\.$/, '');
    
    // Convert to numbers to solve string equality issues (e.g. typing "2" instead of "2.0")
    // Fallback to strict string check if parsing to Number yields NaN.
    const isCorrect = Number(cleanInput) === Number(currentState.problem.answer) || cleanInput === currentState.problem.answer;

    if (side === 'p1') {
       questionsAnsweredRef.current.push({ 
           type: currentState.problem?.type || 'UNKNOWN', 
           isCorrect, 
           timeTaken: (Date.now() - currentQuestionStartTime.current) / 1000 
       });
       currentQuestionStartTime.current = Date.now();
    }

    if (isCorrect) {
      const timeLimit = DIFFICULTY_PRESETS[config.difficulty]?.time || 15;
      const speedRatio = currentState.time / timeLimit;
      const fatiguePenalty = Math.max(0, fatigueRef.current[side] * 0.1);
      const force = Math.max(5, (15 + (speedRatio * 8) + (currentState.streak * 3)) - fatiguePenalty);
      
      applyForce(force, side);
      
      const pts = 10 + Math.floor(speedRatio * 5);
      setState(prev => ({ ...prev, streak: prev.streak + 1, score: prev.score + pts }));
      
      spawnFloatingText(`+${pts} FORCE`, currentState.streak >= 2, side);
      spawnImpact(side === 'p1' ? 'right' : 'left', side === 'p1' ? 'blue' : 'red');
      if (currentState.streak >= 1) triggerShake(currentState.streak >= 4 ? 2 : 1);
      
      generateProblemFor(side);
    } else {
      setState(prev => ({ ...prev, streak: 0, input: "" }));
      triggerShake(1);
    }
  }, [phase, config.difficulty, applyForce, spawnFloatingText, spawnImpact, triggerShake, generateProblemFor]);

  const handleKeyPad = useCallback((key, side) => {
    if (!matchActive.current || phase !== 'PLAYING') return;
    
    const setState = side === 'p1' ? setP1State : setP2State;
    const currentState = side === 'p1' ? p1StateRef.current : p2StateRef.current;

    if (key === 'ENTER') submitAnswer(side);
    else if (key === 'DEL') setState(prev => ({ ...prev, input: prev.input.slice(0, -1) }));
    else if (key === '-') setState(prev => ({ ...prev, input: prev.input.startsWith('-') ? prev.input.slice(1) : '-' + prev.input }));
    else if (key === '.') setState(prev => ({ ...prev, input: prev.input.includes('.') ? prev.input : prev.input + '.' }));
    else {
      setState(prev => ({ ...prev, input: prev.input.length < 8 ? prev.input + key : prev.input }));
    }
  }, [phase, submitAnswer]);

  const handleAbortMatch = async () => {
    matchActive.current = false;
    if (isMulti && matchId) {
      const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId);
      try { await updateDoc(matchRef, { status: 'ABANDONED' }); } catch(e) { console.error("Failed to abandon:", e); }
    }
    onExit();
  };

  useEffect(() => {
    if (phase === 'INTRO') {
       setTimeout(() => setPhase('COUNTDOWN'), 2500);
    } else if (phase === 'COUNTDOWN') {
       let c = 3;
       const int = setInterval(() => {
          c--;
          if (c > 0) setCountdownText(c.toString());
          else if (c === 0) setCountdownText('PULL!');
          else {
             clearInterval(int);
             questionsAnsweredRef.current = []; // Fix memory growth leak across sessions
             setPhase('PLAYING');
             generateProblemFor('p1');
             if (isLocal) generateProblemFor('p2');
          }
       }, 1000);
    }
  }, [phase, generateProblemFor, isLocal]);

  useEffect(() => {
    if (!isMulti || !matchId) return;
    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId);
    const unsub = onSnapshot(matchRef, (snap) => {
      if (!snap.exists() || !matchActive.current) return;
      const data = snap.data();
      
      const trueRope = data.p1Force - data.p2Force;
      targetRopeRef.current = trueRope;
      localForces.current = { p1: data.p1Force, p2: data.p2Force };

      if (data.status === 'FINISHED') {
         matchActive.current = false;
         setPhase('ENDED');
         setTimeout(() => finalizeMatch(data.winner === playerSide), 3000); 
      } else if (data.status === 'ABANDONED') {
         matchActive.current = false;
         setPhase('ABANDONED');
         setTimeout(() => onExit(), 3000);
      } else if (trueRope >= WIN_THRESHOLD) {
         handleServerWin('p1', matchRef);
      } else if (trueRope <= -WIN_THRESHOLD) {
         handleServerWin('p2', matchRef);
      }
    });
    return () => unsub();
  }, [isMulti, matchId, db, appId, playerSide, finalizeMatch, handleServerWin, onExit]);

  useEffect(() => {
    if (isMulti || isLocal || !matchActive.current || phase !== 'PLAYING') return;
    let aiTimer;
    const runAI = () => {
      if (!matchActive.current || !aiMountedRef.current) return;
      const { aiSolveTime, aiAccuracy } = DIFFICULTY_PRESETS[config.difficulty];
      
      let dynamicTimeMod = 1.0;
      if (targetRopeRef.current > 20) dynamicTimeMod = 0.6; 
      if (targetRopeRef.current < -20) dynamicTimeMod = 1.5; 
      
      const baseDelay = Math.random() * (aiSolveTime[1] - aiSolveTime[0]) + aiSolveTime[0];
      const finalDelay = baseDelay * dynamicTimeMod * (2 - aiProfile.aggro);

      aiTimer = setTimeout(() => {
        if (!matchActive.current || !aiMountedRef.current) return;
        const adjustedAccuracy = aiAccuracy * aiProfile.def;

        if (Math.random() < adjustedAccuracy) {
          const baseForce = 12 * aiProfile.aggro;
          const fatiguePenalty = Math.max(0, fatigueRef.current.p2 * 0.1);
          const finalForce = Math.max(5, baseForce - fatiguePenalty);
          
          localForces.current.p2 += finalForce;
          targetRopeRef.current -= finalForce;
          fatigueRef.current.p2 += 10;
          
          spawnImpact('left', 'red');

          if (targetRopeRef.current <= -WIN_THRESHOLD) {
            matchActive.current = false;
            setPhase('ENDED');
            targetRopeRef.current = -(WIN_THRESHOLD + 50);
            setTimeout(() => finalizeMatch(false), 3000);
          }
        }
        runAI();
      }, finalDelay);
    };
    runAI();
    return () => clearTimeout(aiTimer);
  }, [isMulti, isLocal, config.difficulty, phase, aiProfile, finalizeMatch, spawnImpact]);

  // Safe global time loop (No setStates in setStates)
  useEffect(() => {
    if (!matchActive.current || phase !== 'PLAYING') return;
    const interval = setInterval(() => {
      setP1State(prev => prev.time <= 1 ? { ...prev, time: 0 } : { ...prev, time: prev.time - 1 });
      if (isLocal) {
         setP2State(prev => prev.time <= 1 ? { ...prev, time: 0 } : { ...prev, time: prev.time - 1 });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, isLocal]);

  // Handle timeout resets outside of the time tick interval
  useEffect(() => {
      if (phase === 'PLAYING' && p1State.time === 0) {
         const timeLimit = DIFFICULTY_PRESETS[config.difficulty]?.time || 15;
         triggerShake(1);
         generateProblemFor('p1');
         setP1State(prev => ({...prev, streak: 0, input: ""}));
         if (!isLocal) {
             questionsAnsweredRef.current.push({ type: p1State.problem?.type || 'UNKNOWN', isCorrect: false, timeTaken: timeLimit });
             currentQuestionStartTime.current = Date.now();
         }
      }
  }, [p1State.time, phase, isLocal, generateProblemFor, triggerShake, config.difficulty]);

  useEffect(() => {
      if (isLocal && phase === 'PLAYING' && p2State.time === 0) {
         triggerShake(1);
         generateProblemFor('p2');
         setP2State(prev => ({...prev, streak: 0, input: ""}));
      }
  }, [isLocal, p2State.time, phase, generateProblemFor, triggerShake]);

  useEffect(() => {
    if (isLocal) return; 
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') handleKeyPad('ENTER', 'p1');
      else if (e.key === 'Backspace') handleKeyPad('DEL', 'p1');
      else if (e.key === '-') handleKeyPad('-', 'p1');
      else if (e.key === '.') handleKeyPad('.', 'p1');
      else if (/[0-9]/.test(e.key)) handleKeyPad(e.key, 'p1');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPad, isLocal]);

  return (
    <div className={`flex-1 flex flex-col relative w-full h-full max-w-6xl mx-auto transition-transform ${shakeLevel === 2 ? 'animate-severe-shake' : shakeLevel === 1 ? 'animate-shake' : ''}`}>
      
      {(phase === 'ENDED' || phase === 'ABANDONED') && <div className="fixed inset-0 pointer-events-none z-50 bg-slate-900/40 backdrop-grayscale transition-all duration-1000" />}

      {/* Intro & Countdown */}
      {phase === 'INTRO' && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm animate-cinematic">
            <div className="text-center">
              <h2 className="text-5xl font-black text-white tracking-[0.3em] mb-4">{isLocal ? 'LOCAL DUEL' : 'MATCH FOUND'}</h2>
              <div className="flex items-center gap-12 justify-center text-2xl font-bold font-mono">
                 <span className="text-blue-500">{isLocal ? 'TEAM BLUE' : 'YOU'}</span>
                 <span className="text-slate-500">VS</span>
                 <span className="text-rose-500">{isLocal ? 'TEAM RED' : isMulti ? 'CHALLENGER' : aiProfile.name}</span>
              </div>
            </div>
         </div>
      )}
      {phase === 'COUNTDOWN' && (
         <div className="absolute inset-0 z-50 flex items-center justify-center">
            <h1 key={countdownText} className="text-[15rem] font-black text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.8)] animate-cinematic">{countdownText}</h1>
         </div>
      )}
      {phase === 'ABANDONED' && (
         <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md animate-in fade-in">
            <AlertCircle size={80} className="text-rose-500 mb-6 animate-pulse" />
            <h1 className="text-4xl font-black text-white tracking-widest text-center">OPPONENT FLED</h1>
            <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest">Match Voided</p>
         </div>
      )}

      {/* HUD Bar */}
      <div className="flex justify-between items-end mb-4 px-2 relative z-10">
        <div className="flex flex-col gap-1 text-left relative">
          {floatingTexts.filter(ft => ft.side === 'p2').map(ft => (
             <div key={ft.id} className={`absolute bottom-full left-10 whitespace-nowrap font-black font-mono animate-float ${ft.isCritical ? 'text-2xl text-yellow-400 drop-shadow-[0_0_10px_orange]' : 'text-lg text-white'}`}>
                {ft.text}
             </div>
          ))}
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-xl bg-rose-950/50 border border-rose-500/30 flex items-center justify-center"><User className="text-rose-500" /></div>
             <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isMulti ? 'CHALLENGER' : isLocal ? 'TEAM RED' : 'AI TARGET'}</p>
               <p className="text-2xl font-black text-rose-100 font-mono">{isLocal ? p2State.score : ''} {(!isLocal && !isMulti) ? aiProfile.name : ''}</p>
             </div>
          </div>
        </div>

        <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2 top-0">
          <div className={`flex items-center justify-center w-20 h-20 rounded-full border-4 ${p1State.time <= 3 ? 'border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'border-slate-700 text-white'} bg-slate-900 shadow-xl transition-colors duration-300`}>
            <span className={`text-4xl font-black font-mono ${p1State.time <= 3 ? 'animate-pulse' : ''}`}>
               {isLocal ? 'VS' : Math.ceil(p1State.time)}
            </span>
          </div>
          <div className="h-8 mt-2 flex items-center justify-center">
            {(p1State.streak > 2 || p2State.streak > 2) && (
              <span className="px-4 py-1 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-xs font-black rounded-full tracking-widest flex items-center gap-1 shadow-[0_0_20px_rgba(249,115,22,0.8)] animate-pulse border border-white/20">
                <Flame size={14} /> COMBO
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 text-right relative">
          {floatingTexts.filter(ft => ft.side === 'p1').map(ft => (
             <div key={ft.id} className={`absolute bottom-full right-10 whitespace-nowrap font-black font-mono animate-float ${ft.isCritical ? 'text-2xl text-yellow-400 drop-shadow-[0_0_10px_orange]' : 'text-lg text-white'}`}>
                {ft.text}
             </div>
          ))}
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isLocal ? 'TEAM BLUE' : 'YOUR FORCE'}</p>
              <p className="text-2xl font-black text-blue-100 font-mono">{p1State.score}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-900/50 border border-blue-500/30 flex items-center justify-center"><Zap className="text-blue-400" /></div>
          </div>
        </div>
      </div>

      <PhysicsVisualizer 
        targetRopeRef={targetRopeRef} 
        localForcesRef={localForces} 
        fatigueRef={fatigueRef} 
        phase={phase} 
        p1Streak={p1State.streak} 
        p2Streak={p2State.streak} 
      />

      <div className={`grid gap-4 flex-1 transition-all duration-500 ${phase !== 'PLAYING' ? 'opacity-30 pointer-events-none filter grayscale translate-y-4' : 'opacity-100 translate-y-0'} ${isLocal ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
        
        {isLocal ? (
          <PlayerConsole 
            side="p2" 
            color="red" 
            problem={p2State.problem} 
            input={p2State.input} 
            onKey={(k) => handleKeyPad(k, 'p2')} 
            isActive={phase === 'PLAYING'} 
          />
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center p-8 rounded-[2rem] bg-slate-900/80 border border-slate-700 backdrop-blur-xl relative overflow-hidden shadow-inner opacity-50">
             <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Target size={14} /> WAITING ON INPUT...</span>
          </div>
        )}

        <PlayerConsole 
          side="p1" 
          color="blue" 
          problem={p1State.problem} 
          input={p1State.input} 
          onKey={(k) => handleKeyPad(k, 'p1')} 
          isActive={phase === 'PLAYING'} 
        />
        
      </div>
      
      <button onClick={handleAbortMatch} className="mt-4 text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest text-center w-full pb-2">ABORT MISSION</button>
    </div>
  );
}

// --- Post-Match & Analytics ---
function ResultsScreen({ onBack }) {
  const [data, setData] = useState(null);
  useEffect(() => { const raw = sessionStorage.getItem('lastMatchData'); if (raw) setData(JSON.parse(raw)); }, []);
  if (!data) return null;

  const isLocal = data.mode === 'LOCAL';
  const title = isLocal ? (data.localWinner === 'p1' ? 'BLUE TEAM WINS' : 'RED TEAM WINS') : (data.won ? 'VICTORY' : 'DEFEATED');
  const gradient = (isLocal && data.localWinner === 'p2') || (!isLocal && !data.won) ? 'from-rose-600 to-red-900' : 'from-blue-400 to-indigo-600 shadow-blue-500/40 animate-cinematic';
  
  // Align UI feedback with what was computed in processMatchData
  const multiplier = DIFFICULTY_MULTIPLIERS[data.difficulty] || 1;
  const mmrGained = `+${Math.floor(100 * multiplier)}`;

  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 max-w-lg mx-auto w-full z-10">
      <div className={`w-full p-1 rounded-[3rem] shadow-2xl bg-gradient-to-br ${gradient}`}>
        <div className="bg-slate-950 rounded-[2.9rem] p-10 text-center relative overflow-hidden">
          {(data.won || (isLocal && data.localWinner === 'p1')) && <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.5)_0%,transparent_70%)]" />}
          <div className="relative z-10">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-xl ${data.won || (isLocal && data.localWinner === 'p1') ? 'bg-blue-500 shadow-blue-500/50' : isLocal ? 'bg-rose-600 shadow-rose-500/50' : 'bg-slate-800 border border-slate-700'}`}>
              {data.won || isLocal ? <Trophy className="w-12 h-12 text-white" /> : <XCircle className="w-12 h-12 text-slate-500" />}
            </div>
            <h2 className={`text-4xl md:text-5xl font-black tracking-tighter mb-2 text-white`}>{title}</h2>
            <p className="text-slate-400 font-medium mb-8">{isLocal ? 'A fierce local battle concluded.' : data.won ? 'Flawless execution in the arena.' : 'Return to training and analyze your weakness.'}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">SCORE</p><p className="text-3xl font-black font-mono text-white">{data.score}</p></div>
               {!isLocal && (
                 <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">MMR</p><p className={`text-3xl font-black font-mono ${data.won ? 'text-green-400' : 'text-red-400'}`}>{data.won ? mmrGained : '-15'}</p></div>
               )}
            </div>
            <button onClick={onBack} className={`w-full py-5 rounded-[2rem] font-black text-xl transition-all active:scale-95 bg-white text-slate-900 hover:bg-slate-200`}>CONTINUE</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsDashboard({ stats }) {
  const analytics = stats.analytics || {};
  let totalAttempts = 0, totalCorrect = 0, totalTime = 0;
  const operationStats = Object.entries(analytics).map(([key, data]) => {
    totalAttempts += data.attempts; totalCorrect += data.correct; totalTime += data.totalTime;
    return { name: OPERATIONS[key]?.label || key, accuracy: data.attempts > 0 ? (data.correct / data.attempts) * 100 : 0, avgTime: data.correct > 0 ? data.totalTime / data.correct : 0, attempts: data.attempts };
  }).sort((a, b) => b.attempts - a.attempts);

  const globalAcc = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
  const globalAvg = totalCorrect > 0 ? (totalTime / totalCorrect) : 0;
  const currentRank = useMemo(() => getRank(stats.xp), [stats.xp]);

  return (
    <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-right-8 duration-500 space-y-6 z-10">
      <div className="bg-slate-900/80 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-2xl">
        <h2 className="text-3xl font-black mb-8 flex items-center gap-3"><BarChart2 className="text-blue-500" /> Performance Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner"><p className="text-[10px] font-black text-slate-500 uppercase mb-2">GLOBAL ACCURACY</p><p className="text-4xl font-black font-mono tracking-tighter mb-1">{Math.round(globalAcc)}%</p><p className="text-xs text-slate-400">{totalCorrect}/{totalAttempts} correct</p></div>
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner"><p className="text-[10px] font-black text-slate-500 uppercase mb-2">AVG RESPONSE</p><p className="text-4xl font-black font-mono tracking-tighter mb-1">{globalAvg.toFixed(1)}s</p><p className="text-xs text-slate-400">Speed to solve</p></div>
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner"><p className="text-[10px] font-black text-slate-500 uppercase mb-2">TOTAL MATCHES</p><p className="text-4xl font-black font-mono tracking-tighter mb-1">{stats.totalGames}</p><p className="text-xs text-slate-400">{stats.wins} victories</p></div>
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner"><p className="text-[10px] font-black text-slate-500 uppercase mb-2">CURRENT RANK</p><p className={`text-3xl font-black tracking-tighter mb-1 ${currentRank.color}`}>{currentRank.name}</p><p className="text-xs text-slate-400">{Math.floor(stats.xp)} MMR</p></div>
        </div>
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Mastery by Operation</h3>
        {operationStats.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-3xl text-slate-500"><AlertTriangle className="mx-auto mb-3 opacity-50" size={32} /><p className="font-bold uppercase tracking-widest text-xs">NO DATA AVAILABLE.</p></div>
        ) : (
          <div className="space-y-4">
            {operationStats.map((op, i) => (
              <div key={i} className="bg-slate-950 p-5 rounded-2xl border border-slate-800/50 flex items-center gap-6">
                 <div className="w-1/3"><p className="font-black text-lg text-white">{op.name}</p><p className="text-xs text-slate-500 font-bold uppercase">{op.attempts} questions</p></div>
                 <div className="flex-1 space-y-2"><div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400"><span>Accuracy</span><span className={op.accuracy >= 80 ? 'text-green-400' : op.accuracy < 50 ? 'text-red-400' : ''}>{op.accuracy.toFixed(0)}%</span></div><div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${op.accuracy >= 80 ? 'bg-green-500' : op.accuracy < 50 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${op.accuracy}%` }}/></div></div>
                 <div className="w-1/4 flex flex-col items-end"><span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Speed</span><span className="font-mono font-black text-lg">{op.avgTime > 0 ? op.avgTime.toFixed(1) + 's' : '-'}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}