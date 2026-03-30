/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Search, 
  Camera, 
  Home,
  Info, 
  ChevronLeft, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2, 
  HelpCircle,
  ChevronDown,
  Menu,
  X,
  History,
  Filter,
  ArrowRight,
  BookOpen,
  RefreshCw,
  Zap,
  Moon,
  Sun,
  Barcode,
  Package,
  Database,
  Users,
  Trash2,
  Edit3,
  Settings,
  LogOut,
  Trophy,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Microscope,
  Plus,
  Heart,
  Activity,
  TrendingUp,
  TrendingDown,
  Terminal,
  Key
} from 'lucide-react';
import { BarcodeScanner } from './components/BarcodeScanner';
import { triggerHaptic } from './utils/haptics';
import { addLog, getLogs } from './services/logger';
import { getProduct, saveProduct, deleteProduct, verifyProduct, getAllProducts, subscribeToProducts, saveIngredientMapping, deleteIngredientMapping, getIngredientMapping, getAllIngredientMappings, saveIngredient, deleteIngredient, getGlobalStats, getDatabaseStats, testConnection, type IngredientMapping } from './services/productService';
import { getFirebaseAuth, signInWithGoogle, signOutUser, onAuthStateChanged, quotaState, testFirebaseConnection, type User } from './firebase';
import { getRandomFacts, generateMoreFacts, getFactCount, type FoodFact as FirestoreFoodFact } from './services/factService';
import { INGREDIENTS as staticIngredients } from './data/ingredients';
import { motion, AnimatePresence } from 'motion/react';
// const motion = { div: (props: any) => <div {...props} /> };
// const AnimatePresence = ({ children }: any) => <>{children}</>;
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CATEGORIES, getDisplayCategory, type Ingredient, type HealthStatus, type Study, type StudyQuality } from './data/ingredients';
import { INGREDIENTS, getIngredientMap, loadIngredients, subscribeToIngredients, resetIngredientToStatic, cleanIngredientName } from './services/ingredientService';
import { syncUserProfile } from './services/userService';
import { getLeaderboard, recalculateUserStats, recalculateAllStats, type LeaderboardEntry } from './services/leaderboardService';
import { Type, ThinkingLevel } from "@google/genai";
import { safeGenerateContent, matchIngredientsWithAI, generateIngredientDataWithAI, generateHolisticAnalysisWithAI, getAIKeyInfo } from "./services/geminiService";
import { resizeImage } from "./services/imageService";
import { findBestMatch, performHolisticAnalysis, reAnalyzeProduct, calculateOverallScore, calculateHolisticScore } from "./services/analysisService";
import { type ProductAnalysis, type Product, type MatchedIngredient, type ProcessingLevel } from "./types";
import factsData from "./data/facts.json";

