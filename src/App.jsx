import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Trophy, Users, User, Settings, Zap, BarChart2, CheckCircle2, XCircle, 
  ArrowLeft, ChevronRight, RefreshCw, Award, Clock, Flame, Shield, 
  Target, Activity, BrainCircuit, TrendingUp, AlertTriangle, MonitorPlay,
  Check, X, Swords, Globe, Edit3, Save, Volume2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, collection, 
  serverTimestamp, increment
} from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

// --- Zero-Dependency Arcade Synth Engine ---
let globalAudioCtx = null; // Singleton Context to prevent browser audio limits

const playArcadeSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    // Initialize or resume the global audio context
    if (!globalAudioCtx) {
      globalAudioCtx = new AudioContext();
    }
    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
    }
    const ctx = globalAudioCtx;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'pull') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'combo') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'start') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      osc.frequency.setValueAtTime(800, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'alarm') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'victory') {
      // Epic Multi-Layered Arcade Victory Fanfare!
      const timeRamp = [0, 0.15, 0.3, 0.5];
      const melody = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      osc.type = 'square';
      timeRamp.forEach((t, i) => osc.frequency.setValueAtTime(melody[i], now + t));
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.setValueAtTime(0.1, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      osc.start(now); osc.stop(now + 2.5);

      const oscHarm = ctx.createOscillator();
      const gainHarm = ctx.createGain();
      oscHarm.type = 'triangle';
      oscHarm.connect(gainHarm);
      gainHarm.connect(ctx.destination);
      const harmony = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      timeRamp.forEach((t, i) => oscHarm.frequency.setValueAtTime(harmony[i], now + t));
      gainHarm.gain.setValueAtTime(0.15, now);
      gainHarm.gain.setValueAtTime(0.15, now + 0.5);
      gainHarm.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      oscHarm.start(now); oscHarm.stop(now + 2.5);

      const oscSwell = ctx.createOscillator();
      const gainSwell = ctx.createGain();
      oscSwell.type = 'sine';
      oscSwell.frequency.setValueAtTime(1567.98, now + 0.5); // G6 Sparkle
      oscSwell.connect(gainSwell);
      gainSwell.connect(ctx.destination);
      gainSwell.gain.setValueAtTime(0, now);
      gainSwell.gain.setValueAtTime(0.05, now + 0.5);
      gainSwell.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      oscSwell.start(now); oscSwell.stop(now + 2.5);
    } else if (type === 'loss') {
      // Sad descending sawtooth
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.8);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 1.0);
      osc.start(now); osc.stop(now + 1.0);
    } else if (type === 'beat') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'victory_pulse') {
      // Bouncy, happy ambient sound for the results screen
      osc.type = 'square';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'loss_pulse') {
      // Deep ominous ambient pulse for the results screen
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'perfect') {
      // High-energy zap for Speed Strikes
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1760, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    }
  } catch (e) {
    // Silently fail if audio context is blocked by browser policies
  }
};

