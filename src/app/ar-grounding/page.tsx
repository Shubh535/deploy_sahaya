
'use client';
import React from 'react';
import RequireAuth from '../components/RequireAuth';

export default function ARGroundingPage() {
  return (
    <RequireAuth>
      <main className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8">
        <div className="w-full max-w-lg glass-card flex flex-col items-center gap-2">
          <span className="text-5xl mb-2">🪷</span>
          <h1 className="text-3xl font-extrabold mb-1 text-indigo-700 drop-shadow">AR Grounding</h1>
          <p className="mb-2 text-center text-indigo-900 font-medium">AR breathing exercise with WebXR (lotus animation expanding/contracting).</p>
          <div className="w-full mt-4">
            {/* AR Lotus UI will be implemented here */}
            <p className="text-gray-500 text-center">AR Lotus coming soon...</p>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
