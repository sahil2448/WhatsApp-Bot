"use client";

import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './Sidebar';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // Simple redirect logic
  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      window.location.href = '/login';
    }
  }, [user, isLoading, pathname]);

  // Show loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
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

  // Fallback loading
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
    </div>
  );
}