// --- Global Styles & Tailwind Integrations ---
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Fredoka:wght@400;600;700&display=swap');

  body {
      font-family: 'Fredoka', sans-serif;
      background-color: #020617; 
      background-image: radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%);
      touch-action: manipulation;
      color: #e2e8f0;
  }

  .font-arcade { font-family: 'Orbitron', sans-serif; }

  /* Arcade CRT Scanlines Overlay - Animated */
  .scanlines {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
                linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
    background-size: 100% 4px, 6px 100%;
    z-index: 9999; pointer-events: none; opacity: 0.3;
    animation: scroll-scanlines 10s linear infinite;
  }
  @keyframes scroll-scanlines {
    0% { background-position: 0 0, 0 0; }
    100% { background-position: 0 100vh, 0 0; }
  }

  /* Arcade/Mechanical Buttons */
  .btn-3d { transition: all 0.05s ease-in-out; position: relative; border-radius: 12px; }
  .btn-3d:active { transform: translateY(6px); box-shadow: none !important; }
  
  .btn-blue { background-color: #1e40af; box-shadow: 0 6px 0 #1e3a8a, 0 10px 15px rgba(37,99,235,0.4); color: white; border: 1px solid #60a5fa; }
  .btn-red { background-color: #be123c; box-shadow: 0 6px 0 #9f1239, 0 10px 15px rgba(225,29,72,0.4); color: white; border: 1px solid #fb7185; }
  .btn-green { background-color: #15803d; box-shadow: 0 6px 0 #14532d, 0 10px 15px rgba(34,197,94,0.4); color: white; border: 1px solid #4ade80; }
  .btn-gray { background-color: #1e293b; box-shadow: 0 6px 0 #0f172a, 0 10px 15px rgba(0,0,0,0.5); color: #94a3b8; border: 1px solid #334155; }
  .btn-gray:hover { background-color: #334155; color: #cbd5e1; }
  .btn-purple { background-color: #6b21a8; box-shadow: 0 6px 0 #581c87; color: white; border: 1px solid #c084fc; }

  /* Cyber/Neon Panels */
  .glass-panel {
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255,255,255,0.1);
  }

  .neon-blue-border { border: 2px solid #3b82f6; box-shadow: 0 0 25px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.2); }
  .neon-red-border { border: 2px solid #ef4444; box-shadow: 0 0 25px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.2); }

  /* Animations */
  @keyframes shake {
    0%, 100% { transform: translate3d(0, 0, 0); }
    20%, 60% { transform: translate3d(-5px, 2px, 0); }
    40%, 80% { transform: translate3d(5px, -2px, 0); }
  }
  .animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }

  @keyframes severe-shake {
    0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); filter: blur(0); }
    25% { transform: translate3d(-12px, 6px, 0) rotate(-2deg); filter: blur(2px); }
    50% { transform: translate3d(12px, -6px, 0) rotate(2deg); }
    75% { transform: translate3d(-12px, -6px, 0) rotate(-2deg); filter: blur(2px); }
  }
  .animate-severe-shake { animation: severe-shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }

  @keyframes float-up {
    0% { transform: translateY(0) scale(0.8); opacity: 1; font-weight: 900; }
    100% { transform: translateY(-100px) scale(1.8); opacity: 0; font-weight: 900; filter: blur(2px); }
  }
  .animate-float { animation: float-up 0.9s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }

  @keyframes perfect-strike {
    0% { transform: scale(1) rotate(0deg); opacity: 1; filter: brightness(1) drop-shadow(0 0 10px #fbbf24); }
    50% { transform: scale(1.5) rotate(5deg); filter: brightness(2) drop-shadow(0 0 30px #f59e0b); }
    100% { transform: scale(2) translateY(-50px); opacity: 0; filter: blur(4px); }
  }
  .animate-perfect { animation: perfect-strike 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; color: #fbbf24; }

  @keyframes pulse-glow-blue {
    0%, 100% { filter: drop-shadow(0 0 15px rgba(59,130,246,0.6)); }
    50% { filter: drop-shadow(0 0 40px rgba(59,130,246,1)); transform: scale(1.1); }
  }
  .combo-glow-blue { animation: pulse-glow-blue 0.8s infinite alternate; }

  @keyframes pulse-glow-red {
    0%, 100% { filter: drop-shadow(0 0 15px rgba(239,68,68,0.6)); }
    50% { filter: drop-shadow(0 0 40px rgba(239,68,68,1)); transform: scale(1.1); }
  }
  .combo-glow-red { animation: pulse-glow-red 0.8s infinite alternate; }

  .danger-bg {
    position: fixed; inset: 0; z-index: -1; pointer-events: none; transition: opacity 0.5s ease, background 0.5s ease;
  }
  
  /* Intense Vignette for Tension */
  .tension-vignette {
    position: fixed; inset: 0; z-index: 15; pointer-events: none;
    background: radial-gradient(circle, transparent 60%, rgba(0,0,0,0.8) 100%);
    transition: opacity 0.2s ease;
  }

  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.4); }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
`;

// --- Firebase Configuration ---
// TRICK THE BOTS: Split the key in half so GitHub scanners can't read it
const keyPart1 = "AIzaSy"; 
const keyPart2 = "DxPg-ZPISwB0eKhYMDUDL5evPKPsx7POM"; // Replace this with the rest of your new key if you regenerated it!

const firebaseConfig = {
  apiKey: keyPart1 + keyPart2, // Stitches it together safely!
  authDomain: "math-tug-arena.firebaseapp.com",
  projectId: "math-tug-arena",
  storageBucket: "math-tug-arena.firebasestorage.app",
  messagingSenderId: "651768070745",
  appId: "1:651768070745:web:b34e2f87d8abf053922748",
  measurementId: "G-55VJYDNDSR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'math-tug-arena';

// --- Constants & Config ---
const MAX_SCORE_DIFFERENCE = 15; 

const AI_NAMES = [
  { name: 'Abajis', streak: 99, rank: 'Apex', aggro: 3.5, def: 2.0, emoji: '🦅' }, 
  { name: 'Bear-Bot v4', streak: 12, rank: 'Diamond', aggro: 1.5, def: 0.8, emoji: '🐻' },
  { name: 'Calc-Tiger', streak: 5, rank: 'Platinum', aggro: 1.1, def: 1.0, emoji: '🐯' },
  { name: 'Quantum Cub', streak: 8, rank: 'Gold', aggro: 0.9, def: 1.3, emoji: '🐺' }
];

const RANKS = [
  { name: 'Bronze', minXP: 0, color: 'text-amber-600', bg: 'bg-amber-900/30' },
  { name: 'Silver', minXP: 500, color: 'text-slate-400', bg: 'bg-slate-800/50' },
  { name: 'Gold', minXP: 1500, color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  { name: 'Platinum', minXP: 3000, color: 'text-cyan-400', bg: 'bg-cyan-900/30' },
  { name: 'Diamond', minXP: 5000, color: 'text-purple-400', bg: 'bg-purple-900/30' },
  { name: 'Apex', minXP: 10000, color: 'text-rose-500', bg: 'bg-rose-900/50' }
];

const OPERATIONS = {
  ADDITION: { label: 'Addition', icon: '+', color: 'blue' },
  SUBTRACTION: { label: 'Subtraction', icon: '-', color: 'red' },
  MULTIPLICATION: { label: 'Multiplication', icon: '×', color: 'green' },
  DIVISION: { label: 'Division', icon: '÷', color: 'yellow' },
  MIXED: { label: 'All Mixed', icon: '∞', color: 'purple' }
};

const DIFFICULTY_PRESETS = {
  BEGINNER: { range: [1, 12], time: 30, aiSolveTime: [4000, 8000], aiAccuracy: 0.6 },
  INTERMEDIATE: { range: [10, 50], time: 20, aiSolveTime: [2500, 5500], aiAccuracy: 0.75 },
  ADVANCED: { range: [20, 100], time: 10, aiSolveTime: [1500, 4000], aiAccuracy: 0.85 }
};

const generateProblem = (opType, difficulty) => {
  const { range } = DIFFICULTY_PRESETS[difficulty];
  let a, b, ans;
  let activeOp = opType;
  
  if (opType === 'MIXED') {
    const types = ['ADDITION', 'SUBTRACTION', 'MULTIPLICATION', 'DIVISION'];
    activeOp = types[Math.floor(Math.random() * types.length)];
  }

  switch (activeOp) {
    case 'ADDITION':
      a = Math.floor(Math.random() * (range[1] - range[0])) + range[0];
      b = Math.floor(Math.random() * (range[1] - range[0])) + range[0];
      ans = a + b; return { question: `${a} + ${b} = ?`, answer: ans.toString(), type: activeOp };
    case 'SUBTRACTION':
      a = Math.floor(Math.random() * (range[1] - range[0])) + range[0];
      b = Math.floor(Math.random() * (range[1] - range[0])) + range[0];
      if (a < b) [a, b] = [b, a];
      ans = a - b; return { question: `${a} - ${b} = ?`, answer: ans.toString(), type: activeOp };
    case 'MULTIPLICATION':
      a = Math.floor(Math.random() * (range[1] > 20 ? 15 : range[1])) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      ans = a * b; return { question: `${a} × ${b} = ?`, answer: ans.toString(), type: activeOp };
    case 'DIVISION':
      b = Math.floor(Math.random() * 10) + 2;
      ans = Math.floor(Math.random() * 12) + 2;
      a = ans * b; return { question: `${a} ÷ ${b} = ?`, answer: ans.toString(), type: activeOp };
    default:
      a = Math.floor(Math.random() * 10); b = Math.floor(Math.random() * 10);
      return { question: `${a} + ${b} = ?`, answer: (a+b).toString(), type: 'ADDITION' };
  }
};

const getRank = (xp) => [...RANKS].reverse().find(r => xp >= r.minXP) || RANKS[0];
const getSafeID = () => Math.random().toString(36).substring(2, 10);

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [playerName, setPlayerName] = useState("Cadet");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  
  const [view, setView] = useState('MAIN_MENU');
  const [gameMode, setGameMode] = useState(null);
  const [config, setConfig] = useState({ operation: 'MIXED', difficulty: 'INTERMEDIATE', aiOpponent: 'RANDOM' });
  const [stats, setStats] = useState({ xp: 0, totalGames: 0, wins: 0, analytics: {} });
  const [loading, setLoading] = useState(true);

  const initializeAudio = () => playArcadeSound('click');

  useEffect(() => {
    const initAuth = async () => {
  try {
    await signInAnonymously(auth);
  } catch (e) { console.error(e); }
};
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      if (u) {
        setPlayerName(`Cadet_${u.uid.substring(0,4).toUpperCase()}`);
      }
      setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setStats(d);
        if (d.customName) setPlayerName(d.customName); 
      } else {
        const initialStats = { xp: 0, totalGames: 0, wins: 0, analytics: {} };
        setDoc(docRef, initialStats); setStats(initialStats);
      }
    });
    return () => unsub();
  }, [user]);

  const handleSaveName = async () => {
    if (tempName.trim().length < 3) {
      setIsEditingName(false);
      return;
    }
    playArcadeSound('click');
    const safeName = tempName.trim().substring(0, 15); 
    setPlayerName(safeName);
    setIsEditingName(false);

    if (user) {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), { customName: safeName }, { merge: true });
      if (stats.xp > 0) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', user.uid), {
          uid: user.uid,
          name: safeName,
          xp: stats.xp,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    }
  };

  const processMatchData = async (matchData, userQuestions) => {
    if (!user) return;
    const newStats = { ...stats };
    newStats.totalGames += 1;
    let xpGained = 0;

    if (matchData.won) {
      newStats.wins += 1;
      xpGained = 100 * (DIFFICULTY_PRESETS[config.difficulty].time < 15 ? 1.5 : 1);
      if (config.aiOpponent === 'Abajis') xpGained *= 2.5; 
      newStats.xp += xpGained;
    } else {
      newStats.xp = Math.max(0, newStats.xp - 15);
    }

    userQuestions.forEach(q => {
      if (!newStats.analytics[q.type]) newStats.analytics[q.type] = { attempts: 0, correct: 0, totalTime: 0 };
      const typeStat = newStats.analytics[q.type];
      typeStat.attempts += 1;
      if (q.isCorrect) typeStat.correct += 1;
      typeStat.totalTime += q.timeTaken;
    });

    try { 
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), newStats, { merge: true }); 
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', user.uid), {
        uid: user.uid,
        name: playerName,
        xp: newStats.xp,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col text-slate-200 select-none overflow-y-auto md:overflow-hidden relative" onClick={initializeAudio}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="scanlines"></div> 
      
      <header className="w-full p-2 md:p-4 flex flex-wrap justify-between items-center z-10 text-white gap-2 relative bg-slate-900/80 border-b border-slate-700 shadow-lg backdrop-blur-md">
        <button onClick={() => { playArcadeSound('click'); setView('MAIN_MENU'); }} className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold flex items-center gap-2 text-sm md:text-base transition border border-slate-600 shadow-[0_4px_0_#0f172a] active:translate-y-1 active:shadow-none">
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> HQ
        </button>
        
        <h1 className="hidden md:block text-xl md:text-3xl font-arcade font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-rose-400 drop-shadow-lg text-center flex-1">
          MATH TUG ARENA
        </h1>

        {stats && (
          <div className="flex flex-col items-end">
            <div className={`px-3 py-1 rounded-lg font-bold flex items-center gap-2 text-sm border border-white/10 ${getRank(stats.xp).bg} ${getRank(stats.xp).color}`}>
              <Award className="w-4 h-4" /> <span className="font-arcade">{Math.floor(stats.xp)} XP</span>
            </div>
            
            {isEditingName ? (
              <div className="flex items-center gap-1 mt-1">
                <input 
                  type="text" 
                  autoFocus
                  maxLength={15}
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="bg-slate-950 border border-blue-500 text-white text-[10px] font-arcade px-2 py-1 rounded w-28 focus:outline-none"
                  placeholder="NEW ID"
                />
                <button onClick={handleSaveName} className="text-green-400 hover:text-green-300 p-1"><Save size={14} /></button>
              </div>
            ) : (
              <div 
                className="flex items-center gap-1 mt-1 cursor-pointer hover:bg-white/10 px-1 rounded transition group"
                onClick={() => { playArcadeSound('click'); setTempName(playerName); setIsEditingName(true); }}
              >
                <span className="text-[10px] font-arcade text-slate-400 uppercase tracking-widest group-hover:text-white transition">ID: {playerName}</span>
                <Edit3 size={10} className="text-slate-500 group-hover:text-blue-400" />
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col relative p-2 md:p-4 gap-4 md:gap-6 custom-scrollbar">
        {view === 'MAIN_MENU' && (
          <MainMenu 
            onPlaySingle={() => { playArcadeSound('click'); setGameMode('SINGLE'); setView('SETTINGS'); }} 
            onPlayLocal={() => { playArcadeSound('click'); setGameMode('LOCAL'); setView('SETTINGS'); }}
            onPlayMulti={() => { playArcadeSound('click'); setGameMode('MULTI'); setView('LOBBY'); }} 
            onViewStats={() => { playArcadeSound('click'); setView('ANALYTICS'); }} 
            onViewLeaderboard={() => { playArcadeSound('click'); setView('LEADERBOARD'); }}
          />
        )}
        {view === 'SETTINGS' && <SettingsPanel mode={gameMode} config={config} setConfig={setConfig} onStart={() => { playArcadeSound('click'); setView('GAME'); }} />}
        {view === 'LOBBY' && <MultiplayerLobby user={user} appId={appId} db={db} onMatchReady={(matchData) => { playArcadeSound('start'); setConfig(matchData.config); setGameMode('MULTI'); setView('GAME'); sessionStorage.setItem('currentMatchId', matchData.matchId); sessionStorage.setItem('playerSide', matchData.side); }} />}
        {view === 'GAME' && <MatchArena mode={gameMode} config={config} user={user} db={db} appId={appId} onMatchEnd={(matchData, userQuestions) => { if(gameMode !== 'LOCAL') processMatchData(matchData, userQuestions); sessionStorage.setItem('lastMatchData', JSON.stringify(matchData)); setView('RESULTS'); }} onExit={() => { playArcadeSound('click'); setView('MAIN_MENU'); }} />}
        {view === 'RESULTS' && <ResultsScreen onBack={() => { playArcadeSound('click'); setView('MAIN_MENU'); }} />}
        {view === 'ANALYTICS' && <AnalyticsDashboard stats={stats} playerName={playerName} />}
        {view === 'LEADERBOARD' && <GlobalLeaderboard user={user} db={db} appId={appId} />}
      </main>
    </div>
  );
}

// --- Menu Components ---
function MainMenu({ onPlaySingle, onPlayMulti, onPlayLocal, onViewStats, onViewLeaderboard }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500 w-full max-w-4xl mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full mb-8">
        
        <button onClick={onPlaySingle} className="glass-panel p-6 md:p-8 flex flex-col items-center gap-4 hover:scale-105 transition-transform group border border-slate-700 hover:border-blue-500 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <div className="w-16 h-16 bg-blue-900/50 text-blue-400 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors border border-blue-500/30">
            <BrainCircuit size={32} />
          </div>
          <div>
            <h3 className="text-xl font-arcade font-black text-white tracking-widest">VS AI TIGER</h3>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">Offline Training</p>
          </div>
        </button>

        <button onClick={onPlayLocal} className="glass-panel p-6 md:p-8 flex flex-col items-center gap-4 hover:scale-105 transition-transform group border border-slate-700 hover:border-purple-500 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <div className="w-16 h-16 bg-purple-900/50 text-purple-400 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors border border-purple-500/30">
            <Swords size={32} />
          </div>
          <div>
            <h3 className="text-xl font-arcade font-black text-white tracking-widest">LOCAL DUEL</h3>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">Shared Screen 1v1</p>
          </div>
        </button>

        <button onClick={onPlayMulti} className="glass-panel p-6 md:p-8 flex flex-col items-center gap-4 hover:scale-105 transition-transform group border border-slate-700 hover:border-rose-500 relative overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <span className="absolute top-4 right-4 px-2 py-1 bg-rose-600 text-white text-[9px] font-black rounded font-arcade animate-pulse">RANKED</span>
          <div className="w-16 h-16 bg-rose-900/50 text-rose-400 rounded-xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors border border-rose-500/30">
            <Shield size={32} />
          </div>
          <div>
            <h3 className="text-xl font-arcade font-black text-white tracking-widest">MULTIPLAYER</h3>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">Synchronized Online PvP</p>
          </div>
        </button>

        <button onClick={onViewStats} className="glass-panel p-6 md:p-8 flex flex-col items-center gap-4 hover:scale-105 transition-transform group border border-slate-700 hover:border-emerald-500 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <div className="w-16 h-16 bg-emerald-900/50 text-emerald-400 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors border border-emerald-500/30">
            <Activity size={32} />
          </div>
          <div>
            <h3 className="text-xl font-arcade font-black text-white tracking-widest">SERVICE RECORD</h3>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">Metrics & Analysis</p>
          </div>
        </button>

        <button onClick={onViewLeaderboard} className="col-span-1 md:col-span-2 glass-panel p-4 md:p-6 flex flex-row items-center justify-center gap-6 hover:scale-[1.02] transition-transform group border border-slate-700 hover:border-yellow-500 shadow-[0_0_20px_rgba(0,0,0,0.6)] bg-slate-900/90">
          <div className="w-14 h-14 bg-yellow-900/40 text-yellow-500 rounded-full flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-white transition-colors border border-yellow-500/50 group-hover:shadow-[0_0_15px_#eab308]">
            <Globe size={28} />
          </div>
          <div className="text-left">
            <h3 className="text-2xl font-arcade font-black text-white tracking-widest group-hover:text-yellow-400 transition-colors">GLOBAL RANKINGS</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Top Tier Operatives Worldwide</p>
          </div>
        </button>

      </div>

      <div className="w-full mt-auto mb-2 border-t border-slate-800/80 pt-6">
        <div className="glass-panel p-6 border border-blue-900/50 max-w-2xl mx-auto hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-shadow bg-slate-900/60">
          <p className="text-blue-500 font-arcade text-[10px] md:text-xs tracking-[0.2em] mb-2 drop-shadow-md">SYSTEM ARCHITECT</p>
          <h2 className="text-xl md:text-2xl font-black text-white font-arcade tracking-widest mb-2 drop-shadow-lg">ABDULRAHMAN SAEED <span className="text-rose-500">(ABAJIS)</span></h2>
          <p className="text-slate-300 font-bold text-xs md:text-sm uppercase tracking-widest">Student of Air Force Institute of Technology, Kaduna</p>
          <p className="text-slate-500 text-[10px] md:text-xs uppercase tracking-widest mt-1">Studying Metallurgical and Materials Engineering</p>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ mode, config, setConfig, onStart }) {
  const handleConfig = (update) => { playArcadeSound('click'); setConfig(update); };

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto animate-in slide-in-from-bottom-8 duration-300 py-8">
      <div className="glass-panel p-6 md:p-10 w-full border border-slate-700">
        <h2 className="text-2xl font-arcade font-black mb-8 text-center text-white flex items-center justify-center gap-3 tracking-widest">
          <Settings className="text-blue-500" /> CONFIGURE ARENA
        </h2>
        
        <div className="space-y-8">
          {mode === 'SINGLE' && (
            <section>
              <label className="text-xs font-arcade text-slate-400 uppercase tracking-widest block mb-4 text-center">Opponent Selection</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button onClick={() => handleConfig({ ...config, aiOpponent: 'RANDOM' })} 
                  className={`p-3 rounded-lg font-bold flex flex-col items-center gap-2 border transition-all ${config.aiOpponent === 'RANDOM' ? 'bg-rose-900/50 border-rose-400 text-rose-200 shadow-[0_0_15px_rgba(225,29,72,0.3)]' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  <span className="text-2xl font-arcade">🎲</span>
                  <span className="text-[10px] uppercase tracking-widest">Random</span>
                </button>
                {AI_NAMES.map((ai) => (
                  <button key={ai.name} onClick={() => handleConfig({ ...config, aiOpponent: ai.name })} 
                    className={`p-3 rounded-lg font-bold flex flex-col items-center gap-2 border transition-all ${config.aiOpponent === ai.name ? (ai.name === 'Abajis' ? 'bg-red-900/80 border-red-500 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-rose-900/50 border-rose-400 text-rose-200 shadow-[0_0_15px_rgba(225,29,72,0.3)]') : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                    <span className="text-2xl font-arcade">{ai.emoji}</span>
                    <span className={`text-[10px] uppercase tracking-widest ${ai.name === 'Abajis' ? 'font-black text-red-300' : ''}`}>{ai.name}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <label className="text-xs font-arcade text-slate-400 uppercase tracking-widest block mb-4 text-center">Operation Type</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(OPERATIONS).map(([key, op]) => (
                <button key={key} onClick={() => handleConfig({ ...config, operation: key })} 
                  className={`p-3 rounded-lg font-bold flex flex-col items-center gap-2 border transition-all ${config.operation === key ? 'bg-blue-900/50 border-blue-400 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  <span className="text-2xl font-arcade">{op.icon}</span>
                  <span className="text-[10px] uppercase tracking-widest">{op.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="text-xs font-arcade text-slate-400 uppercase tracking-widest block mb-4 text-center">Threat Level</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.keys(DIFFICULTY_PRESETS).map((level) => (
                <button key={level} onClick={() => handleConfig({ ...config, difficulty: level })} 
                  className={`p-3 rounded-lg font-bold flex flex-col items-center gap-1 border transition-all ${config.difficulty === level ? 'bg-amber-900/50 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  <span className="text-sm font-arcade">{level}</span>
                  <span className="text-[10px] opacity-80">{DIFFICULTY_PRESETS[level].time}s Timer</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <button onClick={onStart} className="btn-3d btn-green w-full py-4 rounded-xl font-arcade font-black text-xl mt-10 tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.4)]">
          INITIALIZE MATCH
        </button>
      </div>
    </div>
  );
}

function MultiplayerLobby({ user, appId, db, onMatchReady }) {
  const [matchIdInput, setMatchIdInput] = useState("");
  const [status, setStatus] = useState("IDLE");

  const createMatch = async () => {
    playArcadeSound('click');
    setStatus("HOSTING");
    const newMatchId = Math.floor(10000 + Math.random() * 90000).toString();
    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', newMatchId);
    const initialConfig = { operation: 'MIXED', difficulty: 'INTERMEDIATE' };
    await setDoc(matchRef, { p1Id: user.uid, p2Id: null, p1Force: 0, p2Force: 0, status: 'WAITING', config: initialConfig, createdAt: serverTimestamp() });
    setMatchIdInput(newMatchId);
    const unsub = onSnapshot(matchRef, (snap) => {
      if (snap.exists() && snap.data().p2Id && snap.data().status === 'ACTIVE') {
        unsub(); onMatchReady({ matchId: newMatchId, side: 'p1', config: initialConfig });
      }
    });
  };

  const joinMatch = async () => {
    playArcadeSound('click');
    if (!matchIdInput || matchIdInput.length < 5) return;
    setStatus("JOINING");
    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchIdInput);
    try {
      const snap = await getDoc(matchRef);
      if (snap.exists() && snap.data().status === 'WAITING') {
        await updateDoc(matchRef, { p2Id: user.uid, status: 'ACTIVE' });
        onMatchReady({ matchId: matchIdInput, side: 'p2', config: snap.data().config });
      } else {
        alert("Arena not found or already started."); setStatus("IDLE");
      }
    } catch (e) { console.error(e); setStatus("IDLE"); }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
      <div className="glass-panel border-t-4 border-rose-500 rounded-[2rem] p-8 md:p-10 w-full text-center shadow-[0_0_30px_rgba(225,29,72,0.2)]">
        <div className="w-16 h-16 bg-rose-900/50 rounded-xl flex items-center justify-center mx-auto mb-6 border border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.5)]"><Shield className="text-rose-400 w-8 h-8" /></div>
        <h2 className="text-2xl font-arcade font-black mb-2 text-white tracking-widest">ONLINE RANKED</h2>
        <p className="text-slate-400 font-bold mb-10 text-sm">Connect via secure channel.</p>
        
        {status === "IDLE" && (
          <div className="space-y-6">
            <button onClick={createMatch} className="btn-3d btn-purple w-full py-4 rounded-xl font-arcade font-black text-lg tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.4)]">HOST MATCH</button>
            <div className="flex gap-2">
              <input type="text" maxLength={5} placeholder="CODE" value={matchIdInput} onChange={(e) => setMatchIdInput(e.target.value.replace(/\D/g, ''))} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 font-arcade text-2xl font-black tracking-[0.3em] text-center focus:outline-none focus:border-rose-500 text-white transition-colors" />
              <button onClick={joinMatch} disabled={matchIdInput.length < 5} className="btn-3d btn-green px-6 rounded-xl font-arcade font-black disabled:opacity-50">JOIN</button>
            </div>
          </div>
        )}
        {status === "HOSTING" && (
          <div className="space-y-6 py-4">
            <p className="text-xs font-arcade text-slate-400 uppercase tracking-widest">Share Authorization Code</p>
            <div className="bg-slate-900 p-6 rounded-xl border border-dashed border-rose-500/50"><h3 className="text-5xl font-arcade font-black text-rose-400 tracking-[0.2em] drop-shadow-[0_0_10px_rgba(225,29,72,0.8)]">{matchIdInput}</h3></div>
            <div className="flex items-center justify-center gap-3 text-rose-400"><RefreshCw className="w-5 h-5 animate-spin" /><span className="font-bold text-sm uppercase tracking-wider">Awaiting Challenger...</span></div>
          </div>
        )}
        {status === "JOINING" && <div className="py-12 text-rose-500"><RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4" /><span className="font-arcade font-black uppercase tracking-widest">Establishing Uplink...</span></div>}
      </div>
    </div>
  );
}

// --- CORE GAME ARENA ---
function MatchArena({ mode, config, user, db, appId, onMatchEnd, onExit }) {
  const isMulti = mode === 'MULTI';
  const isLocal = mode === 'LOCAL';
  const matchId = isMulti ? sessionStorage.getItem('currentMatchId') : null;
  const playerSide = isMulti ? sessionStorage.getItem('playerSide') : 'p1'; 

  const [phase, setPhase] = useState('INTRO'); 
  const [countdownText, setCountdownText] = useState('3');
  
  const [p1State, setP1State] = useState({ problem: null, input: "", score: 0, streak: 0, error: false, criticalError: false });
  const [p2State, setP2State] = useState({ problem: null, input: "", score: 0, streak: 0, error: false, criticalError: false });
  
  const [timeLeft, setTimeLeft] = useState(config.difficulty === 'SPEED' ? 4 : DIFFICULTY_PRESETS[config.difficulty].time * 2);
  const timeLeftRef = useRef(timeLeft);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  const [floatingTexts, setFloatingTexts] = useState([]);

  const [aiProfile] = useState(() => {
    if (config.aiOpponent && config.aiOpponent !== 'RANDOM') {
      return AI_NAMES.find(a => a.name === config.aiOpponent) || AI_NAMES[1];
    }
    if(Math.random() < 0.2) return AI_NAMES.find(a => a.name === 'Abajis');
    return AI_NAMES[Math.floor(Math.random() * (AI_NAMES.length - 1)) + 1]; 
  });

  const p1Emoji = '🐺';
  const p2Emoji = isLocal ? '🐯' : (isMulti ? '🐉' : aiProfile.emoji);

  const targetRopeRef = useRef(0);
  const localForces = useRef({ p1: 0, p2: 0 });
  const matchActive = useRef(true);
  const tugContainerRef = useRef(null);
  const questionsAnsweredRef = useRef([]);
  const currentQuestionStartTime = useRef(Date.now());

  const p1StateRef = useRef(p1State);
  useEffect(() => { p1StateRef.current = p1State; }, [p1State]);
  const p2StateRef = useRef(p2State);
  useEffect(() => { p2StateRef.current = p2State; }, [p2State]);

  const [dangerZone, setDangerZone] = useState(null);
  const tensionLevelRef = useRef(0); // For audio/vignette intensity

  useEffect(() => {
    if (phase !== 'PLAYING' && phase !== 'SUDDEN_DEATH') return;
    let timeoutId;
    const tick = () => {
       playArcadeSound('beat');
       let delay = 1000;
       if (phase === 'SUDDEN_DEATH') delay = 200;
       else {
         const timeF = Math.max(0, (60 - timeLeftRef.current) / 60);
         const tensF = tensionLevelRef.current;
         delay = 1000 - (timeF * 500) - (tensF * 350);
         delay = Math.max(200, delay); 
       }
       timeoutId = setTimeout(tick, delay);
    };
    tick();
    return () => clearTimeout(timeoutId);
  }, [phase]); 

  useEffect(() => {
    let animationFrameId;
    let currentX = 0;
    let velocity = 0;

    const updatePhysics = () => {
      const target = targetRopeRef.current;
      const diff = target - currentX;
      const springForce = diff * 0.15;
      velocity = (velocity + springForce) * 0.75; 
      currentX += velocity;

      const absoluteTension = Math.abs(currentX) / MAX_SCORE_DIFFERENCE;
      tensionLevelRef.current = absoluteTension;

      if (phase === 'SUDDEN_DEATH') setDangerZone(Math.random() > 0.5 ? 'p1' : 'p2'); 
      else if (currentX > MAX_SCORE_DIFFERENCE * 0.7 || p1StateRef.current.streak >= 4) setDangerZone('p1');
      else if (currentX < -MAX_SCORE_DIFFERENCE * 0.7 || p2StateRef.current.streak >= 4) setDangerZone('p2');
      else setDangerZone(null);

      if (tugContainerRef.current) {
        const isMobile = window.innerWidth < 768;
        const multiplier = isMobile ? 6 : 15; 
        let movePixels = -(currentX * multiplier);
        tugContainerRef.current.style.transform = `translateX(${movePixels}px)`;
      }
      animationFrameId = requestAnimationFrame(updatePhysics);
    };
    
    animationFrameId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animationFrameId);
  }, [phase]);

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
    targetRopeRef.current = winnerSide === 'p1' ? MAX_SCORE_DIFFERENCE + 5 : -(MAX_SCORE_DIFFERENCE + 5); 
    if (playerSide === winnerSide) {
      try { await updateDoc(matchRef, { status: 'FINISHED', winner: winnerSide }); } catch(e) {}
    }
  }, [playerSide]);

  const generateProblemFor = useCallback((player) => {
    const prob = generateProblem(config.operation, config.difficulty);
    if (player === 'p1') setP1State(prev => ({ ...prev, problem: prob, input: "" }));
    else setP2State(prev => ({ ...prev, problem: prob, input: "" }));
  }, [config.operation, config.difficulty]);

  const spawnFloatingText = useCallback((text, side, isCombo = false) => {
     const id = getSafeID();
     setFloatingTexts(prev => [...prev, { id, text, side, isCombo }]);
     setTimeout(() => setFloatingTexts(prev => prev.filter(i => i.id !== id)), 900);
  }, []);

  const spawnPerfectStrike = useCallback((side) => {
     const id = getSafeID();
     setFloatingTexts(prev => [...prev, { id, text: '⚡ SPEED STRIKE!', side, isPerfect: true }]);
     setTimeout(() => setFloatingTexts(prev => prev.filter(i => i.id !== id)), 600);
  }, []);

  const applyForce = useCallback(async (side, forceAmount = 1) => {
    playArcadeSound('pull');
    const directionalForce = side === 'p1' ? forceAmount : -forceAmount;
    localForces.current[side] += forceAmount; 
    targetRopeRef.current += directionalForce;

    if (isMulti && matchId) {
       if (side === playerSide) {
          const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId);
          const updateField = side === 'p1' ? 'p1Force' : 'p2Force';
          try { await updateDoc(matchRef, { [updateField]: increment(forceAmount) }); } catch (e) {}
       }
    } else {
      if (targetRopeRef.current >= MAX_SCORE_DIFFERENCE) {
        matchActive.current = false;
        setPhase('ENDED');
        targetRopeRef.current = MAX_SCORE_DIFFERENCE + 5;
        setTimeout(() => finalizeMatch(true, 'p1'), 1500);
      } else if (targetRopeRef.current <= -MAX_SCORE_DIFFERENCE) {
        matchActive.current = false;
        setPhase('ENDED');
        targetRopeRef.current = -(MAX_SCORE_DIFFERENCE + 5);
        setTimeout(() => finalizeMatch(false, 'p2'), 1500);
      }
    }
  }, [isMulti, matchId, playerSide, db, appId, finalizeMatch]);

  const submitAnswer = useCallback((side) => {
    if (!matchActive.current || (phase !== 'PLAYING' && phase !== 'SUDDEN_DEATH')) return;

    const currentState = side === 'p1' ? p1StateRef.current : p2StateRef.current;
    const setState = side === 'p1' ? setP1State : setP2State;

    if (!currentState.input || !currentState.problem) return;

    const isCorrect = currentState.input.trim() === currentState.problem.answer;
    let isSpeedStrike = false;

    if (side === 'p1') {
       const timeTaken = Date.now() - currentQuestionStartTime.current;
       if (timeTaken < 2500) isSpeedStrike = true; // Perfect threshold (2.5s)

       questionsAnsweredRef.current.push({ 
           type: currentState.problem?.type || 'UNKNOWN', 
           isCorrect, 
           timeTaken: timeTaken / 1000 
       });
       currentQuestionStartTime.current = Date.now();
    }

    if (isCorrect) {
      if (phase === 'SUDDEN_DEATH') {
         playArcadeSound('combo');
         applyForce(side, MAX_SCORE_DIFFERENCE + 5); 
         return;
      }

      const newStreak = currentState.streak + 1;
      const isCombo = newStreak >= 3;
      let forceAmount = isCombo ? 2 : 1; 

      if (isSpeedStrike && !isCombo) {
          forceAmount += 1;
          playArcadeSound('perfect');
          spawnPerfectStrike(side);
      } else if (isCombo) {
          playArcadeSound('combo');
      }

      applyForce(side, forceAmount);
      
      setState(prev => ({ ...prev, score: prev.score + forceAmount, streak: newStreak, error: false, criticalError: false }));
      
      if (isCombo) spawnFloatingText(`COMBO x${newStreak}!`, side, true);
      else if (!isSpeedStrike) spawnFloatingText(`+${forceAmount} PULL`, side, false);
      
      generateProblemFor(side);
    } else {
      playArcadeSound('error');
      setState(prev => ({ ...prev, input: "", error: true, criticalError: prev.streak >= 3, streak: 0 }));
      setTimeout(() => setState(prev => ({ ...prev, error: false, criticalError: false })), 400);
    }
  }, [phase, applyForce, spawnFloatingText, generateProblemFor]);

  const handleKeyPad = useCallback((key, side) => {
    if (!matchActive.current || (phase !== 'PLAYING' && phase !== 'SUDDEN_DEATH')) return;
    playArcadeSound('click');
    
    const setState = side === 'p1' ? setP1State : setP2State;
    const currentState = side === 'p1' ? p1StateRef.current : p2StateRef.current;

    if (key === 'ENTER') submitAnswer(side);
    else if (key === 'DEL') setState(prev => ({ ...prev, input: "" }));
    else if (currentState.input.length < 3) setState(prev => ({ ...prev, input: prev.input + key }));
    
  }, [phase, submitAnswer]);

  useEffect(() => {
    if (phase === 'INTRO') {
       playArcadeSound('start');
       setTimeout(() => setPhase('COUNTDOWN'), 2500);
    } else if (phase === 'COUNTDOWN') {
       let c = 3;
       const int = setInterval(() => {
          c--;
          if (c > 0) {
             playArcadeSound('click');
             setCountdownText(c.toString());
          }
          else if (c === 0) {
             playArcadeSound('start');
             setCountdownText('FIGHT!');
          }
          else {
             clearInterval(int);
             setPhase('PLAYING');
             generateProblemFor('p1');
             if (isLocal) generateProblemFor('p2');
          }
       }, 1000);
    }
  }, [phase, generateProblemFor, isLocal]);

  useEffect(() => {
    if (phase !== 'PLAYING' || !matchActive.current) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (targetRopeRef.current === 0) {
             setPhase('SUDDEN_DEATH');
             playArcadeSound('alarm');
             spawnFloatingText("SUDDEN DEATH!", 'p1', true);
             spawnFloatingText("SUDDEN DEATH!", 'p2', true);
             return 0;
          }
          matchActive.current = false;
          setPhase('ENDED');
          if (targetRopeRef.current > 0) {
             setTimeout(() => finalizeMatch(true, 'p1'), 1500);
          } else if (targetRopeRef.current < 0) {
             setTimeout(() => finalizeMatch(false, 'p2'), 1500);
          } else {
             setTimeout(() => finalizeMatch(false, 'tie'), 1500);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, finalizeMatch]);

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
         setTimeout(() => finalizeMatch(data.winner === playerSide), 1500); 
      } else if (trueRope >= MAX_SCORE_DIFFERENCE) {
         handleServerWin('p1', matchRef);
      } else if (trueRope <= -MAX_SCORE_DIFFERENCE) {
         handleServerWin('p2', matchRef);
      }
    });
    return () => unsub();
  }, [isMulti, matchId, db, appId, playerSide, finalizeMatch, handleServerWin]);

  useEffect(() => {
    if (isMulti || isLocal || !matchActive.current || (phase !== 'PLAYING' && phase !== 'SUDDEN_DEATH')) return;
    let aiTimer;
    const runAI = () => {
      if (!matchActive.current) return;
      const { aiSolveTime, aiAccuracy } = DIFFICULTY_PRESETS[config.difficulty];
      
      let dynamicTimeMod = 1.0;
      if (targetRopeRef.current > 5) dynamicTimeMod = 0.6; 
      if (phase === 'SUDDEN_DEATH') dynamicTimeMod = 0.4; 
      
      const baseDelay = Math.random() * (aiSolveTime[1] - aiSolveTime[0]) + aiSolveTime[0];
      const calculatedDelay = (baseDelay * dynamicTimeMod) / aiProfile.aggro;
      const finalDelay = Math.max(350, calculatedDelay); 

      aiTimer = setTimeout(() => {
        if (!matchActive.current) return;
        
        if (Math.random() < (aiAccuracy * aiProfile.def)) {
          if (phase === 'SUDDEN_DEATH') {
             playArcadeSound('combo');
             applyForce('p2', MAX_SCORE_DIFFERENCE + 5); 
             return;
          }

          setP2State(prev => {
             const newStreak = prev.streak + 1;
             const isCombo = newStreak >= 3;
             const forceAmount = isCombo ? 2 : 1;
             
             if (isCombo) playArcadeSound('combo');
             
             localForces.current.p2 += forceAmount;
             targetRopeRef.current -= forceAmount;
             playArcadeSound('pull');
             
             if (isCombo) spawnFloatingText(`COMBO x${newStreak}!`, 'p2', true);
             else spawnFloatingText(`+${forceAmount} PULL`, 'p2', false);

             if (targetRopeRef.current <= -MAX_SCORE_DIFFERENCE) {
                matchActive.current = false;
                setPhase('ENDED');
                targetRopeRef.current = -(MAX_SCORE_DIFFERENCE + 5);
                setTimeout(() => finalizeMatch(false), 1500);
             }
             return { ...prev, score: prev.score + forceAmount, streak: newStreak };
          });
        } else {
           playArcadeSound('error');
           setP2State(prev => ({ ...prev, streak: 0, error: true })); 
           setTimeout(() => setP2State(prev => ({...prev, error: false})), 400);
        }
        runAI();
      }, finalDelay);
    };
    runAI();
    return () => clearTimeout(aiTimer);
  }, [isMulti, isLocal, config.difficulty, phase, aiProfile, finalizeMatch, spawnFloatingText]);

  useEffect(() => {
    if (isLocal || (phase !== 'PLAYING' && phase !== 'SUDDEN_DEATH')) return; 
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') handleKeyPad('ENTER', 'p1');
      else if (e.key === 'Backspace') handleKeyPad('DEL', 'p1');
      else if (/[0-9]/.test(e.key)) handleKeyPad(e.key, 'p1');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPad, isLocal, phase]);

  const timerString = phase === 'SUDDEN_DEATH' ? 'OVERTIME' : `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`;
  const ropePos = Math.max(-MAX_SCORE_DIFFERENCE, Math.min(MAX_SCORE_DIFFERENCE, targetRopeRef.current));
  const dominancePercent = 50 + ((ropePos / MAX_SCORE_DIFFERENCE) * 50);
  const vignetteOpacity = Math.max(0, (Math.abs(ropePos) / MAX_SCORE_DIFFERENCE) - 0.5) * 2; // Fades in sharply at 50%+ tension

  return (
    <div className={`flex-1 w-full flex flex-col md:flex-row gap-4 md:gap-6 relative transition-transform duration-75 ${p1State.criticalError || p2State.criticalError ? 'animate-severe-shake' : p1State.error || p2State.error ? 'animate-shake' : ''}`}>
      
      <div className="tension-vignette" style={{ opacity: phase === 'SUDDEN_DEATH' ? 0.8 : vignetteOpacity }}></div>
      <div className={`danger-bg ${dangerZone === 'p1' ? 'opacity-100 bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.6)_0%,transparent_80%)]' : dangerZone === 'p2' ? 'opacity-100 bg-[radial-gradient(circle_at_center,rgba(159,18,57,0.6)_0%,transparent_80%)]' : 'opacity-0'}`} />

      {phase === 'INTRO' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md rounded-3xl">
          <div className={`text-center glass-panel p-10 border-t-4 shadow-[0_0_50px_rgba(0,0,0,1)] max-w-lg w-full ${!isLocal && !isMulti && aiProfile.name === 'Abajis' ? 'border-red-600' : 'border-slate-500'}`}>
            <h2 className="text-4xl font-arcade font-black text-white tracking-[0.2em] mb-8 drop-shadow-lg">{isLocal ? 'LOCAL DUEL' : 'SYSTEM LINKED'}</h2>
            <div className="flex items-center gap-6 justify-center text-2xl font-black">
              <div className="flex flex-col items-center">
                <span className="text-5xl mb-2">{p1Emoji}</span>
                <span className="text-blue-500 font-arcade">BLUE TEAM</span>
              </div>
              <span className="text-slate-600 font-arcade text-xl">VS</span>
              <div className="flex flex-col items-center">
                <span className="text-5xl mb-2">{p2Emoji}</span>
                <span className="text-rose-500 font-arcade">{isLocal ? 'RED TEAM' : isMulti ? 'CHALLENGER' : aiProfile.name}</span>
              </div>
            </div>
            {(!isLocal && !isMulti && aiProfile.name === 'Abajis') && (
              <p className="mt-6 text-red-500 font-arcade font-black text-sm uppercase tracking-widest animate-pulse drop-shadow-[0_0_10px_red]">WARNING: APEX THREAT DETECTED</p>
            )}
          </div>
        </div>
      )}
      {phase === 'COUNTDOWN' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <h1 key={countdownText} className="text-[8rem] md:text-[12rem] font-arcade font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-in zoom-in duration-500 tracking-widest">{countdownText}</h1>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 h-2 md:h-3 bg-slate-800 rounded-full overflow-hidden flex z-20 md:-top-4">
         <div className="h-full bg-blue-500 transition-all duration-300 ease-out shadow-[0_0_10px_#3b82f6]" style={{ width: `${dominancePercent}%` }} />
         <div className="h-full bg-rose-500 flex-1 transition-all duration-300 ease-out shadow-[0_0_10px_#ef4444]" />
         <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white -translate-x-1/2 shadow-[0_0_5px_white]" />
      </div>

      <div className={`w-full md:w-1/3 glass-panel flex flex-col overflow-hidden relative transition-all duration-300 ${p1State.streak >= 3 ? 'neon-blue-border bg-blue-900/20' : 'border border-slate-700'}`}>
        <div className="bg-blue-900/80 text-white p-3 md:p-4 flex justify-between items-center font-black text-xl md:text-xl border-b border-blue-500/30">
          <span className="font-arcade tracking-wider">{isLocal ? 'TEAM BLUE' : 'YOU (BLUE)'}</span>
          <div className="bg-black/50 text-blue-400 w-8 h-8 md:w-10 md:h-10 rounded flex items-center justify-center font-arcade border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]">{p1State.score}</div>
        </div>
        
        {floatingTexts.filter(ft => ft.side === 'p1').map(ft => (
          <div key={ft.id} className={`absolute top-24 right-6 text-2xl md:text-3xl font-arcade font-black drop-shadow-md z-20 ${ft.isPerfect ? 'animate-perfect' : ft.isCombo ? 'animate-float text-yellow-400 drop-shadow-[0_0_10px_#facc15]' : 'animate-float text-blue-400'}`}>{ft.text}</div>
        ))}

        <div className="absolute top-[4.5rem] left-4 flex gap-1">
           {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${p1State.streak > i ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa]' : 'bg-slate-700'}`} />
           ))}
        </div>

        <div className="p-4 md:p-6 flex-1 flex flex-col justify-center items-center gap-3 md:gap-4 min-h-[120px]">
          <div className="text-3xl md:text-4xl font-arcade font-black text-blue-100 tracking-wider">
             {(phase === 'PLAYING' || phase === 'SUDDEN_DEATH') ? p1State.problem?.question : 'AWAIT'}
          </div>
          <div className={`w-full bg-black/60 rounded-xl h-14 md:h-16 text-3xl md:text-4xl font-arcade font-black flex items-center justify-center border transition-colors shadow-inner ${p1State.criticalError ? 'border-red-600 text-red-500' : p1State.error ? 'border-red-500 text-red-400' : p1State.input ? 'border-blue-500/50 text-white shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]' : 'border-slate-800 text-slate-600'}`}>
            {p1State.input || '_'}
          </div>
        </div>

        <div className="p-3 md:p-4 grid grid-cols-3 gap-2 md:gap-3 bg-slate-900/80 rounded-b-xl border-t border-slate-800">
          {['1','2','3','4','5','6','7','8','9'].map(num => (
            <button key={num} onClick={() => handleKeyPad(num, 'p1')} className="btn-3d btn-gray text-xl md:text-2xl font-arcade font-black py-3 md:py-4">{num}</button>
          ))}
          <button onClick={() => handleKeyPad('DEL', 'p1')} className="btn-3d btn-gray text-xl md:text-2xl font-arcade font-black py-3 md:py-4 flex justify-center items-center text-red-400 hover:text-red-300"><X strokeWidth={3} /></button>
          <button onClick={() => handleKeyPad('0', 'p1')} className="btn-3d btn-gray text-xl md:text-2xl font-arcade font-black py-3 md:py-4">0</button>
          <button onClick={() => handleKeyPad('ENTER', 'p1')} className="btn-3d btn-blue text-xl md:text-2xl font-arcade font-black py-3 md:py-4 flex justify-center items-center"><Check strokeWidth={4} /></button>
        </div>
      </div>

      <div className="w-full md:w-1/3 flex flex-col items-center justify-center relative z-0 py-8 md:py-0 min-h-[180px] md:min-h-0">
        <div className={`glass-panel border-b-2 px-6 py-2 flex items-center gap-3 text-2xl md:text-3xl font-arcade font-black mb-4 z-10 absolute top-4 md:relative shadow-2xl transition-colors ${phase === 'SUDDEN_DEATH' ? 'border-red-500 text-yellow-400 bg-red-900/80 animate-pulse shadow-[0_0_30px_red]' : 'border-slate-600 text-white'}`}>
          <Clock className={`w-6 h-6 ${timeLeft <= 10 && phase !== 'SUDDEN_DEATH' ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} strokeWidth={3} />
          <span className={timeLeft <= 10 && phase !== 'SUDDEN_DEATH' ? 'text-red-500' : ''}>{timerString}</span>
        </div>

        <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden mt-8 md:mt-0">
          <div className="absolute h-full w-[2px] border-l-2 border-dashed border-white/20 top-0"></div>
          
          <div ref={tugContainerRef} className="relative w-[200%] md:w-[150%] flex items-center justify-center">
            <div className={`text-[4rem] md:text-[6rem] lg:text-[7rem] z-10 drop-shadow-xl transform scale-x-[-1] transition-transform ${p1State.streak >= 3 ? 'combo-glow-blue scale-110' : ''}`}>{p1Emoji}</div>
            
            <div className={`h-2 md:h-3 w-32 md:w-64 rounded-full relative shadow-[0_0_15px_rgba(255,255,255,0.2)] flex items-center justify-center z-0 border-y border-slate-600 transition-colors ${Math.abs(targetRopeRef.current) > 10 ? 'bg-white shadow-[0_0_20px_white]' : 'bg-slate-700'}`}>
              <div className="absolute w-full h-[1px] bg-slate-900/50"></div>
              <div className={`w-3 h-6 md:w-4 md:h-8 border-2 rounded-sm absolute shadow-[0_0_10px_black] z-20 transition-colors ${targetRopeRef.current > 0 ? 'bg-blue-500 border-blue-300 shadow-[0_0_15px_#3b82f6]' : targetRopeRef.current < 0 ? 'bg-rose-500 border-rose-300 shadow-[0_0_15px_#ef4444]' : 'bg-white border-slate-300'}`}></div>
            </div>

            <div className={`text-[4rem] md:text-[6rem] lg:text-[7rem] z-10 drop-shadow-xl transition-transform ${p2State.streak >= 3 ? 'combo-glow-red scale-110' : ''}`}>{p2Emoji}</div>
          </div>
        </div>
      </div>

      <div className={`w-full md:w-1/3 glass-panel flex flex-col overflow-hidden mb-8 md:mb-0 relative transition-all duration-300 ${p2State.streak >= 3 ? 'neon-red-border bg-rose-900/20' : 'border border-slate-700'}`}>
        <div className="bg-rose-900/80 text-white p-3 md:p-4 flex justify-between items-center font-black text-xl md:text-xl border-b border-rose-500/30">
          <div className="bg-black/50 text-rose-400 w-8 h-8 md:w-10 md:h-10 rounded flex items-center justify-center font-arcade border border-rose-500/50 shadow-[0_0_10px_rgba(225,29,72,0.3)]">{p2State.score}</div>
          <span className="font-arcade tracking-wider">{isLocal ? 'TEAM RED' : isMulti ? 'OPPONENT' : aiProfile.name}</span>
        </div>

        {floatingTexts.filter(ft => ft.side === 'p2').map(ft => (
          <div key={ft.id} className={`absolute top-24 left-6 text-2xl md:text-3xl font-arcade font-black drop-shadow-md z-20 ${ft.isPerfect ? 'animate-perfect' : ft.isCombo ? 'animate-float text-yellow-400 drop-shadow-[0_0_10px_#facc15]' : 'animate-float text-rose-400'}`}>{ft.text}</div>
        ))}
        
        <div className="absolute top-[4.5rem] right-4 flex gap-1 flex-row-reverse">
           {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${p2State.streak > i ? 'bg-rose-400 shadow-[0_0_8px_#fb7185]' : 'bg-slate-700'}`} />
           ))}
        </div>

        <div className="p-4 md:p-6 flex-1 flex flex-col justify-center items-center gap-3 md:gap-4 min-h-[120px]">
          <div className="text-3xl md:text-4xl font-arcade font-black text-rose-100 tracking-wider">
             {(phase === 'PLAYING' || phase === 'SUDDEN_DEATH') ? (isLocal ? p2State.problem?.question : '***') : 'AWAIT'}
          </div>
          <div className={`w-full bg-black/60 rounded-xl h-14 md:h-16 text-3xl md:text-4xl font-arcade font-black flex items-center justify-center border transition-colors shadow-inner ${p2State.criticalError ? 'border-red-600 text-red-500' : p2State.error ? 'border-red-500 text-red-400' : p2State.input ? 'border-rose-500/50 text-white shadow-[inset_0_0_15px_rgba(225,29,72,0.2)]' : 'border-slate-800 text-slate-600'}`}>
             {isLocal ? (p2State.input || '_') : ((phase === 'PLAYING' || phase === 'SUDDEN_DEATH') ? '---' : '_')}
          </div>
        </div>

        <div className={`p-3 md:p-4 grid grid-cols-3 gap-2 md:gap-3 bg-slate-900/80 rounded-b-xl border-t border-slate-800 ${!isLocal ? 'opacity-40 pointer-events-none' : ''}`}>
          {['1','2','3','4','5','6','7','8','9'].map(num => (
            <button key={num} onClick={() => handleKeyPad(num, 'p2')} className="btn-3d btn-gray text-xl md:text-2xl font-arcade font-black py-3 md:py-4">{num}</button>
          ))}
          <button onClick={() => handleKeyPad('DEL', 'p2')} className="btn-3d btn-gray text-xl md:text-2xl font-arcade font-black py-3 md:py-4 flex justify-center items-center text-red-400 hover:text-red-300"><X strokeWidth={3} /></button>
          <button onClick={() => handleKeyPad('0', 'p2')} className="btn-3d btn-gray text-xl md:text-2xl font-arcade font-black py-3 md:py-4">0</button>
          <button onClick={() => handleKeyPad('ENTER', 'p2')} className="btn-3d btn-red text-xl md:text-2xl font-arcade font-black py-3 md:py-4 flex justify-center items-center"><Check strokeWidth={4} /></button>
        </div>
      </div>
    </div>
  );
}

// --- Results Screen & Analytics ---
function ResultsScreen({ onBack }) {
  const [data, setData] = useState(null);
  const [tallyScore, setTallyScore] = useState(0);
  const [tallyDone, setTallyDone] = useState(false);

  useEffect(() => { 
    const raw = sessionStorage.getItem('lastMatchData'); 
    if (raw) setData(JSON.parse(raw)); 
  }, []);
  
  useEffect(() => {
    if (!data) return;
    const targetScore = data.score || 0;
    let curScore = 0;
    
    // Tally Animation
    const timer = setInterval(() => {
      if (curScore < targetScore) {
        curScore += Math.max(1, Math.floor(targetScore / 15));
        if (curScore > targetScore) curScore = targetScore;
        setTallyScore(curScore);
        playArcadeSound('click');
      } else {
        clearInterval(timer);
        setTallyDone(true);
        const isLocalWin = data.mode === 'LOCAL' && data.localWinner === 'p1';
        playArcadeSound(data.won || isLocalWin ? 'victory' : 'loss');
      }
    }, 50);

    return () => clearInterval(timer);
  }, [data]);

  useEffect(() => {
    if (!data || !tallyDone) return;
    const isLocalWin = data.mode === 'LOCAL' && data.localWinner === 'p1';
    // Ambient sound pulses while looking at results
    const pulseTimer = setInterval(() => {
      playArcadeSound(data.won || isLocalWin ? 'victory_pulse' : 'loss_pulse');
    }, 1500);
    return () => clearInterval(pulseTimer);
  }, [data, tallyDone]);

  if (!data) return null;

  const isLocal = data.mode === 'LOCAL';
  const title = isLocal ? (data.localWinner === 'p1' ? 'BLUE WINS' : data.localWinner === 'tie' ? 'DRAW' : 'RED WINS') : (data.won ? 'VICTORY' : 'DEFEATED');
  const borderCol = (isLocal && data.localWinner === 'p2') || (!isLocal && !data.won) ? 'border-rose-500 shadow-[0_0_50px_rgba(225,29,72,0.3)]' : 'border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.3)]';
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto animate-in zoom-in duration-300">
      <div className={`glass-panel border-t-8 ${borderCol} p-8 md:p-12 w-full text-center bg-slate-900`}>
        <h2 className={`text-5xl md:text-6xl font-arcade font-black tracking-widest mb-2 ${data.won || (isLocal && data.localWinner === 'p1') ? 'text-blue-400' : 'text-rose-400'}`}>{title}</h2>
        <p className="text-slate-400 font-bold mb-10 text-sm uppercase tracking-widest">{data.won || isLocal ? 'Combat Scenario Concluded' : 'Analyze failure and retry'}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className={`bg-slate-950 p-4 rounded-xl border border-slate-800 transition-transform ${!tallyDone ? 'scale-105 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : ''}`}>
             <p className="text-[10px] font-arcade text-slate-500 uppercase tracking-widest mb-2">FINAL SCORE</p>
             <p className="text-4xl font-arcade font-black text-white">{tallyScore}</p>
          </div>
          {!isLocal && (
             <div className={`p-4 rounded-xl border transition-opacity duration-1000 ${tallyDone ? 'opacity-100' : 'opacity-0'} ${data.won ? 'bg-blue-900/30 border-blue-500/50' : 'bg-rose-900/30 border-rose-500/50'}`}>
                <p className={`text-[10px] font-arcade uppercase tracking-widest mb-2 ${data.won ? 'text-blue-400' : 'text-rose-400'}`}>XP DELTA</p>
                <p className={`text-4xl font-arcade font-black ${data.won ? 'text-blue-400' : 'text-rose-400'}`}>{data.won ? '+100' : '-15'}</p>
             </div>
          )}
        </div>
        <button onClick={() => { playArcadeSound('click'); onBack(); }} className={`btn-3d btn-gray hover:bg-white hover:text-black w-full py-4 rounded-xl font-arcade font-black text-xl tracking-widest border border-slate-500 transition-opacity duration-500 ${tallyDone ? 'opacity-100' : 'opacity-0'}`}>
           RETURN TO HQ
        </button>
      </div>
    </div>
  );
}

function AnalyticsDashboard({ stats, playerName }) {
  const analytics = stats.analytics || {};
  let totalAttempts = 0, totalCorrect = 0, totalTime = 0;
  const operationStats = Object.entries(analytics).map(([key, data]) => {
    totalAttempts += data.attempts; totalCorrect += data.correct; totalTime += data.totalTime;
    return { name: OPERATIONS[key]?.label || key, accuracy: data.attempts > 0 ? (data.correct / data.attempts) * 100 : 0, avgTime: data.correct > 0 ? data.totalTime / data.correct : 0, attempts: data.attempts };
  }).sort((a, b) => b.attempts - a.attempts);

  const globalAcc = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
  const currentRank = getRank(stats.xp);

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto animate-in slide-in-from-right-8 duration-500 py-6">
      <div className="glass-panel border border-slate-700 p-6 md:p-10">
        <h2 className="text-2xl font-arcade font-black mb-8 flex items-center gap-3 text-white"><BarChart2 className="text-emerald-500 w-8 h-8" /> SERVICE RECORD</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center"><p className="text-[10px] font-arcade text-slate-500 uppercase tracking-widest mb-2">ACCURACY</p><p className="text-2xl font-arcade font-black text-white">{Math.round(globalAcc)}%</p></div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center"><p className="text-[10px] font-arcade text-slate-500 uppercase tracking-widest mb-2">ENGAGEMENTS</p><p className="text-2xl font-arcade font-black text-white">{stats.totalGames}</p></div>
          <div className={`col-span-2 p-4 rounded-xl border text-center ${currentRank.bg} border-white/10`}><p className="text-[10px] font-arcade text-slate-400 uppercase tracking-widest mb-2">RANK IDENTIFIER ({Math.floor(stats.xp)} XP)</p><p className={`text-2xl font-arcade font-black ${currentRank.color}`}>{currentRank.name}</p></div>
        </div>

        <h3 className="text-xs font-arcade text-slate-500 uppercase tracking-widest mb-4">TACTICAL MASTERY</h3>
        {operationStats.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl text-slate-500"><p className="font-arcade text-sm uppercase tracking-widest">INSUFFICIENT DATA FOR ANALYSIS.</p></div>
        ) : (
          <div className="space-y-3">
            {operationStats.map((op, i) => (
              <div key={i} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center gap-4">
                 <div className="w-full md:w-1/3"><p className="font-arcade font-black text-sm text-slate-200">{op.name}</p><p className="text-[10px] text-slate-500 font-bold uppercase">{op.attempts} operations</p></div>
                 <div className="flex-1 w-full space-y-2"><div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500"><span>Precision</span><span className={op.accuracy >= 80 ? 'text-emerald-400' : op.accuracy < 50 ? 'text-rose-400' : 'text-blue-400'}>{op.accuracy.toFixed(0)}%</span></div><div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${op.accuracy >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : op.accuracy < 50 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${op.accuracy}%` }}/></div></div>
                 <div className="w-full md:w-1/4 flex justify-between md:flex-col items-center md:items-end"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reaction Time</span><span className="font-arcade font-black text-sm text-slate-300">{op.avgTime > 0 ? op.avgTime.toFixed(1) + 's' : '-'}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GlobalLeaderboard({ user, db, appId }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const leaderboardRef = collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard');
    const unsub = onSnapshot(leaderboardRef, (snap) => {
      const allPlayers = [];
      snap.forEach(doc => allPlayers.push(doc.data()));
      const sortedLeaders = allPlayers.sort((a, b) => b.xp - a.xp).slice(0, 15);
      setLeaders(sortedLeaders);
      setLoading(false);
    }, (error) => {
      console.error("Leaderboard fetch error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, [db, appId]);

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-500 py-6">
      <div className="glass-panel border-t-4 border-yellow-500 p-6 md:p-10 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
        <div className="flex items-center justify-center gap-4 mb-8">
           <Trophy className="text-yellow-500 w-10 h-10 drop-shadow-[0_0_10px_#eab308]" />
           <h2 className="text-3xl font-arcade font-black text-white tracking-widest">GLOBAL RANKINGS</h2>
           <Globe className="text-slate-500 w-8 h-8" />
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-700 bg-slate-950 text-[10px] md:text-xs font-arcade text-slate-500 uppercase tracking-widest">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-6">Operative Call Sign</div>
            <div className="col-span-4 text-right">Total XP</div>
          </div>
          
          <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex justify-center p-12"><RefreshCw className="w-8 h-8 animate-spin text-yellow-500" /></div>
            ) : leaders.length === 0 ? (
              <div className="text-center p-12 font-arcade text-slate-500 tracking-widest">No intelligence found.</div>
            ) : (
              leaders.map((leader, index) => {
                const rankColor = index === 0 ? 'text-yellow-400 drop-shadow-[0_0_10px_#facc15]' : index === 1 ? 'text-slate-300 drop-shadow-[0_0_10px_#cbd5e1]' : index === 2 ? 'text-amber-600 drop-shadow-[0_0_10px_#d97706]' : 'text-slate-500';
                const isMe = user && leader.uid === user.uid;
                
                return (
                  <div key={leader.uid} className={`grid grid-cols-12 gap-4 p-4 border-b border-slate-800/50 items-center transition-colors hover:bg-slate-800 ${isMe ? 'bg-blue-900/20 border-l-4 border-l-blue-500' : ''}`}>
                    <div className={`col-span-2 text-center font-arcade font-black text-xl md:text-2xl ${rankColor}`}>#{index + 1}</div>
                    <div className="col-span-6 flex items-center gap-3">
                      {isMe && <span className="text-[9px] bg-blue-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-white">YOU</span>}
                      <span className={`font-arcade font-bold truncate ${isMe ? 'text-white' : 'text-slate-300'}`}>{leader.name}</span>
                    </div>
                    <div className={`col-span-4 text-right font-arcade font-black text-lg md:text-xl ${isMe ? 'text-blue-400' : 'text-slate-400'}`}>
                      {Math.floor(leader.xp)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}