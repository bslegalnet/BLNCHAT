'use client';

import { useEffect, useState } from 'react';
import { isSeeded, markSeeded, saveClients, getDashboardSettings } from '@/lib/storage';
import { seedClients, seedMessages } from '@/lib/seed-data';
import { STORAGE_KEYS } from '@/lib/constants';

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSeeded()) {
      saveClients(seedClients);
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(seedMessages));
      markSeeded();
    }
    
    // Set theme
    const settings = getDashboardSettings();
    const theme = settings.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
