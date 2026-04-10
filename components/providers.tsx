'use client';

import { useEffect, useState } from 'react';
import { isSeeded, markSeeded, saveClients, getDashboardSettings } from '@/lib/storage';
import { seedClients, seedMessages } from '@/lib/seed-data';
import { STORAGE_KEYS } from '@/lib/constants';

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Seed data if needed
    if (!isSeeded()) {
      saveClients(seedClients);
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(seedMessages));
      markSeeded();
    }
    
    // Set theme
    const settings = getDashboardSettings();
    const theme = settings.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    
    // Small delay to ensure localStorage is ready
    setTimeout(() => setReady(true), 100);
  }, []);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