// --- Types ---

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const ADMIN_EMAILS = ["jonathanisreed@gmail.com"];

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Error Boundary ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      let isForbidden = errorMessage.includes("403") || 
                         errorMessage.toLowerCase().includes("forbidden") ||
                         errorMessage.toLowerCase().includes("proxying failed") ||
                         errorMessage.toLowerCase().includes("load failed") ||
                         errorMessage.toLowerCase().includes("not authorized");

      return (
        <div className="min-h-dvh bg-zinc-50 dark:bg-dark-bg flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-dark-surface rounded-[2.5rem] p-8 border border-zinc-100 dark:border-dark-border text-center space-y-6 shadow-2xl shadow-zinc-200/50 dark:shadow-none">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-dark-text-primary">Connection Issue</h1>
              <p className="text-sm text-zinc-500 dark:text-dark-text-secondary px-4">
                {isForbidden 
                  ? "Your API key is being blocked. This usually happens after remixing an app because the key is still restricted to the old domain."
                  : "We encountered an unexpected error while connecting to the service."}
              </p>
              <div className="bg-zinc-50 dark:bg-dark-bg p-4 rounded-2xl text-left overflow-auto max-h-48 border border-zinc-100 dark:border-dark-border">
                <p className="text-zinc-400 dark:text-dark-text-secondary text-[10px] font-mono leading-relaxed whitespace-pre-wrap">
                  {errorMessage}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {isForbidden && (
                <button 
                  onClick={async () => {
                    const aistudio = (window as any).aistudio || (window.parent as any).aistudio;
                    if (aistudio && aistudio.openSelectKey) {
                      await aistudio.openSelectKey();
                      window.location.reload();
                    } else {
                      alert("Please go to Settings -> Secrets and update your VITE_GEMINI_API_KEY.");
                    }
                  }}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
                >
                  <Key size={18} />
                  Fix API Key (Recommended)
                </button>
              )}
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all active:scale-[0.98]"
              >
                {isForbidden ? "Try Again" : "Reload App"}
              </button>
              {isForbidden && (
                <p className="text-[10px] text-zinc-400 font-medium pt-2">
                  Clicking "Fix API Key" lets you select a fresh key that isn't restricted.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Components ---

const ScoreBadge = ({ score, size = 'md' }: { score: number; size?: 'xs' | 'sm' | 'md' }) => {
  const roundedScore = Math.round(score);
  const getColors = (s: number) => {
    if (s >= 8) return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
    if (s >= 5) return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
    return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-500/20';
  };

  const sizes = {
    xs: 'w-8 h-8 text-[10px]',
    sm: 'w-10 h-10 text-xs',
    md: 'w-12 h-12 text-sm',
  };

  return (
    <div className={cn(
      "rounded-xl flex items-center justify-center border font-black font-display shrink-0 transition-colors", 
      getColors(roundedScore), 
      sizes[size]
    )}>
      {roundedScore}
    </div>
  );
};

const StatusBadge = ({ status }: { status: HealthStatus }) => {
  const config = {
    'Likely Beneficial': { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-dark-surface/30' },
    'Likely Neutral': { icon: HelpCircle, color: 'text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-dark-surface/50' },
    'Mixed Evidence': { icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20' },
    'Potential Concern': { icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20' },
  };

  const { icon: Icon, color } = config[status];

  return (
    <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium", color)}>
      <Icon size={14} />
      {status}
    </div>
  );
};

const IngredientCard = ({ ingredient, onClick }: { ingredient: Ingredient; onClick: () => void }) => (
  <div 
    onClick={onClick}
    className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-zinc-200 dark:border-dark-border flex items-center justify-between gap-4 cursor-pointer hover:border-zinc-300 dark:hover:border-dark-text-primary/10 transition-colors"
  >
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-zinc-900 dark:text-dark-text-primary line-clamp-1">{ingredient.name}</h3>
      <p className="text-xs text-zinc-500 dark:text-dark-text-secondary line-clamp-1">{getDisplayCategory(ingredient.category)}</p>
    </div>
    <div className="flex items-center gap-3">
      <ScoreBadge score={ingredient.score} size="md" />
      <ChevronLeft className="rotate-180 text-zinc-400 dark:text-dark-text-secondary" size={20} />
    </div>
  </div>
);

// --- Pages ---

// --- Persistent State for HomePage ---
interface FoodFact {
  fact: string;
  category: string;
}

const INITIAL_FACT_POOL: FoodFact[] = factsData as FoodFact[];

let factPool: FoodFact[] = [...INITIAL_FACT_POOL];
let factQueue: FoodFact[] = [];
let factHistory: string[] = [];

const getNextFact = (): FoodFact => {
  if (factQueue.length === 0) {
    // Refill the queue, excluding the most recently shown facts to avoid immediate repeats
    const recentHistory = factHistory.slice(-10);
    const availableFacts = factPool.filter(f => !recentHistory.includes(f.fact));
    
    // Shuffle the available facts
    const shuffled = [...availableFacts].sort(() => Math.random() - 0.5);
    factQueue = shuffled;
  }
  
  // Fallback if something goes wrong and queue is still empty
  if (factQueue.length === 0) {
    factQueue.push(factPool[Math.floor(Math.random() * factPool.length)]);
  }
  
  const nextFact = factQueue.shift()!;
  
  factHistory.push(nextFact.fact);
  // Keep history bounded
  if (factHistory.length > 50) {
    factHistory.shift();
  }
  
  return nextFact;
};

let currentInsight = getNextFact();

const HomePage = ({ 
  onNavigate, 
  insight, 
  refreshInsight, 
  isRefreshing, 
  ingredients, 
  totalStudies,
  dbStatus,
  aiStatus,
  aiError,
  dbError,
  onSync,
  isSyncing
}: { 
  onNavigate: (page: string, params?: any) => void, 
  insight: { fact: string, category: string },
  refreshInsight: () => void,
  isRefreshing: boolean,
  ingredients: Ingredient[],
  totalStudies: number,
  dbStatus: 'testing' | 'ok' | 'error',
  aiStatus: 'testing' | 'ok' | 'error',
  aiError: string | null,
  dbError: string | null,
  onSync: (force?: boolean, silent?: boolean, skipAI?: boolean) => Promise<void>,
  isSyncing: boolean
}) => {
  const isLoading = insight.fact === "Loading interesting food fact...";

  return (
    <div className="space-y-12">
      <header className="space-y-4 relative bg-zinc-50 dark:bg-dark-bg pt-safe">
        <div className="flex items-center justify-between pt-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-dark-text-primary font-display">IngrediScore <span className="text-xs text-zinc-400 font-normal ml-2">v1.2</span></h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-full border border-emerald-100 dark:border-dark-border">
            <CheckCircle2 size={12} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Cloud Sync</span>
          </div>
        </div>
        <p className="text-zinc-500 dark:text-dark-text-secondary">Evidence-based health insights for food ingredients.</p>
      </header>

      {/* Global Library Stats */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-dark-surface p-6 rounded-[2rem] border border-zinc-200 dark:border-dark-border flex flex-col justify-between min-h-[120px] transition-colors">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database size={14} className="text-emerald-500" />
              <p className="text-[10px] font-bold text-zinc-400 dark:text-dark-text-secondary uppercase tracking-widest">Global Library</p>
            </div>
            <div className="flex items-baseline gap-1.5 pt-2">
              <span className="text-3xl font-bold text-zinc-900 dark:text-dark-text-primary tabular-nums">{ingredients.length}</span>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Items</span>
            </div>
          </div>
          {ingredients.length === 0 && (
            <p className="text-[8px] text-rose-500 font-bold mt-2 uppercase flex items-center gap-1">
              <AlertCircle size={8} /> Connection Error
            </p>
          )}
        </div>
        <div className="bg-white dark:bg-dark-surface p-6 rounded-[2rem] border border-zinc-200 dark:border-dark-border flex flex-col justify-between min-h-[120px] transition-colors">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-amber-500" />
              <p className="text-[10px] font-bold text-zinc-400 dark:text-dark-text-secondary uppercase tracking-widest">Clinical Evidence</p>
            </div>
            <div className="flex items-baseline gap-1.5 pt-2">
              <span className="text-3xl font-bold text-zinc-900 dark:text-dark-text-primary tabular-nums">{totalStudies}</span>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Papers</span>
            </div>
          </div>
          <div className="h-4" /> {/* Spacer to match height if error shows on other card */}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-bold text-zinc-400 dark:text-dark-text-secondary uppercase tracking-[0.2em]">Food Insight</h2>
          <button 
            onClick={refreshInsight}
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-dark-text-primary transition-colors"
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="bg-white dark:bg-dark-surface p-8 rounded-3xl border border-zinc-200 dark:border-dark-border space-y-4 min-h-[160px]">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-20 bg-zinc-100 dark:bg-dark-bg rounded-full"></div>
              <div className="h-16 w-full bg-zinc-100 dark:bg-dark-bg rounded-xl"></div>
            </div>
          ) : (
            <div>
              <span className="inline-block px-3 py-1.5 bg-zinc-100 dark:bg-dark-bg text-zinc-600 dark:text-dark-text-secondary rounded-full text-[10px] font-bold uppercase tracking-widest">
                {insight.category}
              </span>
              <p className="text-zinc-700 dark:text-dark-text-primary leading-relaxed font-medium mt-4 text-lg">
                "{insight.fact}"
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white dark:bg-dark-surface p-8 rounded-3xl border border-zinc-100 dark:border-dark-border space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
          <Database size={20} className="text-emerald-500 dark:text-emerald-400" />
          <h3 className="font-bold">The Shared Brain</h3>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
          Every time you scan a new product or research an ingredient, the result is saved to our global library. This means the app gets smarter for everyone, building a permanent and growing resource for the entire community.
        </p>
        <div className="pt-2 flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Users size={10} className="text-zinc-400 dark:text-zinc-500" />
              </div>
            ))}
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Community Powered</span>
        </div>
      </section>

      {/* System Status */}
      <section className="flex items-center justify-center gap-6 py-4 opacity-40 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", dbStatus === 'ok' ? "bg-emerald-500" : dbStatus === 'error' ? "bg-rose-500" : "bg-amber-500 animate-pulse")} />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Database {dbStatus === 'ok' ? '(Connected)' : dbStatus === 'error' ? '(Error)' : '(Connecting...)'}
          </span>
          {dbStatus === 'error' && (
            <button 
              onClick={() => {
                const debugText = `DATABASE ERROR:\n\n${dbError}\n\nDomain: ${window.location.hostname}`;
                navigator.clipboard.writeText(debugText).then(() => {
                  alert("Database debug info copied to clipboard! Please paste it in the chat.");
                }).catch(() => {
                  alert(debugText);
                });
              }}
              className="text-[8px] font-bold text-rose-500 uppercase hover:underline"
            >
              Error Info
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", aiStatus === 'ok' ? "bg-emerald-500" : aiStatus === 'error' ? "bg-rose-500" : "bg-amber-500 animate-pulse")} />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">AI Service</span>
          {dbStatus === 'ok' && (
            <button 
              onClick={() => onSync(true)}
              disabled={isSyncing}
              className={clsx(
                "px-2 py-0.5 bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 rounded-md text-[8px] font-black uppercase tracking-tighter border border-zinc-100 dark:border-zinc-500/20",
                isSyncing && "animate-spin opacity-50"
              )}
            >
              Sync All Data
            </button>
          )}
          {localStorage.getItem('INGREDISCORE_CUSTOM_KEY') && (
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-1 rounded border border-emerald-100">Custom Key Active</span>
              <button 
                onClick={() => {
                  localStorage.removeItem('INGREDISCORE_CUSTOM_KEY');
                  alert("Custom key cleared. Refreshing...");
                  window.location.reload();
                }}
                className="text-[8px] font-bold text-rose-500 uppercase hover:underline"
              >
                Clear
              </button>
            </div>
          )}
          {(aiStatus === 'error' || localStorage.getItem('INGREDISCORE_CUSTOM_KEY')) && (
            <div className="flex items-center gap-2">
              <button 
                onClick={async () => {
                  const aistudio = (window as any).aistudio || (window.parent as any).aistudio;
                  if (aistudio && aistudio.openSelectKey) {
                    await aistudio.openSelectKey();
                    window.location.reload();
                  } else {
                    const current = localStorage.getItem('INGREDISCORE_CUSTOM_KEY') || "";
                    const hostname = window.location.hostname;
                    const newKey = prompt(`To fix this on the Link page:\n\n1. Go to https://aistudio.google.com/app/apikey\n2. Create a NEW API Key (Unrestricted).\n3. Paste it here:\n\n(Current key: ${current ? '***' + current.slice(-4) : 'None'})\n(Domain: ${hostname})`, current);
                    
                    if (newKey === null) return; // Cancelled
                    
                    const trimmed = newKey.trim();
                    if (trimmed === "") {
                      localStorage.removeItem('INGREDISCORE_CUSTOM_KEY');
                      alert("Custom key removed. Refreshing...");
                      window.location.reload();
                    } else if (trimmed.startsWith("AIzaSy") && trimmed.length > 20) {
                      localStorage.setItem('INGREDISCORE_CUSTOM_KEY', trimmed);
                      alert("API Key saved locally! Refreshing to test...");
                      window.location.reload();
                    } else {
                      alert("Invalid key format. It should start with 'AIzaSy' and be at least 20 characters long.");
                    }
                  }
                }}
                className="px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md text-[8px] font-black uppercase tracking-tighter border border-rose-100 dark:border-rose-500/20"
              >
                {localStorage.getItem('INGREDISCORE_CUSTOM_KEY') ? "Change Key" : "Fix Key"}
              </button>
              {localStorage.getItem('INGREDISCORE_CUSTOM_KEY') && (
                <button 
                  onClick={() => {
                    localStorage.removeItem('INGREDISCORE_CUSTOM_KEY');
                    alert("Custom key removed. Refreshing...");
                    window.location.reload();
                  }}
                  className="px-2 py-0.5 bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 rounded-md text-[8px] font-black uppercase tracking-tighter border border-zinc-100 dark:border-zinc-500/20"
                >
                  Reset
                </button>
              )}
              {aiStatus === 'error' && (
                <button 
                  onClick={() => {
                    const info = getAIKeyInfo();
                    const debugText = `AI ERROR:\n\n${aiError}\n\nKey Source: ${info.source}\nKey Snippet: ${info.snippet}\nDomain: ${window.location.hostname}`;
                    navigator.clipboard.writeText(debugText).then(() => {
                      alert("Debug info copied to clipboard! Please paste it in the chat.");
                    }).catch(() => {
                      alert(debugText);
                    });
                  }}
                  className="text-[8px] font-bold text-zinc-400 uppercase hover:underline"
                >
                  Copy Debug Info
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const SearchPage = ({ 
  onNavigate, 
  onBack,
  ingredients,
  preservedQuery,
  setPreservedQuery,
  preservedCategory,
  setPreservedCategory,
  preservedSortBy,
  setPreservedSortBy
}: { 
  onNavigate: (page: string, params?: any) => void, 
  onBack: () => void,
  ingredients: Ingredient[],
  preservedQuery: string,
  setPreservedQuery: (q: string) => void,
  preservedCategory: string | null,
  setPreservedCategory: (c: string | null) => void,
  preservedSortBy: 'name' | 'score-desc' | 'score-asc' | 'studies-asc',
  setPreservedSortBy: (s: 'name' | 'score-desc' | 'score-asc' | 'studies-asc') => void
}) => {
  const [debouncedQuery, setDebouncedQuery] = useState(preservedQuery);
  const activeCategory = preservedCategory;
  const setActiveCategory = setPreservedCategory;
  const sortBy = preservedSortBy;
  const setSortBy = setPreservedSortBy;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(preservedQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [preservedQuery]);

  useEffect(() => {
    document.querySelector('main')?.scrollTo(0, 0);
  }, [activeCategory, sortBy]);

  const filtered = useMemo(() => {
    return ingredients
      .filter(ing => {
        if (!ing || !ing.name) return false;
        const queryLower = debouncedQuery.toLowerCase();
        const matchesQuery = ing.name.toLowerCase().includes(queryLower) || 
                            (ing.synonyms && ing.synonyms.some(s => s && s.toLowerCase().includes(queryLower)));
        const matchesCategory = !activeCategory || getDisplayCategory(ing.category) === activeCategory;
        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        if (!a || !b) return 0;
        if (sortBy === 'score-desc') return (b.score || 0) - (a.score || 0);
        if (sortBy === 'score-asc') return (a.score || 0) - (b.score || 0);
        if (sortBy === 'studies-asc') return (a.studies?.length || 0) - (b.studies?.length || 0);
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [debouncedQuery, activeCategory, sortBy, ingredients]);

  return (
    <div className="space-y-6 pt-safe">
      <div className="sticky top-0 bg-zinc-50 dark:bg-dark-bg pt-6 pb-2 z-10 space-y-4 border-b border-zinc-100 dark:border-dark-border transition-colors">
        <div className="relative px-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-dark-text-secondary" size={20} />
          <input 
            type="text"
            placeholder="Search ingredients..."
            className="w-full bg-white dark:bg-dark-surface border border-zinc-200 dark:border-dark-border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-dark-text-primary transition-all text-zinc-900 dark:text-dark-text-primary placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            value={preservedQuery}
            onChange={(e) => setPreservedQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar px-1">
          <button 
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
              !activeCategory ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white" : "bg-white dark:bg-dark-surface text-zinc-600 dark:text-dark-text-secondary border-zinc-200 dark:border-dark-border"
            )}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                activeCategory === cat ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white" : "bg-white dark:bg-dark-surface text-zinc-600 dark:text-dark-text-secondary border-zinc-200 dark:border-dark-border"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-2 pt-1">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-dark-text-secondary uppercase tracking-widest">
            {filtered.length} Ingredients Found
          </span>
          <button 
            onClick={() => {
              if (sortBy === 'name') setSortBy('score-desc');
              else if (sortBy === 'score-desc') setSortBy('score-asc');
              else if (sortBy === 'score-asc') setSortBy('studies-asc');
              else setSortBy('name');
            }}
            className="h-8 px-3 bg-white dark:bg-dark-surface border border-zinc-200 dark:border-dark-border rounded-full text-zinc-600 dark:text-dark-text-secondary hover:bg-zinc-50 dark:hover:bg-dark-surface/80 transition-colors flex items-center gap-1.5"
          >
            <Filter size={12} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Sorted by: {sortBy === 'name' ? 'Name' : sortBy === 'score-desc' ? 'Score ↓' : sortBy === 'score-asc' ? 'Score ↑' : 'Least Studies'}
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((ing, idx) => (
            <div key={`${ing.id}-${idx}`} className="pb-3">
              <IngredientCard ingredient={ing} onClick={() => onNavigate('detail', { id: ing.id })} />
            </div>
          ))
        ) : (
          <div className="text-center py-12 space-y-2">
            <p className="text-zinc-400 dark:text-zinc-500 font-medium">No ingredients found</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600">Try a different search term or category</p>
          </div>
        )}
      </div>
    </div>
  );
};

const LargeScoreBadge = ({ score }: { score: number }) => {
  const roundedScore = Math.round(score);
  const getColors = (s: number) => {
    if (s >= 8) return { text: 'text-emerald-600 dark:text-emerald-400', ring: 'text-emerald-500', bg: 'bg-emerald-50/30 dark:bg-emerald-500/5' };
    if (s >= 5) return { text: 'text-amber-600 dark:text-amber-400', ring: 'text-amber-500', bg: 'bg-amber-50/30 dark:bg-amber-500/5' };
    return { text: 'text-rose-600 dark:text-rose-400', ring: 'text-rose-500', bg: 'bg-rose-50/30 dark:bg-rose-500/5' };
  };

  const colors = getColors(roundedScore);

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" className="text-zinc-100 dark:text-zinc-800/50" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="289" strokeDashoffset={289 - (roundedScore / 10) * 289} strokeLinecap="round" className={cn("transition-all duration-1000 ease-out", colors.ring)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-5xl font-bold font-display tracking-tight leading-none", colors.text)}>{roundedScore}</span>
        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mt-1">Score</span>
      </div>
    </div>
  );
};

const ConfidenceMeter = ({ level, explanation }: { level?: 'Low' | 'Moderate' | 'High', explanation?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const safeLevel = level || 'Moderate';
  const colors = {
    Low: 'bg-rose-500',
    Moderate: 'bg-amber-500',
    High: 'bg-emerald-500'
  };
  
  const widthPercentages = {
    Low: 33,
    Moderate: 66,
    High: 100
  };

  return (
    <div className="w-[220px] relative">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full group focus:outline-none p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex justify-between items-center w-full mb-1.5 px-0.5">
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest text-left">Confidence</span>
            <ChevronDown 
              size={10} 
              className={cn(
                "transition-transform duration-200 text-zinc-400 group-hover:text-zinc-600",
                isExpanded && "rotate-180"
              )} 
            />
          </div>
          <span className={cn("text-[8px] font-bold uppercase tracking-widest text-right", 
            safeLevel === 'High' ? 'text-emerald-600' : safeLevel === 'Moderate' ? 'text-amber-600' : 'text-rose-600'
          )}>{safeLevel}</span>
        </div>
        <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            initial={false}
            animate={{ width: `${widthPercentages[safeLevel]}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn("h-full", colors[safeLevel])} 
          />
        </div>
      </button>
      
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="explanation"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-1 px-1">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-inner">
                <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium text-center">
                  {explanation || "The confidence level is determined by the quality and quantity of scientific studies available for the ingredients in this product."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StudyCard = ({ study }: { study: Study }) => {
  const getQualityColor = (q: StudyQuality) => {
    switch (q) {
      case 'High': return 'bg-emerald-100 dark:bg-dark-surface text-emerald-700 dark:text-emerald-500 border-emerald-200 dark:border-dark-border';
      case 'Moderate': return 'bg-amber-100 dark:bg-dark-surface text-amber-700 dark:text-amber-500 border-amber-200 dark:border-dark-border';
      case 'Lower': return 'bg-zinc-100 dark:bg-dark-surface text-zinc-700 dark:text-dark-text-secondary border-zinc-200 dark:border-dark-border';
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-dark-surface rounded-3xl border border-zinc-100 dark:border-dark-border space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-dark-bg text-zinc-600 dark:text-dark-text-secondary border border-zinc-200 dark:border-dark-border">
          {study.type}
        </span>
        <span className={cn(
          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
          getQualityColor(study.quality)
        )}>
          {study.quality} Quality
        </span>
      </div>
      
      <div className="space-y-1">
        <h4 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
          {study.title}
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          {study.authors} • {study.journal} • {study.year}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 py-3 border-y border-zinc-50 dark:border-zinc-800">
        {study.sampleSize && (
          <div className="space-y-0.5">
            <p className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Sample Size</p>
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{study.sampleSize}</p>
          </div>
        )}
        {study.duration && (
          <div className="space-y-0.5">
            <p className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Duration</p>
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{study.duration}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Key Findings</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{study.keyFindings}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Limitations</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed italic">{study.limitations}</p>
        </div>
      </div>
    </div>
  );
};

const DetailPage = ({ id, ingredient: passedIngredient, onNavigate, onBack, ingredients, onRefreshIngredients, setSyncMessage, isAdmin }: { 
  id?: string; 
  ingredient?: MatchedIngredient; 
  onNavigate: (page: string, params?: any) => void, 
  onBack: () => void,
  ingredients: Ingredient[],
  onRefreshIngredients: () => Promise<void>,
  setSyncMessage: (msg: { text: string, type: 'success' | 'error' } | null) => void,
  isAdmin?: boolean
}) => {
  const [ingredient, setIngredient] = useState(() => {
    const fromList = ingredients.find(ing => ing.id === id || (passedIngredient && ing.id === passedIngredient.id));
    if (fromList && passedIngredient) {
      // Merge: prefer passedIngredient for match-specific fields, but fromList for full content
      const merged = { ...fromList, ...passedIngredient };
      // If passedIngredient was pruned (no studies), restore them from the global list
      if ((!passedIngredient.studies || passedIngredient.studies.length === 0) && (fromList.studies && fromList.studies.length > 0)) {
        merged.studies = fromList.studies;
      }
      return merged;
    }
    return passedIngredient || fromList;
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync state if passedIngredient changes
  useEffect(() => {
    if (passedIngredient) {
      const fromList = ingredients.find(ing => ing.id === passedIngredient.id);
      if (fromList) {
        const merged = { ...fromList, ...passedIngredient };
        if ((!passedIngredient.studies || passedIngredient.studies.length === 0) && (fromList.studies && fromList.studies.length > 0)) {
          merged.studies = fromList.studies;
        }
        setIngredient(merged);
      } else {
        setIngredient(passedIngredient);
      }
    }
  }, [passedIngredient, ingredients]);

  // Sync state if ingredients prop changes (e.g. after a background update)
  useEffect(() => {
    if (!passedIngredient && id) {
      const updated = ingredients.find(ing => ing.id === id);
      if (updated) {
        setIngredient(updated);
      }
    }
  }, [ingredients, id, passedIngredient]);

  const handleUpdateWithAI = async () => {
    if (!ingredient) return;
    setIsUpdating(true);
    try {
      const updatedIngredient = await generateIngredientDataWithAI(ingredient.name, ingredient.studies?.length || 0);
      // Ensure the id remains the same
      const ingredientWithId = { ...updatedIngredient, id: ingredient.id };
      await saveIngredient(ingredientWithId);
      await onRefreshIngredients();
      setIngredient(ingredientWithId);
      setSyncMessage({ text: "Ingredient updated successfully!", type: 'success' });
      triggerHaptic('success');
    } catch (error: any) {
      console.error("Failed to update ingredient:", error);
      const msg = error?.message || "Failed to update ingredient. Please try again.";
      setSyncMessage({ 
        text: msg.includes("403") || msg.includes("Forbidden") || msg.includes("API Key")
          ? "AI Connection Failed. This is likely due to API key restrictions in the mobile app. Use 'Fix API Key' in the scanner error screen."
          : "Failed to update: " + msg, 
        type: 'error' 
      });
      triggerHaptic('error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!ingredient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle size={48} className="text-rose-500" />
        <p className="font-bold text-zinc-900 dark:text-white">Ingredient not found (ID: {id})</p>
        <button onClick={onBack} className="text-emerald-600 dark:text-white font-bold underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12 pt-safe">
      {/* AI Update Button - Top of page */}
      {isAdmin && (
        <div className="flex flex-col items-end pt-6 space-y-2">
          <button 
            onClick={handleUpdateWithAI}
            disabled={isUpdating}
            className={cn(
              "px-5 py-2.5 rounded-full text-xs font-bold border hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-zinc-900/10 dark:shadow-none",
              (ingredient as MatchedIngredient).matchType === 'unrecognized'
                ? "bg-rose-600 text-white border-rose-500"
                : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-800 dark:border-zinc-200"
            )}
          >
            {isUpdating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {isUpdating 
              ? (ingredient as MatchedIngredient).matchType === 'unrecognized' ? 'Verifying...' : 'Refreshing Research...' 
              : (ingredient as MatchedIngredient).matchType === 'unrecognized' ? 'Verify Ingredient' : 'Refresh Research'}
          </button>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
            {(ingredient as MatchedIngredient).matchType === 'unrecognized'
              ? "Uses real-time scientific search to identify this ingredient"
              : "Uses real-time scientific search to find new studies"}
          </p>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col items-center text-center space-y-6">
        <div className="w-full flex justify-start">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <LargeScoreBadge score={ingredient.score} />
          {ingredient.confidenceLevel === 'Low' && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full border border-rose-100 dark:border-rose-500/20">
              <AlertCircle size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Limited Research</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white font-display tracking-tight leading-[1.1]">
            {ingredient.name}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px]">
            {getDisplayCategory(ingredient.category)}
          </p>
        </div>
      </header>

      {/* Match Status Info */}
      {(ingredient as MatchedIngredient).matchType === 'alias' && (
        <section className="bg-emerald-50/30 dark:bg-emerald-500/5 p-6 rounded-[2rem] border border-emerald-100/50 dark:border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={16} />
              <h3 className="text-[10px] font-bold uppercase tracking-widest">AI Ingredient Mapping</h3>
            </div>
            <button 
              onClick={() => setSyncMessage({ text: 'Thank you for your feedback! Our team will review this mapping.', type: 'success' })}
              className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:underline flex items-center gap-1 transition-colors"
            >
              <AlertTriangle size={12} />
              Report Incorrect Match
            </button>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
              The label term <span className="text-zinc-900 dark:text-white font-bold">"{(ingredient as MatchedIngredient).originalName}"</span> was mapped to <span className="text-zinc-900 dark:text-white font-bold">{ingredient.name}</span>.
            </p>
            {(ingredient as MatchedIngredient).mappingReasoning && (
              <div className="pl-4 border-l-2 border-emerald-200 dark:border-emerald-800/50">
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 italic leading-relaxed">
                  "{(ingredient as MatchedIngredient).mappingReasoning}"
                </p>
              </div>
            )}
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
              This mapping helps us provide a consistent health assessment by linking non-standard label names to established scientific data.
            </p>
          </div>
        </section>
      )}
      
      {(ingredient as MatchedIngredient).matchType === 'unrecognized' && (
        <section className="bg-rose-50/30 dark:bg-rose-950/20 p-6 rounded-[2rem] border border-rose-100/50 dark:border-rose-900/30 space-y-4">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
            <AlertCircle size={20} />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Unrecognized Ingredient</h3>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
            The term <span className="text-zinc-900 dark:text-white font-bold">"{(ingredient as MatchedIngredient).originalName}"</span> was not found in our evidence database. 
            This may be a rare compound or a non-standard label name.
          </p>
          <button 
            onClick={() => setSyncMessage({ text: 'Report submitted! We will review this ingredient.', type: 'success' })}
            className="w-full bg-rose-600 text-white py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Report for Review
          </button>
        </section>
      )}

      {/* Primary Section: Scientific Rationale */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.25em] px-1">Scientific Rationale</h2>
        <div className="p-8 bg-white dark:bg-dark-surface text-zinc-900 dark:text-white rounded-[2.5rem] border border-zinc-100 dark:border-dark-border relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.05]">
            <ShieldCheck size={120} />
          </div>
          <p className="text-xl text-zinc-800 dark:text-zinc-100 leading-relaxed font-medium relative z-10">
            {ingredient.scoreReasoning}
          </p>
        </div>
      </section>

      {/* Research Summary */}
      <section className="space-y-4 bg-white dark:bg-dark-surface p-8 rounded-[2.5rem] border border-zinc-100 dark:border-dark-border">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
            <BookOpen size={18} className="text-emerald-600 dark:text-emerald-500" />
          </div>
          <h2 className="text-[10px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Evidence Overview</h2>
        </div>
        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-sm font-medium">
          {ingredient.evidenceOverview}
        </p>
        <div className="pt-6 border-t border-zinc-100 dark:border-dark-border flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Confidence</p>
            <p className={cn(
              "text-sm font-bold",
              ingredient.confidenceLevel === 'High' ? 'text-emerald-600' : 
              ingredient.confidenceLevel === 'Moderate' ? 'text-amber-600' : 'text-rose-600'
            )}>
              {ingredient.confidenceLevel}
            </p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Primary Evidence</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">{ingredient.evidenceType}</p>
          </div>
        </div>
      </section>

      {/* Benefits & Concerns */}
      <div className="grid grid-cols-1 gap-6">
        <section className="p-6 bg-emerald-50/20 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10 rounded-[2rem] space-y-4">
          <h3 className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-[0.2em]">Observed Benefits</h3>
          <div className="space-y-3">
            {(ingredient.positives || []).map((p, i) => (
              <div key={i} className="flex gap-3 items-start">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <p className="text-zinc-700 dark:text-zinc-300 text-sm font-medium leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 bg-rose-50/20 dark:bg-rose-500/5 border border-rose-100/50 dark:border-rose-500/10 rounded-[2rem] space-y-4">
          <h3 className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-[0.2em]">Identified Risks</h3>
          <div className="space-y-3">
            {(ingredient.negatives || []).map((n, i) => (
              <div key={i} className="flex gap-3 items-start">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                <p className="text-zinc-700 dark:text-zinc-300 text-sm font-medium leading-relaxed">{n}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Study List or Expert Consensus */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            {(ingredient.studies?.length || 0) > 0 ? 'Clinical Research' : 'Expert Consensus'}
          </h3>
          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
            {(ingredient.studies?.length || 0) > 0 ? `${ingredient.studies?.length} Papers` : 'Non-Clinical Basis'}
          </span>
        </div>
        
        <div className="space-y-4">
          {(ingredient.studies?.length || 0) > 0 ? (
            (ingredient.studies || []).map((study) => (
              <StudyCard key={study.id} study={study} />
            ))
          ) : (
            <div className="space-y-4">
              <div className="p-8 bg-amber-50/30 dark:bg-amber-900/10 rounded-[2.5rem] border border-amber-100/50 dark:border-amber-900/20 space-y-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
                  <HelpCircle size={18} />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest">Limited Clinical Data</h4>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                  {ingredient.expertSources && ingredient.expertSources.length > 0 
                    ? `Specific peer-reviewed clinical trials are limited. This analysis relies on systematic reviews and guidance from the expert bodies listed below.`
                    : `No peer-reviewed clinical studies are currently indexed. Analysis is based on regulatory status, expert consensus, and established nutritional science.`}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {ingredient.expertSources && ingredient.expertSources.length > 0 && (
                  <div className="p-6 bg-white dark:bg-dark-surface rounded-[2rem] border border-zinc-100 dark:border-dark-border space-y-4">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Expert Sources</h4>
                    <div className="flex flex-wrap gap-2">
                      {ingredient.expertSources.map((source, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-zinc-50 dark:bg-dark-bg border border-zinc-100 dark:border-dark-border rounded-xl text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-6 bg-white dark:bg-dark-surface rounded-[2rem] border border-zinc-100 dark:border-dark-border space-y-3">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Regulatory Status</h4>
                  <p className="text-sm text-zinc-700 dark:text-zinc-200 font-bold leading-relaxed">
                    {ingredient.regulatoryConsensus || "Classified under standard food safety guidelines."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Ingredient Description (Secondary) */}
      <section className="p-8 bg-zinc-50 dark:bg-dark-surface rounded-[2.5rem] border border-zinc-100 dark:border-dark-border space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white font-display tracking-tight">Definition</h2>
        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-sm font-medium">
          {ingredient.summaryShort}
        </p>
      </section>

      {/* Evolving Evidence (if any) */}
      {ingredient.evolvingEvidence && (
        <div className="bg-amber-50/50 dark:bg-amber-500/10 border border-amber-100/50 dark:border-amber-500/20 p-6 rounded-[2rem] flex gap-4 items-start">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-amber-900 dark:text-amber-400 uppercase tracking-widest">Evolving Science</p>
            <p className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed font-medium">
              {ingredient.evolvingEvidenceNote || "Scientific consensus is currently evolving. We monitor new research to provide the most current analysis."}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="pt-12 border-t border-zinc-100 dark:border-dark-border text-center space-y-6">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          <span>Refresh: {ingredient.lastScientificRefresh}</span>
          <span>Review: {ingredient.lastReviewed}</span>
        </div>
        <p className="text-[10px] text-zinc-400 leading-relaxed italic max-w-xs mx-auto px-4">
          Disclaimer: This analysis is for educational purposes and does not constitute medical advice. Consult a healthcare professional for dietary guidance.
        </p>
      </footer>
    </div>
  );
};

const ProductPage = ({ 
  product: initialProduct, 
  onNavigate, 
  onBack, 
  allIngredients,
  onRefreshIngredients,
  onUpdateProduct,
  isAdmin
}: { 
  product: Product, 
  onNavigate: (page: string, params?: any) => void, 
  onBack: () => void, 
  allIngredients: Ingredient[],
  onRefreshIngredients: () => Promise<void>,
  onUpdateProduct?: (product: Product) => void,
  isAdmin?: boolean
}) => {
  const [product, setProduct] = useState(initialProduct);
  const [isVerified, setIsVerified] = useState(product.status === 'confirmed');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(product.name);
  const [editBrand, setEditBrand] = useState(product.brand);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Sync state with props if they change from parent
  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
      setIsVerified(initialProduct.status === 'confirmed');
    }
  }, [initialProduct]);

  const liveProduct = useMemo(() => {
    if (!product.analysis) return product;

    const refreshIng = (ing: any): any => {
      const dbIng = allIngredients.find(i => i.id === ing.id);
      if (dbIng) {
        // Strictly use the database version as the source of truth
        const refreshed: any = { 
          ...dbIng, 
          originalName: ing.originalName, 
          isMatched: true, 
          matchType: (ing.matchType === 'unrecognized' || !ing.matchType) ? 'exact' : ing.matchType,
          isCompound: ing.isCompound,
          parentLabelType: ing.parentLabelType,
          resolutionStatus: ing.resolutionStatus
        };
        if (ing.isCompound && ing.subIngredients) {
          refreshed.subIngredients = ing.subIngredients.map(refreshIng);
        }
        return refreshed;
      }
      if (ing.isCompound && ing.subIngredients) {
        return {
          ...ing,
          subIngredients: ing.subIngredients.map(refreshIng)
        };
      }
      return ing;
    };

    const refreshedIngredients = product.analysis.ingredients.map(refreshIng);
    const { finalScore: newOverallScore, processingLevel: newProcessingLevel } = calculateHolisticScore(refreshedIngredients);
    
    return {
      ...product,
      analysis: {
        ...product.analysis,
        ingredients: refreshedIngredients,
        overallScore: newOverallScore,
        processingLevel: newProcessingLevel
      }
    };
  }, [product, allIngredients]);

  const displayProduct = liveProduct;

  const handleIngredientClick = (originalName: string) => {
    const findIngredient = (ingredients: any[]): any | undefined => {
      for (const ing of ingredients) {
        if (ing.originalName === originalName) return ing;
        if (ing.subIngredients) {
          const found = findIngredient(ing.subIngredients);
          if (found) return found;
        }
      }
      return undefined;
    };

    const found = findIngredient(displayProduct.analysis?.ingredients || []);
    if (found) {
      onNavigate('detail', { id: found.id, ingredient: found });
    }
  };

  const hasUnrecognized = useMemo(() => {
    if (!displayProduct.analysis) return false;
    return displayProduct.analysis.ingredients.some((ing: any) => 
      ing.matchType === 'unrecognized' || 
      (ing.isCompound && ing.subIngredients?.some((sub: any) => sub.matchType === 'unrecognized'))
    );
  }, [displayProduct.analysis]);

  const [researchingIngs, setResearchingIngs] = useState<Record<string, boolean>>({});
  const [isResearchingAll, setIsResearchingAll] = useState(false);

  const handleResearchIngredient = async (ingName: string, ingId: string, options: { silent?: boolean } = {}) => {
    console.log(`Researching ingredient: ${ingName} (${ingId})`);
    triggerHaptic('medium');
    setResearchingIngs(prev => ({ ...prev, [ingId]: true }));
    try {
      const ingredientData = await generateIngredientDataWithAI(ingName);
      const ingredientWithId = { ...ingredientData, id: ingId };
      await saveIngredient(ingredientWithId);
      
      // Refresh global ingredients list
      await onRefreshIngredients();
      
      // Update the analysis locally to reflect the new data immediately
      if (product.analysis) {
        const updatedIngredients = product.analysis.ingredients.map((ing: any) => {
          if (ing.id === ingId) {
            return { ...ingredientWithId, matchType: 'exact', isMatched: true };
          }
          if (ing.isCompound && ing.subIngredients) {
            const updatedSubs = ing.subIngredients.map((sub: any) => {
              if (sub.id === ingId) {
                return { ...ingredientWithId, matchType: 'exact', isMatched: true };
              }
              return sub;
            });
            return { ...ing, subIngredients: updatedSubs };
          }
          return ing;
        });
        
        const updatedAnalysis = {
          ...product.analysis,
          ingredients: updatedIngredients
        };
        
        const updatedProduct = { ...product, analysis: updatedAnalysis };
        
        // Save the updated product analysis to Firestore so it's persistent
        await saveProduct(updatedProduct);
        
        setProduct(updatedProduct);
        if (onUpdateProduct) onUpdateProduct(updatedProduct);
        console.log(`Ingredient ${ingName} researched and product updated.`);
      }
      
      triggerHaptic('success');
    } catch (error: any) {
      console.error("Failed to research ingredient:", error);
      const msg = error?.message || "Unknown error";
      if (!options.silent) {
        if (msg.includes("403") || msg.includes("Forbidden") || msg.includes("API Key")) {
          alert("AI Connection Failed: This is likely due to API key restrictions in the mobile app. Please use the 'Fix API Key' button in the scanner error screen to provide a fresh key.");
        } else {
          alert("Failed to research ingredient: " + msg);
        }
      }
      triggerHaptic('error');
      throw error;
    } finally {
      setResearchingIngs(prev => ({ ...prev, [ingId]: false }));
    }
  };

  const handleResearchAll = async () => {
    if (!displayProduct.analysis) return;
    triggerHaptic('medium');
    setIsResearchingAll(true);
    
    const unrecognized = displayProduct.analysis.ingredients.flatMap((ing: any) => {
      const list = [];
      if (ing.matchType === 'unrecognized') list.push(ing);
      if (ing.isCompound && ing.subIngredients) {
        list.push(...ing.subIngredients.filter((sub: any) => sub.matchType === 'unrecognized'));
      }
      return list;
    });

    let failCount = 0;
    let lastError: any = null;

    try {
      for (const ing of unrecognized) {
        try {
          await handleResearchIngredient(ing.name, ing.id, { silent: true });
        } catch (e) {
          failCount++;
          lastError = e;
        }
      }
      
      if (failCount > 0) {
        const msg = lastError?.message || "Unknown error";
        if (msg.includes("403") || msg.includes("Forbidden") || msg.includes("API Key")) {
          alert(`AI Connection Failed for ${failCount} ingredients. This is likely due to API key restrictions. Please use the 'Fix API Key' button in the scanner error screen.`);
        } else {
          alert(`Failed to research ${failCount} ingredients. Some data may be missing.`);
        }
      } else {
        triggerHaptic('success');
      }
    } finally {
      setIsResearchingAll(false);
    }
  };

  const handleVerify = async () => {
    try {
      await verifyProduct(displayProduct.barcode);
      setIsVerified(true);
      const updatedProduct = { ...product, status: 'confirmed' as const };
      setProduct(updatedProduct);
      if (onUpdateProduct) onUpdateProduct(updatedProduct);
      triggerHaptic('success');
    } catch (error) {
      console.error("Failed to verify product:", error);
      triggerHaptic('error');
    }
  };

  const handleRefreshAnalysis = async () => {
    setIsRefreshing(true);
    try {
      // Ensure we have the latest ingredient data from DB before re-analyzing
      await onRefreshIngredients();
      const updated = await reAnalyzeProduct(displayProduct);
      setProduct(updated);
      if (onUpdateProduct) {
        onUpdateProduct(updated);
      }
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProduct(product.barcode);
      onBack();
    } catch (error) {
      console.error("Delete failed:", error);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setEditError("Product name cannot be empty.");
      return;
    }
    if (!editBrand.trim()) {
      setEditError("Brand name cannot be empty.");
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);
    try {
      const updatedProduct = {
        ...product,
        name: editName.trim(),
        brand: editBrand.trim(),
        updatedAt: Date.now()
      };
      await saveProduct(updatedProduct);
      setProduct(updatedProduct);
      if (onUpdateProduct) onUpdateProduct(updatedProduct);
      setIsEditing(false);
      triggerHaptic('success');
    } catch (error) {
      console.error("Failed to update product:", error);
      setEditError("Failed to update product. Please try again.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6 pt-safe">
      <header className="flex flex-col gap-6 pt-6">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-dark-surface border border-zinc-200 dark:border-dark-border rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all">
            <ChevronLeft size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
          </button>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={handleRefreshAnalysis}
                disabled={isRefreshing}
                className="p-2 text-zinc-400 hover:text-emerald-500 transition-all disabled:opacity-50 border border-transparent hover:border-zinc-100 rounded-xl"
                title="Refresh Analysis"
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            )}
            {isAdmin && (
              <>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-zinc-400 hover:text-rose-500 transition-all border border-transparent hover:border-zinc-100 rounded-xl"
                  title="Delete Product"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={cn(
                    "p-2 transition-all border border-transparent hover:border-zinc-100 rounded-xl",
                    isEditing ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" : "text-zinc-400 hover:text-emerald-500"
                  )}
                  title="Edit Product Info"
                >
                  <Edit3 size={18} />
                </button>
              </>
            )}
            {isVerified ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-500 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                <CheckCircle2 size={12} />
                Verified
              </div>
            ) : isAdmin ? (
              <button 
                onClick={handleVerify}
                disabled={hasUnrecognized}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-dark-surface text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-500 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-zinc-200 dark:border-dark-border hover:border-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title={hasUnrecognized ? "Research all ingredients before verifying" : "Verify product"}
              >
                <ShieldCheck size={12} />
                Verify
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-5">
          {displayProduct.frontImage ? (
            <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 relative group">
              <img src={displayProduct.frontImage} alt={displayProduct.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-zinc-50 dark:bg-dark-surface border border-zinc-200 dark:border-dark-border flex items-center justify-center shrink-0">
              <Package size={24} className="text-zinc-300 dark:text-dark-text-secondary" />
            </div>
          )}
          <div className="space-y-1.5 flex-1">
            {isEditing ? (
              <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Product Name</label>
                  <input 
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Product Name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Brand</label>
                  <input 
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 focus:outline-none focus:border-emerald-500"
                    placeholder="Brand"
                  />
                </div>
                {editError && <p className="text-[10px] text-rose-500 font-bold">{editError}</p>}
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit}
                    className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSavingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    onClick={() => { setIsEditing(false); setEditName(product.name); setEditBrand(product.brand); setEditError(null); }}
                    className="flex-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-0.5">
                  <p className="text-[8px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.3em]">Product Analysis</p>
                  <h1 className="text-3xl font-bold text-zinc-900 dark:text-white font-display tracking-tight leading-none">
                    {displayProduct.name}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md text-[8px] font-bold uppercase tracking-widest border border-zinc-200 dark:border-dark-border">
                    {displayProduct.brand}
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span className={cn(
                    "text-[8px] font-bold uppercase tracking-widest",
                    displayProduct.analysis?.processingLevel === 'Minimally Processed' ? 'text-emerald-600' :
                    displayProduct.analysis?.processingLevel === 'Moderately Processed' ? 'text-amber-600' : 'text-rose-600'
                  )}>
                    {displayProduct.analysis?.processingLevel || 'Food Product'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {displayProduct.analysis ? (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* Layer 1: The Verdict (High-Level Summary) */}
          <section className="bg-white dark:bg-zinc-900/50 rounded-[2.5rem] p-8 md:p-10 border border-zinc-200 dark:border-dark-border relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full -mr-32 -mt-32 transition-colors duration-700" />
            
            <motion.div 
              layout 
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-10 flex flex-col md:flex-row gap-8 md:items-center"
            >
              {/* Score & Confidence */}
              <div className="flex flex-col items-center gap-4 shrink-0">
                <LargeScoreBadge score={displayProduct.analysis.overallScore} />
                <ConfidenceMeter 
                  level={displayProduct.analysis.confidenceLevel || 'Moderate'} 
                  explanation={displayProduct.analysis.evidenceBasis}
                />
              </div>

              {/* Summary */}
              <div className="flex-1 space-y-6 text-center md:text-left">
                <div className="space-y-3">
                  <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white leading-tight font-display tracking-tight">
                    {displayProduct.analysis.overallScore >= 8 ? "Highly Recommended" :
                     displayProduct.analysis.overallScore >= 6 ? "Safe for Regular Use" :
                     displayProduct.analysis.overallScore >= 4 ? "Consume with Caution" : "Avoid if Possible"}
                  </h2>
                  <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                    {displayProduct.analysis.scoreExplanation}
                  </p>
                </div>

                {/* Quick Stats: Concerning Ingredients */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {displayProduct.analysis.ingredients
                    .filter((ing: any) => ing.score < 6)
                    .sort((a: any, b: any) => a.score - b.score)
                    .slice(0, 3)
                    .map((ing: any, idx: number) => (
                      <button 
                        key={`${ing.id}-${idx}`}
                        onClick={() => handleIngredientClick(ing.name)}
                        className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20 flex items-center gap-2 text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all group"
                      >
                        {ing.name}
                        <ChevronRight size={10} className="text-rose-400 group-hover:text-rose-600 transition-colors" />
                      </button>
                    ))
                  }
                  {displayProduct.analysis.ingredients.filter((ing: any) => ing.score < 6).length === 0 && (
                    <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      Clean Label
                    </div>
                  )}
                  <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    <Activity size={12} className="text-zinc-400" />
                    {displayProduct.analysis.ingredients.length} Total
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Layer 2: Quick Scan (The Good & The Bad) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Critical Concerns */}
            <section className="bg-rose-50/30 dark:bg-rose-500/5 p-8 rounded-[2.5rem] border border-rose-100/50 dark:border-rose-500/10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-[0.3em]">Critical Concerns</h3>
                  <p className="text-[10px] text-rose-600/60 dark:text-rose-400/60 font-medium">Potential health impacts to consider</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                  <AlertCircle size={20} className="text-rose-600" />
                </div>
              </div>
              <div className="space-y-4">
                {displayProduct.analysis.keyConcerns.length > 0 ? (
                  displayProduct.analysis.keyConcerns.map((concern: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 group">
                      <div className="w-2 h-2 rounded-full bg-rose-400 mt-2 shrink-0 transition-transform" />
                      <span className="text-[13px] text-zinc-700 dark:text-zinc-300 font-semibold leading-snug">{concern}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-400 italic">No critical concerns identified.</p>
                )}
              </div>
              {displayProduct.analysis.loweredScoreBy.length > 0 && (
                <div className="pt-6 border-t border-rose-100/50 dark:border-rose-500/10 space-y-3">
                  <p className="text-[9px] font-bold text-rose-700/50 dark:text-rose-400/50 uppercase tracking-widest">Primary Drivers</p>
                  <div className="flex flex-wrap gap-2">
                    {displayProduct.analysis.loweredScoreBy.map((name: string, idx: number) => (
                      <button 
                        key={`${name}-${idx}`}
                        onClick={() => handleIngredientClick(name)}
                        className="px-3 py-1.5 bg-white dark:bg-zinc-900 text-[10px] font-bold text-rose-700 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all group flex items-center gap-2"
                      >
                        {name}
                        <ChevronRight size={10} className="text-rose-400 group-hover:text-rose-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Positive Attributes */}
            <section className="bg-emerald-50/30 dark:bg-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-100/50 dark:border-emerald-500/10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em]">Positive Attributes</h3>
                  <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60 font-medium">Beneficial nutritional qualities</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <Plus size={20} className="text-emerald-600" />
                </div>
              </div>
              <div className="space-y-4">
                {displayProduct.analysis.positiveAttributes.length > 0 ? (
                  displayProduct.analysis.positiveAttributes.map((attr: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 group">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0 transition-transform" />
                      <span className="text-[13px] text-zinc-700 dark:text-zinc-300 font-semibold leading-snug">{attr}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-400 italic">No significant positive attributes identified.</p>
                )}
              </div>
              {displayProduct.analysis.improvedScoreBy.length > 0 && (
                <div className="pt-6 border-t border-emerald-100/50 dark:border-emerald-500/10 space-y-3">
                  <p className="text-[9px] font-bold text-emerald-700/50 dark:text-emerald-400/50 uppercase tracking-widest">Primary Drivers</p>
                  <div className="flex flex-wrap gap-2">
                    {displayProduct.analysis.improvedScoreBy.map((name: string, idx: number) => (
                      <button 
                        key={`${name}-${idx}`}
                        onClick={() => handleIngredientClick(name)}
                        className="px-3 py-1.5 bg-white dark:bg-zinc-900 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all group flex items-center gap-2"
                      >
                        {name}
                        <ChevronRight size={10} className="text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Layer 3: Deep Dive (Ingredient Breakdown) */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <div className="space-y-1">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">Ingredient Breakdown</h3>
                <p className="text-[10px] text-zinc-400 font-medium">Detailed analysis of every component</p>
              </div>
              <div className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                {displayProduct.analysis.ingredients.length} Components
              </div>
            </div>

            {isAdmin && hasUnrecognized && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-6 rounded-3xl border border-amber-200 dark:border-amber-900/30 space-y-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold">
                  <AlertCircle size={18} />
                  <h3>Unknown Ingredients</h3>
                </div>
                <p className="text-sm text-amber-800/80 dark:text-amber-300/60 leading-relaxed">
                  This product contains ingredients that are not currently in our database. Verify them to improve the analysis.
                </p>
                <button 
                  onClick={handleResearchAll}
                  disabled={isResearchingAll}
                  className="w-full py-3 bg-amber-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isResearchingAll ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isResearchingAll ? 'Verifying All...' : 'Verify All Unknown Ingredients'}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {displayProduct.analysis.ingredients.map((ing: any, idx: number) => (
                <div 
                  key={`${ing.id}-${idx}`} 
                  onClick={() => handleIngredientClick(ing.originalName)}
                  className="group bg-white dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left shadow-sm relative overflow-hidden cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-center gap-5 flex-1 text-left">
                      <ScoreBadge score={ing.score} size="md" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight leading-none font-display">
                            {ing.name}
                          </h4>
                          {ing.matchType === 'unrecognized' && (
                            <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[8px] font-bold uppercase tracking-wider rounded-full border border-rose-100 dark:border-rose-500/20">Unknown</span>
                          )}
                        </div>
                        {ing.matchType === 'alias' && ing.originalName && ing.originalName.toLowerCase() !== ing.name.toLowerCase() && (
                          <div className="flex items-center gap-1.5 py-0.5">
                            <div className="h-px w-2 bg-zinc-200 dark:bg-zinc-800" />
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                              Mapped from: <span className="text-zinc-900 dark:text-zinc-100 italic">"{ing.originalName}"</span>
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium line-clamp-2 italic">
                          {ing.scoreReasoning}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:bg-zinc-100 transition-all">
                        <ChevronRight size={16} />
                      </div>
                      {isAdmin && ing.matchType === 'unrecognized' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleResearchIngredient(ing.name, ing.id); }}
                          disabled={researchingIngs[ing.id]}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-[10px] font-bold active:scale-95 transition-all disabled:opacity-50"
                        >
                          {researchingIngs[ing.id] ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                          {researchingIngs[ing.id] ? 'Verifying...' : 'Verify'}
                        </button>
                      )}
                    </div>
                  </div>

                  {ing.isCompound && ing.subIngredients && ing.subIngredients.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-3">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Contains:</p>
                      <div className="space-y-3">
                        {ing.subIngredients.map((sub: any, sIdx: number) => (
                          <div 
                            key={`${sub.id}-${sIdx}`} 
                            onClick={(e) => { e.stopPropagation(); handleIngredientClick(sub.originalName); }}
                            className="flex items-center justify-between gap-4 p-2 -m-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 capitalize">
                                {sub.name}
                              </span>
                              {sub.matchType === 'alias' && sub.originalName && sub.originalName.toLowerCase() !== sub.name.toLowerCase() && (
                                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 italic lowercase">
                                  (from "{sub.originalName}")
                                </span>
                              )}
                              {sub.matchType === 'unrecognized' && (
                                <span className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[7px] font-bold uppercase tracking-wider rounded-full border border-rose-100 dark:border-rose-500/20">Unknown</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <ScoreBadge score={sub.score} size="xs" />
                              {isAdmin && sub.matchType === 'unrecognized' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleResearchIngredient(sub.name, sub.id); }}
                                  disabled={researchingIngs[sub.id]}
                                  className="flex items-center gap-1 px-2 py-1 bg-rose-600 text-white rounded-lg text-[8px] font-bold active:scale-95 transition-all disabled:opacity-50"
                                >
                                  {researchingIngs[sub.id] ? <RefreshCw size={8} className="animate-spin" /> : <Sparkles size={8} />}
                                  {researchingIngs[sub.id] ? 'Verify' : 'Verify'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl border border-zinc-200 dark:border-dark-border space-y-6 flex flex-col items-center text-center">
          <LargeScoreBadge score={displayProduct.score} />
          <p className="text-zinc-700 dark:text-dark-text-primary leading-relaxed font-medium tracking-tight font-display text-lg">{displayProduct.summary}</p>
        </div>
      )}

      {(displayProduct.frontImage || displayProduct.nutritionImage || displayProduct.ingredientsImage) && (
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-400 dark:text-dark-text-secondary uppercase tracking-[0.2em]">Product Images</h3>
          <div className="grid grid-cols-3 gap-2">
            {displayProduct.frontImage && (
              <div className="aspect-square rounded-lg overflow-hidden">
                <img src={displayProduct.frontImage} alt="Front" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
            {displayProduct.nutritionImage && (
              <div className="aspect-square rounded-lg overflow-hidden">
                <img src={displayProduct.nutritionImage} alt="Nutrition" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
            {displayProduct.ingredientsImage && (
              <div className="aspect-square rounded-lg overflow-hidden">
                <img src={displayProduct.ingredientsImage} alt="Ingredients" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
          </div>
        </section>
      )}

      {!displayProduct.analysis && (
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-400 dark:text-dark-text-secondary uppercase tracking-[0.2em]">Ingredients</h3>
          <div className="bg-white dark:bg-dark-surface p-6 rounded-3xl border border-zinc-200 dark:border-dark-border space-y-2">
            {displayProduct.ingredientsParsed.map((ing, i) => (
              <p key={i} className="text-zinc-700 dark:text-dark-text-primary">{ing}</p>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="pt-12 border-t border-zinc-100 dark:border-dark-border text-center space-y-6">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          <span>Analysis: {new Date().toLocaleDateString()}</span>
          <span>Database: v2.4.0</span>
        </div>
        <p className="text-[10px] text-zinc-400 leading-relaxed italic max-w-xs mx-auto px-4">
          Disclaimer: This analysis is for educational purposes and does not constitute medical advice. Consult a healthcare professional for dietary guidance.
        </p>
      </footer>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl border border-zinc-200 dark:border-dark-border overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16" />
              
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
                  <Trash2 size={32} />
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-display">Delete Product?</h3>
                  <p className="text-sm text-zinc-500 dark:text-dark-text-secondary leading-relaxed">
                    This will permanently remove <span className="font-bold text-zinc-900 dark:text-white">{displayProduct.name}</span> from the database. This action cannot be undone.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Yes, Delete Product'
                    )}
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Components ---

const CameraView = ({ onCapture, onCancel, title, subtitle, showFrame = true }: { onCapture: (blob: Blob) => void, onCancel: () => void, title: string, subtitle: string, showFrame?: boolean }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function startCamera() {
      // Add a small delay to allow previous camera sessions (like BarcodeScanner) to fully release
      await new Promise(resolve => setTimeout(resolve, 800));
      
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' },
          audio: false 
        });
        console.log("[Scan Event] Camera started");
        if (isMounted) {
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setIsInitializing(false);
        } else {
          // If unmounted while starting, stop it immediately
          s.getTracks().forEach(track => track.stop());
        }
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        if (isMounted) {
          let msg = "Could not access camera.";
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            msg = "Camera permission is required to capture images. Please click 'Allow' when prompted by your browser, or check your site settings (usually the lock icon next to the URL) to enable camera access.";
          } else if (err.name === 'NotReadableError') {
            msg = "Camera is already in use by another application or tab. Please close other camera apps and try again.";
          }
          setError(msg);
          setIsInitializing(false);
        }
      }
    }
    startCamera();
    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    // Resume video playback when title changes (new scan step)
    if (videoRef.current && !isInitializing && !isCapturing) {
      videoRef.current.play().catch(console.error);
    }
  }, [title, isInitializing, isCapturing]);

  const handleCapture = () => {
    if (videoRef.current && !isCapturing) {
      setIsCapturing(true);
      triggerHaptic('medium');
      
      // Pause the video to "freeze" the frame
      videoRef.current.pause();

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob(async (blob) => {
          // Show loading state for a short duration to signify processing
          await new Promise(resolve => setTimeout(resolve, 300));
          
          setIsCapturing(false);
          
          // Resume video playback for the next scan
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
          }
          
          if (blob) {
            onCapture(blob);
          }
        }, 'image/jpeg', 0.8);
      } else {
        setIsCapturing(false);
        videoRef.current.play().catch(console.error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden font-sans">
      {isInitializing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-[120] bg-black">
          <div className="w-12 h-12 border-2 border-zinc-800 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-[120] bg-black p-8 text-center">
          <AlertCircle size={48} className="text-rose-500 mb-4" />
          <h3 className="text-lg font-bold mb-2">Camera Error</h3>
          <p className="text-sm text-zinc-400 mb-8 leading-relaxed">{error}</p>
          <div className="space-y-3">
            <div className="bg-zinc-900/50 p-4 rounded-2xl text-left space-y-2 border border-white/10">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">How to enable:</p>
              <ul className="text-xs text-zinc-400 space-y-1 list-disc pl-4">
                <li>Look for a <b>lock icon</b> or <b>camera icon</b> in the address bar.</li>
                <li>Ensure <b>Camera</b> is set to <b>Allow</b>.</li>
                <li>If you're in a preview, try <b>Open in New Tab</b> below.</li>
              </ul>
            </div>
            <button onClick={onCancel} className="bg-white text-black px-8 py-3 rounded-full font-bold w-full active:scale-95 transition-transform">Go Back</button>
            <button 
              onClick={async () => {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                  stream.getTracks().forEach(t => t.stop());
                  window.location.reload(); // Refresh to re-initialize camera
                } catch (e) {
                  alert("Still unable to access camera. Please check your browser settings or click the lock icon in the address bar.");
                }
              }}
              className="bg-emerald-600 text-white px-8 py-3 rounded-full font-bold w-full active:scale-95 transition-transform"
            >
              Grant Camera Access
            </button>
            <button 
              onClick={() => window.open(window.location.href, '_blank')}
              className="bg-zinc-800 text-white px-8 py-3 rounded-full font-bold w-full active:scale-95 transition-transform"
            >
              Open in New Tab
            </button>
          </div>
        </div>
      )}
      
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Vignette & Focus Mask */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* Loading Overlay (Replaces Flash) */}
      <AnimatePresence>
        {isCapturing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="w-12 h-12 border-3 border-white/20 border-t-white rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        {/* Top Zone: Title & Subtitle */}
        <div className="relative pt-[40px] pb-4 flex flex-col items-center pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="absolute top-4 left-6">
            <button onClick={onCancel} className="p-2.5 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/10 active:scale-90 transition-transform">
              <X size={22} />
            </button>
          </div>
          <div className="text-center space-y-1.5">
            <h2 className="text-white font-semibold text-base tracking-tight">{title}</h2>
            <p className="text-white/50 text-[10px] uppercase tracking-[0.15em] font-medium">{subtitle}</p>
          </div>
        </div>

        {/* Center Zone: Scan Frame */}
        <div className="flex-1 flex items-center justify-center px-8 py-4">
          <div className="relative w-full aspect-square max-w-[300px]">
            {/* Corners with breathing animation */}
            {showFrame && (
              <motion.div 
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 pointer-events-none"
              >
                {/* Top Left */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-[2.5px] border-l-[2.5px] border-white/80 rounded-tl-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
                {/* Top Right */}
                <div className="absolute top-0 right-0 w-12 h-12 border-t-[2.5px] border-r-[2.5px] border-white/80 rounded-tr-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
                {/* Bottom Left */}
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[2.5px] border-l-[2.5px] border-white/80 rounded-bl-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
                {/* Bottom Right */}
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[2.5px] border-r-[2.5px] border-white/80 rounded-br-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
              </motion.div>
            )}
            
            {/* Captured Message removed in favor of loading overlay */}
          </div>
        </div>

        {/* Bottom Zone: Instruction & Button */}
        <div className="pb-[20px] pt-4 flex flex-col items-center gap-4 pointer-events-auto bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          {showFrame && (
            <p className="text-white/80 text-xs font-medium tracking-wide drop-shadow-md">
              Align label within frame
            </p>
          )}
          <motion.button 
            whileTap={{ scale: 0.92 }}
            onClick={handleCapture}
            disabled={isCapturing}
            className="relative w-20 h-20 flex items-center justify-center disabled:opacity-50"
          >
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border-[3px] border-white/40 shadow-lg" />
            {/* Inner Fill */}
            <div className="w-[66px] h-[66px] rounded-full bg-white shadow-xl flex items-center justify-center">
              <div className="w-full h-full rounded-full border border-black/5" />
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

const ScanPage = ({ 
  onNavigate, 
  onBack,
  ingredients,
  preservedAnalysis,
  setPreservedAnalysis,
  preservedImages,
  setPreservedImages,
  preservedBarcode,
  setPreservedBarcode,
  preservedScanType,
  setPreservedScanType,
  preservedName,
  setPreservedName,
  preservedBrand,
  setPreservedBrand,
  onRefreshIngredients,
  isAdmin
}: { 
  onNavigate: (page: string, params?: any) => void, 
  onBack: () => void,
  ingredients: Ingredient[],
  preservedAnalysis: ProductAnalysis | null,
  setPreservedAnalysis: React.Dispatch<React.SetStateAction<ProductAnalysis | null>>,
  preservedImages: { front: string | null, nutrition: string | null, ingredients: string | null },
  setPreservedImages: React.Dispatch<React.SetStateAction<{ front: string | null, nutrition: string | null, ingredients: string | null }>>,
  preservedBarcode: string | null,
  setPreservedBarcode: React.Dispatch<React.SetStateAction<string | null>>,
  preservedScanType: 'barcode' | 'ingredients' | 'new-product-prompt' | 'capture-front' | 'capture-nutrition' | 'capture-ingredients' | null,
  setPreservedScanType: React.Dispatch<React.SetStateAction<'barcode' | 'ingredients' | 'new-product-prompt' | 'capture-front' | 'capture-nutrition' | 'capture-ingredients' | null>>,
  preservedName: string,
  setPreservedName: React.Dispatch<React.SetStateAction<string>>,
  preservedBrand: string,
  setPreservedBrand: React.Dispatch<React.SetStateAction<string>>,
  onRefreshIngredients: () => Promise<void>,
  isAdmin?: boolean
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [researchingIngs, setResearchingIngs] = useState<Record<string, boolean>>({});
  const [isResearchingAll, setIsResearchingAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const analysis = preservedAnalysis;
  const setAnalysis = setPreservedAnalysis;
  const scanType = preservedScanType;
  const setScanType = setPreservedScanType;
  const capturedImages = preservedImages;
  const setCapturedImages = setPreservedImages;
  const newProductBarcode = preservedBarcode;
  const setNewProductBarcode = setPreservedBarcode;
  const productName = preservedName;
  const setProductName = setPreservedName;
  const productBrand = preservedBrand;
  const setProductBrand = setPreservedBrand;

  const hasUnrecognizedIngredients = (analysis: ProductAnalysis | null) => {
    if (!analysis) return false;
    return analysis.ingredients.some(ing => 
      ing.matchType === 'unrecognized' || 
      (ing.isCompound && ing.subIngredients?.some(sub => sub.matchType === 'unrecognized'))
    );
  };

  const hasUnrecognized = hasUnrecognizedIngredients(analysis);

  const handleResearchIngredient = async (ingName: string, ingId: string, options: { silent?: boolean } = {}) => {
    triggerHaptic('medium');
    setResearchingIngs(prev => ({ ...prev, [ingId]: true }));
    try {
      const ingredientData = await generateIngredientDataWithAI(ingName);
      const ingredientWithId = { ...ingredientData, id: ingId };
      await saveIngredient(ingredientWithId);
      await onRefreshIngredients();
      
      // Update the analysis locally so the UI reflects the new data
      if (analysis) {
        const updatedIngredients = analysis.ingredients.map(ing => {
          if (ing.id === ingId) {
            return { ...ingredientWithId, matchType: 'exact', isMatched: true };
          }
          if (ing.isCompound && ing.subIngredients) {
            const updatedSubs = ing.subIngredients.map(sub => {
              if (sub.id === ingId) {
                return { ...ingredientWithId, matchType: 'exact', isMatched: true };
              }
              return sub;
            });
            return { ...ing, subIngredients: updatedSubs };
          }
          return ing;
        });
        
        const { finalScore: newOverallScore, processingLevel: newProcessingLevel } = calculateHolisticScore(updatedIngredients);
        setAnalysis({ 
          ...analysis, 
          ingredients: updatedIngredients,
          overallScore: newOverallScore,
          processingLevel: newProcessingLevel
        });
      }
      triggerHaptic('success');
    } catch (error: any) {
      console.error("Failed to research ingredient:", error);
      const msg = error?.message || "Unknown error";
      if (!options.silent) {
        if (msg.includes("403") || msg.includes("Forbidden") || msg.includes("API Key")) {
          alert("AI Connection Failed: This is likely due to API key restrictions in the mobile app. Please use the 'Fix API Key' button in the scanner error screen to provide a fresh key.");
        } else {
          alert("Failed to research ingredient: " + msg);
        }
      }
      triggerHaptic('error');
      throw error; // Rethrow so caller can handle bulk failures
    } finally {
      setResearchingIngs(prev => ({ ...prev, [ingId]: false }));
    }
  };

  const handleResearchAll = async () => {
    if (!analysis) return;
    triggerHaptic('medium');
    setIsResearchingAll(true);
    
    const unrecognized = analysis.ingredients.flatMap(ing => {
      const list = [];
      if (ing.matchType === 'unrecognized') list.push(ing);
      if (ing.isCompound && ing.subIngredients) {
        list.push(...ing.subIngredients.filter(sub => sub.matchType === 'unrecognized'));
      }
      return list;
    });

    let failCount = 0;
    let lastError: any = null;

    try {
      for (const ing of unrecognized) {
        try {
          await handleResearchIngredient(ing.name, ing.id, { silent: true });
        } catch (e) {
          failCount++;
          lastError = e;
        }
      }
      
      if (failCount > 0) {
        const msg = lastError?.message || "Unknown error";
        if (msg.includes("403") || msg.includes("Forbidden") || msg.includes("API Key")) {
          alert(`AI Connection Failed for ${failCount} ingredients. This is likely due to API key restrictions. Please use the 'Fix API Key' button in the scanner error screen.`);
        } else {
          alert(`Failed to research ${failCount} ingredients. Some data may be missing.`);
        }
      } else {
        triggerHaptic('success');
      }
    } finally {
      setIsResearchingAll(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!analysis || !newProductBarcode || isSaving) return;
    
    if (!productName.trim() || productName === "New Product") {
      setError("Please enter a valid product name.");
      triggerHaptic('error');
      return;
    }
    
    if (!productBrand.trim() || productBrand === "Unknown") {
      setError("Please enter a valid brand name.");
      triggerHaptic('error');
      return;
    }

    triggerHaptic('success');
    setIsSaving(true);
    try {
      const rawNames = analysis.ingredients.map(m => m.originalName || m.name);
      await saveProduct({
        barcode: newProductBarcode,
        name: productName,
        brand: productBrand,
        ingredientsRaw: rawNames.join(', '),
        ingredientsParsed: rawNames,
        score: analysis.overallScore,
        summary: analysis.summary,
        status: 'confirmed',
        frontImage: capturedImages.front,
        nutritionImage: capturedImages.nutrition,
        ingredientsImage: capturedImages.ingredients,
        analysis: analysis,
        scannedAt: Date.now(),
        updatedAt: Date.now()
      });
      setIsSaved(true);
    } catch (error) {
      console.error("Failed to save product:", error);
      setError("Failed to save product to library.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleIngredientClick = (name: string) => {
    triggerHaptic('light');
    const findIngredient = (ingredients: any[]): any | undefined => {
      for (const ing of ingredients) {
        if (ing.name === name) return ing;
        if (ing.subIngredients) {
          const found = findIngredient(ing.subIngredients);
          if (found) return found;
        }
      }
      return undefined;
    };

    const found = findIngredient(analysis?.ingredients || []);
    if (found) {
      onNavigate('detail', { id: found.id, ingredient: found });
    }
  };

  const handleBarcodeScan = React.useCallback(async (barcode: string) => {
    triggerHaptic('success');
    setIsScanning(true);
    try {
      const existingProduct = await getProduct(barcode);
      
      const hasCompleteInfo = existingProduct && 
        existingProduct.frontImage && 
        existingProduct.ingredientsImage && 
        existingProduct.name && existingProduct.name !== "New Product" && existingProduct.name !== "Unknown" &&
        existingProduct.brand && existingProduct.brand !== "Unknown";

      if (existingProduct && hasCompleteInfo) {
        onNavigate('product', { product: existingProduct });
      } else {
        setNewProductBarcode(barcode);
        setScanType('new-product-prompt');
      }
    } catch (err) {
      console.error("Barcode lookup error:", err);
    } finally {
      setIsScanning(false);
    }
  }, [onNavigate]);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'nutrition' | 'ingredients') => {
    if (isScanning || !scanType.startsWith('capture-')) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const resizedImageData = await resizeImage(imageData);
      setCapturedImages(prev => ({ ...prev, [type]: resizedImageData }));
      
      // Move to next step
      if (type === 'front') setScanType('capture-nutrition');
      else if (type === 'nutrition') setScanType('capture-ingredients');
      else {
        // All captured, proceed to analysis
        processCapturedImages(resizedImageData);
      }
    } catch (err) {
      console.error("Failed to capture/resize image", err);
    }
  };

  const processCapturedImages = async (ingredientsImageData: string) => {
    console.log("processCapturedImages called");
    if (isScanning) {
      console.log("Already scanning, ignoring request.");
      return;
    }
    setIsScanning(true);
    setScanStatus('Checking cache...');
    setAnalysis(null);

    try {
      if (INGREDIENTS.length === 0) {
        console.log("Ingredients empty, forcing load...");
        await loadIngredients();
      }

      // Check if we have a barcode and if the product already exists
      let isFromCache = false;
      if (newProductBarcode) {
        const existingProduct = await getProduct(newProductBarcode);
        if (existingProduct && existingProduct.analysis) {
          console.log("Found existing product analysis in cache");
          setAnalysis(existingProduct.analysis);
          setIsScanning(false);
          setScanStatus('Analysis loaded from cache');
          setScanType('barcode'); // Clear scan type so camera doesn't reappear
          setNewProductBarcode(newProductBarcode); // Ensure barcode is set
          isFromCache = true;
          return;
        }
      }
      
      setScanStatus('Preparing images...');
      
      console.log("Starting analysis...");
      const base64Ingredients = ingredientsImageData.split(',')[1];
      const frontBase64 = capturedImages.front ? capturedImages.front.split(',')[1] : null;

      const parts: any[] = [
        { text: `Extract information from these product images.
        ${frontBase64 ? 'Image 1 is the front of the product. Extract the product name and brand. If you cannot determine them, use "Unknown".\nImage 2 is the ingredients label.' : 'The image is the ingredients label.'}
        Extract all food ingredients in the EXACT order they appear. 
        
        CRITICAL RULES FOR COMPOUND INGREDIENTS:
        1. Treat any ingredient followed by parentheses as a compound ingredient with sub-ingredients.
        2. Format: Parent Label (sub-ingredient 1, sub-ingredient 2, ...)
        3. KEEP the Parent Label as a compound label (do not ignore it).
        4. EXTRACT each sub-ingredient inside the parentheses individually.
        5. DO NOT treat the parent label as unrecognized if it has sub-ingredients.
        6. Classify parent labels as: "Compound Ingredient", "Functional Group Label", or "Ingredient Group".
        7. Terms like "Leavening", "Seasoning", "Spice Blend", "Semisweet Chocolate", "Lemonade" are Parent Labels.
        8. Commas inside parentheses separate sub-ingredients of that parent, not top-level ingredients.
        9. Never replace the parent label with one of the sub-ingredients.
        10. If an ingredient description says "made from X", "from X", "derived from X", or "produced from X" (e.g., "Vinegar (made from apples)"), DO NOT extract "X" as a sub-ingredient. It is just describing the source of the main ingredient. The main ingredient is what is in the food. For example, "Sugar (made from beets)" should just be "Sugar (made from beets)" with NO sub-ingredients.
        11. If an ingredient is followed by a SINGLE function or category in parentheses (e.g., "Xanthan Gum (Thickener)"), treat it as a simple ingredient "Xanthan Gum".
        12. If a function or category is followed by a SINGLE ingredient in parentheses (e.g., "Thickener (Xanthan Gum)"), treat it as a simple ingredient "Xanthan Gum".
        13. ONLY treat it as a compound ingredient if the parentheses contain MULTIPLE ingredients (separated by commas or semicolons) or if the parent is a known group label like "Leavening" or "Seasoning".
        
        Return as JSON: 
        { 
          "scanId": "${Date.now()}",
          "name": "...", 
          "brand": "...", 
          "ingredients": [
            { "full": "...", "outerName": "...", "subIngredients": ["...", "..."] },
            "Simple Ingredient Name",
            ...
          ] 
        }` }
      ];

      if (frontBase64) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: frontBase64 } });
      }
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Ingredients } });

      console.log("Calling safeGenerateContent...");
      setScanStatus('Sending to AI...');
      console.time('AI_Analysis');
      let response;
      try {
        response = await safeGenerateContent({
          model: "gemini-3-flash-preview",
          contents: [{ parts }],
          config: { 
            responseMimeType: "application/json",
            maxOutputTokens: 4096,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
          }
        });
      } catch (aiErr: any) {
        console.error("AI Analysis Error:", aiErr);
        const msg = aiErr.message || String(aiErr);
        throw new Error(`AI_ERROR: ${msg}`);
      }
      console.timeEnd('AI_Analysis');
      console.log("safeGenerateContent returned, response:", response);

      if (!response.text) {
        const finishReason = response.candidates?.[0]?.finishReason;
        const safetyRatings = response.candidates?.[0]?.safetyRatings;
        console.error("AI returned empty text. Finish Reason:", finishReason, "Safety Ratings:", safetyRatings);
        
        if (finishReason === 'SAFETY') {
          throw new Error("AI blocked the response due to safety filters. Try a clearer image of the label.");
        } else if (finishReason === 'RECITATION') {
          throw new Error("AI blocked the response due to recitation filters.");
        } else {
          throw new Error("No response from AI. The image might be too blurry or the model is overloaded.");
        }
      }
      
      console.log("Parsing AI response...");
      let extractedData: any = {};
      try {
        extractedData = JSON.parse(response.text || '{}');
      } catch (parseErr) {
        console.error("Failed to parse AI response:", response.text);
        throw new Error("The AI returned an invalid response format. Please try taking a clearer picture of the label.");
      }
      console.log("Parsing complete, extractedData:", extractedData);
      setScanStatus('Parsing ingredient data...');
      const extractedIngredients: any[] = extractedData.ingredients || [];
      setScanStatus('Calculating health score...');
      const extractedName = extractedData.name || "New Product";
      const extractedBrand = extractedData.brand || "Unknown";
      
      setProductName(extractedName);
      setProductBrand(extractedBrand);
      
      console.log(`Extracted ${extractedIngredients.length} ingredients.`);
      
      setScanStatus('Matching ingredients to database...');
      console.time('Ingredient_Lookup');
      let allMappings: IngredientMapping[] = [];
      try {
        allMappings = await getAllIngredientMappings();
      } catch (dbErr: any) {
        console.error("Database Lookup Error:", dbErr);
        const msg = dbErr.message || String(dbErr);
        throw new Error(`DB_ERROR: ${msg}`);
      }
      const mappingDict: Record<string, string> = {};
      allMappings.forEach(m => {
        mappingDict[m.originalName] = m.mappedId;
      });
      console.timeEnd('Ingredient_Lookup');

      const matched: MatchedIngredient[] = [];

      for (const item of extractedIngredients) {
        const isCompound = typeof item === 'object' && item !== null && 'outerName' in item;
        const fullText = isCompound ? item.full : item;
        const outerName = isCompound ? item.outerName : item;
        const subNames = isCompound ? (item.subIngredients || []) : [];

        let matchedIng: MatchedIngredient | null = await findBestMatch(outerName, mappingDict);

        if (!matchedIng) {
          // Check if it's a known parent label type that should be resolved via sub-ingredients
          const parentLabelTerms = [
            'leavening', 'seasoning', 'spice blend', 'filling', 'frosting', 'coating', 
            'sauce', 'broth', 'marinade', 'breading', 'semisweet chocolate', 
            'lemonade', 'natural flavor', 'artificial flavor', 'dough conditioner'
          ];
          const isKnownParent = isCompound && parentLabelTerms.some(term => outerName.toLowerCase().includes(term));
          const hasValidSubIngredients = isCompound && subNames.length > 0;

          if (isKnownParent || hasValidSubIngredients) {
            // Resolved Parent Label
            matchedIng = {
              id: `resolved-${outerName.replace(/\s+/g, '-').toLowerCase()}`,
              name: outerName,
              originalName: fullText,
              synonyms: [],
              category: 'Compound Label',
              score: 7, // Default neutral-positive for resolved parents
              scoreReasoning: 'This is a grouping label resolved via its individual sub-ingredients.',
              summaryShort: 'Grouping label.',
              positives: [],
              negatives: [],
              evidenceOverview: 'Resolved via sub-ingredients.',
              confidenceLevel: 'High',
              evidenceType: 'Mixed',
              studies: [],
              lastReviewed: 'N/A',
              status: 'Likely Neutral',
              studyQualitySummary: 'N/A',
              regulatoryWeight: 0,
              regulatoryConsensus: 'Known Grouping',
              evidenceStrength: 'High',
              humanEvidence: 'High',
              evolvingEvidence: false,
              lastScientificRefresh: 'N/A',
              isMatched: true,
              matchType: 'resolved-parent',
              parentLabelType: isKnownParent ? 'Functional Group Label' : 'Compound Ingredient',
              resolutionStatus: 'Resolved via sub-ingredients'
            };
          } else {
            // Unrecognized parent
            const unrecognizedId = `unknown-${outerName.replace(/\s+/g, '-').toLowerCase()}`;
            matchedIng = {
              id: unrecognizedId,
              name: outerName,
              originalName: fullText,
              synonyms: [],
              category: 'Unknown',
              score: 5,
              scoreReasoning: 'This ingredient is not in our clinical database.',
              summaryShort: 'Information not available.',
              positives: [],
              negatives: [],
              evidenceOverview: 'No clinical data found.',
              confidenceLevel: 'Low',
              evidenceType: 'Mixed',
              studies: [],
              lastReviewed: 'N/A',
              status: 'Likely Neutral',
              studyQualitySummary: 'N/A',
              regulatoryWeight: 0,
              regulatoryConsensus: 'Unknown',
              evidenceStrength: 'Low',
              humanEvidence: 'Low',
              evolvingEvidence: false,
              lastScientificRefresh: 'N/A',
              isMatched: false,
              matchType: 'unrecognized'
            };
          }
        }

        if (isCompound) {
          matchedIng.isCompound = true;
          matchedIng.subIngredients = [];
          for (const subName of subNames) {
            const subMatch = await findBestMatch(subName, mappingDict);
            if (subMatch) {
              matchedIng.subIngredients.push(subMatch);
            } else {
              // Unrecognized sub-ingredient
              const subUnrecognizedId = `unknown-sub-${subName.replace(/\s+/g, '-').toLowerCase()}`;
              matchedIng.subIngredients.push({
                id: subUnrecognizedId,
                name: subName,
                originalName: subName,
                synonyms: [],
                category: 'Unknown',
                score: 5,
                scoreReasoning: 'Sub-ingredient not in database.',
                summaryShort: 'Information not available.',
                positives: [],
                negatives: [],
                evidenceOverview: 'No clinical data found.',
                confidenceLevel: 'Low',
                evidenceType: 'Mixed',
                studies: [],
                lastReviewed: 'N/A',
                status: 'Likely Neutral',
                studyQualitySummary: 'N/A',
                regulatoryWeight: 0,
                regulatoryConsensus: 'Unknown',
                evidenceStrength: 'Low',
                humanEvidence: 'Low',
                evolvingEvidence: false,
                lastScientificRefresh: 'N/A',
                isMatched: false,
                matchType: 'unrecognized'
              });
            }
          }
        }

        matched.push(matchedIng);
      }

      // --- AI-Powered Matching for Unrecognized Ingredients ---
      const unrecognizedForAI = matched.filter(ing => !ing.isMatched && ing.matchType === 'unrecognized');
      const unrecognizedSubForAI = matched.flatMap(ing => ing.isCompound ? (ing.subIngredients || []).filter(sub => !sub.isMatched && sub.matchType === 'unrecognized') : []);
      
      const allUnrecognized = [...new Set([
        ...unrecognizedForAI.map(ing => ing.name),
        ...unrecognizedSubForAI.map(ing => ing.name)
      ])].slice(0, 10); // Limit to 10 to prevent token limits and rate limits

      if (allUnrecognized.length > 0) {
        console.log(`Attempting AI matching for ${allUnrecognized.length} unrecognized ingredients...`);
        let aiStandardizations: Record<string, { standardName: string, synonyms: string[], reasoning?: string } | null> = {};
        try {
          aiStandardizations = await matchIngredientsWithAI(allUnrecognized, ingredients);
        } catch (err: any) {
          console.error("AI matching failed:", err);
          const msg = err.message || String(err);
          setError(msg);
          setScanType('barcode');
          return;
        }
        
        // Apply AI matches
        for (const [originalName, data] of Object.entries(aiStandardizations)) {
          if (data && data.standardName) {
            // Try to match the standardized name or synonyms locally
            let matchedIng = await findBestMatch(data.standardName);
            if (!matchedIng && data.synonyms) {
              for (const syn of data.synonyms) {
                matchedIng = await findBestMatch(syn);
                if (matchedIng) break;
              }
            }

            if (matchedIng && matchedIng.matchType !== 'unrecognized') {
              const dbIng = INGREDIENTS.find(ing => ing.id === matchedIng!.id);
              if (dbIng) {
                console.log(`AI Matched: "${originalName}" -> "${dbIng.name}"`);
                // Update top-level matches
                matched.forEach((ing, idx) => {
                  if (ing.matchType === 'unrecognized' && ing.name === originalName) {
                    matched[idx] = { ...dbIng, originalName: ing.originalName, isMatched: true, matchType: 'alias', mappingReasoning: data.reasoning };
                    saveIngredientMapping({ originalName: originalName.toLowerCase(), mappedId: dbIng.id, confidence: 1.0, status: 'confirmed', reasoning: data.reasoning });
                  }
                });
                // Update sub-ingredient matches
                matched.forEach(ing => {
                  if (ing.isCompound && ing.subIngredients) {
                    ing.subIngredients.forEach((sub, sIdx) => {
                      if (sub.matchType === 'unrecognized' && sub.name === originalName) {
                        ing.subIngredients![sIdx] = { ...dbIng, originalName: sub.originalName, isMatched: true, matchType: 'alias' };
                        saveIngredientMapping({ originalName: originalName.toLowerCase(), mappedId: dbIng.id, confidence: 1.0, status: 'confirmed' });
                      }
                    });
                  }
                });
              }
            }
          }
        }
      }

      console.log("Extracted ingredients, starting holistic analysis...");
      console.time("performHolisticAnalysis");
      const fullAnalysis = await performHolisticAnalysis(extractedName, extractedBrand, matched);
      console.timeEnd("performHolisticAnalysis");
      console.log("Holistic analysis complete. Analysis:", fullAnalysis);
      setAnalysis(fullAnalysis);

      // Save product if we have a barcode and all ingredients are known
      const hasUnknownIngredients = matched.some(ing => 
        ing.matchType === 'unrecognized' ||
        (ing.isCompound && ing.subIngredients?.some(sub => sub.matchType === 'unrecognized'))
      );
      console.log("Has unknown ingredients:", hasUnknownIngredients);

      if (newProductBarcode && !hasUnknownIngredients) {
        setScanStatus('Saving product...');
        console.log("Saving product...");
        console.time("saveProduct");
        // Check if product already exists to preserve confirmed status
        const existingProduct = await getProduct(newProductBarcode);
        console.log("Existing product found:", !!existingProduct);
        const rawNames = matched.map(m => m.originalName);
        
        // Resize images to save space and improve performance
        let resizedFront = capturedImages.front || existingProduct?.frontImage;
        let resizedNutrition = capturedImages.nutrition || existingProduct?.nutritionImage;
        let resizedIngredients = ingredientsImageData || existingProduct?.ingredientsImage;

        try {
          if (capturedImages.front) resizedFront = await resizeImage(capturedImages.front, 600, 600);
          if (capturedImages.nutrition) resizedNutrition = await resizeImage(capturedImages.nutrition, 800, 800);
          if (ingredientsImageData) resizedIngredients = await resizeImage(ingredientsImageData, 800, 800);
        } catch (e) {
          console.warn("Image resizing failed, using original", e);
        }

        await saveProduct({
          barcode: newProductBarcode,
          name: productName,
          brand: productBrand,
          ingredientsRaw: rawNames.join(', '),
          ingredientsParsed: rawNames,
          score: fullAnalysis.overallScore,
          summary: fullAnalysis.summary,
          status: 'confirmed',
          frontImage: resizedFront,
          nutritionImage: resizedNutrition,
          ingredientsImage: resizedIngredients,
          analysis: fullAnalysis,
          scannedAt: Date.now(),
          updatedAt: Date.now()
        });
        console.timeEnd("saveProduct");
        console.log("Product saved.");
      } else if (newProductBarcode && hasUnknownIngredients) {
        console.log("Product has unknown ingredients, skipping initial save to library.");
      }
      
      // Clear scan type so capture UI doesn't reappear
      setScanType('barcode');
    } catch (err: any) {
      console.error("Analysis error:", err);
      const displayMsgRaw = err.message || "Unknown error";
      let displayMsg = displayMsgRaw;
      let authInfo = "";
      let debugInfo = "";
      let errorType = "General";

      if (displayMsgRaw.startsWith("AI_ERROR: ")) {
        errorType = "AI Service";
        displayMsg = displayMsgRaw.replace("AI_ERROR: ", "");
      } else if (displayMsgRaw.startsWith("DB_ERROR: ")) {
        errorType = "Database";
        displayMsg = displayMsgRaw.replace("DB_ERROR: ", "");
      }
      
      // Try to parse detailed JSON error from handleFirestoreError
      try {
        const parsed = JSON.parse(displayMsg);
        if (parsed.error) displayMsg = parsed.error;
        if (parsed.operationType && parsed.path) {
          displayMsg += ` (Op: ${parsed.operationType}, Path: ${parsed.path})`;
        }
        if (parsed.authInfo) {
          authInfo = ` (User: ${parsed.authInfo.userId || 'Not Logged In'})`;
        }
        debugInfo = JSON.stringify(parsed, null, 2);
      } catch (e) {
        // Not JSON, keep raw
        debugInfo = displayMsg;
      }
      
      const isForbidden = displayMsg.toLowerCase().includes("permission-denied") || 
                          displayMsg.toLowerCase().includes("forbidden") || 
                          displayMsg.toLowerCase().includes("permission denied") ||
                          displayMsg.includes("403") ||
                          displayMsg.toLowerCase().includes("proxying failed") ||
                          displayMsg.toLowerCase().includes("load failed") ||
                          displayMsg.toLowerCase().includes("not authorized");

      const aiKeyInfo = getAIKeyInfo();
      const keySuffix = aiKeyInfo.snippet !== "None" ? ` (Key: ${aiKeyInfo.snippet})` : "";
      const keySource = aiKeyInfo.source;
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';

      if (displayMsg.toLowerCase().includes("quota exceeded")) {
        setError(`${errorType} Quota Exceeded: ${displayMsg}. The daily limit has been reached. Please try again later.`);
      } else if (isForbidden) {
        setError(`${errorType} Error (Forbidden): ${displayMsg}${authInfo}. 
        
        [DEBUG INFO]
        Domain: ${hostname}
        Key Source: ${keySource}
        Key Snippet: ${keySuffix}
        
        This usually happens when the API key is restricted to this specific domain. Click "Fix API Key" below while on this page to fix it.`);
      } else {
        setError(`${errorType} Analysis failed: ${displayMsg}${authInfo}${keySuffix}`);
      }
      
      // Store full error for debug
      (window as any).lastScanError = err;
      (window as any).lastScanDebugInfo = debugInfo;
      
      setScanType('barcode'); // Reset scan type on error
    } finally {
      setIsScanning(false);
      setScanStatus('');
    }
  };

  return (
    <div className="space-y-8 pt-safe">
      <div className="pt-6">
        {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 p-6 rounded-3xl border border-rose-100 dark:border-rose-900/30 text-center space-y-4">
          <AlertCircle size={48} className="text-rose-500 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-rose-900 dark:text-rose-400">Analysis Error</h3>
            <p className="text-sm text-rose-800 dark:text-rose-300/80">{error}</p>
          </div>
          <div className="space-y-3">
            {(error?.toLowerCase().includes("camera") || 
              error?.toLowerCase().includes("permission") || 
              error?.toLowerCase().includes("notallowed") || 
              error?.toLowerCase().includes("notreadable") ||
              error?.toLowerCase().includes("usermedia")) && (
              <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-2xl text-left space-y-2 border border-zinc-200 dark:border-white/10">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">How to enable:</p>
                <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-disc pl-4">
                  <li>Look for a <b>lock icon</b> or <b>camera icon</b> in the address bar.</li>
                  <li>Ensure <b>Camera</b> is set to <b>Allow</b>.</li>
                  <li>If you're in a preview, try <b>Open in New Tab</b> below.</li>
                </ul>
              </div>
            )}
            {(error?.toLowerCase().includes("forbidden") || 
              error?.toLowerCase().includes("403") || 
              error?.toLowerCase().includes("proxying failed") || 
              error?.toLowerCase().includes("load failed") ||
              error?.toLowerCase().includes("not authorized")) && (
              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={async () => {
                    const aistudio = (window as any).aistudio || (window.parent as any).aistudio;
                    if (aistudio && aistudio.openSelectKey) {
                      await aistudio.openSelectKey();
                      window.location.reload();
                    } else {
                      const current = localStorage.getItem('INGREDISCORE_CUSTOM_KEY') || "";
                      const newKey = prompt(`To fix this on the Link page:\n\n1. Go to https://aistudio.google.com/app/apikey\n2. Create a NEW API Key.\n3. Paste it here:\n\n(Current key: ${current ? '***' + current.slice(-4) : 'None'})`, current);
                      
                      if (newKey === null) return; // Cancelled
                      
                      const trimmed = newKey.trim();
                      if (trimmed === "") {
                        localStorage.removeItem('INGREDISCORE_CUSTOM_KEY');
                        alert("Custom key removed. Refreshing...");
                        window.location.reload();
                      } else if (trimmed.startsWith("AIzaSy") && trimmed.length > 20) {
                        localStorage.setItem('INGREDISCORE_CUSTOM_KEY', trimmed);
                        alert("API Key saved locally! Refreshing to test...");
                        window.location.reload();
                      } else {
                        alert("Invalid key format. It should start with 'AIzaSy' and be at least 20 characters long.");
                      }
                    }
                  }}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold w-full active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <Key size={18} />
                  {localStorage.getItem('INGREDISCORE_CUSTOM_KEY') ? "Change API Key" : "Fix API Key (Recommended)"}
                </button>
                {localStorage.getItem('INGREDISCORE_CUSTOM_KEY') && (
                  <button 
                    onClick={() => {
                      localStorage.removeItem('INGREDISCORE_CUSTOM_KEY');
                      alert("Custom key cleared. Refreshing to use default key...");
                      window.location.reload();
                    }}
                    className="text-[10px] text-rose-500 font-bold uppercase tracking-widest hover:underline"
                  >
                    Reset to Default Key
                  </button>
                )}
                <button 
                  onClick={() => {
                    const debug = (window as any).lastScanDebugInfo || error;
                    const info = getAIKeyInfo();
                    alert(`DEBUG INFO:\n\n${debug}\n\nKey Source: ${info.source}\nKey Snippet: ${info.snippet}`);
                  }}
                  className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest hover:underline"
                >
                  Show Debug Info
                </button>
                <p className="text-[10px] text-zinc-400 font-medium">
                  Clicking "Fix API Key" lets you select a fresh key that isn't restricted.
                </p>
              </div>
            )}
            <button onClick={() => { setError(null); setScanType('barcode'); }} className="bg-rose-600 text-white px-8 py-3 rounded-2xl font-bold w-full active:scale-95 transition-transform">
              Try Again
            </button>
            {(error?.toLowerCase().includes("camera") || 
              error?.toLowerCase().includes("permission") || 
              error?.toLowerCase().includes("notallowed") || 
              error?.toLowerCase().includes("notreadable") ||
              error?.toLowerCase().includes("usermedia")) && (
              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                      stream.getTracks().forEach(t => t.stop());
                      setError(null);
                      setScanType('barcode');
                    } catch (e) {
                      alert("Still unable to access camera. Please check your browser settings or click the lock icon in the address bar.");
                    }
                  }}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold w-full active:scale-95 transition-transform"
                >
                  Grant Camera Access
                </button>
                <button 
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black px-8 py-3 rounded-2xl font-bold w-full active:scale-95 transition-transform"
                >
                  Open in New Tab
                </button>
              </div>
            )}
            <button 
              onClick={() => { 
                const info = (window as any).lastScanDebugInfo || "No debug info available";
                alert(`Debug Info:\n${info}`);
              }} 
              className="text-xs font-medium text-rose-700 dark:text-rose-500 underline w-full text-center py-1"
            >
              Show Technical Details
            </button>
            <button onClick={() => { setError(null); onBack(); }} className="text-sm font-bold text-zinc-500 w-full text-center">
              Cancel
            </button>
          </div>
        </div>
      )}
      {!scanType && !analysis && !isScanning && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="w-16 h-16 border-4 border-zinc-200 dark:border-dark-border border-t-zinc-900 dark:border-t-dark-text-primary rounded-full animate-spin" />
        </div>
      )}

      {scanType === 'barcode' && !analysis && !error && (
        <BarcodeScanner 
          onScanSuccess={handleBarcodeScan}
          onScanFailure={(err) => {
            if (err === 'CANCELLED') {
              onBack();
            } else {
              setError(err);
              setScanType(null); // Stop scanning view
            }
          }}
        />
      )}

      {scanType === 'new-product-prompt' && (
        <div className="bg-amber-50 dark:bg-amber-950/30 p-8 rounded-3xl border border-amber-100 dark:border-amber-900/30 text-center space-y-6">
          <AlertCircle size={48} className="text-amber-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-amber-900 dark:text-amber-400">New Product Detected</h2>
            <p className="text-sm text-amber-800 dark:text-amber-300/80">
              This barcode ({newProductBarcode}) has not been scanned before.
            </p>
          </div>
          <button 
            onClick={() => setScanType('capture-front')}
            className="bg-amber-600 text-white px-8 py-4 rounded-2xl font-bold w-full active:scale-95 transition-transform"
          >
            Scan Front of Product
          </button>
          <button onClick={() => { onBack(); setNewProductBarcode(null); }} className="text-sm font-bold text-zinc-500 w-full text-center">Cancel</button>
        </div>
      )}

      {(scanType === 'capture-front' || scanType === 'capture-nutrition' || scanType === 'capture-ingredients') && !isScanning && (
        <CameraView 
          title={
            scanType === 'capture-front' ? 'Scan Front of Product' : 
            scanType === 'capture-nutrition' ? 'Scan Nutrition Label' : 'Scan Ingredient List'
          }
          subtitle="Position clearly in view"
          showFrame={false}
          onCancel={() => { onBack(); setNewProductBarcode(null); setCapturedImages({ front: null, nutrition: null, ingredients: null }); }}
          onCapture={async (blob) => {
            handleCapture({ target: { files: [new File([blob], "capture.jpg", { type: "image/jpeg" })] } } as any, 
              scanType === 'capture-front' ? 'front' : scanType === 'capture-nutrition' ? 'nutrition' : 'ingredients'
            );
          }}
        />
      )}

      {isScanning && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-zinc-200 dark:border-dark-border border-t-zinc-900 dark:border-t-dark-text-primary rounded-full animate-spin" />
            <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-900 dark:text-dark-text-primary" size={24} />
          </div>
          <div className="text-center space-y-2">
            <p className="font-bold text-zinc-900 dark:text-dark-text-primary">{scanStatus || 'Analyzing Product...'}</p>
            <p className="text-xs text-zinc-400 dark:text-dark-text-secondary">Our AI is extracting ingredients and performing a holistic health assessment.</p>
          </div>
        </div>
      )}

      {analysis && (
        <div className="space-y-10">
          {/* Product Analysis Page */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold font-display text-zinc-900 dark:text-dark-text-primary">Product Analysis</h2>
                {scanStatus === 'Analysis loaded from cache' && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                    <Database size={10} />
                    <span className="text-[8px] font-bold uppercase tracking-wider">From Shared Brain</span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => { setAnalysis(null); setNewProductBarcode(null); setCapturedImages({ front: null, nutrition: null, ingredients: null }); setScanType('barcode'); }}
                className="text-sm font-bold text-emerald-600 dark:text-dark-text-primary"
              >
                Scan Another
              </button>
            </div>

            {isAdmin && hasUnrecognized && newProductBarcode && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-6 rounded-3xl border border-amber-200 dark:border-amber-900/30 space-y-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold">
                  <AlertCircle size={18} />
                  <h3>Product Not Saved</h3>
                </div>
                <p className="text-sm text-amber-800/80 dark:text-amber-300/60 leading-relaxed">
                  This product contains ingredients that are not currently in our database. To maintain data accuracy, this product will not be saved to your history until all ingredients are verified.
                </p>
                <button 
                  onClick={handleResearchAll}
                  disabled={isResearchingAll}
                  className="w-full py-3 bg-amber-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isResearchingAll ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isResearchingAll ? 'Verifying All...' : 'Verify All Unknown Ingredients'}
                </button>
              </div>
            )}

            {!hasUnrecognized && newProductBarcode && (
              <div className={cn(
                "p-6 rounded-3xl border space-y-4 transition-all",
                isSaved 
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/30" 
                  : "bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800/30"
              )}>
                <div className="flex items-center gap-2 font-bold">
                  {isSaved ? (
                    <>
                      <CheckCircle2 size={18} className="text-emerald-600" />
                      <h3 className="text-emerald-800 dark:text-emerald-400">Saved to Library!</h3>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} className="text-zinc-600 dark:text-zinc-400" />
                      <h3 className="text-zinc-800 dark:text-zinc-200">Ingredients Verified</h3>
                    </>
                  )}
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {isSaved 
                    ? "This product has been successfully added to your library and history."
                    : "All ingredients have been identified. You can now add this product to your library."}
                </p>
                {!isSaved && (
                  <button 
                    onClick={handleSaveToLibrary}
                    disabled={isSaving}
                    className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                    {isSaving ? 'Saving...' : 'Add to Library'}
                  </button>
                )}
              </div>
            )}

            <div className="bg-white dark:bg-dark-surface p-8 rounded-[2.5rem] border border-zinc-200 dark:border-dark-border shadow-sm space-y-8">
              {/* Editable Name and Brand */}
              <div className="space-y-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Product Name</label>
                  <input 
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product name"
                    className="w-full bg-transparent text-xl font-bold text-zinc-900 dark:text-dark-text-primary focus:outline-none border-b border-transparent focus:border-emerald-500/30 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Brand</label>
                  <input 
                    type="text"
                    value={productBrand}
                    onChange={(e) => setProductBrand(e.target.value)}
                    placeholder="Enter brand name"
                    className="w-full bg-transparent text-lg font-medium text-zinc-600 dark:text-dark-text-secondary focus:outline-none border-b border-transparent focus:border-emerald-500/30 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <LargeScoreBadge score={analysis.overallScore} />
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                    analysis.overallScore >= 8 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-100 dark:border-emerald-500/20" :
                    analysis.overallScore >= 5 ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20" :
                    "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20"
                  )}>
                    {analysis.overallScore >= 8 ? "Excellent" :
                     analysis.overallScore >= 6 ? "Good" :
                     analysis.overallScore >= 4 ? "Caution" : "Avoid"}
                  </div>
                </div>
                <div className="space-y-4 flex-1">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Processing Level</p>
                    <p className={cn(
                      "text-lg font-bold",
                      analysis.processingLevel === 'Minimally Processed' ? 'text-emerald-600 dark:text-white' :
                      analysis.processingLevel === 'Moderately Processed' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                    )}>
                      {analysis.processingLevel}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Summary</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">{analysis.summary}</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-dark-bg/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-dark-text-primary">
                  <HelpCircle size={16} className="text-zinc-400" />
                  <p className="text-xs font-bold uppercase tracking-widest">Why this score?</p>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                  {analysis.scoreExplanation}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                {analysis.loweredScoreBy.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-rose-400 dark:text-rose-500 uppercase tracking-widest">Lowered Score Most</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.loweredScoreBy.map((name, idx) => (
                        <button 
                          key={`${name}-${idx}`} 
                          onClick={() => handleIngredientClick(name)}
                          className="px-3 py-1 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 rounded-full text-xs font-bold border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors text-left"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {analysis.improvedScoreBy.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-emerald-400 dark:text-white uppercase tracking-widest">Improved Score</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.improvedScoreBy.map((name, idx) => (
                        <button 
                          key={`${name}-${idx}`} 
                          onClick={() => handleIngredientClick(name)}
                          className="px-3 py-1 bg-emerald-50 dark:bg-zinc-800/30 text-emerald-700 dark:text-white rounded-full text-xs font-bold border border-emerald-100 dark:border-zinc-800/50 hover:bg-emerald-100 dark:hover:bg-zinc-800/50 transition-colors text-left"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Key Concerns</p>
                  <div className="space-y-2">
                    {analysis.keyConcerns.map((c, i) => (
                      <div key={i} className="flex gap-2 items-start text-sm text-zinc-600 dark:text-zinc-400">
                        <AlertCircle size={14} className="text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Positive Attributes</p>
                  <div className="space-y-2">
                    {analysis.positiveAttributes.map((a, i) => (
                      <div key={i} className="flex gap-2 items-start text-sm text-zinc-600 dark:text-zinc-400">
                        <CheckCircle2 size={14} className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Score Explanation</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic">{analysis.scoreExplanation}</p>
              </div>
            </div>
          </section>

          {/* Individual Ingredients List */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold font-display px-2 text-zinc-900 dark:text-dark-text-primary">Ingredient Breakdown</h2>
            <div className="space-y-4">
              {analysis.ingredients.map((ing, idx) => (
                <div 
                  key={`${ing.id}-${idx}`} 
                  onClick={() => handleIngredientClick(ing.name)}
                  className="bg-white dark:bg-dark-surface p-6 rounded-3xl border border-zinc-200 dark:border-dark-border shadow-sm space-y-4 cursor-pointer hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <ScoreBadge score={ing.score} size="sm" />
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-dark-text-primary">{ing.name}</h3>
                        {ing.matchType === 'alias' && (
                          <p className="text-[10px] text-emerald-600 dark:text-dark-text-primary font-bold uppercase tracking-wider">
                            Matched from: {ing.originalName}
                          </p>
                        )}
                        {ing.matchType === 'unrecognized' && isAdmin && (
                          <div className="flex flex-col gap-2">
                            <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold uppercase tracking-wider">
                              Unknown Ingredient
                            </p>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleResearchIngredient(ing.name, ing.id); }}
                              disabled={researchingIngs[ing.id]}
                              className="px-3 py-1 bg-rose-500 text-white rounded-full text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit disabled:opacity-50"
                            >
                              {researchingIngs[ing.id] ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                              {researchingIngs[ing.id] ? 'Verifying...' : 'Verify Ingredient'}
                            </button>
                          </div>
                        )}
                        {ing.isCompound && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            <p className="text-[10px] text-zinc-400 dark:text-dark-text-secondary font-bold uppercase tracking-wider">
                              {ing.parentLabelType || 'Compound Ingredient'}
                            </p>
                            {ing.resolutionStatus && (
                              <p className="text-[10px] text-emerald-500 dark:text-dark-text-primary font-bold uppercase tracking-wider">
                                • {ing.resolutionStatus}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-dark-text-secondary uppercase tracking-widest bg-zinc-50 dark:bg-dark-surface px-2 py-1 rounded-full">
                        #{idx + 1}
                      </span>
                      <ChevronRight size={14} className="text-zinc-300" />
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-dark-text-secondary leading-relaxed">{ing.scoreReasoning}</p>
                  
                  {ing.isCompound && ing.subIngredients && ing.subIngredients.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-dark-border space-y-3">
                      <p className="text-[10px] font-bold text-zinc-400 dark:text-dark-text-secondary uppercase tracking-widest">Sub-Ingredients</p>
                      <div className="grid grid-cols-1 gap-2">
                        {ing.subIngredients.map((sub, sIdx) => (
                          <div 
                            key={`${sub.id}-${sIdx}`} 
                            onClick={(e) => { e.stopPropagation(); handleIngredientClick(sub.name); }}
                            className="flex items-center justify-between bg-zinc-50 dark:bg-dark-surface/50 p-2 rounded-xl border border-zinc-100 dark:border-dark-border hover:bg-zinc-100 dark:hover:bg-dark-surface transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <ScoreBadge score={sub.score} size="sm" />
                              <div className="overflow-hidden">
                                <span className="text-xs font-medium text-zinc-700 dark:text-dark-text-primary truncate block">{sub.name}</span>
                                {sub.matchType === 'alias' && (
                                  <p className="text-[8px] text-emerald-600 dark:text-dark-text-primary font-bold uppercase tracking-wider truncate">
                                    From: {sub.originalName}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              {sub.isMatched ? (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-dark-text-primary">Details</span>
                              ) : isAdmin ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleResearchIngredient(sub.name, sub.id); }}
                                  disabled={researchingIngs[sub.id]}
                                  className="px-2 py-1 bg-rose-500 text-white rounded-full text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 disabled:opacity-50"
                                >
                                  {researchingIngs[sub.id] ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                                  {researchingIngs[sub.id] ? 'Verifying...' : 'Verify'}
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400">Unknown</span>
                              )}
                              <ChevronRight size={12} className="text-zinc-300" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={(e) => { e.stopPropagation(); onNavigate('detail', { ingredient: ing }); }}
                    className="text-xs font-bold text-emerald-600 dark:text-white flex items-center gap-1 hover:underline"
                  >
                    View clinical evidence <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
      </div>
    </div>
  );
};

const ProductListItem = ({ 
  product, 
  allIngredients, 
  onClick, 
  onDelete,
  size = 'md'
}: { 
  product: Product, 
  allIngredients: Ingredient[], 
  onClick: () => void, 
  onDelete?: (e: React.MouseEvent) => void,
  size?: 'sm' | 'md'
}) => {
  const liveScore = useMemo(() => {
    if (!product.analysis?.ingredients) return product.analysis?.overallScore || 0;
    
    const refreshIng = (ing: any): any => {
      const dbIng = allIngredients.find(i => i.id === ing.id);
      if (dbIng) {
        // Strictly use the database version as the source of truth
        const refreshed: any = { 
          ...dbIng, 
          originalName: ing.originalName, 
          isMatched: true, 
          matchType: ing.matchType,
          isCompound: ing.isCompound
        };
        if (ing.isCompound && ing.subIngredients) {
          refreshed.subIngredients = ing.subIngredients.map(refreshIng);
        }
        return refreshed;
      }
      if (ing.isCompound && ing.subIngredients) {
        return {
          ...ing,
          subIngredients: ing.subIngredients.map(refreshIng)
        };
      }
      return ing;
    };

    const refreshedIngredients = product.analysis.ingredients.map(refreshIng);
    const { finalScore } = calculateHolisticScore(refreshedIngredients);
    return finalScore;
  }, [product.analysis, allIngredients]);

  return (
    <div className="relative">
      <button 
        onClick={onClick}
        className={cn(
          "w-full bg-white dark:bg-dark-surface rounded-[2rem] border border-zinc-200 dark:border-dark-border shadow-sm flex items-center hover:border-zinc-300 dark:hover:border-dark-text-primary/10 transition-all text-left group",
          size === 'sm' ? "p-4 gap-4" : "p-5 gap-5"
        )}
      >
      <div className={cn(
        "rounded-lg flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform",
        size === 'sm' ? "w-12 h-12" : "w-16 h-16"
      )}>
        {product.frontImage ? (
          <img src={product.frontImage} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <Package size={size === 'sm' ? 20 : 24} className="text-zinc-300 dark:text-dark-text-secondary" />
        )}
      </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-bold text-zinc-900 dark:text-dark-text-primary truncate", size === 'sm' ? "text-base" : "text-lg")}>{product.name}</h3>
          <p className="text-sm text-zinc-500 dark:text-dark-text-secondary truncate font-medium">{product.brand}</p>
          <div className="flex items-center gap-2 mt-1">
            {product.status === 'confirmed' ? (
              <>
                <CheckCircle2 size={12} className="text-emerald-500 dark:text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Verified</span>
              </>
            ) : (
              <>
                <AlertCircle size={12} className="text-amber-500 dark:text-amber-400" />
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Needs Review</span>
              </>
            )}
          </div>
        </div>
        <ScoreBadge score={liveScore} size={size} />
      </button>
    </div>
  );
};

const HistoryPage = ({ 
  onNavigate, 
  onBack, 
  isSyncing, 
  onSync,
  allIngredients,
  user
}: { 
  onNavigate: (page: string, params?: any) => void, 
  onBack: () => void,
  isSyncing: boolean,
  onSync: (force?: boolean, silent?: boolean, skipAI?: boolean) => Promise<void>,
  allIngredients: Ingredient[],
  user: User | null
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const autoSyncRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToProducts((all) => {
      setProducts(all.sort((a, b) => (b.scannedAt || 0) - (a.scannedAt || 0)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const handleSync = async () => {
    await onSync();
  };

  return (
    <div className="space-y-8 pt-safe">
      <header className="flex items-center justify-between pt-6">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 dark:text-dark-text-secondary">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-dark-text-primary">Scan History</h1>
        <div className="flex items-center gap-2">
          {products.length > 0 && (
            <button 
              onClick={handleSync} 
              disabled={isSyncing}
              className={clsx(
                "p-2 text-emerald-500 transition-colors",
                isSyncing && "animate-spin opacity-50"
              )}
              title="Sync with latest ingredient data"
            >
              <RefreshCw size={20} />
            </button>
          )}
          <div className="w-10" />
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-zinc-200 dark:border-dark-border border-t-zinc-900 dark:border-t-dark-text-primary rounded-full animate-spin" />
        </div>
      ) : products.length > 0 ? (
        <div className="space-y-3">
          {products.map((product, idx) => (
            <ProductListItem 
              key={product.barcode || `product-${idx}`}
              product={product}
              allIngredients={allIngredients}
              onClick={() => onNavigate('product', { product })}
              size="sm"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 bg-zinc-50 dark:bg-dark-surface rounded-full flex items-center justify-center mx-auto text-zinc-300 dark:text-dark-text-secondary">
            <History size={32} />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-zinc-900 dark:text-dark-text-primary">No scans yet</p>
            <p className="text-sm text-zinc-500 dark:text-dark-text-secondary">Your scan history will appear here.</p>
            {!user && (
              <p className="text-xs text-zinc-400 dark:text-dark-text-secondary mt-2">Sign in to sync your scans across devices.</p>
            )}
          </div>
          <div className="flex flex-col gap-3 items-center">
            <button 
              onClick={() => onNavigate('scan')}
              className="bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-zinc-900/10 dark:shadow-white/5"
            >
              Start Scanning
            </button>
            {user && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-300 text-white rounded-2xl text-sm font-bold transition-colors shadow-lg shadow-emerald-500/20"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <span>Sync Cloud Data</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const LeaderboardPage = ({ onBack, user, isAdmin }: { onBack: () => void, user: User | null, isAdmin: boolean }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRecalculatingAll, setIsRecalculatingAll] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    const data = await getLeaderboard();
    setEntries(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleRefreshMyStats = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      await recalculateUserStats(user);
      await fetchLeaderboard();
    } catch (error) {
      console.error("Failed to refresh stats:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRecalculateAll = async () => {
    if (!isAdmin) return;
    setIsRecalculatingAll(true);
    try {
      await recalculateAllStats();
      await fetchLeaderboard();
      addLog("Admin: Recalculated all leaderboard stats.");
    } catch (error) {
      console.error("Failed to recalculate all stats:", error);
    } finally {
      setIsRecalculatingAll(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 pt-safe">
      <header className="flex items-center justify-between pt-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 rounded-xl">
              <Trophy size={20} />
            </div>
            <h1 className="text-2xl font-bold font-display dark:text-dark-text-primary">Top Contributors</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button 
              onClick={handleRecalculateAll}
              disabled={isRecalculatingAll || isLoading}
              className={cn(
                "p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-full transition-all",
                isRecalculatingAll && "animate-spin opacity-50"
              )}
              title="Recalculate All Stats (Admin)"
            >
              <ShieldCheck size={20} />
            </button>
          )}
          {user && (
            <button 
              onClick={handleRefreshMyStats}
              disabled={isRefreshing || isLoading}
              className={cn(
                "p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-full transition-all",
                isRefreshing && "animate-spin opacity-50"
              )}
              title="Refresh My Stats"
            >
              <RefreshCw size={20} />
            </button>
          )}
        </div>
      </header>

      <div className="bg-white dark:bg-dark-surface rounded-[2.5rem] border border-zinc-200 dark:border-dark-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 dark:border-dark-border bg-zinc-50/50 dark:bg-dark-bg/50">
          <p className="text-sm text-zinc-500 dark:text-dark-text-secondary leading-relaxed">
            Recognizing the community members who help verify the world's food ingredients. Counts only include <span className="font-bold text-emerald-600 dark:text-emerald-500">verified</span> products.
          </p>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-dark-border">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-4 border-zinc-200 dark:border-dark-border border-t-amber-500 rounded-full animate-spin" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Calculating Rankings...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-zinc-50 dark:bg-dark-bg rounded-full flex items-center justify-center mx-auto text-zinc-300">
                <Trophy size={32} />
              </div>
              <p className="text-sm text-zinc-500 dark:text-dark-text-secondary">No contributions yet. Be the first to add a verified product!</p>
            </div>
          ) : (
            entries.map((entry, index) => (
              <div key={entry.uid} className="p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-dark-bg/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg overflow-hidden border-2",
                      index === 0 ? "bg-amber-50 border-amber-200 text-amber-600" : 
                      index === 1 ? "bg-slate-50 border-slate-200 text-slate-500" :
                      index === 2 ? "bg-orange-50 border-orange-200 text-orange-700" :
                      "bg-zinc-50 dark:bg-dark-bg border-zinc-100 dark:border-dark-border text-zinc-400"
                    )}>
                      {entry.photoURL ? (
                        <img src={entry.photoURL} alt={entry.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        entry.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    {index < 3 && (
                      <div className={cn(
                        "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-dark-surface shadow-sm",
                        index === 0 ? "bg-amber-400 text-white" :
                        index === 1 ? "bg-slate-400 text-white" :
                        "bg-orange-400 text-white"
                      )}>
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold dark:text-dark-text-primary">{entry.displayName}</h3>
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-dark-text-secondary uppercase tracking-widest">Community Member</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-zinc-900 dark:text-dark-text-primary">{entry.count}</div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-dark-text-secondary uppercase tracking-widest">Verified Foods</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const FoodPage = ({ onNavigate, onBack, allIngredients }: { onNavigate: (page: string, params?: any) => void, onBack: () => void, allIngredients: Ingredient[] }) => {
  const [verifiedProducts, setVerifiedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'healthiest' | 'unhealthiest' | 'alphabetical'>('newest');
  const [activeDiet, setActiveDiet] = useState<string | null>(null);

  const DIETS = [
    { id: 'vegan', name: 'Vegan', avoid: ['milk', 'egg', 'honey', 'meat', 'beef', 'pork', 'chicken', 'fish', 'gelatin', 'whey', 'casein', 'lactose', 'butter', 'cream', 'lard', 'tallow'] },
    { id: 'gluten-free', name: 'Gluten-Free', avoid: ['wheat', 'barley', 'rye', 'malt', 'brewer\'s yeast', 'seitan', 'triticale'] },
    { id: 'keto', name: 'Keto', avoid: ['sugar', 'flour', 'wheat', 'corn', 'rice', 'potato', 'starch', 'honey', 'syrup', 'dextrose', 'maltodextrin'] },
    { id: 'paleo', name: 'Paleo', avoid: ['wheat', 'corn', 'rice', 'potato', 'starch', 'soy', 'bean', 'lentil', 'peanut', 'milk', 'cheese', 'yogurt', 'sugar', 'syrup'] },
  ];

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToProducts((products) => {
      setVerifiedProducts(products);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    // 0. Filter by confirmed status
    let result = verifiedProducts.filter(p => p.status === 'confirmed');

    // 1. Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.brand.toLowerCase().includes(query)
      );
    }

    // 2. Diet filter
    if (activeDiet) {
      const diet = DIETS.find(d => d.id === activeDiet);
      if (diet) {
        result = result.filter(product => {
          const ingredients = product.ingredientsRaw.toLowerCase();
          return !diet.avoid.some(keyword => ingredients.includes(keyword));
        });
      }
    }

    // 3. Pre-calculate scores for sorting to avoid redundant calculations
    const scoreMap = new Map<string, number>();
    const getLiveScore = (p: Product) => {
      if (scoreMap.has(p.barcode)) return scoreMap.get(p.barcode)!;
      
      let score = p.analysis?.overallScore || 0;
      if (p.analysis?.ingredients) {
        const refreshed = p.analysis.ingredients.map(ing => {
          const dbIng = allIngredients.find(i => i.id === ing.id);
          return dbIng ? { ...ing, score: dbIng.score } : ing;
        });
        score = calculateOverallScore(refreshed);
      }
      scoreMap.set(p.barcode, score);
      return score;
    };

    // 4. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'healthiest':
          return getLiveScore(b) - getLiveScore(a);
        case 'unhealthiest':
          return getLiveScore(a) - getLiveScore(b);
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'newest':
        default:
          return (b.scannedAt || 0) - (a.scannedAt || 0);
      }
    });

    return result;
  }, [verifiedProducts, searchQuery, sortBy, activeDiet, allIngredients]);

  return (
    <div className="space-y-8 pt-safe">
      <header className="flex items-center justify-between pt-6">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 dark:text-dark-text-secondary">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-dark-text-primary">Verified Food</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => getAllProducts(true)} 
            className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-full transition-colors"
            title="Refresh Library"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </header>

      {verifiedProducts.length > 0 && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your verified food..."
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-dark-surface border border-zinc-200 dark:border-dark-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-dark-text-primary shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              <Filter size={16} className="text-zinc-400 shrink-0" />
              <button 
                onClick={() => setActiveDiet(null)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                  !activeDiet 
                    ? "bg-emerald-500 text-white border-emerald-500" 
                    : "bg-white dark:bg-dark-surface text-zinc-600 dark:text-dark-text-secondary border-zinc-200 dark:border-dark-border"
                )}
              >
                All Diets
              </button>
              {DIETS.map(diet => (
                <button 
                  key={diet.id}
                  onClick={() => setActiveDiet(diet.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                    activeDiet === diet.id
                      ? "bg-emerald-500 text-white border-emerald-500" 
                      : "bg-white dark:bg-dark-surface text-zinc-600 dark:text-dark-text-secondary border-zinc-200 dark:border-dark-border"
                  )}
                >
                  {diet.name}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'Item' : 'Items'}
              </span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-zinc-600 dark:text-dark-text-secondary focus:outline-none cursor-pointer"
              >
                <option value="newest">Sort: Newest</option>
                <option value="healthiest">Sort: Healthiest</option>
                <option value="unhealthiest">Sort: Least Healthy</option>
                <option value="alphabetical">Sort: A-Z</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-zinc-200 dark:border-dark-border border-t-zinc-900 dark:border-t-dark-text-primary rounded-full animate-spin" />
        </div>
      ) : verifiedProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredAndSortedProducts.length > 0 ? (
            filteredAndSortedProducts.map(product => (
              <ProductListItem 
                key={product.barcode}
                product={product}
                allIngredients={allIngredients}
                onClick={() => onNavigate('product', { product })}
              />
            ))
          ) : (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 bg-zinc-50 dark:bg-dark-surface rounded-full flex items-center justify-center mx-auto text-zinc-300">
                <Search size={32} />
              </div>
              <p className="text-zinc-500 dark:text-dark-text-secondary text-sm font-medium">No results found for "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-emerald-600 dark:text-emerald-400 text-sm font-bold"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 space-y-4">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-dark-surface rounded-full flex items-center justify-center mx-auto text-zinc-300 dark:text-dark-text-secondary">
            <Package size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-zinc-900 dark:text-dark-text-primary">No Foods Found</h3>
            <p className="text-sm text-zinc-500 dark:text-dark-text-secondary max-w-[240px] mx-auto">
              Scan products to add them to your library. Your history and verified items will appear here.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('scan')}
            className="bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-2xl font-bold text-sm"
          >
            Start Scanning
          </button>
        </div>
      )}
    </div>
  );
};

const SettingsPage = ({ 
  theme, 
  onThemeToggle, 
  onBack, 
  onNavigate,
  ingredients, 
  onRefreshIngredients,
  isSyncing,
  setIsSyncing,
  handleSyncData,
  message,
  setMessage,
  isAdmin
}: { 
  theme: 'light' | 'dark', 
  onThemeToggle: () => void, 
  onBack: () => void,
  onNavigate: (page: string, params?: any) => void,
  ingredients: Ingredient[],
  onRefreshIngredients: (force?: boolean) => Promise<void>,
  isSyncing: boolean,
  setIsSyncing: (syncing: boolean) => void,
  handleSyncData: (force?: boolean, silent?: boolean, skipAI?: boolean) => Promise<void>,
  message: { text: string, type: 'success' | 'error' } | null,
  setMessage: (msg: { text: string, type: 'success' | 'error' } | null) => void,
  isAdmin: boolean
}) => {
  const [newIngredientName, setNewIngredientName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isQuickUpdating, setIsQuickUpdating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const stats = useMemo(() => {
    const totalIngredients = ingredients.length;
    const totalStudies = ingredients.reduce((acc, ing) => acc + (ing.studies?.length || 0), 0);
    
    // Calculate distribution
    const distribution: Record<number, number> = {};
    ingredients.forEach(ing => {
      const count = ing.studies?.length || 0;
      distribution[count] = (distribution[count] || 0) + 1;
    });
    
    // Sort distribution by study count
    const sortedDistribution = Object.entries(distribution)
      .map(([count, num]) => ({ count: parseInt(count), num }))
      .sort((a, b) => a.count - b.count);

    return { totalIngredients, totalStudies, sortedDistribution };
  }, [ingredients]);

  const handleGenerateIngredient = async () => {
    if (!newIngredientName.trim()) return;
    setIsGenerating(true);
    setMessage(null);
    try {
      const ingredientData = await generateIngredientDataWithAI(newIngredientName);
      
      // Fallback for ID if missing but name is present
      if (!ingredientData.id && ingredientData.name) {
        ingredientData.id = ingredientData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      
      if (!ingredientData.id || !ingredientData.name) {
        throw new Error("AI returned invalid data format");
      }

      await saveIngredient(ingredientData);
      
      // Reload local cache
      await onRefreshIngredients();
      
      setMessage({ text: `Successfully researched and added ${ingredientData.name}!`, type: 'success' });
      setNewIngredientName('');
      triggerHaptic('success');
    } catch (error: any) {
      console.error("Failed to generate ingredient:", error);
      const msg = error?.message || "Unknown error";
      setMessage({ 
        text: msg.includes("403") || msg.includes("Forbidden") || msg.includes("API Key")
          ? "AI Connection Failed. This is likely due to API key restrictions. Use 'Fix API Key' in the scanner error screen."
          : "Failed to generate: " + msg, 
        type: 'error' 
      });
      triggerHaptic('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickUpdate = async () => {
    setIsQuickUpdating(true);
    setMessage(null);
    try {
      // 1. Find ingredients with exactly 1 study
      const candidates = ingredients.filter(ing => ing && (ing.studies?.length || 0) === 1);
      
      if (candidates.length === 0) {
        setMessage({ text: "No ingredients found with exactly 1 study.", type: 'error' });
        return;
      }
      
      // 2. Pick a random one
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      
      // 3. Update with AI
      const updatedIngredient = await generateIngredientDataWithAI(target.name, target.studies?.length || 0);
      
      // Ensure the id remains the same
      const ingredientWithId = { ...updatedIngredient, id: target.id };
      
      // 4. Save
      await saveIngredient(ingredientWithId);
      
      // 5. Reload local cache
      await onRefreshIngredients();
      
      setMessage({ text: `Successfully updated ${target.name}! It now has ${updatedIngredient.studies?.length || 0} studies.`, type: 'success' });
      triggerHaptic('success');
    } catch (error: any) {
      console.error("Failed to quick update ingredient:", error);
      const msg = error?.message || "Unknown error";
      setMessage({ 
        text: msg.includes("403") || msg.includes("Forbidden") || msg.includes("API Key")
          ? "AI Connection Failed. This is likely due to API key restrictions. Use 'Fix API Key' in the scanner error screen."
          : "Failed to update: " + msg, 
        type: 'error' 
      });
      triggerHaptic('error');
    } finally {
      setIsQuickUpdating(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    setIsCleaning(true);
    setMessage(null);
    try {
      // Group by name
      const groups: Record<string, Ingredient[]> = {};
      ingredients.forEach(ing => {
        const name = ing.name.toLowerCase().trim();
        if (!groups[name]) groups[name] = [];
        groups[name].push(ing);
      });

      let deletedCount = 0;
      for (const name in groups) {
        const group = groups[name];
        if (group.length > 1) {
          // Sort by study count descending
          group.sort((a, b) => (b.studies?.length || 0) - (a.studies?.length || 0));
          
          // Keep the first one, delete the rest
          const toDelete = group.slice(1);
          for (const ing of toDelete) {
            await deleteIngredient(ing.id);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        await onRefreshIngredients();
        setMessage({ text: `Successfully cleaned up ${deletedCount} duplicate ingredients.`, type: 'success' });
      } else {
        setMessage({ text: "No duplicate ingredients found.", type: 'success' });
      }
    } catch (error: any) {
      console.error("Failed to cleanup duplicates:", error);
      setMessage({ text: "Failed to cleanup: " + error.message, type: 'error' });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-8 pt-safe">
      <div className="flex items-center gap-4 pt-6">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-dark-text-primary transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-dark-text-primary">Settings</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-dark-surface p-6 rounded-[2rem] border border-zinc-200 dark:border-dark-border shadow-sm space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-900 dark:text-dark-text-primary">Data Management</h3>
              <p className="text-xs text-zinc-500 dark:text-dark-text-secondary">Update your saved foods with the latest ingredient research and ratings. This will re-analyze all your saved products.</p>
            </div>
            <button
              onClick={() => handleSyncData()}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-300 text-white rounded-2xl font-semibold transition-colors shadow-lg shadow-emerald-500/20"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  <span>Syncing Data...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={20} />
                  <span>Sync Cloud Data</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-6 border-t border-zinc-100 dark:border-dark-border space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-900 dark:text-dark-text-primary">AI Ingredient Generator</h3>
              <p className="text-xs text-zinc-500 dark:text-dark-text-secondary">Type an ingredient name, and AI will research it, format it, and add it directly to your database.</p>
            </div>
            {isAdmin ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={newIngredientName}
                  onChange={(e) => setNewIngredientName(e.target.value)}
                  placeholder="e.g. Red 40, Stevia, MSG"
                  className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-dark-bg border border-zinc-200 dark:border-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-dark-text-primary"
                />
                <button 
                  onClick={handleGenerateIngredient}
                  disabled={isGenerating || !newIngredientName.trim()}
                  className="px-6 py-3 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {isGenerating ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Researching...</>
                  ) : (
                    'Research & Add'
                  )}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium italic">Ingredient research is restricted to administrators.</p>
              </div>
            )}
            {message && (
              <div className={`p-3 rounded-xl text-xs font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                {message.text}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-[2rem] border border-zinc-200 dark:border-dark-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-900 dark:text-dark-text-primary">Quick Update</h3>
              <p className="text-xs text-zinc-500 dark:text-dark-text-secondary">Picks a random ingredient with only 1 study and updates it with AI.</p>
            </div>
            {isAdmin && (
              <button 
                onClick={handleQuickUpdate}
                disabled={isQuickUpdating}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {isQuickUpdating ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Updating...</>
                ) : (
                  'Update Random'
                )}
              </button>
            )}
          </div>

          <div className="pt-6 border-t border-zinc-100 dark:border-dark-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-900 dark:text-dark-text-primary">Cleanup Duplicates</h3>
              <p className="text-xs text-zinc-500 dark:text-dark-text-secondary">Removes duplicate ingredients, keeping the ones with the most research.</p>
            </div>
            {isAdmin && (
              <button 
                onClick={handleCleanupDuplicates}
                disabled={isCleaning}
                className="w-full sm:w-auto px-6 py-3 bg-zinc-100 dark:bg-dark-bg text-zinc-900 dark:text-dark-text-primary text-sm font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {isCleaning ? (
                  <><div className="w-4 h-4 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin"></div> Cleaning...</>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Cleanup</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-[2rem] border border-zinc-200 dark:border-dark-border shadow-sm space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-zinc-900 dark:text-dark-text-primary">Database Statistics</h3>
                <p className="text-xs text-zinc-500 dark:text-dark-text-secondary">Current research coverage across the global ingredient database.</p>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => onRefreshIngredients(true)}
                  className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors"
                  title="Force Refresh Data"
                >
                  <RefreshCw size={18} />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 dark:bg-dark-bg p-4 rounded-2xl border border-zinc-100 dark:border-dark-border">
                <div className="flex items-center gap-2 mb-1">
                  <Database size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-dark-text-secondary">Ingredients</span>
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-dark-text-primary">{stats.totalIngredients}</p>
              </div>
              
              <div className="bg-zinc-50 dark:bg-dark-bg p-4 rounded-2xl border border-zinc-100 dark:border-dark-border">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={14} className="text-blue-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-dark-text-secondary">Studies</span>
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-dark-text-primary">{stats.totalStudies}</p>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <div className="flex gap-3">
                <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                  Average of <span className="font-bold">{(stats.totalStudies / (stats.totalIngredients || 1)).toFixed(1)}</span> scientific studies per ingredient. We prioritize high-quality peer-reviewed research for all safety ratings.
                </p>
              </div>
            </div>

            {/* Study Distribution */}
            <div className="pt-4 border-t border-zinc-100 dark:border-dark-border space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-dark-text-secondary">Research Distribution</h4>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-dark-text-secondary">Ingredients</span>
              </div>
              <div className="space-y-2.5">
                {stats.sortedDistribution.map(({ count, num }) => (
                  <div key={count} className="flex items-center gap-3">
                    <div className="w-16 text-[10px] font-bold text-zinc-500 dark:text-dark-text-secondary whitespace-nowrap">
                      {count} {count === 1 ? 'Study' : 'Studies'}
                    </div>
                    <div className="flex-1 h-2 bg-zinc-100 dark:bg-dark-bg rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(num / stats.totalIngredients) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full",
                          count === 0 ? "bg-zinc-300 dark:bg-zinc-700" : 
                          count < 3 ? "bg-amber-400" : "bg-emerald-500"
                        )}
                      />
                    </div>
                    <div className="w-8 text-right text-[10px] font-bold text-zinc-900 dark:text-dark-text-primary">
                      {num}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Research Ingredients */}
            <div className="pt-4 border-t border-zinc-100 dark:border-dark-border space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-dark-text-secondary">Low Research Ingredients</h4>
              <div className="flex flex-wrap gap-2">
                {ingredients
                  .filter(ing => (ing.studies?.length || 0) <= 1)
                  .sort((a, b) => (a.studies?.length || 0) - (b.studies?.length || 0))
                  .slice(0, 15)
                  .map((ing, idx) => (
                    <button 
                      key={`${ing.id}-${idx}`}
                      onClick={() => onNavigate('detail', { id: ing.id, ingredient: ing })}
                      className="px-2 py-1 bg-zinc-50 dark:bg-dark-bg border border-zinc-100 dark:border-dark-border rounded-lg text-[10px] font-medium text-zinc-600 dark:text-dark-text-secondary hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center gap-1.5"
                    >
                      <span>{ing.name}</span>
                      <span className="text-[8px] opacity-50">({ing.studies?.length || 0})</span>
                    </button>
                  ))
                }
                {ingredients.filter(ing => (ing.studies?.length || 0) <= 1).length > 15 && (
                  <span className="text-[10px] text-zinc-400 dark:text-dark-text-secondary self-center italic">
                    + {ingredients.filter(ing => (ing.studies?.length || 0) <= 1).length - 15} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-[2rem] border border-zinc-200 dark:border-dark-border shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-900 dark:text-dark-text-primary">Dark Mode</h3>
              <p className="text-xs text-zinc-500 dark:text-dark-text-secondary">Toggle between light and dark themes</p>
            </div>
            <button 
              onClick={onThemeToggle}
              className={cn(
                "w-14 h-8 rounded-full transition-colors relative",
                theme === 'dark' ? "bg-white" : "bg-zinc-200 dark:bg-dark-surface"
              )}
            >
              <div className={cn(
                "absolute top-1 w-6 h-6 rounded-full shadow-sm transition-all",
                theme === 'dark' ? "left-7 bg-black" : "left-1 bg-white"
              )} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SupportPage = ({ onBack }: { onBack: () => void }) => {
  const [supportType, setSupportType] = useState<'one-time' | 'monthly'>('one-time');

  const oneTimeTiers = [
    { amount: '$3', label: 'Supporter', icon: <Heart size={18} /> },
    { amount: '$5', label: 'Contributor', icon: <Activity size={18} /> },
    { amount: '$10', label: 'Champion', icon: <Sparkles size={18} /> }
  ];

  const monthlyTiers = [
    { amount: '$2', label: 'Member', icon: <ShieldCheck size={18} /> },
    { amount: '$5', label: 'Sponsor', icon: <Trophy size={18} /> },
    { amount: '$10', label: 'Champion', icon: <Sparkles size={18} /> }
  ];

  const activeTiers = supportType === 'one-time' ? oneTimeTiers : monthlyTiers;

  return (
    <div className="space-y-8 pt-safe">
      <header className="flex items-center justify-between pt-6">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 dark:text-dark-text-secondary">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-dark-text-primary">Support the Project</h1>
        <div className="w-10" />
      </header>

      <div className="space-y-8">
        <div className="bg-white dark:bg-dark-surface p-8 rounded-[2.5rem] text-center space-y-4 border border-zinc-200 dark:border-dark-border shadow-sm">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
            <Heart className="text-rose-600 dark:text-rose-400 fill-rose-600 dark:fill-rose-400" size={32} />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Mission-Driven & Community-Funded</h2>
            <p className="text-zinc-500 dark:text-dark-text-secondary text-sm leading-relaxed">
              IngrediScore was founded on the principle that health transparency should be accessible to everyone. Our goal is to provide a comprehensive food analysis tool with zero paywalls and unrestricted access to ingredient research.
            </p>
            <div className="pt-2">
              <p className="text-zinc-400 dark:text-zinc-500 text-[11px] uppercase tracking-widest font-bold">
                Your support helps maintain and grow the project
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex p-1 bg-zinc-100 dark:bg-dark-surface rounded-2xl border border-zinc-200 dark:border-dark-border">
            <button 
              onClick={() => setSupportType('one-time')}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-bold transition-all",
                supportType === 'one-time' ? "bg-white dark:bg-dark-bg text-zinc-900 dark:text-white shadow-sm" : "text-zinc-400"
              )}
            >
              One-time
            </button>
            <button 
              onClick={() => setSupportType('monthly')}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-bold transition-all",
                supportType === 'monthly' ? "bg-white dark:bg-dark-bg text-zinc-900 dark:text-white shadow-sm" : "text-zinc-400"
              )}
            >
              Monthly
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold px-2">
              {supportType === 'one-time' ? 'Choose a Donation Amount' : 'Choose a Subscription Tier'}
            </h3>
            
            <div className="grid gap-3">
              {activeTiers.map((tier, i) => (
                <button 
                  key={i}
                  className="w-full bg-white dark:bg-dark-surface p-5 rounded-2xl border border-zinc-100 dark:border-dark-border flex items-center justify-between group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-50 dark:bg-dark-bg rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                      {tier.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-zinc-900 dark:text-dark-text-primary">{tier.label}</p>
                      <p className="text-xs text-zinc-400">{supportType === 'one-time' ? 'One-time donation' : 'Recurring monthly'}</p>
                    </div>
                  </div>
                  <div className="bg-zinc-100 dark:bg-white dark:text-black px-4 py-2 rounded-xl text-sm font-bold text-zinc-900">
                    {tier.amount}{supportType === 'monthly' && '/mo'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-zinc-50 dark:bg-dark-surface/50 rounded-3xl border border-dashed border-zinc-200 dark:border-dark-border text-center space-y-3">
          <p className="text-xs text-zinc-500 dark:text-dark-text-secondary leading-relaxed italic">
            "Our commitment is simple: provide the highest quality health data at no cost to the user. Your support ensures we can keep the servers running and the information free for all."
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">— Founder of IngrediScore</p>
        </div>
      </div>
    </div>
  );
};

const AboutPage = ({ onBack }: { onBack: () => void }) => (
  <div className="space-y-8 pt-safe">
    <header className="flex items-center justify-between pt-6">
      <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 dark:text-dark-text-secondary">
        <ChevronLeft size={24} />
      </button>
      <h1 className="text-xl font-bold text-zinc-900 dark:text-dark-text-primary">About IngrediScore</h1>
      <div className="w-10" />
    </header>
    <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-zinc-600 dark:text-dark-text-secondary text-sm leading-relaxed">
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-dark-text-primary">Our Mission</h2>
        <p>
          IngrediScore is a community-powered platform dedicated to providing clear, evidence-based information about food ingredients. We believe that health transparency shouldn't be a luxury or a mystery. By combining human clinical research with modern AI, we've built a "Shared Brain" that helps consumers navigate the complex world of food additives.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-dark-text-primary">The Shared Brain</h2>
        <p>
          Unlike traditional apps that rely on static, proprietary databases, IngrediScore grows with its users. Every time a member scans a new product or uses our AI to research an ingredient, the results are verified and added to our global library. This shared database ensures that once an ingredient is researched, the entire community benefits from that knowledge forever.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-dark-text-primary">Study Relevance & Scope</h2>
        <p>
          A critical part of our methodology is understanding that scientific evidence comes in many forms. While we prioritize studies that directly test a specific ingredient, we also incorporate research where the findings are directly applicable to that ingredient.
        </p>
        <p className="bg-zinc-50 dark:bg-dark-bg p-4 rounded-2xl border border-zinc-100 dark:border-dark-border italic">
          "Not every study cited will have the ingredient's name in the title. We often look at research on active chemical components, specific metabolic pathways, or broader chemical classes (like azo dyes or emulsifiers) when the biological mechanism is identical to the ingredient in question."
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-dark-text-primary">Scoring Methodology</h2>
        <p>
          Our 1-10 health score is derived from a hierarchy of evidence, prioritizing research that provides the most reliable insights into human health:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>7-10 (Beneficial):</strong> Strong evidence of positive health outcomes or essential nutritional value in humans.</li>
          <li><strong>4-6 (Neutral/Mixed):</strong> Evidence is either neutral, conflicting, or the ingredient is considered "generally recognized as safe" (GRAS) but lacks significant health benefits.</li>
          <li><strong>1-3 (Concerning):</strong> Peer-reviewed evidence of potential harm, inflammatory response, or significant long-term health risks in human populations.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-dark-text-primary">Evidence Hierarchy</h2>
        <p>
          We prioritize human data over animal or in vitro studies. Our primary sources include:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Systematic Reviews & Meta-analyses (The Gold Standard)</li>
          <li>Randomized Controlled Trials (RCTs)</li>
          <li>Large-scale Epidemiological Cohort Studies</li>
          <li>Official safety assessments from WHO, IARC, and major health agencies</li>
        </ul>
      </section>
    </div>
  </div>
);

// --- Constants & Utilities ---

const NON_INGREDIENT_TERMS = [
  'contains', 'may contain', 'allergen', 'allergens', 'information', 'facility',
  'processed', 'gluten free', 'vegan', 'non-gmo', 'gmo free', 'certified',
  'ingredients', 'ingredient', 'other ingredients'
];

// --- Main App ---

console.log('App.tsx loading...');

export default function App() {
  console.log('App component rendering...');
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState<any>(null);
  const [ingredientsLoaded, setIngredientsLoaded] = useState(false);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>(staticIngredients);
  const [readSaverMode, setReadSaverMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('read_saver_mode') === 'true';
    }
    return false;
  });
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(quotaState.isExceeded);

  // Check for quota status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (quotaState.isExceeded !== isQuotaExceeded) {
        setIsQuotaExceeded(quotaState.isExceeded);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isQuotaExceeded]);
  const [globalStats, setGlobalStats] = useState<{ ingredients: number, products: number } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('global_stats');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });

  const handleToggleReadSaver = useCallback(() => {
    setReadSaverMode(prev => {
      const newVal = !prev;
      localStorage.setItem('read_saver_mode', newVal.toString());
      return newVal;
    });
  }, []);

  const refreshIngredients = useCallback(async (force: boolean = false) => {
    console.log(`Refreshing ingredients (force: ${force})...`);
    const loaded = await loadIngredients(force);
    console.log(`Setting allIngredients state with ${loaded.length} items.`);
    setAllIngredients([...loaded]);
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const s = await getGlobalStats();
      setGlobalStats(s);
      localStorage.setItem('global_stats', JSON.stringify(s));
    } catch (error) {
      console.error("Failed to refresh global stats", error);
    }
  }, []);


  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved as 'light' | 'dark';
    }
    return 'light';
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const isAdmin = useMemo(() => user && ADMIN_EMAILS.includes(user.email || ''), [user]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const hasAutoSyncedRef = useRef(false);

  // Migration no longer needed after reverting to Firebase

  const handleSyncData = useCallback(async (force: boolean = false, silent: boolean = false, skipAI: boolean = false) => {
    const LAST_GLOBAL_SYNC_KEY = 'global_sync_timestamp';
    const SYNC_THROTTLE = 60 * 60 * 1000; // 1 hour
    const now = Date.now();
    const lastGlobalSync = parseInt(localStorage.getItem(LAST_GLOBAL_SYNC_KEY) || '0');

    // Skip silent sync if it's been less than 1 hour since last sync
    if (silent && !force && (now - lastGlobalSync < SYNC_THROTTLE)) {
      console.log("Skipping silent sync: last sync was less than 1 hour ago.");
      return;
    }

    if (!silent) setIsSyncing(true);
    if (!silent) setSyncMessage(null);
    try {
      addLog(`handleSyncData: Starting sync (force: ${force}, silent: ${silent}, skipAI: ${skipAI})...`);
      
      // Only force refresh ingredients if explicitly requested
      await refreshIngredients(force);
      
      // Refresh global stats
      await refreshStats();
      
      addLog(`handleSyncData: Fetching products from Firestore (force=${force})...`);
      const products = await getAllProducts(force);
      addLog(`handleSyncData: Received ${products.length} products from getAllProducts.`);
      
      // Update sync timestamp
      localStorage.setItem(LAST_GLOBAL_SYNC_KEY, now.toString());

      if (products.length === 0) {
        addLog("handleSyncData: No new products found to sync.");
        if (!silent) setSyncMessage({ text: "No new products found to sync. Try scanning some products first!", type: 'success' });
        return;
      }
      
      // Only re-analyze products if they were actually fetched from remote (incremental sync)
      // or if force is true.
      let updatedCount = 0;
      for (const product of products) {
        // We could add logic here to check if the product actually needs re-analysis
        // For now, we'll just re-analyze if force is true or if it's a small number of products
        if (force || products.length < 20) {
          await reAnalyzeProduct(product, skipAI);
          updatedCount++;
        }
      }
      
      if (!silent) {
        const msg = updatedCount > 0 
          ? `Successfully synced ${updatedCount} products.`
          : `Sync complete. Found ${products.length} products.`;
        setSyncMessage({ text: msg, type: 'success' });
      }
    } catch (error: any) {
      console.error("Sync failed:", error);
      if (!silent) setSyncMessage({ text: "Sync failed: " + error.message, type: 'error' });
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, [refreshIngredients, refreshStats]);

  useEffect(() => {
    if (syncMessage) {
      const timer = setTimeout(() => {
        setSyncMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [syncMessage]);

  useEffect(() => {
    // Safety timeout for ingredient loading
    const safetyTimeout = setTimeout(() => {
      if (!ingredientsLoaded) {
        addLog("App: Ingredient loading safety timeout reached. Proceeding...");
        setIngredientsLoaded(true);
      }
    }, 10000);

    // Initial load
    const init = async () => {
      addLog(`App: Initializing for user: ${user?.email || 'Anonymous'}`);
      try {
        await testConnection();
        await refreshStats();
        await refreshIngredients();
        
        // Automatically pull products from cloud on initialization
        addLog("App: Pulling products from cloud...");
        const products = await getAllProducts();
        
        // If they have products in the cloud, trigger a silent background re-analysis
        // to ensure scores are up-to-date with the latest ingredient database.
        // We only do this once per session to avoid excessive processing.
        if (products.length > 0 && !hasAutoSyncedRef.current) {
          hasAutoSyncedRef.current = true;
          addLog("App: Triggering silent background sync...");
          handleSyncData(false, true, true); // force=false, silent=true, skipAI=true
        }
        
        addLog("App: Initial stats and ingredients loaded.");
      } catch (e) {
        addLog(`App: Initial load error - ${e instanceof Error ? e.message : String(e)}`);
        console.error("Initial load failed", e);
      } finally {
        setIngredientsLoaded(true);
        clearTimeout(safetyTimeout);
      }
    };
    init();

    // Setup real-time subscription for ingredients
    // If Read Saver mode is on, we don't subscribe to real-time updates
    // to save Firestore reads. We only use the local cache.
    if (readSaverMode) {
      addLog("App: Read Saver mode is active. Skipping real-time ingredient subscription.");
      setIngredientsLoaded(true);
      clearTimeout(safetyTimeout);
      return;
    }

    // This will provide the initial data and keep it updated
    const unsubscribeIngredients = subscribeToIngredients((data) => {
      setAllIngredients(data);
      setIngredientsLoaded(true);
      clearTimeout(safetyTimeout);
    });

    return () => {
      unsubscribeIngredients();
      clearTimeout(safetyTimeout);
    };
  }, [refreshStats, refreshIngredients, user, readSaverMode]);
  
  // Navigation History
  const [history, setHistory] = useState<{page: string, params: any}[]>([]);

  // Scan State (Preserved across navigation)
  const [scanAnalysis, setScanAnalysis] = useState<ProductAnalysis | null>(null);
  const [scanCapturedImages, setScanCapturedImages] = useState<{ front: string | null; nutrition: string | null; ingredients: string | null }>({ front: null, nutrition: null, ingredients: null });
  const [scanBarcode, setScanBarcode] = useState<string | null>(null);
  const [scanName, setScanName] = useState('');
  const [scanBrand, setScanBrand] = useState('');
  const [scanType, setScanType] = useState<'barcode' | 'ingredients' | 'new-product-prompt' | 'capture-front' | 'capture-nutrition' | 'capture-ingredients' | null>('barcode');

  // Search State (Preserved across navigation)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<string | null>(null);
  const [searchSortBy, setSearchSortBy] = useState<'name' | 'score-desc' | 'score-asc' | 'studies-asc'>('name');

  const mainRef = React.useRef<HTMLElement>(null);

  const navigate = useCallback((page: string, params: any = null, isBack: boolean = false) => {
    if (!isBack) {
      setHistory(prev => [...prev, { page: currentPage, params: pageParams }]);
    }
    setCurrentPage(page);
    setPageParams(params);
    if (page === 'scan') {
      setScanType('barcode');
      setScanAnalysis(null);
      setScanCapturedImages({ front: null, nutrition: null, ingredients: null });
      setScanBarcode(null);
      setScanName('');
      setScanBrand('');
    }
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
    setIsMenuOpen(false);
    setShowSignOutConfirm(false);
  }, [currentPage, pageParams]);

  const goBack = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) {
        setCurrentPage('home');
        setPageParams(null);
        return [];
      }
      const newHistory = [...prev];
      const last = newHistory.pop()!;
      setCurrentPage(last.page);
      setPageParams(last.params);
      if (mainRef.current) {
        mainRef.current.scrollTo(0, 0);
      }
      setIsMenuOpen(false);
      return newHistory;
    });
  }, []);

  // Check for Auth on mount
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [dbStatus, setDbStatus] = useState<'testing' | 'ok' | 'error'>('testing');
  const [dbError, setDbError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<'testing' | 'ok' | 'error'>('testing');
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    // Test Firebase connection on mount
    testFirebaseConnection()
      .then(() => {
        setDbStatus('ok');
        setDbError(null);
      })
      .catch(err => {
        console.warn("Initial Firebase connection test failed:", err);
        setDbStatus('error');
        setDbError(err?.message || String(err));
      });
    
    // Test AI connection (simple ping)
    safeGenerateContent({
      model: "gemini-3-flash-preview",
      contents: "ping",
      config: { maxOutputTokens: 1 }
    })
      .then(() => {
        setAiStatus('ok');
        setAiError(null);
      })
      .catch(err => {
        let errorMessage = "Unknown Error";
        try {
          if (err?.message) {
            errorMessage = err.message;
          } else if (typeof err === 'string') {
            errorMessage = err;
          } else {
            errorMessage = JSON.stringify(err, Object.getOwnPropertyNames(err));
          }
        } catch (e) {
          errorMessage = String(err);
        }
        
        if (errorMessage === "{}" || errorMessage === "{}") {
          errorMessage = `Empty error object of type: ${typeof err}. Keys: ${Object.keys(err).join(', ')}. String: ${String(err)}`;
        }

        console.warn("!!! AI CONNECTION FAILED !!!:", errorMessage, err);
        setAiStatus('error');
        setAiError(errorMessage);
      });

    // Safety timeout for auth loading
    const safetyTimeout = setTimeout(() => {
      if (isAuthLoading) {
        addLog("App: Auth loading safety timeout reached. Proceeding...");
        setIsAuthLoading(false);
      }
    }, 8000);

    // Set up Firebase Auth listener
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (currentUser) => {
      setUser(currentUser as User | null);
      if (currentUser) {
        syncUserProfile(currentUser as User);
      } else {
        // Reset auto-sync flag on sign-out so it can trigger again on next sign-in
        hasAutoSyncedRef.current = false;
      }
      setIsAuthLoading(false);
      clearTimeout(safetyTimeout);
    });

    return () => {
      unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (isAuthProcessing) return;
    
    setIsAuthProcessing(true);
    setAuthError(null);
    
    try {
      const loggedInUser = await signInWithGoogle();
      if (loggedInUser) {
        setUser(loggedInUser);
        addLog("App: Sign-in successful, user state updated.");
      }
    } catch (error: any) {
      // Wait a moment to see if onAuthStateChanged fires anyway (common in iframes/mobile)
      // We'll check multiple times over 4 seconds
      for (let i = 0; i < 4; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const currentUser = getFirebaseAuth().currentUser;
        if (currentUser) {
          console.log("Auth: User detected after error check " + (i+1) + ", manually updating state.");
          setUser(currentUser as User);
          setIsAuthProcessing(false);
          return;
        }
      }

      console.error("Sign in failed", error);
      
      // If it's a cancellation error, we might not want to show a scary red box immediately
      // if the user just closed the popup. But if they are stuck, we should.
      let message = error.message || "Sign in failed. Please check your Firebase/Google configuration.";
      
      if (error.code === 'auth/popup-blocked') {
        message = "The sign-in popup was blocked by your browser. Please allow popups for this site and try again.";
      } else if (error.code === 'auth/unauthorized-domain') {
        message = "This domain is not authorized for Firebase Authentication. Please add '" + window.location.hostname + "' to the authorized domains in your Firebase Console.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = "The sign-in popup was closed before completion. If you signed in, please wait a moment or refresh.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = "A previous sign-in request was still active. We've cleared it - please try signing in one more time.";
      } else if (error.code === 'auth/network-request-failed') {
        message = "A network error occurred. Please check your internet connection and try again.";
      }
      
      setAuthError(message);
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      navigate('home');
      setShowSignOutConfirm(false);
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  // Insight state
  const [insight, setInsight] = useState(currentInsight);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load facts from Firestore
  useEffect(() => {
    const loadFirestoreFacts = async () => {
      try {
        const firestoreFacts = await getRandomFacts(50);
        if (firestoreFacts.length > 0) {
          factPool = firestoreFacts.map(f => ({ fact: f.fact, category: f.category }));
          // If current insight is the default loading one, refresh it
          if (insight.fact === "Loading interesting food fact...") {
            const nextFact = getNextFact();
            setInsight(nextFact);
            currentInsight = nextFact;
          }
        }
      } catch (error) {
        console.error("Failed to load facts from Firestore", error);
      }
    };
    loadFirestoreFacts();
  }, []);

  const consumeInsight = React.useCallback(async () => {
    setIsRefreshing(true);
    
    // Try to get more facts if pool is getting low
    if (factQueue.length < 5) {
      try {
        const moreFacts = await getRandomFacts(20);
        if (moreFacts.length > 0) {
          const newFacts = moreFacts.map(f => ({ fact: f.fact, category: f.category }));
          // Add to pool and avoid duplicates
          const existingFacts = new Set(factPool.map(f => f.fact));
          newFacts.forEach(f => {
            if (!existingFacts.has(f.fact)) {
              factPool.push(f);
            }
          });
        }
      } catch (e) {
        console.warn("Could not fetch more facts from Firestore, using pool.");
      }
    }

    // Use setTimeout to allow the UI to show the spin state briefly
    setTimeout(() => {
      const nextFact = getNextFact();
      setInsight(nextFact);
      currentInsight = nextFact;
      setIsRefreshing(false);
    }, 150);
  }, [insight.fact]);

  // Refresh on return to home page
  const previousPage = React.useRef(currentPage);
  useEffect(() => {
    if (currentPage === 'home' && previousPage.current !== 'home') {
      consumeInsight();
    }
    previousPage.current = currentPage;
  }, [currentPage, consumeInsight]);

  const totalStudies = useMemo(() => {
    return allIngredients.reduce((acc, ing) => acc + (ing.studies?.length || 0), 0);
  }, [allIngredients]);

  if (!ingredientsLoaded) {
    return (
      <div className="min-h-dvh bg-zinc-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const renderPage = () => {
    console.log('renderPage', currentPage, pageParams);
    switch (currentPage) {
      case 'home': return (
        <HomePage 
          onNavigate={navigate} 
          insight={insight} 
          refreshInsight={consumeInsight} 
          isRefreshing={isRefreshing} 
          ingredients={allIngredients} 
          totalStudies={totalStudies} 
          dbStatus={dbStatus} 
          aiStatus={aiStatus} 
          aiError={aiError} 
          dbError={dbError}
          onSync={handleSyncData}
          isSyncing={isSyncing}
        />
      );
      case 'search': return (
        <SearchPage 
          onNavigate={navigate} 
          onBack={goBack}
          ingredients={allIngredients}
          preservedQuery={searchQuery}
          setPreservedQuery={setSearchQuery}
          preservedCategory={searchCategory}
          setPreservedCategory={setSearchCategory}
          preservedSortBy={searchSortBy}
          setPreservedSortBy={setSearchSortBy}
        />
      );
      case 'scan': return (
        <ScanPage 
          onNavigate={navigate} 
          onBack={goBack}
          ingredients={allIngredients}
          preservedAnalysis={scanAnalysis}
          setPreservedAnalysis={setScanAnalysis}
          preservedImages={scanCapturedImages}
          setPreservedImages={setScanCapturedImages}
          preservedBarcode={scanBarcode}
          setPreservedBarcode={setScanBarcode}
          preservedName={scanName}
          setPreservedName={setScanName}
          preservedBrand={scanBrand}
          setPreservedBrand={setScanBrand}
          preservedScanType={scanType}
          setPreservedScanType={setScanType}
          onRefreshIngredients={refreshIngredients}
          isAdmin={isAdmin}
        />
      );
      case 'detail': return <DetailPage id={pageParams?.id} ingredient={pageParams?.ingredient} onNavigate={navigate} onBack={goBack} ingredients={allIngredients} onRefreshIngredients={refreshIngredients} setSyncMessage={setSyncMessage} isAdmin={isAdmin} />;
      case 'product': return <ProductPage 
        product={pageParams?.product} 
        onNavigate={navigate} 
        onBack={goBack} 
        allIngredients={allIngredients} 
        onRefreshIngredients={refreshIngredients}
        onUpdateProduct={(updated) => {
          setPageParams(prev => ({ ...prev, product: updated }));
        }}
        isAdmin={isAdmin}
      />;
      case 'food': return <FoodPage onNavigate={navigate} onBack={goBack} allIngredients={allIngredients} />;
      case 'history': return <HistoryPage onNavigate={navigate} onBack={goBack} isSyncing={isSyncing} onSync={handleSyncData} allIngredients={allIngredients} user={user} />;
      case 'leaderboard': return <LeaderboardPage onBack={goBack} user={user} isAdmin={isAdmin} />;
      case 'about': return <AboutPage onBack={goBack} />;
      case 'support': return <SupportPage onBack={goBack} />;
      case 'settings': return (
        <SettingsPage 
          theme={theme} 
          onThemeToggle={() => setTheme(t => t === 'light' ? 'dark' : 'light')} 
          onBack={goBack} 
          onNavigate={navigate}
          ingredients={allIngredients} 
          onRefreshIngredients={refreshIngredients}
          isSyncing={isSyncing}
          setIsSyncing={setIsSyncing}
          handleSyncData={handleSyncData}
          message={syncMessage}
          setMessage={setSyncMessage}
          isAdmin={isAdmin}
        />
      );
      default: return (
        <HomePage 
          onNavigate={navigate} 
          insight={insight} 
          refreshInsight={consumeInsight} 
          isRefreshing={isRefreshing} 
          ingredients={allIngredients} 
          totalStudies={totalStudies} 
          dbStatus={dbStatus} 
          aiStatus={aiStatus} 
          aiError={aiError} 
          dbError={dbError}
          onSync={handleSyncData}
          isSyncing={isSyncing}
        />
      );
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-dvh bg-zinc-50 dark:bg-dark-bg flex items-center justify-center transition-colors">
        <div className="w-10 h-10 border-4 border-zinc-200 dark:border-dark-border border-t-zinc-900 dark:border-t-dark-text-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Removed mandatory sign-in block to allow unauthenticated access to shared database
  
  return (
    <div className="fixed inset-0 bg-zinc-50 dark:bg-dark-bg text-zinc-900 dark:text-dark-text-primary font-sans selection:bg-white selection:text-zinc-950 transition-colors duration-300 overflow-hidden">
      {/* Side Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => { setIsMenuOpen(false); setShowSignOutConfirm(false); }}
              className="fixed inset-0 bg-zinc-900/20 z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: "circOut" }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-white dark:bg-dark-surface z-[70] flex flex-col pt-safe border-l border-zinc-200 dark:border-dark-border"
            >
              <div className="p-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100 dark:border-dark-border">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-zinc-900 dark:bg-white rounded flex items-center justify-center">
                      <Barcode size={14} className="text-white dark:text-black" />
                    </div>
                    <h2 className="text-sm font-bold font-display uppercase tracking-widest dark:text-dark-text-primary">System Menu</h2>
                  </div>
                  <button 
                    onClick={() => { setIsMenuOpen(false); setShowSignOutConfirm(false); }} 
                    className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* User Profile / Sign In */}
                {user ? (
                  <div className="mb-8 p-3 bg-zinc-50 dark:bg-dark-bg/30 rounded-xl border border-zinc-100 dark:border-dark-border flex items-center gap-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded border border-zinc-200 dark:border-dark-border" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-zinc-200 dark:bg-dark-bg flex items-center justify-center text-zinc-500">
                        <Users size={16} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate dark:text-dark-text-primary">{user.displayName || 'Contributor'}</p>
                      <p className="text-[9px] text-zinc-400 dark:text-dark-text-secondary uppercase tracking-widest font-bold">Authorized Access</p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 p-4 bg-zinc-900 dark:bg-white rounded-2xl flex flex-col gap-3">
                    <p className="text-[10px] font-bold text-white dark:text-black uppercase tracking-widest text-center">Cloud Sync Disabled</p>
                    <button 
                      onClick={() => { setIsMenuOpen(false); handleSignIn(); }}
                      className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-3.5 h-3.5" />
                      Sign In
                    </button>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="flex-1 space-y-1">
                  {[
                    { id: 'about', label: 'About Project', icon: Info },
                    { id: 'history', label: 'Data History', icon: History },
                    { id: 'leaderboard', label: 'Contributors', icon: Trophy },
                    { id: 'support', label: 'Support Research', icon: Heart },
                    { id: 'settings', label: 'System Settings', icon: Settings },
                  ].map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => navigate(item.id)} 
                      className="flex items-center gap-3 w-full p-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-dark-text-secondary hover:bg-zinc-100 dark:hover:bg-dark-bg hover:text-zinc-900 dark:hover:text-white transition-all group"
                    >
                      <item.icon size={16} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white" />
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Footer Section */}
                <div className="mt-auto pt-6 border-t border-zinc-100 dark:border-dark-border space-y-4">
                  {user && (
                    <div className="space-y-2">
                      {showSignOutConfirm ? (
                        <div className="bg-zinc-50 dark:bg-dark-bg p-3 rounded-xl border border-zinc-200 dark:border-dark-border space-y-2">
                          <p className="text-[9px] font-bold text-zinc-600 dark:text-dark-text-secondary uppercase tracking-widest text-center">Terminate Session?</p>
                          <div className="flex gap-2">
                            <button 
                              onClick={handleSignOut}
                              className="flex-1 bg-zinc-100 dark:bg-white text-zinc-900 dark:text-black py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-white/90 transition-colors"
                            >
                              Confirm
                            </button>
                            <button 
                              onClick={() => setShowSignOutConfirm(false)}
                              className="flex-1 bg-white dark:bg-dark-surface text-zinc-500 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-zinc-200 dark:border-dark-border"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowSignOutConfirm(true)} 
                          className="flex items-center gap-3 w-full p-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      )}
                    </div>
                  )}
                  <div className="px-2">
                    <p className="text-[9px] text-zinc-400 dark:text-zinc-500 leading-relaxed font-mono uppercase tracking-tighter">
                      Build 1.1.0-STABLE<br />
                      Evidence-based analysis
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quota Warning */}
      {isQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between sticky top-0 z-[100]">
          <div className="flex items-center gap-2 text-amber-800 text-sm">
            <AlertCircle size={16} />
            <span>Firestore Quota Exceeded. The app is running in offline/cache-only mode.</span>
          </div>
          <button 
            onClick={() => {
              quotaState.isExceeded = false;
              setIsQuotaExceeded(false);
              localStorage.removeItem('firestore_quota_exceeded');
              localStorage.removeItem('firestore_quota_exceeded_time');
              window.location.reload();
            }}
            className="text-amber-900 font-medium text-sm hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content Area: Absolute shell for independent scrolling */}
      <main ref={mainRef} className="absolute inset-0 overflow-y-auto overscroll-none no-scrollbar pb-content">
        <div className="max-w-md mx-auto px-6">
          <ErrorBoundary>
            {renderPage()}
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile Nav Bar: Fixed to absolute bottom, background covers safe area */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-xl border-t border-zinc-200 dark:border-dark-border z-50 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="max-w-md mx-auto flex items-center justify-between px-2 h-16">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'search', label: 'Search', icon: Search },
            { id: 'scan', label: 'Scan', icon: Camera },
            { id: 'food', label: 'Food', icon: Package },
            { id: 'menu', label: 'Menu', icon: Menu, isMenu: true },
          ].map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => item.isMenu ? setIsMenuOpen(true) : navigate(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 transition-colors duration-200 min-w-[64px] h-full focus:outline-none select-none",
                  isActive ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-700"
                )}
              >
                <div className="p-1 transition-colors duration-200">
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-wider",
                  isActive ? "opacity-100" : "opacity-60"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sync Message Toast */}
      <AnimatePresence>
        {syncMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-6 right-6 z-[60]"
          >
            <div className={clsx(
              "p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 border",
              syncMessage.type === 'success' ? "bg-emerald-500 text-white border-emerald-400" : "bg-rose-500 text-white border-rose-400"
            )}>
              <div className="flex items-center gap-3">
                {syncMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <p className="text-sm font-bold">{syncMessage.text}</p>
              </div>
              <button onClick={() => setSyncMessage(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="fixed bottom-2 right-2 text-[8px] text-gray-400 opacity-20 pointer-events-none z-[100]">
        Build: ${Date.now()}
      </div>
    </div>
  );
}
