// frontend/src/components/ProtectedLayout.tsx - Better auth handling
"use client";

import { useAuth } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './Sidebar';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Skip redirect during loading
    if (isLoading) return;

    // Allow login page
    if (pathname === '/login') return;

    // Redirect to login if not authenticated and not already on login page
    if (!user && pathname !== '/login') {
      console.log('🔒 Not authenticated, redirecting to login');
      router.replace('/login'); // Use replace instead of push
      return;
    }

    // Redirect to dashboard if authenticated and on login page
    if (user && pathname === '/login') {
      console.log('✅ Already authenticated, redirecting to dashboard');
      router.replace('/'); // Use replace instead of push
      return;
    }
  }, [user, isLoading, pathname, router]);

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Show dashboard only if authenticated
  if (user) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  // Loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
    </div>
  );
}
