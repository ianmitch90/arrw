'use client';

import React, { createContext, useContext } from 'react';
import { sessionManager } from '@/utils/auth/session';

const SessionManagerContext = createContext(sessionManager);

export function SessionManagerProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionManagerContext.Provider value={sessionManager}>
      {children}
    </SessionManagerContext.Provider>
  );
}

export const useSessionManager = () => {
  const context = useContext(SessionManagerContext);
  if (!context) {
    throw new Error('useSessionManager must be used within a SessionManagerProvider');
  }
  return context;
};
