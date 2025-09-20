// Imagen 2 UI page for image generation
'use client';
import React, { useState } from 'react';
import RequireAuth from '../components/RequireAuth';
import { apiRequest } from '../utils/apiClient';

export default function ImagenPage() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setImageUrl('');
    try {
      // Endpoint disabled on Hobby plan to reduce function count
      throw new Error('Image generation is temporarily unavailable on this deployment.');
    } catch (err: any) {
      setError(err.message || 'Error generating image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequireAuth>
      <main className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8">
        <div className="w-full max-w-lg glass-card flex flex-col items-center gap-2">
          <span className="text-5xl mb-2">🖼️</span>
          <h1 className="text-3xl font-extrabold mb-1 text-indigo-700 drop-shadow">Imagen 2 (AI Art)</h1>
          <p className="mb-2 text-center text-indigo-900 font-medium">Generate images from text prompts using AI (temporarily unavailable on this deployment).</p>
          <form onSubmit={handleGenerate} className="w-full flex flex-col gap-2 mt-4">
            <input
              className="input input-bordered"
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe your image..."
              required
              disabled={loading}
            />
            <button className="btn btn-primary" type="submit" disabled={loading || !prompt.trim()}>{loading ? 'Generating...' : 'Generate'}</button>
          </form>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          {imageUrl && (
            <div className="mt-4 w-full flex flex-col items-center">
              <img src={imageUrl} alt="Generated" className="rounded shadow max-w-xs" />
              <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline mt-2">Open full image</a>
            </div>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}
