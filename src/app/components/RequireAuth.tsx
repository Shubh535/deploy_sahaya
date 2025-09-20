// RequireAuth component to protect pages/routes
'use client';
import React from 'react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen text-lg">Loading...</div>;
  }
  return <>{children}</>;
}
