/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Brain, 
  Layers, 
  Trash2, 
  X, 
  CheckCircle2,
  Clock,
  Tag,
  Sparkles,
  ChevronDown,
  Moon,
  Sun,
  Activity,
  Download,
  Upload,
  Settings
} from 'lucide-react';

// --- Types ---
interface Card {
  id: string;
  content: string;
  cluster: string;
  createdAt: number;
  lastReviewed?: number;
  nextReview: number; // Timestamp
  interval: number; // Days
  ease: number; // Multiplier
}

interface Cluster {
  name: string;
  count: number;
  dueCount: number;
}

// --- Components ---

const SwipeableCard = ({ 
  card, 
  onSwipe, 
  isActive 
}: { 
  card: Card; 
  onSwipe: (direction: 'left' | 'right') => void;
  isActive: boolean;
  key?: React.Key;
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  if (!isActive) return null;

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 flex items-center justify-center p-6 touch-none"
    >
      <div className="w-full max-w-sm aspect-[3/4] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
        <div className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/50">
          {card.cluster}
        </div>
        <p className="text-3xl font-semibold text-slate-900 leading-[1.4] tracking-tight px-2">
          {card.content}
        </p>
        <div className="absolute bottom-10 flex gap-8 text-slate-400">
          <div className="flex flex-col items-center gap-1 text-red-500/40">
            <ChevronLeft size={24} />
            <span className="text-[9px] font-black uppercase tracking-widest">Forgot</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-emerald-500/40">
            <ChevronRight size={24} />
            <span className="text-[9px] font-black uppercase tracking-widest">Got it</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newCardText, setNewCardText] = useState('');
  const [newCardCluster, setNewCardCluster] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [viewingCards, setViewingCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'home' | 'review'>('home');
  const [clusterViewMode, setClusterViewMode] = useState<'detailed' | 'simple'>('detailed');
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [reviewHistory, setReviewHistory] = useState<Record<string, number>>({});
  const [showClusterDropdown, setShowClusterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowClusterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load from localStorage
  useEffect(() => {
    const savedCards = localStorage.getItem('recall_cards');
    const savedHistory = localStorage.getItem('recall_history');
    const savedTheme = localStorage.getItem('recall_theme');
    
    if (savedCards) {
      try {
        setCards(JSON.parse(savedCards));
      } catch (e) {
        console.error("Failed to load cards", e);
      }
    }
    
    if (savedHistory) {
      try {
        setReviewHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }

    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('recall_cards', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem('recall_history', JSON.stringify(reviewHistory));
  }, [reviewHistory]);

  useEffect(() => {
    localStorage.setItem('recall_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const clusters = useMemo(() => {
    const map: Record<string, { count: number; dueCount: number }> = {};
    const now = Date.now();
    cards.forEach(c => {
      if (!map[c.cluster]) {
        map[c.cluster] = { count: 0, dueCount: 0 };
      }
      map[c.cluster].count++;
      if (c.nextReview <= now) {
        map[c.cluster].dueCount++;
      }
    });
    return Object.entries(map).map(([name, stats]) => ({ 
      name, 
      count: stats.count, 
      dueCount: stats.dueCount 
    }));
  }, [cards]);

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardText.trim()) return;

    const cluster = newCardCluster.trim() || "General";
    
    const newCard: Card = {
      id: Math.random().toString(36).substr(2, 9),
      content: newCardText,
      cluster,
      createdAt: Date.now(),
      nextReview: Date.now(), // Due immediately
      interval: 1,
      ease: 2.5,
    };

    setCards(prev => [newCard, ...prev]);
    setNewCardText('');
    setNewCardCluster('');
    setIsAdding(false);
  };

  const startReview = (clusterName: string) => {
    const now = Date.now();
    const filtered = cards.filter(c => c.cluster === clusterName);
    
    // Prioritize due cards, then recently created cards
    const sorted = [...filtered].sort((a, b) => {
      const aDue = a.nextReview <= now;
      const bDue = b.nextReview <= now;
      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;
      return a.nextReview - b.nextReview;
    });

    const sessionCards = sorted.slice(0, 5);
    setViewingCards(sessionCards);
    setCurrentIndex(0);
    setViewMode('review');
  };

  const startRandomReview = () => {
    const now = Date.now();
    if (cards.length === 0) return;

    // Prioritize due cards across all clusters
    const sorted = [...cards].sort((a, b) => {
      const aDue = a.nextReview <= now;
      const bDue = b.nextReview <= now;
      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;
      return a.nextReview - b.nextReview;
    });

    // Take top 10 most due/soonest and pick 5 randomly from them for variety
    const pool = sorted.slice(0, 10);
    const sessionCards = [...pool].sort(() => 0.5 - Math.random()).slice(0, 5);
    
    setViewingCards(sessionCards);
    setCurrentIndex(0);
    setViewMode('review');
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    const currentCard = viewingCards[currentIndex];
    const isCorrect = direction === 'right';
    
    // Update card spaced repetition data
    setCards(prev => prev.map(c => {
      if (c.id === currentCard.id) {
        let newInterval = c.interval;
        let newEase = c.ease;
        
        if (isCorrect) {
          // Remembered: Increase interval
          newInterval = Math.ceil(c.interval * c.ease);
          newEase = Math.min(3.5, c.ease + 0.1);
        } else {
          // Forgot: Reset interval
          newInterval = 1;
          newEase = Math.max(1.3, c.ease - 0.2);
        }
        
        return {
          ...c,
          interval: newInterval,
          ease: newEase,
          lastReviewed: Date.now(),
          nextReview: Date.now() + newInterval * 24 * 60 * 60 * 1000,
        };
      }
      return c;
    }));

    // Update review history
    const today = new Date().toISOString().split('T')[0];
    setReviewHistory(prev => ({
      ...prev,
      [today]: (prev[today] || 0) + 1
    }));

    // Move to next card
    if (currentIndex < viewingCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // End of review
      setViewMode('home');
    }
  };

  const deleteCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const exportData = () => {
    const data = {
      cards,
      history: reviewHistory,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recall_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        let newCards: Card[] = [];
        let newHistory: Record<string, number> = {};

        if (Array.isArray(imported)) {
          newCards = imported;
        } else if (imported.cards && Array.isArray(imported.cards)) {
          newCards = imported.cards;
          newHistory = imported.history || {};
        } else {
          return;
        }

        // Basic validation
        const isValid = newCards.every(c => c.id && c.content && c.cluster);
        if (isValid) {
          setCards(newCards);
          if (Object.keys(newHistory).length > 0) {
            setReviewHistory(newHistory);
          }
        }
      } catch (err) {
        console.error("Import failed", err);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const heatmapData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      data.push({
        date: dateStr,
        count: reviewHistory[dateStr] || 0
      });
    }
    return data;
  }, [reviewHistory]);

  return (
    <div className={`h-screen w-full flex flex-col font-sans select-none overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`px-6 pt-14 pb-6 flex items-center justify-between sticky top-0 z-10 border-b transition-colors duration-500 ${isDarkMode ? 'bg-black/90 border-white/10' : 'bg-white/90 border-slate-100/50'} backdrop-blur-xl`}>
        <div>
          <h1 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Recall</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Smart Revision</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isDarkMode ? 'bg-white/10 text-yellow-400' : 'bg-slate-100 text-slate-400'}`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-200 active:scale-90 transition-all"
          >
            <Plus size={28} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24">
        {viewMode === 'home' ? (
          <div className="space-y-8 pt-4">
            {/* Random 5 Feature */}
            {cards.length > 0 && (
              <section>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={startRandomReview}
                  className="w-full bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[2rem] shadow-xl shadow-indigo-200 flex items-center justify-between group overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Sparkles size={80} />
                  </div>
                  <div className="relative z-10 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-indigo-300" />
                      <span className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.25em]">Smart Session</span>
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter">Random 5</h2>
                    <p className="text-indigo-100/70 text-sm mt-1 font-medium">Prioritizing your due cards</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white relative z-10">
                    <ChevronRight size={24} />
                  </div>
                </motion.button>
              </section>
            )}

            {/* Clusters Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Layers size={20} className="text-indigo-600" />
                  <h2 className={`text-xs font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Clusters</h2>
                </div>
                <div className={`flex p-1 rounded-xl transition-colors duration-500 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200/50'}`}>
                  <button 
                    onClick={() => setClusterViewMode('detailed')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${clusterViewMode === 'detailed' ? (isDarkMode ? 'bg-white/20 text-white shadow-sm' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-500'}`}
                  >
                    Grid
                  </button>
                  <button 
                    onClick={() => setClusterViewMode('simple')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${clusterViewMode === 'simple' ? (isDarkMode ? 'bg-white/20 text-white shadow-sm' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-500'}`}
                  >
                    List
                  </button>
                </div>
              </div>
              
              {clusters.length === 0 ? (
                <div className={`rounded-2xl p-8 text-center border border-dashed transition-colors duration-500 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <Brain className="mx-auto mb-3 text-slate-200" size={40} />
                  <p className="text-slate-400 text-sm">Add your first card to see clusters</p>
                </div>
              ) : clusterViewMode === 'detailed' ? (
                <div className="grid grid-cols-2 gap-4">
                  {clusters.map(cluster => (
                    <motion.button
                      key={cluster.name}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => startReview(cluster.name)}
                      className={`p-4 rounded-2xl border shadow-sm flex flex-col items-start text-left group transition-colors duration-500 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}
                    >
                      <div className="flex gap-2 mb-3">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${isDarkMode ? 'text-indigo-300 bg-indigo-500/20' : 'text-indigo-600 bg-indigo-50'}`}>
                          {cluster.count}
                        </span>
                        {cluster.dueCount > 0 && (
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 ${isDarkMode ? 'text-orange-300 bg-orange-500/20' : 'text-orange-600 bg-orange-50'}`}>
                            <Clock size={10} /> {cluster.dueCount}
                          </span>
                        )}
                      </div>
                      <span className={`text-xl font-bold break-words w-full leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {cluster.name}
                      </span>
                      <div className="mt-6 flex items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] group-hover:text-indigo-600 transition-colors">
                        Review <ChevronRight size={12} className="ml-1" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {clusters.map(cluster => (
                    <div key={cluster.name} className={`rounded-xl border shadow-sm overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}>
                      <button
                        onClick={() => setExpandedCluster(expandedCluster === cluster.name ? null : cluster.name)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left"
                      >
                        <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{cluster.name}</span>
                        <div className="flex items-center gap-3">
                          {cluster.dueCount > 0 && (
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                          )}
                          <ChevronDown 
                            size={18} 
                            className={`text-slate-400 transition-transform duration-300 ${expandedCluster === cluster.name ? 'rotate-180' : ''}`} 
                          />
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {expandedCluster === cluster.name && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                          >
                            <div className={`px-5 pb-5 pt-1 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-50'}`}>
                              <div className="flex items-center gap-4 mb-4">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                                  <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>{cluster.count} cards</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due</span>
                                  <span className={`text-sm font-bold ${cluster.dueCount > 0 ? 'text-orange-500' : (isDarkMode ? 'text-white' : 'text-slate-700')}`}>
                                    {cluster.dueCount} cards
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => startReview(cluster.name)}
                                className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300 active:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-600 active:bg-indigo-100'}`}
                              >
                                <Brain size={14} />
                                Start Session
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Cards */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Clock size={20} className="text-indigo-600" />
                <h2 className={`text-xs font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Recent Cards</h2>
              </div>
              <div className="space-y-4">
                {cards.slice(0, 10).map(card => (
                  <div key={card.id} className={`p-5 rounded-2xl border flex items-start justify-between shadow-sm hover:shadow-md transition-all duration-500 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}>
                    <div className="flex-1 pr-4">
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] block mb-2 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-500'}`}>
                        {card.cluster}
                      </span>
                      <p className={`text-base font-medium leading-relaxed line-clamp-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{card.content}</p>
                    </div>
                    <button 
                      onClick={() => deleteCard(card.id)}
                      className="text-slate-300 hover:text-red-500 p-2 -mr-2 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Activity Heatmap */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Activity size={20} className="text-indigo-600" />
                <h2 className={`text-xs font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Activity</h2>
              </div>
              <div className={`p-5 rounded-3xl border transition-colors duration-500 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'} shadow-sm`}>
                <div className="flex flex-wrap gap-1.5 justify-between">
                  {heatmapData.map((day, i) => {
                    let color = isDarkMode ? 'bg-white/5' : 'bg-slate-100';
                    if (day.count > 0 && day.count < 3) color = 'bg-indigo-300';
                    else if (day.count >= 3 && day.count < 6) color = 'bg-indigo-500';
                    else if (day.count >= 6) color = 'bg-indigo-700';
                    
                    return (
                      <div 
                        key={day.date}
                        className={`w-[calc(100%/7-6px)] aspect-square rounded-md ${color} transition-colors duration-500 relative group`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 transition-opacity font-bold uppercase tracking-widest">
                          {day.count} reviews • {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Last 28 Days</span>
                  <div className="flex items-center gap-1">
                    <span>Less</span>
                    <div className="flex gap-1">
                      <div className={`w-2 h-2 rounded-sm ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`} />
                      <div className="w-2 h-2 rounded-sm bg-indigo-300" />
                      <div className="w-2 h-2 rounded-sm bg-indigo-500" />
                      <div className="w-2 h-2 rounded-sm bg-indigo-700" />
                    </div>
                    <span>More</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Management */}
            <section className="pb-12">
              <div className="flex items-center gap-2 mb-6">
                <Settings size={20} className="text-indigo-600" />
                <h2 className={`text-xs font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Data Management</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={exportData}
                  className={`p-5 rounded-3xl border flex flex-col items-center justify-center gap-3 transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-100 text-slate-900'} shadow-sm`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Download size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Export JSON</span>
                </button>
                
                <label className={`p-5 rounded-3xl border flex flex-col items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-100 text-slate-900'} shadow-sm`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-600'}`}>
                    <Upload size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Import JSON</span>
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={importData} 
                    className="hidden" 
                  />
                </label>
              </div>
              <p className="mt-4 text-[9px] text-slate-400 text-center font-medium uppercase tracking-widest">
                Back up your cards or restore from a previous session
              </p>
            </section>
          </div>
        ) : (
          /* Review Mode */
          <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
            <div className="p-6 pt-12 flex items-center justify-between text-white">
              <button onClick={() => setViewMode('home')} className="p-2 -ml-2">
                <X size={24} />
              </button>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Reviewing</p>
                <p className="text-sm font-semibold">
                  {viewingCards.every(c => c.cluster === viewingCards[0].cluster) 
                    ? viewingCards[0]?.cluster 
                    : "Random Mix"}
                </p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center text-xs font-bold bg-white/10 rounded-full">
                {currentIndex + 1}/{viewingCards.length}
              </div>
            </div>

            <div className="flex-1 relative">
              <AnimatePresence mode="wait">
                <SwipeableCard 
                  key={viewingCards[currentIndex]?.id}
                  card={viewingCards[currentIndex]} 
                  onSwipe={handleSwipe}
                  isActive={true}
                />
              </AnimatePresence>
            </div>

            <div className="p-12 text-center">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-widest animate-pulse">
                Swipe right for next card
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Add Card Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[60] backdrop-blur-sm flex items-end sm:items-center justify-center p-4 ${isDarkMode ? 'bg-black/60' : 'bg-slate-900/40'}`}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className={`w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl transition-colors duration-500 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className={`text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>New Card</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddCard} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Content</label>
                  <textarea
                    autoFocus
                    value={newCardText}
                    onChange={(e) => setNewCardText(e.target.value)}
                    placeholder="Enter something you want to remember..."
                    className={`w-full h-40 p-5 rounded-3xl border-none focus:ring-2 focus:ring-indigo-500 text-xl font-medium leading-relaxed resize-none transition-colors duration-500 ${isDarkMode ? 'bg-white/5 text-white placeholder:text-slate-600' : 'bg-slate-50 text-slate-900 placeholder:text-slate-300'}`}
                  />
                </div>

                <div className="relative" ref={dropdownRef}>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Cluster (Optional)</label>
                  <div className="relative">
                    <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      value={newCardCluster}
                      onChange={(e) => {
                        setNewCardCluster(e.target.value);
                        setShowClusterDropdown(true);
                      }}
                      onFocus={() => setShowClusterDropdown(true)}
                      placeholder="e.g. AI, Art, Vocabulary"
                      className={`w-full pl-14 pr-14 py-5 rounded-3xl border-none focus:ring-2 focus:ring-indigo-500 text-lg font-medium transition-colors duration-500 ${isDarkMode ? 'bg-white/5 text-white placeholder:text-slate-600' : 'bg-slate-50 text-slate-900 placeholder:text-slate-300'}`}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowClusterDropdown(!showClusterDropdown)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                    >
                      <ChevronDown size={24} className={`transition-transform duration-300 ${showClusterDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {showClusterDropdown && clusters.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`absolute z-[70] left-0 right-0 mt-2 rounded-2xl shadow-xl border max-h-48 overflow-y-auto transition-colors duration-500 ${isDarkMode ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-100'}`}
                      >
                        {clusters
                          .filter(c => c.name.toLowerCase().includes(newCardCluster.toLowerCase()))
                          .map(c => (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => {
                                setNewCardCluster(c.name);
                                setShowClusterDropdown(false);
                              }}
                              className={`w-full px-6 py-3 text-left text-sm font-medium border-b last:border-none flex items-center justify-between transition-colors ${isDarkMode ? 'text-white hover:bg-white/5 border-white/5' : 'text-slate-700 hover:bg-slate-50 border-slate-50'}`}
                            >
                              {c.name}
                              <span className="text-[10px] text-slate-400">{c.count} cards</span>
                            </button>
                          ))}
                        {clusters.filter(c => c.name.toLowerCase().includes(newCardCluster.toLowerCase())).length === 0 && (
                          <div className="px-6 py-4 text-center text-xs text-slate-400 italic">
                            No matching clusters
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {clusters.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.25em] mb-3">Quick Select</p>
                      <div className="flex flex-wrap gap-2">
                        {clusters.slice(0, 6).map(c => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => {
                              setNewCardCluster(c.name);
                              setShowClusterDropdown(false);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              newCardCluster === c.name 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                : (isDarkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                            }`}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  disabled={!newCardText.trim()}
                  type="submit"
                  className="w-full mt-4 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-200 disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                  <CheckCircle2 size={24} />
                  Save Card
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Nav (Only on Home) */}
      {viewMode === 'home' && (
        <nav className={`fixed bottom-0 left-0 w-full backdrop-blur-lg border-t px-12 py-4 flex justify-around items-center z-10 transition-colors duration-500 ${isDarkMode ? 'bg-black/80 border-white/10' : 'bg-white/80 border-slate-100'}`}>
          <button className="flex flex-col items-center gap-1 text-indigo-600">
            <Brain size={24} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Recall</span>
          </button>
          <div className={`w-12 h-1 rounded-full absolute top-2 left-1/2 -translate-x-1/2 ${isDarkMode ? 'bg-white/10' : 'bg-slate-100'}`} />
        </nav>
      )}
    </div>
  );
}
