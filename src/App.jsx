import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Trophy, Users, User, Settings, Zap, BarChart2, CheckCircle2, XCircle, 
  ArrowLeft, ChevronRight, RefreshCw, Award, Clock, Flame, Shield, 
  Target, Activity, BrainCircuit, TrendingUp, AlertTriangle, MonitorPlay,
  Check, X, Swords, Globe, Edit3, Save, Volume2, WifiOff, BatteryCharging,
  Code, Snowflake, Crown, Gift, Medal, Star, Lock, Timer
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, collection, 
  serverTimestamp, increment
} from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

// --- Zero-Dependency Arcade Synth Engine & Haptics ---
let globalAudioCtx = null;

const vibrate = (pattern) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch (e) {}
  }
};

const playArcadeSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!globalAudioCtx) globalAudioCtx = new AudioContext();
    if (globalAudioCtx.state === 'suspended') globalAudioCtx.resume();
    
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
      vibrate(20);
    } else if (type === 'pull') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
      vibrate([50]);
    } else if (type === 'combo') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
      vibrate([40, 40, 40]);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
      vibrate([100]);
    } else if (type === 'start') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      osc.frequency.setValueAtTime(800, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'powerup') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
      vibrate([30, 50, 80]);
    } else if (type === 'shield_break') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
      vibrate([100, 50, 100]);
    } else if (type === 'beat') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'perfect') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1760, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'hitstop') { 
      osc.type = 'sine';
      osc.frequency.setValueAtTime(50, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 0.2);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
      vibrate([150]);
    } else if (type === 'tick') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'victory') {
      const timeRamp = [0, 0.15, 0.3, 0.5];
      const melody = [523.25, 659.25, 783.99, 1046.50]; 
      osc.type = 'square';
      timeRamp.forEach((t, i) => osc.frequency.setValueAtTime(melody[i], now + t));
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.setValueAtTime(0.1, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      osc.start(now); osc.stop(now + 2.5);
    } else if (type === 'loss') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.8);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 1.0);
      osc.start(now); osc.stop(now + 1.0);
    } else if (type === 'victory_pulse') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'loss_pulse') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    }
  } catch (e) {}
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
      overflow-x: hidden;
  }

  .font-arcade { font-family: 'Orbitron', sans-serif; }

  /* Cyber Grid Background */
  .cyber-grid {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background-image: 
      linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
    background-size: 50px 50px;
    background-position: center center;
    z-index: 0; pointer-events: none;
    mask-image: linear-gradient(to bottom, transparent, black, transparent);
    -webkit-mask-image: linear-gradient(to bottom, transparent, black, transparent);
  }

  /* Arcade CRT Scanlines Overlay */
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

  .btn-3d { transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1); position: relative; border-radius: 12px; }
  .btn-3d:active { transform: translateY(6px); box-shadow: 0 0 0 transparent !important; filter: brightness(0.9); }
  .btn-3d:hover { filter: brightness(1.1); }
  
  .btn-blue { background-color: #1e40af; box-shadow: 0 6px 0 #1e3a8a, 0 10px 20px rgba(37,99,235,0.5); color: white; border: 1px solid #60a5fa; }
  .btn-red { background-color: #be123c; box-shadow: 0 6px 0 #9f1239, 0 10px 20px rgba(225,29,72,0.5); color: white; border: 1px solid #fb7185; }
  .btn-green { background-color: #15803d; box-shadow: 0 6px 0 #14532d, 0 10px 20px rgba(34,197,94,0.5); color: white; border: 1px solid #4ade80; }
  .btn-gray { background-color: #1e293b; box-shadow: 0 6px 0 #0f172a, 0 10px 15px rgba(0,0,0,0.6); color: #94a3b8; border: 1px solid #334155; }
  .btn-gray:hover { background-color: #334155; color: #cbd5e1; }
  .btn-purple { background-color: #6b21a8; box-shadow: 0 6px 0 #581c87, 0 10px 20px rgba(168,85,247,0.4); color: white; border: 1px solid #c084fc; }

  .glass-panel {
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255,255,255,0.1);
  }

  /* --- VISUAL JUICE & BUFFS --- */
  .hit-stop-active { animation: hit-stop-flash 0.15s cubic-bezier(.36,.07,.19,.97) forwards; }
  @keyframes hit-stop-flash {
    0% { filter: contrast(1.5) brightness(1.5) grayscale(0.5); transform: scale(1.02); }
    100% { filter: contrast(1) brightness(1) grayscale(0); transform: scale(1); }
  }

  @keyframes particle-burst {
    0% { transform: translate(0, 0) scale(1); opacity: 1; }
    100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
  }
  .particle {
    position: absolute; pointer-events: none;
    border-radius: 50%; z-index: 50;
    animation: particle-burst 0.6s cubic-bezier(0, 1, 0.5, 1) forwards;
  }

  .jammed-ui { animation: glitch 0.2s infinite; filter: hue-rotate(90deg) contrast(1.5); border-color: #ef4444 !important; }
  .jammed-text { filter: blur(1px); opacity: 0.8; }
  @keyframes glitch {
    0% { transform: translate(0) }
    20% { transform: translate(-3px, 3px) }
    40% { transform: translate(-3px, -3px) }
    60% { transform: translate(3px, 3px) }
    80% { transform: translate(3px, -3px) }
    100% { transform: translate(0) }
  }

  .frozen-ui { animation: shiver 0.1s infinite; filter: hue-rotate(180deg) brightness(1.2) saturate(0.5); border-color: #06b6d4 !important; }
  @keyframes shiver { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(2px); } }

  .shield-aura { box-shadow: 0 0 30px #10b981, inset 0 0 20px #10b981 !important; border-color: #34d399 !important; }
  .double-aura { box-shadow: 0 0 30px #eab308, inset 0 0 20px #eab308 !important; border-color: #fde047 !important; animation: pulse-yellow 1s infinite; }
  
  .neon-blue-border { box-shadow: 0 0 15px rgba(59,130,246,0.5), inset 0 0 10px rgba(59,130,246,0.5); border-color: #3b82f6 !important; }
  .neon-red-border { box-shadow: 0 0 15px rgba(225,29,72,0.5), inset 0 0 10px rgba(225,29,72,0.5); border-color: #ef4444 !important; }

  @keyframes pulse-yellow { 0%, 100% { box-shadow: 0 0 30px #eab308; } 50% { box-shadow: 0 0 50px #facc15; } }
  
  @keyframes shake {
    0%, 100% { transform: translate3d(0, 0, 0); }
    20%, 60% { transform: translate3d(-5px, 2px, 0); }
    40%, 80% { transform: translate3d(5px, -2px, 0); }
  }
  .animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }

  @keyframes severe-shake {
    0%, 100% { transform: translate3d(0, 0, 0); }
    10%, 30%, 50%, 70%, 90% { transform: translate3d(-10px, 5px, 0); }
    20%, 40%, 60%, 80% { transform: translate3d(10px, -5px, 0); }
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
  
  @keyframes avatar-hover {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(2deg); }
  }
  .avatar-float { animation: avatar-hover 4s ease-in-out infinite; }

  .danger-bg { position: fixed; inset: 0; z-index: -1; pointer-events: none; transition: opacity 0.5s ease, background 0.5s ease; }
  .tension-vignette { position: fixed; inset: 0; z-index: 15; pointer-events: none; background: radial-gradient(circle, transparent 60%, rgba(0,0,0,0.8) 100%); transition: opacity 0.2s ease; }

  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.4); }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
  
  /* Banners */
  .banner-void { background: radial-gradient(circle at center, #0f172a 0%, #000000 100%); }
  .banner-flames { background: linear-gradient(0deg, rgba(220,38,38,0.2) 0%, transparent 100%), url('data:image/svg+xml;utf8,<svg opacity="0.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="%23ef4444" d="M50 0 C50 0 20 40 20 70 C20 90 35 100 50 100 C65 100 80 90 80 70 C80 40 50 0 50 0 Z"/></svg>'); background-size: cover; }
  .banner-ice { background: linear-gradient(180deg, rgba(6,182,212,0.2) 0%, transparent 100%), url('data:image/svg+xml;utf8,<svg opacity="0.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon fill="%2306b6d4" points="50,0 100,50 50,100 0,50"/></svg>'); background-size: 20px 20px; }
  .banner-lightning { background: linear-gradient(90deg, rgba(234,179,8,0.1) 0%, transparent 50%, rgba(234,179,8,0.1) 100%), url('data:image/svg+xml;utf8,<svg opacity="0.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path fill="%23eab308" d="M5 0 L0 6 L4 6 L3 10 L8 4 L4 4 Z"/></svg>'); background-size: 30px 30px; }
`;

// --- Firebase Configuration ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
let firebaseConfig;
try {
  firebaseConfig = JSON.parse(firebaseConfigStr);
} catch (e) {
  firebaseConfig = { apiKey: "dummy", authDomain: "dummy", projectId: "dummy" };
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Constants & Config ---
const MAX_SCORE_DIFFERENCE = 15; 

const AI_NAMES = [
  { name: 'Abajis', streak: 99, rank: 'Apex', aggro: 4.0, def: 2.5, emoji: '🦅' }, 
  { name: 'Bear-Bot v4', streak: 12, rank: 'Diamond', aggro: 1.5, def: 0.8, emoji: '🐻' },
  { name: 'Calc-Tiger', streak: 5, rank: 'Platinum', aggro: 1.1, def: 1.0, emoji: '🐯' },
  { name: 'Quantum Cub', streak: 8, rank: 'Gold', aggro: 0.9, def: 1.3, emoji: '🐺' }
];

const SPECIAL_MODES = {
  STANDARD: { label: 'Standard', desc: 'Classic Rules' },
  SPEED_RUSH: { label: 'Speed Rush', desc: '3s per answer' },
  SURVIVAL: { label: 'Survival', desc: 'One mistake = Death' },
  PUZZLE: { label: 'Puzzle', desc: 'Complex math, big pull' }
};

const POWERUPS = {
  JAM: { id: 'JAM', name: 'SYS JAM', iconComp: WifiOff, color: 'bg-rose-500', shadow: 'shadow-[0_0_15px_#f43f5e]' },
  FREEZE: { id: 'FREEZE', name: 'FREEZE', iconComp: Snowflake, color: 'bg-cyan-500', shadow: 'shadow-[0_0_15px_#06b6d4]' },
  DOUBLE_DAMAGE: { id: 'DOUBLE_DAMAGE', name: '2X DMG', iconComp: Zap, color: 'bg-yellow-500 text-black', shadow: 'shadow-[0_0_15px_#eab308]' },
  SHIELD: { id: 'SHIELD', name: 'SHIELD', iconComp: Shield, color: 'bg-emerald-500', shadow: 'shadow-[0_0_15px_#10b981]' }
};

const RANKED_TIERS = [
  { name: 'Bronze', minSR: 0, maxSR: 1000, color: 'text-amber-600', bg: 'bg-amber-900/30', decay: false },
  { name: 'Silver', minSR: 1000, maxSR: 2000, color: 'text-slate-400', bg: 'bg-slate-800/50', decay: true },
  { name: 'Gold', minSR: 2000, maxSR: 3000, color: 'text-yellow-400', bg: 'bg-yellow-900/30', decay: true },
  { name: 'Platinum', minSR: 3000, maxSR: 4000, color: 'text-cyan-400', bg: 'bg-cyan-900/30', decay: true },
  { name: 'Diamond', minSR: 4000, maxSR: 5000, color: 'text-purple-400', bg: 'bg-purple-900/30', decay: true },
  { name: 'Master', minSR: 5000, maxSR: 6000, color: 'text-rose-400', bg: 'bg-rose-900/30', decay: true },
  { name: 'Grandmaster', minSR: 6000, maxSR: 7000, color: 'text-red-500', bg: 'bg-red-900/50', decay: true },
  { name: 'Legend', minSR: 7000, maxSR: Infinity, color: 'text-yellow-300', bg: 'bg-gradient-to-r from-yellow-600/40 via-yellow-400/20 to-yellow-600/40 border border-yellow-500 shadow-[0_0_15px_rgba(253,224,71,0.5)]', decay: false }
];

const PROFILE_FEATURES = {
  titles: ['Novice', 'Strategist', 'Math Master', 'Apex Predator', 'Grand Champion', 'Quantum Calculator'],
  avatars: ['🐺', '🦅', '🐉', '🦁', '🐯', '🤖', '💀', '👽'],
  banners: ['void', 'flames', 'ice', 'lightning'],
};

const BATTLE_PASS = Array.from({ length: 20 }).map((_, i) => ({
  level: i + 1,
  xpRequired: (i + 1) * 500,
  freeReward: i % 5 === 4 ? `Title: ${PROFILE_FEATURES.titles[Math.floor(i/5)+1]}` : `${(i+1)*50} Coins`,
  premiumReward: i % 3 === 2 ? `Avatar: ${PROFILE_FEATURES.avatars[i%PROFILE_FEATURES.avatars.length]}` : `Animated Banner`,
  isPremiumOnly: i % 2 !== 0
}));

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

const generateProblem = (opType, difficulty, specialMode = 'STANDARD') => {
  const { range } = DIFFICULTY_PRESETS[difficulty];
  let a, b, c, ans;
  let activeOp = opType;
  
  if (opType === 'MIXED') {
    const types = ['ADDITION', 'SUBTRACTION', 'MULTIPLICATION', 'DIVISION'];
    activeOp = types[Math.floor(Math.random() * types.length)];
  }

  if (specialMode === 'PUZZLE') {
      a = Math.floor(Math.random() * 10) + 2;
      b = Math.floor(Math.random() * 10) + 2;
      c = Math.floor(Math.random() * 10) + 2;
      // Format: a * b + c
      ans = (a * b) + c;
      return { question: `${a} × ${b} + ${c} = ?`, answer: ans.toString(), type: 'MIXED' };
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

const getRank = (sr) => [...RANKED_TIERS].reverse().find(r => sr >= r.minSR) || RANKED_TIERS[0];
const getSafeID = () => Math.random().toString(36).substring(2, 10);
const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5);

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('MAIN_MENU');
  const [gameMode, setGameMode] = useState(null);
  const [matchContext, setMatchContext] = useState(null); 
  const [config, setConfig] = useState({ operation: 'MIXED', difficulty: 'INTERMEDIATE', aiOpponent: 'RANDOM', specialMode: 'STANDARD' });
  const [stats, setStats] = useState({ 
    sr: 500, xp: 0, bpLevel: 1, totalGames: 0, wins: 0, analytics: {}, 
    customName: "Cadet", avatar: "🐺", title: "Novice", banner: "void" 
  });
  const [loading, setLoading] = useState(true);

  const initializeAudio = () => playArcadeSound('click');

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error(e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setStats(snap.data());
      } else {
        const initialStats = { 
          sr: 500, xp: 0, bpLevel: 1, totalGames: 0, wins: 0, analytics: {}, 
          customName: `Cadet_${user.uid.substring(0,4).toUpperCase()}`, 
          avatar: "🐺", title: "Novice", banner: "void" 
        };
        setDoc(docRef, initialStats); setStats(initialStats);
      }
    }, (error) => console.error(error));
    return () => unsub();
  }, [user]);

  const updateProfile = async (updates) => {
    playArcadeSound('click');
    if (!user) return;
    const newStats = { ...stats, ...updates };
    setStats(newStats);
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), newStats, { merge: true });
    
    // Also update leaderboard if necessary
    if (newStats.sr > 0) {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', user.uid), {
        uid: user.uid, name: newStats.customName, sr: newStats.sr, avatar: newStats.avatar, title: newStats.title, banner: newStats.banner, updatedAt: serverTimestamp()
      }, { merge: true });
    }
  };

  const processMatchData = async (matchData, userQuestions) => {
    if (!user) return;
    const newStats = { ...stats };
    
    // Safety checks against undefined properties
    newStats.totalGames = (newStats.totalGames || 0) + 1;
    if (!newStats.analytics) newStats.analytics = {};

    let srDelta = 0;
    let xpGained = 0;

    const diffMultiplier = DIFFICULTY_PRESETS[config.difficulty]?.time < 15 ? 1.5 : (DIFFICULTY_PRESETS[config.difficulty]?.time === 20 ? 1.2 : 1.0);

    if (matchData.isTie) {
      srDelta = 0; // No SR penalty for drawing
      xpGained = Math.floor(50 * diffMultiplier);
    } else if (matchData.won) {
      newStats.wins = (newStats.wins || 0) + 1;
      srDelta = Math.floor((Math.random() * 10 + 20) * diffMultiplier); // Win 20-30 SR * diff
      xpGained = Math.floor(100 * diffMultiplier);
      if (config.aiOpponent === 'Abajis') { srDelta *= 2; xpGained *= 2.5; }
    } else {
      // SR Loss mitigation for lower ranks
      const lossBase = Math.floor(15 * (1 / diffMultiplier));
      srDelta = (newStats.sr || 0) < 1000 ? -Math.floor(lossBase * 0.5) : -lossBase;
      xpGained = 15; // Still gain a little BP XP for playing
    }

    newStats.sr = Math.max(0, (newStats.sr || 0) + srDelta);
    newStats.xp = (newStats.xp || 0) + xpGained;
    
    // Changed 'if' to 'while' to allow multiple level-ups from high XP matches
    let currentBPReq = BATTLE_PASS[Math.min(newStats.bpLevel || 1, BATTLE_PASS.length) - 1]?.xpRequired || 999999;
    while (newStats.xp >= currentBPReq && (newStats.bpLevel || 1) < BATTLE_PASS.length) {
      newStats.bpLevel = (newStats.bpLevel || 1) + 1;
      currentBPReq = BATTLE_PASS[Math.min(newStats.bpLevel, BATTLE_PASS.length) - 1]?.xpRequired || 999999;
    }

    userQuestions.forEach(q => {
      if (!newStats.analytics[q.type]) newStats.analytics[q.type] = { attempts: 0, correct: 0, totalTime: 0 };
      const typeStat = newStats.analytics[q.type];
      typeStat.attempts += 1;
      if (q.isCorrect) typeStat.correct += 1;
      typeStat.totalTime += q.timeTaken;
    });

    // Save full data back to matchData for Results screen rendering
    matchData.srDelta = srDelta;
    matchData.newSR = newStats.sr;
    matchData.xpGained = xpGained;

    try { 
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), newStats, { merge: true }); 
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', user.uid), {
        uid: user.uid, name: newStats.customName || 'Cadet', sr: newStats.sr, avatar: newStats.avatar || '🐺', title: newStats.title || 'Novice', banner: newStats.banner || 'void', updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
    </div>
  );

  const currentRank = getRank(stats.sr || 0);

  return (
    <div className="min-h-screen w-full flex flex-col text-slate-200 select-none overflow-y-auto md:overflow-hidden relative" onClick={initializeAudio}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="cyber-grid"></div>
      <div className="scanlines"></div> 
      
      <header className={`w-full p-2 md:p-4 flex flex-wrap justify-between items-center z-10 text-white gap-2 relative border-b shadow-lg backdrop-blur-md banner-${stats.banner || 'void'} border-slate-700`}>
        <div className="absolute inset-0 bg-slate-900/80 -z-10"></div>
        
        <button onClick={() => { playArcadeSound('click'); setView('MAIN_MENU'); }} className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold flex items-center gap-2 text-sm md:text-base transition border border-slate-600 shadow-[0_4px_0_#0f172a] active:translate-y-1 active:shadow-none z-10">
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> HQ
        </button>
        
        <h1 className="hidden md:block text-xl md:text-3xl font-arcade font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-rose-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] text-center flex-1 z-10">
          MATH TUG ARENA
        </h1>

        {stats && (
          <div 
            className="flex items-center gap-3 cursor-pointer group bg-slate-900/50 p-2 rounded-xl border border-white/5 hover:border-white/20 transition-colors z-10"
            onClick={() => { playArcadeSound('click'); setView('PROFILE'); }}
          >
            <div className="text-right hidden sm:block">
              {/* Added safe String casting to protect against Object rendering errors from corrupted Firestore data */}
              <div className="text-xs font-bold text-slate-300 uppercase tracking-widest">{typeof stats.customName === 'string' ? stats.customName : 'Cadet'}</div>
              <div className={`text-[10px] font-arcade uppercase ${currentRank.color}`}>{currentRank.name} // {stats.sr || 0} SR</div>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-slate-800 border border-slate-600 group-hover:scale-105 transition-transform ${currentRank.bg}`}>
              {typeof stats.avatar === 'string' ? stats.avatar : '🐺'}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col relative p-2 md:p-4 gap-4 md:gap-6 custom-scrollbar z-10">
        {view === 'MAIN_MENU' && (
          <MainMenu 
            onPlaySingle={() => { playArcadeSound('click'); setGameMode('SINGLE'); setView('SETTINGS'); }} 
            onPlayLocal={() => { playArcadeSound('click'); setGameMode('LOCAL'); setView('SETTINGS'); }}
            onPlayMulti={() => { playArcadeSound('click'); setGameMode('MULTI'); setView('LOBBY'); }} 
            onViewStats={() => { playArcadeSound('click'); setView('ANALYTICS'); }} 
            onViewLeaderboard={() => { playArcadeSound('click'); setView('LEADERBOARD'); }}
            onViewTournaments={() => { playArcadeSound('click'); setView('TOURNAMENTS'); }}
            onViewBattlePass={() => { playArcadeSound('click'); setView('BATTLEPASS'); }}
          />
        )}
        {view === 'SETTINGS' && <SettingsPanel mode={gameMode} config={config} setConfig={setConfig} onStart={() => { playArcadeSound('click'); setView('GAME'); }} />}
        {view === 'LOBBY' && <MultiplayerLobby user={user} onMatchReady={(data) => { playArcadeSound('start'); setConfig(data.config); setGameMode('MULTI'); setMatchContext({ matchId: data.matchId, side: data.side }); setView('GAME'); }} />}
        
        {view === 'GAME' && (
          <MatchArena 
            mode={gameMode} 
            matchContext={matchContext} 
            config={config} 
            user={user} 
            playerProfile={stats} 
            onMatchEnd={async (matchData, userQuestions) => { 
              if (gameMode !== 'LOCAL') {
                await processMatchData(matchData, userQuestions); 
              }
              sessionStorage.setItem('lastMatchData', JSON.stringify(matchData)); 
              setView('RESULTS'); 
            }} 
            onExit={() => { playArcadeSound('click'); setView('MAIN_MENU'); }} 
          />
        )}

        {view === 'RESULTS' && <ResultsScreen onBack={() => { playArcadeSound('click'); setView('MAIN_MENU'); }} />}
        {view === 'ANALYTICS' && <AnalyticsDashboard stats={stats} />}
        {view === 'LEADERBOARD' && <GlobalLeaderboard user={user} />}
        {view === 'PROFILE' && <ProfileScreen stats={stats} onSave={updateProfile} />}
        {view === 'TOURNAMENTS' && <TournamentsScreen />}
        {view === 'BATTLEPASS' && <BattlePassScreen stats={stats} />}
      </main>
    </div>
  );
}

// --- Menu Components ---
function MainMenu({ onPlaySingle, onPlayMulti, onPlayLocal, onViewStats, onViewLeaderboard, onViewTournaments, onViewBattlePass }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500 w-full max-w-5xl mx-auto py-4 md:py-8">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full mb-6">
        {/* Core Game Modes (Practice Prominent) */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <button onClick={onPlaySingle} className="col-span-1 md:col-span-2 glass-panel p-6 md:p-10 flex flex-row items-center gap-6 hover:scale-[1.02] transition-transform group border-2 border-blue-500/50 hover:border-blue-500 relative overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] bg-slate-900/90">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors"></div>
            <span className="absolute top-4 right-4 px-2 py-1 bg-blue-600 text-white text-[10px] font-black rounded font-arcade animate-pulse shadow-[0_0_10px_#2563eb]">OFFLINE</span>
            <div className="w-20 h-20 bg-blue-900/50 text-blue-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors border border-blue-500/50 group-hover:shadow-[0_0_20px_#2563eb]">
              <BrainCircuit size={40} />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-3xl font-arcade font-black text-white tracking-widest drop-shadow-md group-hover:text-blue-100">PRACTICE ARENA</h3>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-wider mt-1">Train Offline vs AI Tiger</p>
            </div>
          </button>

          <button onClick={onPlayMulti} className="glass-panel p-6 flex flex-col items-center gap-4 hover:scale-105 transition-transform group border border-slate-700 hover:border-rose-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(225,29,72,0.4)]">
            <div className="w-14 h-14 bg-rose-900/50 text-rose-400 rounded-xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors border border-rose-500/30">
              <Shield size={28} />
            </div>
            <div>
              <h3 className="text-lg font-arcade font-black text-white tracking-widest">RANKED PvP</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Online Sync</p>
            </div>
          </button>

          <button onClick={onPlayLocal} className="glass-panel p-6 flex flex-col items-center gap-4 hover:scale-105 transition-transform group border border-slate-700 hover:border-purple-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]">
            <div className="w-14 h-14 bg-purple-900/50 text-purple-400 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors border border-purple-500/30">
              <Swords size={28} />
            </div>
            <div>
              <h3 className="text-lg font-arcade font-black text-white tracking-widest">LOCAL DUEL</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Shared Screen</p>
            </div>
          </button>
        </div>

        {/* Social & Progression */}
        <div className="flex flex-col gap-4 md:gap-6">
          <button onClick={onViewTournaments} className="flex-1 glass-panel p-4 flex items-center gap-4 hover:scale-[1.02] transition-transform group border border-slate-700 hover:border-amber-500">
            <div className="w-12 h-12 bg-amber-900/40 text-amber-500 rounded flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors"><Crown size={24} /></div>
            <div className="text-left">
              <h3 className="text-sm font-arcade font-black text-white tracking-widest group-hover:text-amber-400">TOURNAMENTS</h3>
              <p className="text-slate-500 text-[10px] uppercase font-bold">Daily & Guild Events</p>
            </div>
          </button>

          <button onClick={onViewBattlePass} className="flex-1 glass-panel p-4 flex items-center gap-4 hover:scale-[1.02] transition-transform group border border-slate-700 hover:border-emerald-500 relative overflow-hidden">
            <div className="w-12 h-12 bg-emerald-900/40 text-emerald-500 rounded flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors"><Gift size={24} /></div>
            <div className="text-left">
              <h3 className="text-sm font-arcade font-black text-white tracking-widest group-hover:text-emerald-400">BATTLE PASS</h3>
              <p className="text-slate-500 text-[10px] uppercase font-bold">Unlock Cosmetics</p>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-4 flex-1">
             <button onClick={onViewLeaderboard} className="glass-panel flex flex-col items-center justify-center gap-2 hover:bg-slate-800 transition-colors border border-slate-700 hover:border-yellow-500 group py-4">
                <Globe className="text-slate-500 group-hover:text-yellow-500 transition-colors" size={24} />
                <span className="text-[10px] font-arcade font-black text-slate-400 group-hover:text-yellow-100">RANKINGS</span>
             </button>
             <button onClick={onViewStats} className="glass-panel flex flex-col items-center justify-center gap-2 hover:bg-slate-800 transition-colors border border-slate-700 hover:border-blue-500 group py-4">
                <Activity className="text-slate-500 group-hover:text-blue-500 transition-colors" size={24} />
                <span className="text-[10px] font-arcade font-black text-slate-400 group-hover:text-blue-100">STATS</span>
             </button>
          </div>
        </div>
      </div>

      {/* --- RESTORED SYSTEM ARCHITECT GRID --- */}
      <div className="glass-panel p-6 mt-6 w-full max-w-2xl mx-auto border border-slate-700/50 flex flex-col items-center justify-center text-center shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 hover:opacity-100 transition-opacity"></div>
        <div className="text-blue-400 font-arcade text-[10px] md:text-xs tracking-[0.2em] mb-2 uppercase font-bold">System Architect</div>
        <div className="text-white font-arcade font-black text-xl md:text-2xl tracking-widest mb-3 uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            Abdulrahman Saeed <span className="text-rose-500 drop-shadow-[0_0_10px_rgba(225,29,72,0.4)]">(ABAJIS)</span>
        </div>
        <div className="text-slate-300 font-bold text-[9px] md:text-[11px] uppercase tracking-[0.1em] mb-1">Student of Air Force Institute of Technology, Kaduna</div>
        <div className="text-slate-500 font-bold text-[8px] md:text-[9px] uppercase tracking-wider">Studying Metallurgical and Materials Engineering</div>
      </div>
    </div>
  );
}

// --- New Progression Panels ---
function ProfileScreen({ stats, onSave }) {
  const [editName, setEditName] = useState(typeof stats.customName === 'string' ? stats.customName : 'Cadet');
  const [selectedAvatar, setSelectedAvatar] = useState(typeof stats.avatar === 'string' ? stats.avatar : '🐺');
  const [selectedTitle, setSelectedTitle] = useState(typeof stats.title === 'string' ? stats.title : 'Novice');
  const [selectedBanner, setSelectedBanner] = useState(typeof stats.banner === 'string' ? stats.banner : 'void');

  const rankInfo = getRank(stats.sr || 0);

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-500 py-6">
      <div className={`glass-panel border-t-4 border-t-blue-500 p-6 md:p-10 shadow-[0_0_40px_rgba(59,130,246,0.2)] banner-${selectedBanner}`}>
        
        <div className="flex flex-col md:flex-row items-center gap-8 mb-10 bg-slate-900/80 p-6 rounded-xl border border-white/10 backdrop-blur-sm">
          <div className={`w-24 h-24 text-5xl flex items-center justify-center rounded-2xl bg-slate-800 border-2 shadow-2xl ${rankInfo.bg} border-slate-600`}>
            {selectedAvatar}
          </div>
          <div className="flex-1 text-center md:text-left">
            <input 
              type="text" maxLength={15} value={editName} onChange={(e) => setEditName(e.target.value)} 
              className="bg-transparent border-b-2 border-blue-500 text-3xl font-arcade font-black text-white focus:outline-none focus:border-white mb-2 text-center md:text-left w-full md:w-auto"
            />
            <div className="text-blue-400 font-arcade text-sm uppercase tracking-widest">{selectedTitle}</div>
            <div className="mt-4 flex flex-wrap gap-4 justify-center md:justify-start">
               <div className={`px-4 py-2 rounded-lg font-bold text-xs border border-white/10 ${rankInfo.bg} ${rankInfo.color} uppercase tracking-widest shadow-inner`}>
                 Rank: {rankInfo.name}
               </div>
               <div className="px-4 py-2 rounded-lg font-bold text-xs border border-slate-700 bg-slate-800 text-slate-300 uppercase tracking-widest shadow-inner">
                 Skill Rating: {stats.sr || 0}
               </div>
               <div className="px-4 py-2 rounded-lg font-bold text-xs border border-emerald-700/50 bg-emerald-900/30 text-emerald-400 uppercase tracking-widest shadow-inner flex items-center gap-2">
                 <Gift size={14}/> BP Level {stats.bpLevel || 1}
               </div>
            </div>
          </div>
          <button onClick={() => onSave({ customName: editName, avatar: selectedAvatar, title: selectedTitle, banner: selectedBanner })} className="btn-3d btn-blue px-8 py-4 font-arcade font-black rounded-xl">SAVE DOSSIER</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-950/90 p-6 rounded-xl border border-slate-800">
           <div>
             <h3 className="text-xs font-arcade text-slate-500 uppercase tracking-widest mb-4">Select Avatar</h3>
             <div className="flex flex-wrap gap-3">
               {PROFILE_FEATURES.avatars.map(a => (
                 <button key={a} onClick={() => setSelectedAvatar(a)} className={`w-14 h-14 text-2xl rounded-xl flex items-center justify-center transition-all ${selectedAvatar === a ? 'bg-blue-600 border-2 border-white shadow-[0_0_15px_rgba(59,130,246,0.6)]' : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'}`}>{a}</button>
               ))}
             </div>
           </div>

           <div>
             <h3 className="text-xs font-arcade text-slate-500 uppercase tracking-widest mb-4">Equip Title</h3>
             <div className="flex flex-wrap gap-2">
               {PROFILE_FEATURES.titles.map((t, i) => {
                 const unlocked = (stats.bpLevel || 1) >= (i * 3) || i === 0; 
                 return (
                 <button key={t} disabled={!unlocked} onClick={() => setSelectedTitle(t)} className={`px-3 py-2 text-[10px] font-arcade uppercase tracking-widest rounded border transition-all ${!unlocked ? 'opacity-30 cursor-not-allowed bg-slate-900 border-slate-800' : selectedTitle === t ? 'bg-rose-600 border-white shadow-[0_0_10px_rgba(225,29,72,0.5)] text-white' : 'bg-slate-800 border-slate-600 hover:border-rose-400 text-slate-300'}`}>
                   {t} {!unlocked && <Lock size={10} className="inline ml-1" />}
                 </button>
               )})}
             </div>
           </div>

           <div className="md:col-span-2">
             <h3 className="text-xs font-arcade text-slate-500 uppercase tracking-widest mb-4">Player Card Banner</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {PROFILE_FEATURES.banners.map(b => (
                 <button key={b} onClick={() => setSelectedBanner(b)} className={`h-20 rounded-xl border-2 transition-all banner-${b} ${selectedBanner === b ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'}`}>
                    <span className="bg-black/50 px-2 py-1 rounded text-[10px] font-arcade uppercase text-white m-2 block w-fit">{b}</span>
                 </button>
               ))}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}

function TournamentsScreen() {
  return (
    <div className="flex-1 w-full max-w-5xl mx-auto animate-in slide-in-from-right-8 duration-500 py-6">
      <div className="glass-panel border-t-4 border-amber-500 p-6 md:p-10 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
         <div className="flex items-center gap-4 mb-8 border-b border-slate-700 pb-6">
            <Crown className="w-12 h-12 text-amber-500 drop-shadow-[0_0_15px_#f59e0b]" />
            <div>
              <h2 className="text-3xl font-arcade font-black text-white tracking-widest">TOURNAMENT HUB</h2>
              <p className="text-amber-400/80 text-sm font-bold uppercase tracking-wider">Compete for Exclusive Glory</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Daily Card */}
            <div className="glass-panel bg-slate-900 border border-slate-700 p-6 relative overflow-hidden flex flex-col group hover:border-amber-500 transition-colors">
               <div className="absolute top-0 right-0 p-2 bg-amber-500 text-black text-[10px] font-black font-arcade rounded-bl-lg">LIVE</div>
               <h3 className="text-xl font-arcade font-black text-white mb-2">DAILY CLASH</h3>
               <p className="text-slate-400 text-xs uppercase tracking-wider mb-6">8-Player Bracket (Single Elim)</p>
               <div className="mt-auto">
                 <div className="flex justify-between text-xs mb-2 text-slate-500 font-bold"><span>Prize Pool:</span> <span className="text-amber-400">1,000 Coins + Title</span></div>
                 <button className="w-full btn-3d btn-gray py-3 font-arcade text-sm flex items-center justify-center gap-2"><Clock size={16}/> JOIN QUEUE</button>
               </div>
            </div>

            {/* Seasonal Card */}
            <div className="glass-panel bg-slate-900 border border-slate-700 p-6 relative overflow-hidden flex flex-col opacity-75">
               <h3 className="text-xl font-arcade font-black text-white mb-2 text-cyan-400">SEASON 1 CHAMPIONSHIP</h3>
               <p className="text-slate-400 text-xs uppercase tracking-wider mb-6">Top 64 Legend Players</p>
               <div className="mt-auto border border-dashed border-slate-700 p-4 rounded text-center">
                 <span className="text-[10px] font-arcade text-slate-500 uppercase tracking-widest">Unlocks in 14 Days</span>
               </div>
            </div>

            {/* Clan Card */}
            <div className="glass-panel bg-slate-900 border border-slate-700 p-6 relative overflow-hidden flex flex-col opacity-75">
               <h3 className="text-xl font-arcade font-black text-rose-400 mb-2">GUILD WARS</h3>
               <p className="text-slate-400 text-xs uppercase tracking-wider mb-6">3v3 Synchronized Tugs</p>
               <div className="mt-auto border border-dashed border-slate-700 p-4 rounded text-center">
                 <span className="text-[10px] font-arcade text-slate-500 uppercase tracking-widest">Formation Phase...</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function BattlePassScreen({ stats }) {
  const currentLevel = stats.bpLevel || 1;
  const currentXP = stats.xp || 0;
  const nextReq = BATTLE_PASS[Math.min(currentLevel, BATTLE_PASS.length) - 1]?.xpRequired || 999999;
  const prevReq = currentLevel > 1 ? BATTLE_PASS[currentLevel - 2].xpRequired : 0;
  const progressPercent = currentLevel >= BATTLE_PASS.length ? 100 : ((currentXP - prevReq) / (nextReq - prevReq)) * 100;

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto animate-in slide-in-from-left-8 duration-500 py-6 flex flex-col">
      <div className="glass-panel border-t-4 border-emerald-500 p-6 shadow-[0_0_40px_rgba(16,185,129,0.2)] mb-6">
        <div className="flex justify-between items-end">
           <div>
              <h2 className="text-3xl font-arcade font-black text-white tracking-widest flex items-center gap-3">
                <Gift className="text-emerald-500" /> SYSTEM OVERRIDE PASS
              </h2>
              <p className="text-emerald-400/80 text-sm font-bold uppercase tracking-wider mt-1">Season 1: Cyber Awakening</p>
           </div>
           <div className="text-right">
              <div className="text-4xl font-arcade font-black text-white">LVL {currentLevel}</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">{currentXP} / {nextReq} XP</div>
           </div>
        </div>
        <div className="w-full h-3 bg-slate-900 rounded-full mt-4 overflow-hidden border border-slate-700">
           <div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981] transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto custom-scrollbar pb-6">
         <div className="flex gap-4 min-w-max px-2">
            {BATTLE_PASS.map((tier) => {
              const isUnlocked = currentLevel >= tier.level;
              const isCurrent = currentLevel === tier.level;
              return (
                <div key={tier.level} className={`w-48 flex flex-col gap-2 transition-all ${isCurrent ? 'scale-105 transform origin-bottom' : ''}`}>
                  <div className={`text-center font-arcade font-black text-lg py-2 rounded-t-xl ${isUnlocked ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                     TIER {tier.level}
                  </div>
                  
                  {/* Free Track */}
                  <div className={`h-32 rounded-xl p-4 flex flex-col items-center justify-center text-center relative border-2 ${isUnlocked ? 'border-emerald-500/50 bg-slate-800/80 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' : 'border-slate-800 bg-slate-900 opacity-60'}`}>
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest absolute top-2 left-2">FREE</span>
                     <div className="text-2xl mb-2">{tier.freeReward.includes('Title') ? <Crown className="text-yellow-400" /> : <Award className="text-blue-400" />}</div>
                     <span className="text-[10px] font-arcade text-white">{tier.freeReward}</span>
                     {isUnlocked && <CheckCircle2 className="absolute bottom-2 right-2 text-emerald-500 w-4 h-4" />}
                  </div>

                  {/* Premium Track */}
                  <div className={`h-32 rounded-xl p-4 flex flex-col items-center justify-center text-center relative border-2 ${isUnlocked ? 'border-amber-500/50 bg-gradient-to-b from-amber-900/40 to-slate-900 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]' : 'border-slate-800 bg-slate-900 opacity-40'}`}>
                     <span className="text-xs font-bold text-amber-500 uppercase tracking-widest absolute top-2 left-2 flex items-center gap-1"><Star size={10}/> PRO</span>
                     <div className="text-3xl mb-2">{tier.premiumReward.includes('Avatar') ? tier.premiumReward.split(' ')[1] : <MonitorPlay className="text-purple-400" />}</div>
                     <span className="text-[10px] font-arcade text-amber-100">{tier.premiumReward}</span>
                     <Lock className="absolute bottom-2 right-2 text-slate-600 w-4 h-4" /> {/* Mocking locked premium for now */}
                  </div>
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
}

function SettingsPanel({ mode, config, setConfig, onStart }) {
  const handleConfig = (update) => { playArcadeSound('click'); setConfig(update); };

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-300 py-8">
      <div className="glass-panel p-6 md:p-10 w-full border border-slate-700 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
        <h2 className="text-2xl font-arcade font-black mb-8 text-center text-white flex items-center justify-center gap-3 tracking-widest">
          <Settings className="text-blue-500" /> CONFIGURE ARENA
        </h2>
        
        <div className="space-y-8">
          {mode === 'SINGLE' && (
            <section>
              <label className="text-xs font-arcade text-slate-400 uppercase tracking-widest block mb-4 text-center">Opponent Selection</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <button onClick={() => handleConfig({ ...config, aiOpponent: 'RANDOM' })} 
                  className={`p-3 rounded-lg font-bold flex flex-col items-center gap-2 border transition-all hover:scale-105 ${config.aiOpponent === 'RANDOM' ? 'bg-rose-900/50 border-rose-400 text-rose-200 shadow-[0_0_15px_rgba(225,29,72,0.5)]' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  <span className="text-2xl font-arcade">🎲</span>
                  <span className="text-[10px] uppercase tracking-widest">Random</span>
                </button>
                {AI_NAMES.map((ai) => (
                  <button key={ai.name} onClick={() => handleConfig({ ...config, aiOpponent: ai.name })} 
                    className={`p-3 rounded-lg font-bold flex flex-col items-center gap-2 border transition-all hover:scale-105 ${config.aiOpponent === ai.name ? (ai.name === 'Abajis' ? 'bg-red-900/80 border-red-500 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse' : 'bg-rose-900/50 border-rose-400 text-rose-200 shadow-[0_0_15px_rgba(225,29,72,0.5)]') : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                    <span className="text-2xl font-arcade">{ai.emoji}</span>
                    <span className={`text-[10px] uppercase tracking-widest text-center ${ai.name === 'Abajis' ? 'font-black text-red-300' : ''}`}>{ai.name}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <label className="text-xs font-arcade text-slate-400 uppercase tracking-widest block mb-4 text-center">Operation Type</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(OPERATIONS).map(([key, op]) => (
                <button key={key} onClick={() => handleConfig({ ...config, operation: key })} 
                  className={`p-3 rounded-lg font-bold flex flex-col items-center gap-2 border transition-all hover:scale-105 ${config.operation === key ? 'bg-blue-900/50 border-blue-400 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  <span className="text-2xl font-arcade">{op.icon}</span>
                  <span className="text-[10px] uppercase tracking-widest">{op.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="text-xs font-arcade text-slate-400 uppercase tracking-widest block mb-4 text-center">Combat Modifier</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(SPECIAL_MODES).map(([key, modeObj]) => (
                <button key={key} onClick={() => handleConfig({ ...config, specialMode: key })} 
                  className={`p-3 rounded-lg font-bold flex flex-col items-center gap-1 border transition-all hover:scale-105 ${config.specialMode === key ? 'bg-purple-900/50 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  <span className="text-sm font-arcade uppercase tracking-widest">{modeObj.label}</span>
                  <span className="text-[9px] opacity-80 text-center uppercase">{modeObj.desc}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="text-xs font-arcade text-slate-400 uppercase tracking-widest block mb-4 text-center">Threat Level</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.keys(DIFFICULTY_PRESETS).map((level) => (
                <button key={level} onClick={() => handleConfig({ ...config, difficulty: level })} 
                  className={`p-3 rounded-lg font-bold flex flex-col items-center gap-1 border transition-all hover:scale-105 ${config.difficulty === level ? 'bg-amber-900/50 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  <span className="text-sm font-arcade uppercase tracking-widest">{level}</span>
                  <span className="text-[10px] opacity-80 uppercase">{DIFFICULTY_PRESETS[level].time}s Match</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <button onClick={onStart} className="btn-3d btn-green w-full py-4 rounded-xl font-arcade font-black text-xl mt-10 tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)]">
          INITIALIZE MATCH
        </button>
      </div>
    </div>
  );
}

function MultiplayerLobby({ user, onMatchReady }) {
  const [matchIdInput, setMatchIdInput] = useState("");
  const [status, setStatus] = useState("IDLE");
  const [errorMsg, setErrorMsg] = useState(""); 
  const unsubRef = useRef(null);
  
  // Track hosted matches to clean them up on early exit
  const hostedMatchIdRef = useRef(null); 
  const isMatchReadyRef = useRef(false);

  useEffect(() => {
    // Cleanup ghost listeners and DB lobbies if the user leaves early
    return () => { 
        if (unsubRef.current) unsubRef.current(); 
        if (hostedMatchIdRef.current && !isMatchReadyRef.current) {
            updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', hostedMatchIdRef.current), { status: 'CANCELLED' }).catch(()=>{});
        }
    };
  }, []);

  const createMatch = async () => {
    if (!user) return;
    playArcadeSound('click');
    setStatus("HOSTING");
    const newMatchId = Math.floor(10000 + Math.random() * 90000).toString();
    hostedMatchIdRef.current = newMatchId;
    
    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', newMatchId);
    const initialConfig = { operation: 'MIXED', difficulty: 'INTERMEDIATE', specialMode: 'STANDARD' };
    
    // Updated Match Data Structure
    await setDoc(matchRef, { 
      p1Id: user.uid, 
      p2Id: null, 
      p1Force: 0, p2Force: 0, 
      p1JammedUntil: 0, p2JammedUntil: 0, 
      p1FrozenUntil: 0, p2FrozenUntil: 0,
      p1Shield: false, p2Shield: false,
      p1Double: false, p2Double: false,
      status: 'WAITING', 
      config: initialConfig, 
      createdAt: serverTimestamp() 
    });
    
    setMatchIdInput(newMatchId);
    unsubRef.current = onSnapshot(matchRef, (snap) => {
      if (snap.exists() && snap.data().p2Id && snap.data().status === 'ACTIVE') {
        isMatchReadyRef.current = true; // Match successfully started, prevent cancellation
        if (unsubRef.current) unsubRef.current();
        onMatchReady({ matchId: newMatchId, side: 'p1', config: initialConfig });
      }
    }, (err) => console.error(err));
  };

  const joinMatch = async () => {
    if (!user) return;
    playArcadeSound('click');
    if (!matchIdInput || matchIdInput.length < 5) return;
    setStatus("JOINING");
    setErrorMsg(""); // Clear previous errors
    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchIdInput);
    try {
      const snap = await getDoc(matchRef);
      if (snap.exists() && snap.data().status === 'WAITING') {
        await updateDoc(matchRef, { p2Id: user.uid, status: 'ACTIVE' });
        onMatchReady({ matchId: matchIdInput, side: 'p2', config: snap.data().config });
      } else {
        setErrorMsg("Arena not found or already in progress."); 
        setStatus("IDLE");
      }
    } catch (e) { console.error(e); setStatus("IDLE"); setErrorMsg("Connection failed."); }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
      <div className="glass-panel border-t-4 border-rose-500 rounded-[2rem] p-8 md:p-10 w-full text-center shadow-[0_0_40px_rgba(225,29,72,0.3)]">
        <div className="w-16 h-16 bg-rose-900/50 rounded-xl flex items-center justify-center mx-auto mb-6 border border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.5)]"><Shield className="text-rose-400 w-8 h-8" /></div>
        <h2 className="text-2xl font-arcade font-black mb-2 text-white tracking-widest">ONLINE RANKED</h2>
        <p className="text-slate-400 font-bold mb-10 text-sm">Connect via secure channel.</p>
        
        {status === "IDLE" && (
          <div className="space-y-6">
            <button onClick={createMatch} className="btn-3d btn-purple w-full py-4 rounded-xl font-arcade font-black text-lg tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.4)]">HOST MATCH</button>
            <div className="flex gap-2">
              <input type="text" maxLength={5} placeholder="CODE" value={matchIdInput} onChange={(e) => setMatchIdInput(e.target.value.replace(/\D/g, ''))} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 font-arcade text-2xl font-black tracking-[0.3em] text-center focus:outline-none focus:border-rose-500 text-white transition-colors" />
              <button onClick={joinMatch} disabled={matchIdInput.length < 5} className="btn-3d btn-green px-6 rounded-xl font-arcade font-black disabled:opacity-50 shadow-[0_0_20px_rgba(34,197,94,0.4)]">JOIN</button>
            </div>
            {errorMsg && <p className="text-rose-500 font-arcade text-[10px] uppercase tracking-widest mt-2 animate-pulse">{errorMsg}</p>}
          </div>
        )}
        {status === "HOSTING" && (
          <div className="space-y-6 py-4">
            <p className="text-xs font-arcade text-slate-400 uppercase tracking-widest">Share Authorization Code</p>
            <div className="bg-slate-900 p-6 rounded-xl border border-dashed border-rose-500/50"><h3 className="text-5xl font-arcade font-black text-rose-400 tracking-[0.2em] drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]">{matchIdInput}</h3></div>
            <div className="flex items-center justify-center gap-3 text-rose-400"><RefreshCw className="w-5 h-5 animate-spin" /><span className="font-bold text-sm uppercase tracking-wider">Awaiting Challenger...</span></div>
          </div>
        )}
        {status === "JOINING" && <div className="py-12 text-rose-500"><RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4" /><span className="font-arcade font-black uppercase tracking-widest">Establishing Uplink...</span></div>}
      </div>
    </div>
  );
}

// --- CORE GAME ARENA ---
function MatchArena({ mode, config, user, playerProfile, onMatchEnd, onStateUpdated, onExit, matchContext }) {
  const isMulti = mode === 'MULTI';
  const isLocal = mode === 'LOCAL';
  const matchId = matchContext?.matchId;
  const playerSide = matchContext?.side || 'p1'; 

  // SAFEGUARD: Move finalizeMatch to the very top to prevent ANY ReferenceError / TDZ issues
  const questionsAnsweredRef = useRef([]);
  // We need p1StateRef to exist before finalizeMatch
  const [p1State, setP1State] = useState({ problem: null, input: "", score: 0, streak: 0, error: false, criticalError: false, meter: 0, isJammed: false, isFrozen: false, hasShield: false, hasDouble: false, readyPowerUp: null });
  const p1StateRef = useRef(p1State);
  useEffect(() => { p1StateRef.current = p1State; }, [p1State]);
  
  const finalizeMatch = useCallback((won, endStateWinner = null) => {
    onMatchEnd({ 
      won, 
      isTie: endStateWinner === 'tie', 
      score: p1StateRef.current.score, 
      timestamp: Date.now(), 
      mode, 
      difficulty: config.difficulty,
      localWinner: endStateWinner
    }, questionsAnsweredRef.current);
  }, [mode, config.difficulty, onMatchEnd]);

  const [phase, setPhase] = useState('INTRO'); 
  const [countdownText, setCountdownText] = useState('3');
  
  const [p2State, setP2State] = useState({ problem: null, input: "", score: 0, streak: 0, error: false, criticalError: false, meter: 0, isJammed: false, isFrozen: false, hasShield: false, hasDouble: false, readyPowerUp: null });
  
  const [hitStop, setHitStop] = useState(false);
  const hitStopRef = useRef(false);
  const [particles, setParticles] = useState([]);

  const defaultKeys = ['1','2','3','4','5','6','7','8','9'];
  const [p1Keys, setP1Keys] = useState(defaultKeys);
  const [p2Keys, setP2Keys] = useState(defaultKeys);

  const [timeLeft, setTimeLeft] = useState(DIFFICULTY_PRESETS[config.difficulty].time);
  const timeLeftRef = useRef(timeLeft);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  const p1SpeedDeadline = useRef(0);
  const p2SpeedDeadline = useRef(0);
  
  const p1RushBarRef = useRef(null);
  const p2RushBarRef = useRef(null);

  const [floatingTexts, setFloatingTexts] = useState([]);
  
  const isMounted = useRef(true);
  const p1TimeoutLockRef = useRef(false);
  const p2TimeoutLockRef = useRef(false);
  const submissionLockRef = useRef({ p1: false, p2: false });
  const gameInfoRef = useRef({ isMulti, matchId, playerSide });

  // Keep game info fresh for the unmount cleanup
  useEffect(() => { gameInfoRef.current = { isMulti, matchId, playerSide }; }, [isMulti, matchId, playerSide]);

  useEffect(() => {
    return () => { 
      isMounted.current = false; 
      // Gracefully forfeit the match if the user rage-quits to the Main Menu
      const { isMulti, matchId, playerSide } = gameInfoRef.current;
      if (isMulti && matchActive.current && matchId) {
         const forfeitWinner = playerSide === 'p1' ? 'p2' : 'p1';
         const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId);
         updateDoc(matchRef, { status: 'FINISHED', winner: forfeitWinner }).catch(()=>{});
      }
    };
  }, [db]);

  const spawnFloatingText = useCallback((text, side, isCombo = false, isPerfect = false) => {
    const id = Math.random().toString(36).substr(2, 9);
    setFloatingTexts(prev => [...prev, { id, text, side, isCombo, isPerfect }]);
    setTimeout(() => {
       if (isMounted.current) setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
    }, 1200);
  }, []);

  const spawnPerfectStrike = useCallback((side) => {
    spawnFloatingText("PERFECT!", side, false, true);
  }, [spawnFloatingText]);

  const [aiProfile] = useState(() => {
    if (config.aiOpponent && config.aiOpponent !== 'RANDOM') {
      return AI_NAMES.find(a => a.name === config.aiOpponent) || AI_NAMES[1];
    }
    if(Math.random() < 0.2) return AI_NAMES.find(a => a.name === 'Abajis');
    return AI_NAMES[Math.floor(Math.random() * (AI_NAMES.length - 1)) + 1]; 
  });

  const getAvatar = useCallback((side) => {
    const s = side === 'p1' ? p1State : p2State;
    if (s.isFrozen) return '🧊';
    if (s.isJammed) return '🤬';
    if (s.error || s.criticalError) return '😵';
    if (s.hasDouble) return '⚡';
    if (s.streak >= 3) return '🔥';
    return side === 'p1' ? (typeof playerProfile?.avatar === 'string' ? playerProfile.avatar : '🐺') : (isLocal ? '🐯' : (isMulti ? '🐉' : aiProfile.emoji));
  }, [p1State, p2State, isLocal, isMulti, aiProfile.emoji, playerProfile]);

  const targetRopeRef = useRef(0);
  const localForces = useRef({ p1: 0, p2: 0 });
  const matchActive = useRef(true);
  const tugContainerRef = useRef(null);
  
  const currentQuestionStartTime = useRef(Date.now());
  const p2QuestionStartTime = useRef(Date.now());

  const p2StateRef = useRef(p2State);
  useEffect(() => { p2StateRef.current = p2State; }, [p2State]);

  const [dangerZone, setDangerZone] = useState(null);
  const tensionLevelRef = useRef(0);
  const hitStopTimeoutRef = useRef(null);
  const hasFinalizedRef = useRef(false);

  const triggerHitStop = useCallback(() => {
    setHitStop(true);
    hitStopRef.current = true;
    playArcadeSound('hitstop');
    if (hitStopTimeoutRef.current) clearTimeout(hitStopTimeoutRef.current);
    hitStopTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        setHitStop(false);
        hitStopRef.current = false;
      }
    }, 150);
  }, []);

  const spawnParticles = useCallback((side, colorHex) => {
    const newParticles = Array.from({length: 12}).map(() => ({
      id: Math.random().toString(),
      side,
      color: colorHex,
      dx: (Math.random() - 0.5) * 300 + 'px',
      dy: (Math.random() - 0.5) * 300 + 'px',
      size: Math.random() * 10 + 5 + 'px'
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
       if (isMounted.current) setParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, 600);
  }, []);

  const generateProblemFor = useCallback((player) => {
    const prob = generateProblem(config.operation, config.difficulty, config.specialMode);
    
    if (player === 'p1') {
        setP1State(prev => ({ ...prev, problem: prob, input: "" }));
        if (config.specialMode === 'SPEED_RUSH') p1SpeedDeadline.current = Date.now() + 3000;
        currentQuestionStartTime.current = Date.now(); // Reset timing tracking
    } else {
        setP2State(prev => ({ ...prev, problem: prob, input: "" }));
        if (config.specialMode === 'SPEED_RUSH') p2SpeedDeadline.current = Date.now() + 3000;
        if (isLocal) p2QuestionStartTime.current = Date.now(); // Reset timing tracking
    }
  }, [config.operation, config.difficulty, config.specialMode, isLocal]);

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

  const applyForce = useCallback(async (side, forceAmount = 1) => {
    if (!matchActive.current) return;

    const opponentSide = side === 'p1' ? 'p2' : 'p1';
    const opponentStateRef = opponentSide === 'p1' ? p1StateRef : p2StateRef;
    
    // Shield Mechanics
    if (opponentStateRef.current.hasShield) {
        playArcadeSound('shield_break');
        spawnFloatingText('🛡️ BLOCKED!', opponentSide, true);
        
        if (opponentSide === 'p1') setP1State(prev => ({...prev, hasShield: false}));
        else setP2State(prev => ({...prev, hasShield: false}));

        if (isMulti && matchId) {
            const opponentNetworkSide = playerSide === 'p1' ? 'p2' : 'p1';
            const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId);
            try { updateDoc(matchRef, { [`${opponentNetworkSide}Shield`]: false }); } catch (e) {}
        }
        return; // Attack completely negated!
    }

    playArcadeSound('pull');
    const directionalForce = side === 'p1' ? forceAmount : -forceAmount;
    localForces.current[side] += forceAmount; 
    targetRopeRef.current += directionalForce;

    if (isMulti && matchId) {
       const targetNetworkSide = side === 'p1' ? playerSide : (playerSide === 'p1' ? 'p2' : 'p1');
       const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId);
       const updateField = targetNetworkSide === 'p1' ? 'p1Force' : 'p2Force';
       try { await updateDoc(matchRef, { [updateField]: increment(forceAmount) }); } catch (e) {}
    } else {
      if (targetRopeRef.current >= MAX_SCORE_DIFFERENCE) {
        matchActive.current = false;
        triggerHitStop();
        setPhase('ENDED');
        targetRopeRef.current = MAX_SCORE_DIFFERENCE + 5;
        setTimeout(() => { if (isMounted.current) finalizeMatch(true, 'p1'); }, 1500);
      } else if (targetRopeRef.current <= -MAX_SCORE_DIFFERENCE) {
        matchActive.current = false;
        triggerHitStop();
        setPhase('ENDED');
        targetRopeRef.current = -(MAX_SCORE_DIFFERENCE + 5);
        setTimeout(() => { if (isMounted.current) finalizeMatch(false, 'p2'); }, 1500);
      }
    }
  }, [isMulti, matchId, playerSide, triggerHitStop, spawnFloatingText, finalizeMatch]); 

  // Fast animation loop for UI (Speed Rush timers + physics)
  useEffect(() => {
    let animationFrameId;
    let currentX = 0;
    let velocity = 0;

    const updatePhysics = () => {
      if (!hitStopRef.current && matchActive.current) {
        // Physics logic
        const target = targetRopeRef.current;
        const diff = target - currentX;
        const springForce = diff * 0.15;
        velocity = (velocity + springForce) * 0.75; 
        currentX += velocity;

        const absoluteTension = Math.abs(currentX) / MAX_SCORE_DIFFERENCE;
        tensionLevelRef.current = absoluteTension;

        if (phase === 'SUDDEN_DEATH') {
            setDangerZone(prev => prev !== 'both' ? 'both' : prev); 
        } else if (currentX > MAX_SCORE_DIFFERENCE * 0.7 || p1StateRef.current.streak >= 4) {
            setDangerZone(prev => prev !== 'p1' ? 'p1' : prev);
        } else if (currentX < -MAX_SCORE_DIFFERENCE * 0.7 || p2StateRef.current.streak >= 4) {
            setDangerZone(prev => prev !== 'p2' ? 'p2' : prev);
        } else {
            setDangerZone(prev => prev !== null ? null : prev);
        }

        if (tugContainerRef.current) {
          const isMobile = window.innerWidth < 768;
          const multiplier = isMobile ? 6 : 15; 
          let movePixels = -(currentX * multiplier);
          tugContainerRef.current.style.transform = `translateX(${movePixels}px)`;
        }

        // Speed Rush logic
        if (config.specialMode === 'SPEED_RUSH' && phase === 'PLAYING') {
            const now = Date.now();
            
            if (p1StateRef.current.problem && !p1StateRef.current.isFrozen) {
                const left1 = p1SpeedDeadline.current - now;
                const pct1 = Math.min(100, Math.max(0, (left1 / 3000) * 100)); // Cap at 100 to prevent bar overflow
                
                // Update DOM directly instead of triggering 60 React renders per second
                if (p1RushBarRef.current) {
                    p1RushBarRef.current.style.width = `${pct1}%`;
                    p1RushBarRef.current.style.backgroundColor = pct1 < 30 ? '#ef4444' : '#fbbf24';
                }
                
                if (left1 <= 0 && !p1TimeoutLockRef.current && !p1StateRef.current.error) {
                    p1TimeoutLockRef.current = true;
                    playArcadeSound('error');
                    // Log timeout as a failure so accuracy doesn't falsely show 100%
                    questionsAnsweredRef.current.push({
                        type: p1StateRef.current.problem?.type || 'UNKNOWN',
                        isCorrect: false,
                        timeTaken: 3.0
                    });
                    setP1State(prev => ({ ...prev, input: "", error: true, streak: 0 }));
                    applyForce('p2', 1);
                    generateProblemFor('p1');
                    spawnFloatingText("TOO SLOW!", 'p1', false);
                    
                    // Ensure the error state resets so the player doesn't become immune to future timeouts!
                    setTimeout(() => { 
                        p1TimeoutLockRef.current = false; 
                        if (isMounted.current) setP1State(prev => ({...prev, error: false})); 
                    }, 1000);
                }
            }

            if (p2StateRef.current.problem && !p2StateRef.current.isFrozen && !isMulti) {
                const left2 = p2SpeedDeadline.current - now;
                const pct2 = Math.min(100, Math.max(0, (left2 / 3000) * 100));

                if (p2RushBarRef.current) {
                    p2RushBarRef.current.style.width = `${pct2}%`;
                    p2RushBarRef.current.style.backgroundColor = pct2 < 30 ? '#ef4444' : '#fbbf24';
                }
                
                if (left2 <= 0 && !p2TimeoutLockRef.current && !p2StateRef.current.error) {
                    p2TimeoutLockRef.current = true;
                    playArcadeSound('error');
                    setP2State(prev => ({ ...prev, input: "", error: true, streak: 0 }));
                    applyForce('p1', 1);
                    generateProblemFor('p2');
                    spawnFloatingText("TOO SLOW!", 'p2', false);
                    
                    // Clear P2 error immunity
                    setTimeout(() => { 
                        p2TimeoutLockRef.current = false; 
                        if (isMounted.current) setP2State(prev => ({...prev, error: false}));
                    }, 1000);
                }
            }
        }
      }
      animationFrameId = requestAnimationFrame(updatePhysics);
    };
    
    animationFrameId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animationFrameId);
  }, [phase, config.specialMode, isLocal, generateProblemFor, applyForce, spawnFloatingText, isMulti]); 

  const activatePowerUp = useCallback(async (attackerSide) => {
    if (!matchActive.current) return;
    
    const attackerStateRef = attackerSide === 'p1' ? p1StateRef : p2StateRef;
    const setState = attackerSide === 'p1' ? setP1State : setP2State;
    const powerUp = attackerStateRef.current.readyPowerUp;
    
    if (!powerUp) return;
    playArcadeSound('powerup');
    setState(prev => ({ ...prev, meter: 0, readyPowerUp: null }));

    const targetSide = attackerSide === 'p1' ? 'p2' : 'p1';

    const applyPowerUpLocal = (pType, side) => {
        if (pType === 'JAM') {
            const targetSetState = side === 'p1' ? setP2State : setP1State;
            const targetSetKeys = side === 'p1' ? setP2Keys : setP1Keys;
            targetSetState(prev => ({ ...prev, isJammed: true }));
            targetSetKeys(shuffleArray(defaultKeys));
            spawnFloatingText('📡 SYSTEM JAMMED!', targetSide, true);
            setTimeout(() => { 
               if (!isMounted.current) return;
               targetSetState(prev => ({ ...prev, isJammed: false })); 
               targetSetKeys(defaultKeys); 
            }, 3000);
        } else if (pType === 'FREEZE') {
            const targetSetState = side === 'p1' ? setP2State : setP1State;
            targetSetState(prev => ({ ...prev, isFrozen: true }));
            spawnFloatingText('❄️ FROZEN!', targetSide, true);
            
            // Adjust speed rush deadline if frozen so they don't instadie
            if (config.specialMode === 'SPEED_RUSH') {
                if (targetSide === 'p1') p1SpeedDeadline.current += 2000;
                else p2SpeedDeadline.current += 2000;
            }

            setTimeout(() => {
               if (isMounted.current) targetSetState(prev => ({ ...prev, isFrozen: false }));
            }, 2000);
        } else if (pType === 'DOUBLE_DAMAGE') {
            setState(prev => ({ ...prev, hasDouble: true }));
            spawnFloatingText('⚡ DMG BOOST!', side, true);
        } else if (pType === 'SHIELD') {
            setState(prev => ({ ...prev, hasShield: true }));
            spawnFloatingText('🛡️ SHIELD UP!', side, true);
        }
    };

    if (isMulti && matchId) {
        const attackerNetworkSide = attackerSide === 'p1' ? playerSide : (playerSide === 'p1' ? 'p2' : 'p1');
        const targetNetworkSide = attackerNetworkSide === 'p1' ? 'p2' : 'p1';
        
        const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId);
        let updates = {};
        if (powerUp === 'JAM') updates[`${targetNetworkSide}JammedUntil`] = Date.now() + 3000;
        else if (powerUp === 'FREEZE') updates[`${targetNetworkSide}FrozenUntil`] = Date.now() + 2000;
        else if (powerUp === 'DOUBLE_DAMAGE') updates[`${attackerNetworkSide}Double`] = true;
        else if (powerUp === 'SHIELD') updates[`${attackerNetworkSide}Shield`] = true;
        try { await updateDoc(matchRef, updates); } catch (e) {}
    } else {
        applyPowerUpLocal(powerUp, attackerSide);
    }
  }, [isMulti, matchId, playerSide, spawnFloatingText, config.specialMode]);

  const submitAnswer = useCallback((side) => {
    if (!matchActive.current || (phase !== 'PLAYING' && phase !== 'SUDDEN_DEATH')) return;
    
    // Lock submission to prevent "Enter-mashing" combo exploits
    if (submissionLockRef.current[side]) return;

    const currentState = side === 'p1' ? p1StateRef.current : p2StateRef.current;
    const setState = side === 'p1' ? setP1State : setP2State;

    if (!currentState.input || !currentState.problem || currentState.isFrozen) return;

    submissionLockRef.current[side] = true;
    setTimeout(() => { submissionLockRef.current[side] = false; }, 250);

    const isCorrect = currentState.input.trim() === currentState.problem.answer;
    let isSpeedStrike = false;

    // Base Speed Strikes on real human timing for both P1 and P2 Local
    if (side === 'p1' || isLocal) {
       const timerRef = side === 'p1' ? currentQuestionStartTime : p2QuestionStartTime;
       const timeTaken = Date.now() - timerRef.current;
       if (timeTaken < 2500) isSpeedStrike = true;

       if (side === 'p1') {
           questionsAnsweredRef.current.push({ 
               type: currentState.problem?.type || 'UNKNOWN', 
               isCorrect, 
               timeTaken: timeTaken / 1000 
           });
       }
    } else {
       // Only the network/bot AI uses RNG for their perfect strikes
       if (Math.random() < 0.2 * aiProfile.aggro) isSpeedStrike = true;
    }

    if (!isCorrect) {
        // SURVIVAL MODE LOGIC
        if (config.specialMode === 'SURVIVAL') {
            playArcadeSound('loss');
            matchActive.current = false;
            setPhase('ENDED');
            targetRopeRef.current = side === 'p1' ? -MAX_SCORE_DIFFERENCE - 5 : MAX_SCORE_DIFFERENCE + 5;
            spawnFloatingText("FATAL ERROR!", side, true);
            setTimeout(() => { if (isMounted.current) finalizeMatch(side !== 'p1', side !== 'p1' ? 'p2' : 'p1'); }, 1500);
            
            if (isMulti && matchId) {
                const errNetworkSide = side === 'p1' ? playerSide : (playerSide === 'p1' ? 'p2' : 'p1');
                const winner = errNetworkSide === 'p1' ? 'p2' : 'p1';
                updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId), { status: 'FINISHED', winner }).catch(()=>{});
            }
            return;
        }

        playArcadeSound('error');
        setState(prev => ({ ...prev, input: "", error: true, criticalError: prev.streak >= 3, streak: 0 }));
        setTimeout(() => {
            if (isMounted.current) setState(prev => ({ ...prev, error: false, criticalError: false }));
        }, 400);
        return;
    }

    // IF CORRECT:
    if (phase === 'SUDDEN_DEATH') {
        triggerHitStop();
        playArcadeSound('combo');
        applyForce(side, MAX_SCORE_DIFFERENCE + 5); 
        return;
    }

    const newStreak = currentState.streak + 1;
    const isCombo = newStreak >= 3;
    
    let baseForce = isCombo ? 2 : 1; 
    
    // PUZZLE MODE Massive Pulls
    if (config.specialMode === 'PUZZLE') baseForce *= 3; 

    if (isSpeedStrike && !isCombo) baseForce += 1;
    
    // Multiplier Logic
    if (currentState.hasDouble) {
        baseForce *= 2;
        setState(prev => ({...prev, hasDouble: false}));
        if (isMulti && matchId) {
            const uiNetworkSide = side === 'p1' ? playerSide : (playerSide === 'p1' ? 'p2' : 'p1');
            updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId), { [`${uiNetworkSide}Double`]: false }).catch(()=>{});
        }
    }

    if (isSpeedStrike && !isCombo) {
        playArcadeSound('perfect');
        spawnPerfectStrike(side);
        spawnParticles(side, '#facc15');
    } else if (isCombo) {
        playArcadeSound('combo');
        triggerHitStop();
        spawnParticles(side, side === 'p1' ? '#3b82f6' : '#ef4444');
    }

    applyForce(side, baseForce);
    
    const meterGain = isSpeedStrike ? 40 : 25;
    const newMeter = Math.min(100, currentState.meter + meterGain);
    
    let nextPowerUp = currentState.readyPowerUp;
    if (newMeter >= 100 && !nextPowerUp) {
        const pKeys = Object.keys(POWERUPS);
        nextPowerUp = pKeys[Math.floor(Math.random() * pKeys.length)];
    }

    setState(prev => ({ 
        ...prev, 
        score: prev.score + baseForce, 
        streak: newStreak, 
        error: false, 
        criticalError: false,
        meter: newMeter,
        readyPowerUp: nextPowerUp
    }));
    
    if (isCombo) spawnFloatingText(`COMBO x${newStreak}!`, side, true);
    else if (!isSpeedStrike) spawnFloatingText(`+${baseForce} PULL`, side, false);
    
    generateProblemFor(side);

  }, [phase, applyForce, spawnFloatingText, generateProblemFor, triggerHitStop, spawnPerfectStrike, spawnParticles, aiProfile.aggro, isMulti, matchId, playerSide, config.specialMode, finalizeMatch, isLocal]);

  const handleKeyPad = useCallback((key, side) => {
    if (!matchActive.current || (phase !== 'PLAYING' && phase !== 'SUDDEN_DEATH')) return;
    playArcadeSound('click');
    
    const setState = side === 'p1' ? setP1State : setP2State;
    const currentState = side === 'p1' ? p1StateRef.current : p2StateRef.current;

    if (currentState.isFrozen) return;

    if (key === 'ENTER') submitAnswer(side);
    else if (key === 'DEL') setState(prev => ({ ...prev, input: prev.input.slice(0, -1) }));
    else if (currentState.input.length < 5) setState(prev => ({ ...prev, input: prev.input + key }));
    
  }, [phase, submitAnswer]);

  useEffect(() => {
    let timeoutId;
    let intervalId;

    if (phase === 'INTRO') {
       playArcadeSound('start');
       timeoutId = setTimeout(() => setPhase('COUNTDOWN'), 2500);
    } else if (phase === 'COUNTDOWN') {
       let c = 3;
       intervalId = setInterval(() => {
          c--;
          if (c > 0) {
             playArcadeSound('tick');
             setCountdownText(c.toString());
          }
          else if (c === 0) {
             playArcadeSound('start');
             setCountdownText('FIGHT!');
          }
          else {
             clearInterval(intervalId);
             setPhase('PLAYING');
             generateProblemFor('p1');
             if (isLocal) generateProblemFor('p2');
          }
       }, 1000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [phase, generateProblemFor, isLocal]);

  useEffect(() => {
    if (phase !== 'PLAYING' || !matchActive.current) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'PLAYING' || !matchActive.current || timeLeft > 0) return;
    
    if (targetRopeRef.current === 0) {
        setPhase('SUDDEN_DEATH');
        playArcadeSound('alarm');
        triggerHitStop();
        spawnFloatingText("SUDDEN DEATH!", 'p1', true);
        spawnFloatingText("SUDDEN DEATH!", 'p2', true);
        return;
    }
    
    const finalRope = targetRopeRef.current;
    
    if (isMulti) {
        matchActive.current = false; 
        if (playerSide === 'p1' && !hasFinalizedRef.current) {
            const winner = finalRope > 0 ? 'p1' : (finalRope < 0 ? 'p2' : 'tie');
            const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId);
            updateDoc(matchRef, { status: 'FINISHED', winner }).catch(console.error);
        }
    } else {
        if (!hasFinalizedRef.current) {
            hasFinalizedRef.current = true;
            matchActive.current = false;
            setPhase('ENDED');
            if (finalRope > 0) setTimeout(() => { if(isMounted.current) finalizeMatch(true, 'p1'); }, 1500);
            else if (finalRope < 0) setTimeout(() => { if(isMounted.current) finalizeMatch(false, 'p2'); }, 1500);
            else setTimeout(() => { if(isMounted.current) finalizeMatch(false, 'tie'); }, 1500);
        }
    }
  }, [timeLeft, phase, finalizeMatch, triggerHitStop, spawnFloatingText, playerSide, isMulti, matchId, db]);

  useEffect(() => {
    if (!user || !isMulti || !matchId) return;
    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId);
    
    const unsub = onSnapshot(matchRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      
      if (data.status === 'FINISHED') {
         if (!hasFinalizedRef.current) {
             hasFinalizedRef.current = true;
             matchActive.current = false;
             setPhase('ENDED');
             
             const isTie = data.winner === 'tie';
             const iWon = data.winner === playerSide;
             
             let finalRope = 0;
             if (!isTie) finalRope = iWon ? MAX_SCORE_DIFFERENCE + 5 : -(MAX_SCORE_DIFFERENCE + 5);
             targetRopeRef.current = finalRope;
             
             setTimeout(() => { if(isMounted.current) finalizeMatch(iWon, data.winner); }, 1500); 
         }
         return;
      }

      if (!matchActive.current) return;

      const uiRope = playerSide === 'p1' ? (data.p1Force - data.p2Force) : (data.p2Force - data.p1Force);
      targetRopeRef.current = uiRope;
      
      const newP1Force = playerSide === 'p1' ? data.p1Force : data.p2Force;
      const newP2Force = playerSide === 'p1' ? data.p2Force : data.p1Force;

      if (newP2Force > localForces.current.p2) {
          setP2State(prev => {
             const newMeter = Math.min(100, prev.meter + 25);
             let nextPowerUp = prev.readyPowerUp;
             if (newMeter >= 100 && !nextPowerUp) {
                 const pKeys = Object.keys(POWERUPS);
                 nextPowerUp = pKeys[Math.floor(Math.random() * pKeys.length)];
             }
             return { ...prev, meter: newMeter, readyPowerUp: nextPowerUp };
          });
      }

      localForces.current = { p1: newP1Force, p2: newP2Force };

      if (playerSide === 'p1') {
          const trueRope = data.p1Force - data.p2Force;
          if (trueRope >= MAX_SCORE_DIFFERENCE) {
              updateDoc(matchRef, { status: 'FINISHED', winner: 'p1' }).catch(()=>{});
          } else if (trueRope <= -MAX_SCORE_DIFFERENCE) {
              updateDoc(matchRef, { status: 'FINISHED', winner: 'p2' }).catch(()=>{});
          }
      }

      const syncStatus = (networkSide) => {
         const uiSide = networkSide === playerSide ? 'p1' : 'p2';
         const isMe = uiSide === 'p1';
         const stateRef = uiSide === 'p1' ? p1StateRef : p2StateRef;
         const setState = uiSide === 'p1' ? setP1State : setP2State;
         const setKeys = uiSide === 'p1' ? setP1Keys : setP2Keys;
         
         const jammedTime = data[`${networkSide}JammedUntil`];
         const frozenTime = data[`${networkSide}FrozenUntil`];
         const isJammed = jammedTime > Date.now();
         const isFrozen = frozenTime > Date.now();
         const hasShield = data[`${networkSide}Shield`];
         const hasDouble = data[`${networkSide}Double`];

         const previousState = stateRef.current;
         let meterReset = {};
         if (!isMe && (
            (isJammed && !previousState.isJammed) || 
            (isFrozen && !previousState.isFrozen) ||
            (hasShield && !previousState.hasShield) || 
            (hasDouble && !previousState.hasDouble)
         )) {
            meterReset = { meter: 0, readyPowerUp: null };
         }

         if (isJammed && !stateRef.current.isJammed) {
           if (isMe) setKeys(shuffleArray(defaultKeys));
           spawnFloatingText('📡 SYSTEM JAMMED!', uiSide, true);
           setTimeout(() => {
             if (!isMounted.current) return;
             setState(prev => ({ ...prev, isJammed: false }));
             if (isMe) setKeys(defaultKeys);
           }, jammedTime - Date.now());
         }
         
         if (isFrozen && !stateRef.current.isFrozen) {
           spawnFloatingText('❄️ FROZEN!', uiSide, true);
           if (config.specialMode === 'SPEED_RUSH') {
                if (uiSide === 'p1') p1SpeedDeadline.current += 2000;
                else p2SpeedDeadline.current += 2000;
           }
           setTimeout(() => {
              if (isMounted.current) setState(prev => ({ ...prev, isFrozen: false }));
           }, frozenTime - Date.now());
         }

         setState(prev => ({ ...prev, isJammed, isFrozen, hasShield, hasDouble, ...meterReset }));
      };
      
      syncStatus('p1');
      syncStatus('p2');

    }, (err) => console.error(err));
    return () => unsub();
  }, [user, isMulti, matchId, playerSide, finalizeMatch, spawnFloatingText, config.specialMode]);

  useEffect(() => {
    if (isMulti || isLocal || !matchActive.current || (phase !== 'PLAYING' && phase !== 'SUDDEN_DEATH')) return;
    let aiTimer;
    const runAI = () => {
      if (!matchActive.current) return;

      if (p2StateRef.current.isFrozen) {
          aiTimer = setTimeout(runAI, 500); 
          return;
      }
      
      if (p2StateRef.current.readyPowerUp && Math.random() < 0.3) {
        activatePowerUp('p2');
      }

      const { aiSolveTime, aiAccuracy } = DIFFICULTY_PRESETS[config.difficulty];
      
      let dynamicTimeMod = 1.0;
      if (targetRopeRef.current > 5) dynamicTimeMod = 0.6; 
      if (phase === 'SUDDEN_DEATH') dynamicTimeMod = 0.4; 
      if (p2StateRef.current.isJammed) dynamicTimeMod = 2.0; 
      
      let baseDelay = Math.random() * (aiSolveTime[1] - aiSolveTime[0]) + aiSolveTime[0];
      
      if (config.specialMode === 'SPEED_RUSH') baseDelay = Math.min(baseDelay, 2800);
      
      if (aiProfile.name === 'Abajis' && questionsAnsweredRef.current.length > 2) {
          const recent = questionsAnsweredRef.current.slice(-3).map(q => q.timeTaken);
          const avgPTime = (recent.reduce((a,b)=>a+b,0) / recent.length) * 1000;
          baseDelay = Math.max(800, avgPTime - 150); 
      }

      const calculatedDelay = (baseDelay * dynamicTimeMod) / aiProfile.aggro;
      const finalDelay = Math.max(300, calculatedDelay); 

      aiTimer = setTimeout(() => {
        if (!matchActive.current) return; 
        if (p2StateRef.current.isFrozen) { runAI(); return; } 
        
        if (Math.random() < (aiAccuracy * aiProfile.def)) {
          if (phase === 'SUDDEN_DEATH') {
             triggerHitStop();
             playArcadeSound('combo');
             applyForce('p2', MAX_SCORE_DIFFERENCE + 5); 
             return;
          }

          setP2State(prev => {
             const newStreak = prev.streak + 1;
             const isCombo = newStreak >= 3;
             let baseForce = isCombo ? 2 : 1;
             
             if (config.specialMode === 'PUZZLE') baseForce *= 3;
             
             if (prev.hasDouble) baseForce *= 2;

             if (isCombo) { playArcadeSound('combo'); triggerHitStop(); spawnParticles('p2', '#ef4444'); }
             
             applyForce('p2', baseForce);
             
             if (isCombo) spawnFloatingText(`COMBO x${newStreak}!`, 'p2', true);
             else spawnFloatingText(`+${baseForce} PULL`, 'p2', false);

             const meterGain = 20;
             const newMeter = Math.min(100, prev.meter + meterGain);
             let nextPowerUp = prev.readyPowerUp;
             if (newMeter >= 100 && !nextPowerUp) {
                 const pKeys = Object.keys(POWERUPS);
                 nextPowerUp = pKeys[Math.floor(Math.random() * pKeys.length)];
             }

             return { ...prev, score: prev.score + baseForce, streak: newStreak, meter: newMeter, readyPowerUp: nextPowerUp, hasDouble: false };
          });
          
          if (config.specialMode === 'SPEED_RUSH') p2SpeedDeadline.current = Date.now() + 3000;
          
        } else {
           if (config.specialMode === 'SURVIVAL') {
                playArcadeSound('victory'); // Player wins if AI misses in Survival!
                matchActive.current = false;
                setPhase('ENDED');
                targetRopeRef.current = MAX_SCORE_DIFFERENCE + 5;
                spawnFloatingText("FATAL ERROR!", 'p2', true);
                setTimeout(() => { if(isMounted.current) finalizeMatch(true, 'p1'); }, 1500);
                return;
           }

           playArcadeSound('error');
           setP2State(prev => ({ ...prev, streak: 0, error: true })); 
           setTimeout(() => {
               if (isMounted.current) setP2State(prev => ({...prev, error: false}));
           }, 400);
        }
        runAI();
      }, finalDelay);
    };
    runAI();
    return () => clearTimeout(aiTimer);
  }, [isMulti, isLocal, config.difficulty, config.specialMode, phase, aiProfile, finalizeMatch, spawnFloatingText, activatePowerUp, triggerHitStop, spawnParticles, applyForce]);

  useEffect(() => {
    if ((phase !== 'PLAYING' && phase !== 'SUDDEN_DEATH')) return; 
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
         e.preventDefault();
         if (p1StateRef.current.readyPowerUp) activatePowerUp('p1');
         return;
      }
      
      if (e.code === 'NumpadEnter' && isLocal && p2StateRef.current.readyPowerUp) {
          e.preventDefault();
          activatePowerUp('p2');
          return;
      }
      
      const isNumpad = e.code.startsWith('Numpad');

      if (!isLocal || (!isNumpad && e.key !== 'Delete')) {
          if (e.key === 'Enter') handleKeyPad('ENTER', 'p1');
          else if (e.key === 'Backspace') handleKeyPad('DEL', 'p1');
          else if (/[0-9]/.test(e.key)) handleKeyPad(e.key, 'p1');
      }
      
      if (isLocal && (isNumpad || e.key === 'Delete')) {
          if (e.code === 'NumpadEnter') handleKeyPad('ENTER', 'p2');
          else if (e.key === 'Delete' || e.code === 'NumpadSubtract') handleKeyPad('DEL', 'p2');
          else if (/[0-9]/.test(e.key)) handleKeyPad(e.key, 'p2');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPad, phase, activatePowerUp, isLocal]);

  const timerString = phase === 'SUDDEN_DEATH' ? 'OVERTIME' : `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`;
  const ropePos = Math.max(-MAX_SCORE_DIFFERENCE, Math.min(MAX_SCORE_DIFFERENCE, targetRopeRef.current));
  const dominancePercent = 50 + ((ropePos / MAX_SCORE_DIFFERENCE) * 50);
  const vignetteOpacity = Math.max(0, (Math.abs(ropePos) / MAX_SCORE_DIFFERENCE) - 0.5) * 2; 

  const renderPowerUpBtn = (state, side) => {
      const isReady = !!state.readyPowerUp;
      const data = isReady ? POWERUPS[state.readyPowerUp] : null;
      const IconComp = isReady ? data.iconComp : WifiOff;
      return (
          <button 
            onClick={() => (!isLocal && side === 'p2' ? null : activatePowerUp(side))}
            disabled={!isReady || (!isLocal && side === 'p2')}
            className={`text-[10px] font-arcade px-3 py-1 rounded font-black tracking-widest transition-all flex items-center gap-1 ${isReady ? `${data.color} ${data.shadow} hover:scale-105 active:scale-95 ${data.id === 'DOUBLE_DAMAGE' ? 'text-black' : 'text-white'}` : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
          >
            {isReady ? <><IconComp size={14} /> {data.name}</> : <><WifiOff size={12}/> CHARGING</>} {isReady && side === 'p1' ? '(SPC)' : ''}
          </button>
      )
  };

  return (
    <div className={`flex-1 w-full flex flex-col md:flex-row gap-4 md:gap-6 relative transition-transform duration-75 ${hitStop ? 'hit-stop-active' : ''} ${p1State.criticalError || p2State.criticalError ? 'animate-severe-shake' : p1State.error || p2State.error ? 'animate-shake' : ''}`}>
      
      <div className="tension-vignette" style={{ opacity: phase === 'SUDDEN_DEATH' ? 0.8 : vignetteOpacity }}></div>
      <div className={`danger-bg ${dangerZone === 'p1' ? 'opacity-100 bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.6)_0%,transparent_80%)]' : dangerZone === 'p2' ? 'opacity-100 bg-[radial-gradient(circle_at_center,rgba(159,18,57,0.6)_0%,transparent_80%)]' : dangerZone === 'both' ? 'opacity-100 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.4)_0%,transparent_80%)] animate-pulse' : 'opacity-0'}`} />

      {/* Particles Overlay */}
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: p.side === 'p1' ? '25%' : '75%', 
          top: '50%', 
          backgroundColor: p.color, 
          width: p.size, height: p.size, 
          '--dx': p.dx, '--dy': p.dy,
          boxShadow: `0 0 10px ${p.color}`
        }} />
      ))}

      {phase === 'INTRO' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md rounded-3xl">
          <div className={`text-center glass-panel p-10 border-t-4 shadow-[0_0_50px_rgba(0,0,0,1)] max-w-lg w-full ${!isLocal && !isMulti && aiProfile.name === 'Abajis' ? 'border-red-600' : 'border-slate-500'}`}>
            <h2 className="text-4xl font-arcade font-black text-white tracking-[0.2em] mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">{isLocal ? 'LOCAL DUEL' : 'SYSTEM LINKED'}</h2>
            <div className="text-amber-500 font-arcade text-sm uppercase tracking-widest mb-8">{SPECIAL_MODES[config.specialMode].label} Mode</div>
            <div className="flex items-center gap-6 justify-center text-2xl font-black">
              <div className="flex flex-col items-center">
                <span className="text-5xl mb-2 avatar-float">{getAvatar('p1')}</span>
                <span className="text-blue-500 font-arcade">BLUE TEAM</span>
              </div>
              <span className="text-slate-600 font-arcade text-xl">VS</span>
              <div className="flex flex-col items-center">
                <span className="text-5xl mb-2 avatar-float">{getAvatar('p2')}</span>
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

      <div className="absolute top-0 left-0 right-0 h-2 md:h-3 bg-slate-800 rounded-full overflow-hidden flex z-20 md:-top-4 shadow-inner">
         <div className="h-full bg-blue-500 transition-all duration-300 ease-out shadow-[0_0_10px_#3b82f6]" style={{ width: `${dominancePercent}%` }} />
         <div className="h-full bg-rose-500 flex-1 transition-all duration-300 ease-out shadow-[0_0_10px_#ef4444]" />
         <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white -translate-x-1/2 shadow-[0_0_5px_white]" />
      </div>

      {/* P1 Section */}
      <div className={`w-full md:w-1/3 glass-panel flex flex-col overflow-hidden relative transition-all duration-300 ${p1State.isFrozen ? 'frozen-ui' : p1State.isJammed ? 'jammed-ui' : ''} ${p1State.hasShield ? 'shield-aura' : ''} ${p1State.hasDouble ? 'double-aura' : ''} ${p1State.streak >= 3 && !p1State.hasShield && !p1State.hasDouble ? 'neon-blue-border bg-blue-900/20' : 'border border-slate-700'}`}>
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
          <div className={`text-2xl md:text-4xl font-arcade font-black text-blue-100 tracking-wider ${p1State.isJammed ? 'jammed-text' : ''} ${config.specialMode === 'PUZZLE' ? 'text-xl md:text-3xl' : ''}`}>
             {(phase === 'PLAYING' || phase === 'SUDDEN_DEATH') ? (p1State.isFrozen ? 'SYS.LOCK' : p1State.isJammed ? 'E##OR' : p1State.problem?.question) : 'AWAIT'}
          </div>
          <div className="w-full relative">
            <div className={`w-full bg-black/60 rounded-xl h-14 md:h-16 text-3xl md:text-4xl font-arcade font-black flex items-center justify-center border transition-colors shadow-inner ${p1State.criticalError ? 'border-red-600 text-red-500' : p1State.error ? 'border-red-500 text-red-400' : p1State.input ? 'border-blue-500/50 text-white shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]' : 'border-slate-800 text-slate-600'}`}>
              {p1State.input || '_'}
            </div>
            {config.specialMode === 'SPEED_RUSH' && phase === 'PLAYING' && (
               <div className="absolute -bottom-2 left-0 right-0 h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                   <div ref={p1RushBarRef} className="h-full w-full transition-all"></div>
               </div>
            )}
          </div>
        </div>
        
        <div className="px-3 flex gap-2 mb-2 items-center mt-2">
          <div className="flex-1 h-3 bg-slate-900 rounded-full border border-slate-700 overflow-hidden relative shadow-inner">
            <div className={`h-full transition-all duration-300 ${p1State.readyPowerUp ? 'bg-yellow-400 animate-pulse shadow-[0_0_10px_#eab308]' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'}`} style={{ width: `${p1State.meter}%` }} />
          </div>
          {renderPowerUpBtn(p1State, 'p1')}
        </div>

        <div className="p-3 md:p-4 grid grid-cols-3 gap-2 md:gap-3 bg-slate-900/80 rounded-b-xl border-t border-slate-800">
          {p1Keys.map(num => (
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
          <span className={timeLeft <= 10 && phase !== 'SUDDEN_DEATH' ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : ''}>{timerString}</span>
        </div>

        {config.specialMode !== 'STANDARD' && (
          <div className="absolute top-20 z-10 text-[10px] font-arcade bg-slate-900/80 px-3 py-1 rounded text-amber-500 border border-amber-500/50 uppercase font-black">
             {SPECIAL_MODES[config.specialMode].label}
          </div>
        )}

        <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden mt-8 md:mt-0">
          <div className="absolute h-full w-[2px] border-l-2 border-dashed border-white/20 top-0"></div>
          
          <div ref={tugContainerRef} className="relative w-[200%] md:w-[150%] flex items-center justify-center">
            <div className={`text-[4rem] md:text-[6rem] lg:text-[7rem] z-10 drop-shadow-xl transform scale-x-[-1] transition-all duration-100 ${p1State.streak >= 3 ? 'scale-110 drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]' : ''} ${p1State.error ? 'scale-75 opacity-50' : 'avatar-float'}`}>{getAvatar('p1')}</div>
            
            <div className={`h-3 md:h-4 w-32 md:w-64 rounded-full relative flex items-center justify-center z-0 transition-colors ${Math.abs(targetRopeRef.current) > 10 ? 'bg-white shadow-[0_0_20px_white]' : 'bg-slate-800'}`}>
              <div className="absolute w-full h-full rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-pulse"></div>
              </div>
              <div className={`w-4 h-8 md:w-5 md:h-10 border-2 rounded absolute shadow-[0_0_10px_black] z-20 transition-colors ${targetRopeRef.current > 0 ? 'bg-blue-400 border-blue-200 shadow-[0_0_20px_#3b82f6]' : targetRopeRef.current < 0 ? 'bg-rose-400 border-rose-200 shadow-[0_0_20px_#ef4444]' : 'bg-white border-slate-300'}`}>
                <div className="w-full h-full flex items-center justify-center gap-[2px]">
                   <div className="w-[2px] h-1/2 bg-black/30"></div>
                   <div className="w-[2px] h-1/2 bg-black/30"></div>
                </div>
              </div>
            </div>

            <div className={`text-[4rem] md:text-[6rem] lg:text-[7rem] z-10 drop-shadow-xl transition-all duration-100 ${p2State.streak >= 3 ? 'scale-110 drop-shadow-[0_0_20px_rgba(225,29,72,0.8)]' : ''} ${p2State.error ? 'scale-75 opacity-50' : 'avatar-float'}`}>{getAvatar('p2')}</div>
          </div>
        </div>
      </div>

      {/* P2 Section */}
      <div className={`w-full md:w-1/3 glass-panel flex flex-col overflow-hidden mb-8 md:mb-0 relative transition-all duration-300 ${p2State.isFrozen ? 'frozen-ui' : p2State.isJammed ? 'jammed-ui' : ''} ${p2State.hasShield ? 'shield-aura' : ''} ${p2State.hasDouble ? 'double-aura' : ''} ${p2State.streak >= 3 && !p2State.hasShield && !p2State.hasDouble ? 'neon-red-border bg-rose-900/20' : 'border border-slate-700'}`}>
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
          <div className={`text-2xl md:text-4xl font-arcade font-black text-rose-100 tracking-wider ${p2State.isJammed ? 'jammed-text' : ''} ${config.specialMode === 'PUZZLE' ? 'text-xl md:text-3xl' : ''}`}>
             {(phase === 'PLAYING' || phase === 'SUDDEN_DEATH') ? (isLocal ? (p2State.isFrozen ? 'SYS.LOCK' : p2State.isJammed ? 'E##OR' : p2State.problem?.question) : '***') : 'AWAIT'}
          </div>
          <div className="w-full relative">
            <div className={`w-full bg-black/60 rounded-xl h-14 md:h-16 text-3xl md:text-4xl font-arcade font-black flex items-center justify-center border transition-colors shadow-inner ${p2State.criticalError ? 'border-red-600 text-red-500' : p2State.error ? 'border-red-500 text-red-400' : p2State.input ? 'border-rose-500/50 text-white shadow-[inset_0_0_15px_rgba(225,29,72,0.2)]' : 'border-slate-800 text-slate-600'}`}>
               {isLocal ? (p2State.input || '_') : ((phase === 'PLAYING' || phase === 'SUDDEN_DEATH') ? '---' : '_')}
            </div>
            {/* FIX: Ensure the visual timer bar shows for the AI opponent in Single Player */}
            {config.specialMode === 'SPEED_RUSH' && phase === 'PLAYING' && !isMulti && (
               <div className="absolute -bottom-2 left-0 right-0 h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                   <div ref={p2RushBarRef} className="h-full w-full transition-all"></div>
               </div>
            )}
          </div>
        </div>

        <div className="px-3 flex gap-2 mb-2 items-center flex-row-reverse mt-2">
          <div className="flex-1 h-3 bg-slate-900 rounded-full border border-slate-700 overflow-hidden relative shadow-inner">
            <div className={`h-full transition-all duration-300 ${p2State.readyPowerUp ? 'bg-yellow-400 animate-pulse shadow-[0_0_10px_#eab308]' : 'bg-rose-500 shadow-[0_0_10px_#ef4444]'}`} style={{ width: `${p2State.meter}%`, marginLeft: 'auto' }} />
          </div>
          {renderPowerUpBtn(p2State, 'p2')}
        </div>

        <div className={`p-3 md:p-4 grid grid-cols-3 gap-2 md:gap-3 bg-slate-900/80 rounded-b-xl border-t border-slate-800 ${!isLocal ? 'opacity-40 pointer-events-none' : ''}`}>
          {p2Keys.map(num => (
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
    const pulseTimer = setInterval(() => {
      playArcadeSound(data.won || isLocalWin ? 'victory_pulse' : 'loss_pulse');
    }, 1500);
    return () => clearInterval(pulseTimer);
  }, [data, tallyDone]);

  if (!data) return null;

  const isLocal = data.mode === 'LOCAL';
  const isTie = data.isTie || data.localWinner === 'tie';
  const title = isTie ? 'DRAW' : isLocal ? (data.localWinner === 'p1' ? 'BLUE WINS' : 'RED WINS') : (data.won ? 'VICTORY' : 'DEFEATED');
  const borderCol = isTie ? 'border-slate-500 shadow-[0_0_50px_rgba(100,116,139,0.4)]' : (isLocal && data.localWinner === 'p2') || (!isLocal && !data.won) ? 'border-rose-500 shadow-[0_0_50px_rgba(225,29,72,0.4)]' : 'border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.4)]';
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto animate-in zoom-in duration-300">
      <div className={`glass-panel border-t-8 ${borderCol} p-8 md:p-12 w-full text-center bg-slate-900`}>
        <h2 className={`text-5xl md:text-6xl font-arcade font-black tracking-widest mb-2 ${isTie ? 'text-slate-300 drop-shadow-[0_0_15px_#cbd5e1]' : data.won || (isLocal && data.localWinner === 'p1') ? 'text-blue-400 drop-shadow-[0_0_15px_#3b82f6]' : 'text-rose-400 drop-shadow-[0_0_15px_#ef4444]'}`}>{title}</h2>
        <p className="text-slate-400 font-bold mb-10 text-sm uppercase tracking-widest">{data.won || isLocal || isTie ? 'Combat Scenario Concluded' : 'Analyze failure and retry'}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className={`bg-slate-950 p-4 rounded-xl border border-slate-800 transition-transform ${!tallyDone ? 'scale-105 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : ''}`}>
             <p className="text-[10px] font-arcade text-slate-500 uppercase tracking-widest mb-2">FINAL SCORE</p>
             <p className="text-4xl font-arcade font-black text-white">{tallyScore}</p>
          </div>
          {!isLocal && (
             <div className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-opacity duration-1000 ${tallyDone ? 'opacity-100' : 'opacity-0'} ${isTie ? 'bg-slate-800/30 border-slate-500' : data.won ? 'bg-amber-900/30 border-amber-500/50' : 'bg-slate-800/50 border-slate-700'}`}>
                <p className={`text-[10px] font-arcade uppercase tracking-widest mb-2 ${isTie ? 'text-slate-300' : data.won ? 'text-amber-400' : 'text-slate-400'}`}>SKILL RATING</p>
                <div className="flex items-center gap-2">
                   <span className={`text-3xl font-arcade font-black ${isTie ? 'text-slate-300' : data.won ? 'text-amber-400' : 'text-rose-400'}`}>{data.srDelta > 0 ? `+${data.srDelta}` : data.srDelta}</span>
                   {tallyDone && <span className="text-xs text-slate-500 font-bold">({data.newSR})</span>}
                </div>
             </div>
          )}
        </div>
        <button onClick={() => { playArcadeSound('click'); onBack(); }} className={`btn-3d btn-gray hover:bg-white hover:text-black w-full py-4 rounded-xl font-arcade font-black text-xl tracking-widest border border-slate-500 transition-opacity duration-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${tallyDone ? 'opacity-100' : 'opacity-0'}`}>
            RETURN TO HQ
        </button>
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
  const currentRank = getRank(stats.sr || 0);

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto animate-in slide-in-from-right-8 duration-500 py-6">
      <div className="glass-panel border border-slate-700 p-6 md:p-10 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
        <h2 className="text-2xl font-arcade font-black mb-8 flex items-center gap-3 text-white"><BarChart2 className="text-blue-500 w-8 h-8" /> SERVICE RECORD</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center"><p className="text-[10px] font-arcade text-slate-500 uppercase tracking-widest mb-2">ACCURACY</p><p className="text-2xl font-arcade font-black text-white">{Math.round(globalAcc)}%</p></div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center"><p className="text-[10px] font-arcade text-slate-500 uppercase tracking-widest mb-2">ENGAGEMENTS</p><p className="text-2xl font-arcade font-black text-white">{stats.totalGames}</p></div>
          <div className={`col-span-2 p-4 rounded-xl border text-center ${currentRank.bg} border-white/10`}><p className="text-[10px] font-arcade text-slate-400 uppercase tracking-widest mb-2">RANK TIER</p><p className={`text-2xl font-arcade font-black ${currentRank.color}`}>{currentRank.name} - {stats.sr || 0} SR</p></div>
        </div>

        <h3 className="text-xs font-arcade text-slate-500 uppercase tracking-widest mb-4">TACTICAL MASTERY</h3>
        {operationStats.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl text-slate-500"><p className="font-arcade text-sm uppercase tracking-widest">INSUFFICIENT DATA FOR ANALYSIS.</p></div>
        ) : (
          <div className="space-y-3">
            {operationStats.map((op, i) => (
              <div key={i} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center gap-4 hover:bg-slate-800/80 transition-colors">
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

function GlobalLeaderboard({ user }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const leaderboardRef = collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard');
    const unsub = onSnapshot(leaderboardRef, (snap) => {
      const allPlayers = [];
      snap.forEach(doc => allPlayers.push(doc.data()));
      const sortedLeaders = allPlayers.sort((a, b) => (b.sr || 0) - (a.sr || 0)).slice(0, 15);
      setLeaders(sortedLeaders);
      setLoading(false);
    }, (error) => {
      console.error("Leaderboard fetch error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-500 py-6">
      <div className="glass-panel border-t-4 border-yellow-500 p-6 md:p-10 shadow-[0_0_40px_rgba(234,179,8,0.3)]">
        <div className="flex items-center justify-center gap-4 mb-8">
           <Trophy className="text-yellow-500 w-10 h-10 drop-shadow-[0_0_15px_#eab308]" />
           <h2 className="text-3xl font-arcade font-black text-white tracking-widest">GLOBAL RANKINGS</h2>
           <Globe className="text-slate-500 w-8 h-8" />
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-inner">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-700 bg-slate-950 text-[10px] md:text-xs font-arcade text-slate-500 uppercase tracking-widest">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-6">Operative Call Sign</div>
            <div className="col-span-4 text-right">Total SR</div>
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
                  <div key={leader.uid} className={`grid grid-cols-12 gap-4 p-4 border-b border-slate-800/50 items-center transition-colors hover:bg-slate-800 ${isMe ? 'bg-blue-900/20 border-l-4 border-l-blue-500 shadow-inner' : ''}`}>
                    <div className={`col-span-2 text-center font-arcade font-black text-xl md:text-2xl ${rankColor}`}>#{index + 1}</div>
                    <div className="col-span-6 flex items-center gap-3">
                      <span className="text-xl">{leader.avatar || '🐺'}</span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                           {isMe && <span className="text-[9px] bg-blue-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-white shadow-[0_0_8px_#3b82f6]">YOU</span>}
                           <span className={`font-arcade font-bold truncate ${isMe ? 'text-white' : 'text-slate-300'}`}>{leader.name}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{leader.title || 'Novice'}</span>
                      </div>
                    </div>
                    <div className={`col-span-4 text-right font-arcade font-black text-lg md:text-xl ${isMe ? 'text-amber-400' : 'text-slate-400'}`}>
                      {Math.floor(leader.sr || 0)} SR
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