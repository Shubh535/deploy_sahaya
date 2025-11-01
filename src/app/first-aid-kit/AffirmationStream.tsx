"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../utils/apiClient';

interface Affirmation {
  id: string;
  text: string;
  category: string;
  mood: string;
  personalized: boolean;
  createdAt: number;
}

const MOOD_CATEGORIES = [
  { key: 'anxiety', label: '😰 Anxiety', color: 'from-blue-300 to-cyan-300' },
  { key: 'sadness', label: '😢 Sadness', color: 'from-indigo-300 to-purple-300' },
  { key: 'motivation', label: '💪 Motivation', color: 'from-orange-300 to-amber-300' },
  { key: 'confidence', label: '✨ Confidence', color: 'from-pink-300 to-rose-300' },
  { key: 'gratitude', label: '🙏 Gratitude', color: 'from-emerald-300 to-teal-300' },
  { key: 'self-love', label: '💖 Self-Love', color: 'from-rose-300 to-pink-300' },
];

export default function AffirmationStream() {
  const [selectedMood, setSelectedMood] = useState(MOOD_CATEGORIES[0]);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savedAffirmations, setSavedAffirmations] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dailyAffirmation, setDailyAffirmation] = useState<Affirmation | null>(null);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Fetch daily affirmation on mount
  useEffect(() => {
    fetchDailyAffirmation();
    fetchSavedAffirmations();
  }, []);

  // Fetch affirmations when mood changes
  useEffect(() => {
    fetchAffirmations();
  }, [selectedMood]);

  const fetchDailyAffirmation = async () => {
    console.log('Fetching daily affirmation...');
    try {
      const response = await apiRequest('/api/wellness/daily-affirmation', {
        method: 'GET'
      });
      console.log('Daily affirmation response:', response);
      if (response.affirmation) {
        setDailyAffirmation(response.affirmation);
      }
    } catch (error) {
      console.error('Failed to fetch daily affirmation:', error);
      // Set a fallback daily affirmation
      setDailyAffirmation({
        id: 'daily_fallback',
        text: 'Today, I choose to embrace growth, practice kindness, and trust in my journey.',
        category: 'daily',
        mood: 'daily',
        personalized: false,
        createdAt: Date.now()
      });
    }
  };

  const fetchAffirmations = async () => {
    setLoading(true);
    console.log('Fetching affirmations for mood:', selectedMood.key);
    try {
      const response = await apiRequest('/api/wellness/affirmations', {
        method: 'POST',
        body: JSON.stringify({
          mood: selectedMood.key,
          personalized: true,
          count: 5
        })
      });
      console.log('Affirmations response:', response);
      
      // Check if we got a valid response with affirmations array
      if (!response) {
        throw new Error('No response from server');
      }
      
      if (!response.affirmations) {
        console.error('Response missing affirmations array:', response);
        throw new Error(`Invalid response format: ${JSON.stringify(response)}`);
      }
      
      if (!Array.isArray(response.affirmations)) {
        console.error('Affirmations is not an array:', typeof response.affirmations);
        throw new Error(`Affirmations is not an array: ${typeof response.affirmations}`);
      }
      
      if (response.affirmations.length === 0) {
        throw new Error('Empty affirmations array returned');
      }
      
      // Success - we have valid affirmations
      console.log(`Successfully loaded ${response.affirmations.length} affirmations`);
      setAffirmations(response.affirmations);
      setCurrentIndex(0);
      
    } catch (error) {
      console.error('Failed to fetch affirmations:', error);
      console.log('Using fallback affirmations');
      
      // Show error temporarily for debugging
      alert(`⚠️ API Error: ${error}\n\nUsing fallback affirmations. Check browser console for details.`);
      
      // Fallback affirmations with variety
      const fallbackAffirmations = {
        anxiety: [
          'I am safe in this moment and I trust myself.',
          'My breath anchors me to the present moment.',
          'I release what I cannot control with grace.',
          'Peace flows through me with every breath I take.',
          'I am stronger than my anxious thoughts.'
        ],
        sadness: [
          'I allow myself to feel and honor my emotions.',
          'This feeling will pass, and joy will return.',
          'I am worthy of love even in my sadness.',
          'My heart is healing with each passing day.',
          'I embrace this moment with compassion for myself.'
        ],
        motivation: [
          'I am capable of achieving anything I set my mind to.',
          'Every step forward is progress worth celebrating.',
          'My potential is limitless and I am unstoppable.',
          'I choose to take action and make today count.',
          'Success is built one determined moment at a time.'
        ],
        confidence: [
          'I trust my abilities and know my worth.',
          'I am powerful, capable, and deserving of respect.',
          'My voice matters and I speak with confidence.',
          'I embrace my unique strengths and celebrate myself.',
          'I am enough exactly as I am right now.'
        ],
        gratitude: [
          'I am grateful for the gift of this present moment.',
          'Abundance flows to me from expected and unexpected sources.',
          'I appreciate the beauty and blessings in my life.',
          'My heart overflows with thankfulness for what I have.',
          'I recognize and celebrate the good surrounding me.'
        ],
        'self-love': [
          'I am deserving of my own love and kindness.',
          'I treat myself with the compassion I give others.',
          'My worth is inherent and not based on achievement.',
          'I honor my needs and set boundaries with love.',
          'I am beautiful, inside and out, exactly as I am.'
        ]
      };
      
      const moodAffirmations = fallbackAffirmations[selectedMood.key as keyof typeof fallbackAffirmations] || fallbackAffirmations.motivation;
      setAffirmations(moodAffirmations.map((text, i) => ({
        id: `fallback_${selectedMood.key}_${i}`,
        text,
        category: selectedMood.key,
        mood: selectedMood.key,
        personalized: false,
        createdAt: Date.now()
      })));
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedAffirmations = async () => {
    try {
      const response = await apiRequest('/api/wellness/saved-affirmations', {
        method: 'GET'
      });
      setSavedAffirmations(response.saved || []);
    } catch (error) {
      console.error('Failed to fetch saved affirmations:', error);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % affirmations.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + affirmations.length) % affirmations.length);
  };

  const handleSave = async () => {
    const current = affirmations[currentIndex];
    if (!current) return;

    console.log('Saving affirmation:', current);
    try {
      const response = await apiRequest('/api/wellness/save-affirmation', {
        method: 'POST',
        body: JSON.stringify({
          affirmationId: current.id,
          text: current.text,
          mood: current.mood
        })
      });
      
      console.log('Save response:', response);
      setSavedAffirmations([...savedAffirmations, current.id]);
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 2000);
    } catch (error) {
      console.error('Failed to save affirmation:', error);
      alert(`Failed to save: ${error}. Please check your connection.`);
    }
  };

  const handlePlayAudio = async () => {
    const current = affirmations[currentIndex];
    if (!current || isPlaying) return;

    setIsPlaying(true);
    try {
      // Try backend TTS first
      const response = await apiRequest('/api/wellness/text-to-speech', {
        method: 'POST',
        body: JSON.stringify({
          text: current.text,
          voice: 'calm'
        })
      });

      // Play audio from base64 or URL
      if (response.audioUrl) {
        const audio = new Audio(response.audioUrl);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        await audio.play();
      } else {
        // Use browser Speech Synthesis API as fallback
        throw new Error('No audio URL, using browser TTS');
      }
    } catch (error) {
      console.log('Using browser Speech Synthesis API for TTS');
      
      // Use Web Speech API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(current.text);
        utterance.rate = 0.9; // Slightly slower for calming effect
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to find a calm, gentle voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Natural')
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => {
          setIsPlaying(false);
          alert('Text-to-speech failed. Please try again.');
        };
        
        speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(false);
        alert('Text-to-speech is not supported in your browser.');
      }
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const handleRemind = async () => {
    const current = affirmations[currentIndex];
    if (!current) return;

    console.log('Setting reminder for affirmation:', current);
    try {
      const response = await apiRequest('/api/wellness/set-reminder', {
        method: 'POST',
        body: JSON.stringify({
          affirmationId: current.id,
          text: current.text,
          remindAt: Date.now() + 3600000 // 1 hour from now
        })
      });
      
      console.log('Reminder response:', response);
      alert('✅ Reminder set for 1 hour from now! 🔔');
    } catch (error) {
      console.error('Failed to set reminder:', error);
      alert(`Failed to set reminder: ${error}`);
    }
  };

  const currentAffirmation = affirmations[currentIndex];
  const isSaved = currentAffirmation && savedAffirmations.includes(currentAffirmation.id);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-light text-slate-700 dark:text-slate-200">
          Affirmation Stream
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Personalized affirmations based on your mood and journey
        </p>
      </div>

      {/* Daily Affirmation Card */}
      {dailyAffirmation && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-r ${MOOD_CATEGORIES[0].color} rounded-3xl p-8 shadow-xl`}
        >
          <div className="text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              ✨ Today's Affirmation
            </p>
            <p className="text-2xl font-light text-slate-800 leading-relaxed">
              {dailyAffirmation.text}
            </p>
            <p className="text-xs text-slate-600">
              Refreshes every 24 hours
            </p>
          </div>
        </motion.div>
      )}

      {/* Mood Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {MOOD_CATEGORIES.map(mood => (
          <button
            key={mood.key}
            onClick={() => setSelectedMood(mood)}
            disabled={loading}
            className={`px-4 py-3 rounded-2xl font-medium transition-all duration-300 ${
              selectedMood.key === mood.key
                ? `bg-gradient-to-r ${mood.color} text-slate-800 shadow-lg scale-105`
                : 'bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:scale-105'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {mood.label}
          </button>
        ))}
      </div>

      {/* Main Affirmation Display */}
      <div className="relative">
        {loading ? (
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin text-6xl">⏳</div>
          </div>
        ) : affirmations.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateY: 10 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className={`bg-gradient-to-br ${selectedMood.color} rounded-3xl p-12 shadow-2xl`}
            >
              <div className="text-center space-y-6">
                <p className="text-3xl md:text-4xl font-light text-slate-800 leading-relaxed">
                  {currentAffirmation?.text}
                </p>
                
                {/* Enhanced Personalization Status */}
                <div className="flex items-center justify-center gap-2">
                  {currentAffirmation?.personalized ? (
                    <div 
                      className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm font-medium text-slate-800 flex items-center gap-2 shadow-md border border-white/40"
                      title="Generated by Gemini AI using your Mitra conversation history for deeper personalization"
                    >
                      <span className="text-lg">✨</span>
                      <span>AI Personalized with Your Context</span>
                    </div>
                  ) : currentAffirmation?.id.startsWith('fallback_') ? (
                    <div 
                      className="px-4 py-2 bg-white/40 backdrop-blur-sm rounded-full text-sm text-slate-700 flex items-center gap-2 border border-white/30"
                      title="Curated affirmations (AI temporarily unavailable)"
                    >
                      <span className="text-lg">💙</span>
                      <span>Expertly Curated</span>
                    </div>
                  ) : (
                    <div 
                      className="px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full text-sm text-slate-700 flex items-center gap-2 border border-white/30"
                      title="Generated by Gemini AI (chat with Mitra for personalized affirmations)"
                    >
                      <span className="text-lg">🤖</span>
                      <span>AI Generated</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center text-slate-500 py-20">
            No affirmations available
          </div>
        )}

        {/* Saved Message */}
        <AnimatePresence>
          {showSavedMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg"
            >
              ✓ Saved!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation & Actions */}
      <div className="flex flex-col gap-4">
        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={loading || affirmations.length === 0}
            className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 disabled:opacity-50"
          >
            <span className="text-2xl">←</span>
          </button>
          
          <div className="flex items-center gap-2">
            {affirmations.slice(0, 5).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? `bg-gradient-to-r ${selectedMood.color} w-6`
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={handleNext}
            disabled={loading || affirmations.length === 0}
            className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 disabled:opacity-50"
          >
            <span className="text-2xl">→</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleSave}
            disabled={!currentAffirmation || isSaved}
            className={`px-6 py-3 rounded-2xl font-medium shadow-lg transition-all duration-300 hover:scale-105 ${
              isSaved
                ? 'bg-emerald-500 text-white'
                : 'bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:shadow-xl'
            } disabled:opacity-50`}
          >
            {isSaved ? '❤️ Saved' : '🤍 Save'}
          </button>
          
          <button
            onClick={isPlaying ? handleStopAudio : handlePlayAudio}
            disabled={!currentAffirmation}
            className="px-6 py-3 bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
          >
            {isPlaying ? '⏹️ Stop' : '🔊 Listen'}
          </button>
          
          <button
            onClick={handleRemind}
            disabled={!currentAffirmation}
            className="px-6 py-3 bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
          >
            ⏰ Remind
          </button>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchAffirmations}
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-purple-400 to-indigo-400 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
        >
          <span className="flex items-center gap-2">
            <span className="text-xl">🔄</span>
            Generate New Affirmations
          </span>
        </button>
      </div>
    </div>
  );
}
