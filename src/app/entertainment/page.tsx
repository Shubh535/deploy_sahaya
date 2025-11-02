"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RequireAuth from "../components/RequireAuth";

interface Meme {
  id: string;
  imageUrl: string;
  description: string;
  photographer: string;
  photographerUrl: string;
  reactions: string[];
  bookmarked: boolean;
}

interface Song {
  title: string;
  artist: string;
  genre: string;
}

interface MusicRecommendation {
  emotion: string;
  songs: Song[];
  reasoning: string;
}

export default function EntertainmentPage() {
  const [dailyMeme, setDailyMeme] = useState<Meme | null>(null);
  const [musicRecs, setMusicRecs] = useState<MusicRecommendation | null>(null);
  const [loadingMeme, setLoadingMeme] = useState(false);
  const [loadingMusic, setLoadingMusic] = useState(false);
  const [activeSection, setActiveSection] = useState<'meme' | 'music' | null>(null);

  // Helper to get auth token
  const getAuthToken = async () => {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  };

  // Fetch daily meme
  const fetchDailyMeme = async () => {
    setLoadingMeme(true);
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/entertainment/daily-meme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Meme API error:', errorData);
        alert(`Failed to load meme: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      const data = await response.json();
      if (data && data.imageUrl) {
        setDailyMeme(data);
      } else {
        console.error('Invalid meme data:', data);
        alert('Invalid meme data received');
      }
    } catch (error) {
      console.error('Error fetching meme:', error);
      alert('Failed to load meme. Check console for details.');
    } finally {
      setLoadingMeme(false);
    }
  };

  // Fetch music recommendations
  const fetchMusicRecommendations = async () => {
    setLoadingMusic(true);
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/entertainment/music-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Music API error:', errorData);
        alert(`Failed to load music: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      const data = await response.json();
      if (data && data.songs && Array.isArray(data.songs)) {
        setMusicRecs(data);
      } else {
        console.error('Invalid music data:', data);
        alert('Invalid music data received');
      }
    } catch (error) {
      console.error('Error fetching music:', error);
      alert('Failed to load music. Check console for details.');
    } finally {
      setLoadingMusic(false);
    }
  };

  // React to meme
  const reactToMeme = async (emoji: string) => {
    if (!dailyMeme) return;
    
    const newReactions = dailyMeme.reactions.includes(emoji)
      ? dailyMeme.reactions.filter((r: string) => r !== emoji)
      : [...dailyMeme.reactions, emoji];

    setDailyMeme({ ...dailyMeme, reactions: newReactions });

    try {
      const token = await getAuthToken();
      await fetch('/api/entertainment/react-meme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          memeId: dailyMeme.id,
          reactions: newReactions
        })
      });
    } catch (error) {
      console.error('Error saving reaction:', error);
    }
  };

  // Toggle bookmark
  const toggleBookmark = async () => {
    if (!dailyMeme) return;
    
    const newBookmarked = !dailyMeme.bookmarked;
    setDailyMeme({ ...dailyMeme, bookmarked: newBookmarked });

    try {
      const token = await getAuthToken();
      await fetch('/api/entertainment/bookmark-meme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          memeId: dailyMeme.id,
          bookmarked: newBookmarked
        })
      });
    } catch (error) {
      console.error('Error saving bookmark:', error);
    }
  };

  // Animated particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
  }));

  return (
    <RequireAuth>
      <main className="relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        {/* Animated Background Particles */}
        <div className="absolute inset-0 z-0">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-3 h-3 bg-purple-300 rounded-full opacity-20"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
              animate={{
                y: [0, -30, 0],
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {!activeSection && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center mb-12"
              >
                <div className="text-7xl mb-4">🎭</div>
                <h1 className="text-5xl font-light mb-4 text-gray-800">
                  Entertainment & Expression
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Lighten your mood with joy-filled moments and soulful music
                </p>
              </motion.div>
            )}

            {!activeSection && (
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Daily Meme Hub Button */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveSection('meme');
                    fetchDailyMeme();
                  }}
                  className="group relative p-10 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl hover:shadow-purple-300/50 transition-all duration-300"
                >
                  <div className="text-6xl mb-4 text-center">😂</div>
                  <h3 className="text-2xl font-semibold mb-2 text-gray-800">
                    Daily Meme Hub
                  </h3>
                  <p className="text-gray-600">
                    Curated positive visuals to brighten your day
                  </p>
                </motion.button>

                {/* Indian Music Button */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveSection('music');
                    fetchMusicRecommendations();
                  }}
                  className="group relative p-10 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl hover:shadow-pink-300/50 transition-all duration-300"
                >
                  <div className="text-6xl mb-4 text-center">🎵</div>
                  <h3 className="text-2xl font-semibold mb-2 text-gray-800">
                    Indian Music Recommendations
                  </h3>
                  <p className="text-gray-600">
                    Soulful songs matched to your emotional state
                  </p>
                </motion.button>
              </div>
            )}

            {/* Meme Section */}
            {activeSection === 'meme' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-3xl mx-auto"
              >
                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
                  <button
                    onClick={() => setActiveSection(null)}
                    className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2"
                  >
                    ← Back
                  </button>

                  <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
                    😂 Daily Meme Hub
                  </h2>

                  {loadingMeme ? (
                    <div className="text-center py-20">
                      <div className="animate-spin text-6xl mb-4">😂</div>
                      <p className="text-gray-600">Finding something fun for you...</p>
                    </div>
                  ) : dailyMeme ? (
                    <div>
                      <div className="relative rounded-2xl overflow-hidden mb-6">
                        <img
                          src={dailyMeme.imageUrl}
                          alt={dailyMeme.description}
                          className="w-full h-auto max-h-[500px] object-cover"
                        />
                      </div>

                      <div className="flex items-center justify-between mb-6">
                        <a
                          href={dailyMeme.photographerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          📷 Photo by {dailyMeme.photographer}
                        </a>
                        <button
                          onClick={toggleBookmark}
                          className="text-2xl hover:scale-110 transition-transform"
                        >
                          {dailyMeme.bookmarked ? '⭐' : '☆'}
                        </button>
                      </div>

                      <button
                        onClick={fetchDailyMeme}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        Show Me Another 🎲
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-gray-600">Click the button above to load a meme!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Music Section */}
            {activeSection === 'music' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-4xl mx-auto"
              >
                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
                  <button
                    onClick={() => setActiveSection(null)}
                    className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2"
                  >
                    ← Back
                  </button>

                  <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
                    🎵 Indian Music Recommendations
                  </h2>

                  {loadingMusic ? (
                    <div className="text-center py-20">
                      <div className="animate-bounce text-6xl mb-4">🎵</div>
                      <p className="text-gray-600">Curating music for your mood...</p>
                    </div>
                  ) : musicRecs && musicRecs.songs ? (
                    <div>
                      <div className="bg-purple-50 rounded-xl p-4 mb-6 text-center">
                        <p className="text-sm text-gray-600">You're feeling:</p>
                        <p className="text-xl font-semibold text-purple-600">{musicRecs.emotion}</p>
                      </div>

                      {musicRecs.reasoning && (
                        <div className="bg-pink-50 rounded-xl p-4 mb-6">
                          <p className="text-sm text-gray-700 italic">"{musicRecs.reasoning}"</p>
                        </div>
                      )}

                      <div className="space-y-4 mb-6">
                        {musicRecs.songs.map((song, index) => (
                          <div
                            key={index}
                            className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 hover:shadow-lg transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-800 text-lg">
                                  {index + 1}. {song.title}
                                </h4>
                                <p className="text-gray-600">{song.artist}</p>
                                <span className="inline-block mt-1 px-2 py-1 bg-white/60 rounded-full text-xs text-purple-700">
                                  {song.genre}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <a
                                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(song.title + ' ' + song.artist)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                                >
                                  🎵 YouTube
                                </a>
                                <a
                                  href={`https://open.spotify.com/search/${encodeURIComponent(song.title + ' ' + song.artist)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                                >
                                  🎧 Spotify
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={fetchMusicRecommendations}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        Refresh Recommendations 🔄
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-gray-600">Loading music recommendations...</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </RequireAuth>
  );
}
