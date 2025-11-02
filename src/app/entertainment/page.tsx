"use client";
import React, { useState } from "react";
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

  return (
    <RequireAuth>
      <main className="min-h-screen px-4 py-12 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="w-full max-w-6xl mx-auto">
          {!activeSection && (
              <div className="text-center mb-12 animate-fade-in">
                <h1 className="text-5xl font-light mb-4 text-slate-800 dark:text-slate-100">
                  Entertainment & Expression
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                  Lighten your mood with joy-filled moments and soulful music
                </p>
              </div>
            )}

            {!activeSection && (
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto animate-fade-in-delayed">
                {/* Daily Meme Hub Button */}
                <button
                  onClick={() => {
                    setActiveSection('meme');
                    fetchDailyMeme();
                  }}
                  className="group p-10 glass-card hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                >
                  <div className="text-6xl mb-4 text-center">😂</div>
                  <h3 className="text-2xl font-semibold mb-2 text-slate-800 dark:text-slate-100">
                    Daily Meme Hub
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Curated positive visuals to brighten your day
                  </p>
                </button>

                {/* Indian Music Button */}
                <button
                  onClick={() => {
                    setActiveSection('music');
                    fetchMusicRecommendations();
                  }}
                  className="group p-10 glass-card hover:border-pink-300 dark:hover:border-pink-600 transition-colors"
                >
                  <div className="text-6xl mb-4 text-center">🎵</div>
                  <h3 className="text-2xl font-semibold mb-2 text-slate-800 dark:text-slate-100">
                    Indian Music Recommendations
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Soulful songs matched to your emotional state
                  </p>
                </button>
              </div>
            )}

            {/* Meme Section */}
            {activeSection === 'meme' && (
              <div className="max-w-3xl mx-auto animate-fade-in">
                <div className="glass-card p-8">
                  <button
                    onClick={() => setActiveSection(null)}
                    className="mb-6 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 transition-colors"
                  >
                    ← Back
                  </button>

                  <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-6 text-center">
                    😂 Daily Meme Hub
                  </h2>

                  {loadingMeme ? (
                    <div className="text-center py-20">
                      <div className="w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">Finding something fun for you...</p>
                    </div>
                  ) : dailyMeme ? (
                    <div>
                      <div className="relative rounded-xl overflow-hidden mb-6">
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
                          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                          📷 Photo by {dailyMeme.photographer}
                        </a>
                        <button
                          onClick={toggleBookmark}
                          className="text-2xl hover:opacity-70 transition-opacity"
                        >
                          {dailyMeme.bookmarked ? '⭐' : '☆'}
                        </button>
                      </div>

                      <button
                        onClick={fetchDailyMeme}
                        className="w-full btn-primary"
                      >
                        Show Me Another 🎲
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-slate-600 dark:text-slate-400">Click the button above to load a meme!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Music Section */}
            {activeSection === 'music' && (
              <div className="max-w-4xl mx-auto animate-fade-in">
                <div className="glass-card p-8">
                  <button
                    onClick={() => setActiveSection(null)}
                    className="mb-6 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 transition-colors"
                  >
                    ← Back
                  </button>

                  <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-6 text-center">
                    🎵 Indian Music Recommendations
                  </h2>

                  {loadingMusic ? (
                    <div className="text-center py-20">
                      <div className="w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">Curating music for your mood...</p>
                    </div>
                  ) : musicRecs && musicRecs.songs ? (
                    <div>
                      <div className="bg-purple-50 dark:bg-purple-950 rounded-xl p-4 mb-6 text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400">You're feeling:</p>
                        <p className="text-xl font-semibold text-purple-600 dark:text-purple-400">{musicRecs.emotion}</p>
                      </div>

                      {musicRecs.reasoning && (
                        <div className="bg-pink-50 dark:bg-pink-950 rounded-xl p-4 mb-6">
                          <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{musicRecs.reasoning}"</p>
                        </div>
                      )}

                      <div className="space-y-4 mb-6">
                        {musicRecs.songs.map((song, index) => (
                          <div
                            key={index}
                            className="message-user p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">
                                  {index + 1}. {song.title}
                                </h4>
                                <p className="text-slate-600 dark:text-slate-400">{song.artist}</p>
                                <span className="inline-block mt-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-950 rounded-full text-xs text-emerald-700 dark:text-emerald-300">
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
                        className="w-full btn-primary"
                      >
                        Refresh Recommendations 🔄
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-slate-600 dark:text-slate-400">Loading music recommendations...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </main>
    </RequireAuth>
  );
}
