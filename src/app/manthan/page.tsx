

"use client";
import { useState, useRef, useEffect } from "react";
import { plantTree } from "../sanjha-grove/useGarden";
import { useAuth } from "../components/AuthProvider";
import { getIdToken } from "../utils/getIdToken";

// Mood options
const MOODS = [
  { emoji: "😊", label: "Happy", value: "happy" },
  { emoji: "😌", label: "Calm", value: "calm" },
  { emoji: "😐", label: "Neutral", value: "neutral" },
  { emoji: "😰", label: "Anxious", value: "anxious" },
  { emoji: "😢", label: "Sad", value: "sad" },
  { emoji: "😡", label: "Angry", value: "angry" },
];

export default function ManthanJournalPage() {
  const { user, loading } = useAuth();
  
  // Current entry state
  const [entry, setEntry] = useState("");
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("neutral");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  
  // Analysis results
  const [insights, setInsights] = useState<any>(null);
  
  // Journal list
  const [journals, setJournals] = useState<any[]>([]);
  const [loadingJournals, setLoadingJournals] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  
  // Filters
  const [filterMood, setFilterMood] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Reflection prompts
  const [promptCategories, setPromptCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("gratitude");
  const [currentPrompt, setCurrentPrompt] = useState<any>(null);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [showPromptsPanel, setShowPromptsPanel] = useState(true);
  
  const entryRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (entryRef.current) entryRef.current.focus();
  }, []);

  // Load journals on mount and when filter changes
  useEffect(() => {
    if (user) {
      loadJournals();
      loadPromptCategories();
    }
  }, [user, filterMood]);

  // Auto-save with debounce (30 seconds)
  useEffect(() => {
    if (!entry.trim() || !user) return;
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (entry.trim() && !selectedJournal) {
        // Only auto-save new entries, not edits
        handleSave(true);
      }
    }, 30000);
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [entry, user, selectedJournal]);

  const loadJournals = async () => {
    setLoadingJournals(true);
    try {
      const token = await getIdToken();
      const params = new URLSearchParams({ limit: '20' });
      if (filterMood) params.append('mood', filterMood);
      
      const res = await fetch(`/api/manthan/journals?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load journals");
      setJournals(data.journals || []);
    } catch (e) {
      console.error('Error loading journals:', e);
    } finally {
      setLoadingJournals(false);
    }
  };

  const loadPromptCategories = async () => {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/manthan/reflection-prompts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.categories) {
        setPromptCategories(data.categories);
      }
    } catch (e) {
      console.error('Error loading prompt categories:', e);
    }
  };

  const handleGeneratePrompt = async () => {
    setGeneratingPrompt(true);
    setError("");
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/manthan/reflection-prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category: selectedCategory,
          mood: mood,
          recentTopics: tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate prompt");
      setCurrentPrompt(data);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to generate prompt';
      setError(errorMessage);
    } finally {
      setGeneratingPrompt(false);
    }
  };

  const handleJournalFromPrompt = () => {
    if (currentPrompt) {
      setEntry(`Prompt: ${currentPrompt.prompt}\n\n---\n\n`);
      setTitle(`Reflection: ${currentPrompt.categoryName}`);
      setCurrentPrompt(null);
      if (entryRef.current) {
        entryRef.current.focus();
        // Move cursor to end
        entryRef.current.setSelectionRange(entryRef.current.value.length, entryRef.current.value.length);
      }
    }
  };


  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError("");
    setInsights(null);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/manthan/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: entry, mood }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setInsights(data.insights);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async (isAutoSave = false) => {
    if (!entry.trim()) return;
    
    setSaving(true);
    setError("");
    try {
      const token = await getIdToken();
      const payload: any = {
        content: entry,
        mood,
        tags,
      };
      
      if (title.trim()) {
        payload.title = title;
      }
      
      if (insights) {
        payload.insights = insights;
      }
      
      let res;
      if (selectedJournal) {
        // Update existing
        res = await fetch(`/api/manthan/journals`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...payload, id: selectedJournal.id }),
        });
      } else {
        // Create new
        res = await fetch(`/api/manthan/journals`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      
      if (!isAutoSave) {
        // Clear form and reload journals
        setEntry("");
        setTitle("");
        setMood("neutral");
        setTags([]);
        setInsights(null);
        setSelectedJournal(null);
        await loadJournals();
        
        // Plant a tree in Sanjha Grove
        const color = mood === "happy" || mood === "calm" ? "#a5b4fc" : 
                      mood === "sad" || mood === "anxious" ? "#fca5a5" : "#fcd34d";
        const x = Math.random();
        const y = 0.6 + Math.random() * 0.3;
        await plantTree({ x, y, color, mood });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      if (!isAutoSave) setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSelectJournal = (journal: any) => {
    setSelectedJournal(journal);
    setEntry(journal.content);
    setTitle(journal.title || "");
    setMood(journal.mood || "neutral");
    setTags(journal.tags || []);
    setInsights(journal.insights || null);
  };

  const handleNewEntry = () => {
    setSelectedJournal(null);
    setEntry("");
    setTitle("");
    setMood("neutral");
    setTags([]);
    setInsights(null);
  };

  const handleDeleteJournal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this journal entry?")) return;
    
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/manthan/journals?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      
      await loadJournals();
      if (selectedJournal?.id === id) {
        handleNewEntry();
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(errorMessage);
    }
  };

  const handleExportJournal = async (journal: any) => {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/manthan/export`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          journal: {
            title: journal.title,
            entry: journal.content,
            mood: journal.mood,
            tags: journal.tags,
            timestamp: journal.created_at
          },
          insights: journal.insights
        }),
      });
      
      if (!res.ok) throw new Error("Export failed");
      
      // Get the HTML content
      const html = await res.text();
      
      // Create a blob and download
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manthan-${journal.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'journal'}-${new Date(journal.created_at).toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Export failed';
      setError(errorMessage);
    }
  };

  if (loading) return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900'>
      <div className='glass-card p-8 text-center animate-fade-in'>
        <div className='w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
        <p className='text-slate-600 dark:text-slate-400'>Preparing your reflection space...</p>
      </div>
    </div>
  );
  
  if (!user) return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900'>
      <div className='glass-card p-8 text-center animate-fade-in'>
        <div className='text-4xl mb-4'>🔐</div>
        <p className='text-slate-600 dark:text-slate-400'>Please sign in to begin your journey of self-discovery.</p>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900'>
      {/* Main content */}
      <div className='max-w-7xl mx-auto p-6 min-h-screen'>
        {/* Header */}
        <header className='text-center mb-8 animate-fade-in'>
          <h1 className='text-4xl sm:text-5xl font-light mb-2 text-slate-800 dark:text-slate-100 tracking-wide'>
            Manthan <span className='text-3xl align-super text-emerald-600'>(मंथन)</span>
          </h1>
          <p className='text-lg text-slate-600 dark:text-slate-300'>AI Journal for reflection, reframing, and emotional growth</p>
        </header>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left sidebar - Journal list */}
          <div className='lg:col-span-1'>
            <div className='glass-card p-6 animate-fade-in'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-xl font-medium text-slate-700 dark:text-slate-200'>My Journals</h2>
                <button
                  onClick={handleNewEntry}
                  className='btn-primary'
                >
                  + New
                </button>
              </div>
              
              {/* Filter by mood */}
              <div className='mb-4'>
                <select
                  value={filterMood}
                  onChange={(e) => setFilterMood(e.target.value)}
                  className='w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm transition-colors'
                >
                  <option value="">All Moods</option>
                  {MOODS.map(m => (
                    <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Journal list */}
              <div className='space-y-3 max-h-[600px] overflow-y-auto'>
                {loadingJournals ? (
                  <div className='text-center py-8'>
                    <div className='w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2' />
                    <p className='text-sm text-slate-500'>Loading...</p>
                  </div>
                ) : journals.length === 0 ? (
                  <div className='text-center py-8'>
                    <div className='text-4xl mb-2'>📝</div>
                    <p className='text-sm text-slate-500'>No journals yet</p>
                  </div>
                ) : (
                  journals.map(journal => (
                    <div
                      key={journal.id}
                      onClick={() => handleSelectJournal(journal)}
                      className={`p-4 rounded-xl cursor-pointer transition-colors ${
                        selectedJournal?.id === journal.id
                          ? 'bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-400'
                          : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className='flex items-start justify-between mb-2'>
                        <div className='flex items-center gap-2'>
                          <span className='text-2xl'>
                            {MOODS.find(m => m.value === journal.mood)?.emoji || '📝'}
                          </span>
                          <div>
                            <h3 className='font-medium text-slate-700 dark:text-slate-200 text-sm'>
                              {journal.title || 'Untitled'}
                            </h3>
                            <p className='text-xs text-slate-500'>
                              {new Date(journal.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleExportJournal(journal); }}
                            className='text-blue-400 hover:text-blue-600 text-sm transition-colors'
                            title='Export as HTML'
                          >
                            📤
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteJournal(journal.id); }}
                            className='text-red-400 hover:text-red-600 text-sm'
                            title='Delete'
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <p className='text-xs text-slate-600 dark:text-slate-400 line-clamp-2'>
                        {journal.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main editor */}
          <div className='lg:col-span-2'>
            <div className='glass-card mb-6 animate-fade-in'>
              <div className='p-6'>
                <div className='flex items-center gap-3 mb-4'>
                  <input
                    type='text'
                    placeholder='Give your entry a title...'
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className='flex-1 text-xl font-light bg-transparent border-none outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400'
                  />
                </div>
                
                {/* Mood selector */}
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2'>
                    How are you feeling?
                  </label>
                  <div className='flex gap-2 flex-wrap'>
                    {MOODS.map(m => (
                      <button
                        key={m.value}
                        onClick={() => setMood(m.value)}
                        className={`px-4 py-2 rounded-xl border-2 transition-colors ${
                          mood === m.value
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-300'
                        }`}
                      >
                        <span className='text-2xl'>{m.emoji}</span>
                        <span className='ml-2 text-sm'>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Content editor */}
                <textarea
                  ref={entryRef}
                  className='w-full min-h-[200px] rounded-xl border px-4 py-3 text-base bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-colors text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 resize-none'
                  placeholder="Pour out your heart... let your thoughts flow freely..."
                  value={entry}
                  onChange={e => setEntry(e.target.value)}
                  disabled={analyzing || saving}
                />
                
                {/* Tags input */}
                <div className='mt-4'>
                  <label className='block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2'>
                    Tags
                  </label>
                  <div className='flex gap-2 items-center mb-2'>
                    <input
                      type='text'
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAddTag()}
                      placeholder='Add a tag...'
                      className='flex-1 px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm transition-colors'
                    />
                    <button
                      onClick={handleAddTag}
                      className='btn-primary text-sm'
                    >
                      Add
                    </button>
                  </div>
                  <div className='flex gap-2 flex-wrap'>
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className='px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2'
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className='text-emerald-600 hover:text-emerald-800'
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className='flex gap-4 mt-6'>
                  <button
                    className='btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed'
                    onClick={handleAnalyze}
                    disabled={analyzing || !entry.trim()}
                  >
                    {analyzing ? (
                      <span className='flex items-center justify-center gap-2'>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                        Analyzing...
                      </span>
                    ) : (
                      <span className='flex items-center justify-center gap-2'>
                        <span>🔍</span>
                        Analyze with AI
                      </span>
                    )}
                  </button>
                  <button
                    className='btn-outline flex-1 disabled:opacity-50 disabled:cursor-not-allowed'
                    onClick={() => handleSave(false)}
                    disabled={saving || !entry.trim()}
                  >
                    {saving ? (
                      <span className='flex items-center justify-center gap-2'>
                        <div className='w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin' />
                        Saving...
                      </span>
                    ) : (
                      <span className='flex items-center justify-center gap-2'>
                        <span>💾</span>
                        {selectedJournal ? 'Update' : 'Save'} Entry
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className='glass-card mb-6 p-4 animate-fade-in bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'>
                <div className='flex items-center gap-3'>
                  <div className='text-2xl'>⚠️</div>
                  <p className='text-red-600 dark:text-red-400'>{error}</p>
                </div>
              </div>
            )}

            {/* Reflection Prompts Panel */}
            <div className='glass-card p-6 mb-6 animate-fade-in'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <div className='text-2xl'>✨</div>
                  <h3 className='text-xl font-medium text-slate-700 dark:text-slate-200'>Reflection Prompts</h3>
                </div>
                <button
                  onClick={() => setShowPromptsPanel(!showPromptsPanel)}
                  className='text-slate-400 hover:text-slate-600 text-sm'
                >
                  {showPromptsPanel ? '▼' : '▶'}
                </button>
              </div>

              {showPromptsPanel && (
                <div className='space-y-4'>
                  {/* Category selector */}
                  <div>
                    <label className='block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2'>
                      Choose a theme
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className='w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm transition-colors'
                      disabled={generatingPrompt}
                    >
                      {promptCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} - {cat.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Generate button */}
                  <button
                    onClick={handleGeneratePrompt}
                    disabled={generatingPrompt}
                    className='w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {generatingPrompt ? (
                      <span className='flex items-center justify-center gap-2'>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                        Generating prompt...
                      </span>
                    ) : (
                      <span className='flex items-center justify-center gap-2'>
                        <span>✨</span>
                        Generate Reflection Prompt
                      </span>
                    )}
                  </button>

                  {/* Current prompt display */}
                  {currentPrompt && (
                    <div className='p-4 rounded-xl bg-purple-50 dark:bg-purple-950 border-2 border-purple-300 dark:border-purple-700 animate-fade-in'>
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex items-center gap-2'>
                          <span className='text-2xl'>💭</span>
                          <span className='text-sm font-medium text-purple-700 dark:text-purple-300'>
                            {currentPrompt.categoryName}
                          </span>
                        </div>
                        <button
                          onClick={() => setCurrentPrompt(null)}
                          className='text-slate-400 hover:text-slate-600 text-sm'
                        >
                          ✕
                        </button>
                      </div>
                      <p className='text-slate-700 dark:text-slate-300 leading-relaxed mb-4 text-base'>
                        {currentPrompt.prompt}
                      </p>
                      <button
                        onClick={handleJournalFromPrompt}
                        className='w-full btn-primary'
                      >
                        📝 Journal from this Prompt
                      </button>
                    </div>
                  )}

                  <p className='text-xs text-slate-500 dark:text-slate-400 text-center'>
                    AI-generated prompts based on CBT and DBT principles
                  </p>
                </div>
              )}
            </div>

            {/* AI Insights */}
            {insights && (
              <div className='glass-card p-6 animate-fade-in space-y-4'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='text-2xl'>💡</div>
                  <h3 className='text-xl font-medium text-slate-700 dark:text-slate-200'>AI Insights</h3>
                </div>
                
                {insights.reframed_thought && (
                  <div className='p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-400'>
                    <h4 className='font-medium text-emerald-700 dark:text-emerald-300 mb-2'>Reframed Perspective</h4>
                    <p className='text-slate-600 dark:text-slate-400 leading-relaxed'>{insights.reframed_thought}</p>
                  </div>
                )}
                
                {insights.emotional_summary && (
                  <div className='p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400'>
                    <h4 className='font-medium text-blue-700 dark:text-blue-300 mb-2'>Emotional Summary</h4>
                    <p className='text-slate-600 dark:text-slate-400 leading-relaxed'>{insights.emotional_summary}</p>
                  </div>
                )}
                
                {insights.cognitive_distortions && insights.cognitive_distortions.length > 0 && (
                  <div className='p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400'>
                    <h4 className='font-medium text-amber-700 dark:text-amber-300 mb-2'>Cognitive Patterns Noticed</h4>
                    <ul className='list-disc list-inside space-y-1'>
                      {insights.cognitive_distortions.map((d: string, i: number) => (
                        <li key={i} className='text-slate-600 dark:text-slate-400 text-sm'>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {insights.encouragement && (
                  <div className='p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-400'>
                    <h4 className='font-medium text-purple-700 dark:text-purple-300 mb-2'>Encouragement</h4>
                    <p className='text-slate-600 dark:text-slate-400 leading-relaxed'>{insights.encouragement}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
