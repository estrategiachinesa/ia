'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type BBContextType = {
  isSystemOnline: boolean;
  toggleSystemOnline: () => void;
};

const BBContext = createContext<BBContextType | undefined>(undefined);

export function BBProvider({ children }: { children: ReactNode }) {
  const [isSystemOnline, setIsSystemOnline] = useState(false);

  const toggleSystemOnline = () => {
    setIsSystemOnline(prev => !prev);
  };

  return (
    <BBContext.Provider value={{ isSystemOnline, toggleSystemOnline }}>
      {children}
    </BBContext.Provider>
  );
}

export function useBB() {
  const context = useContext(BBContext);
  if (context === undefined) {
    throw new Error('useBB must be used within a BBProvider');
  }
  return context;
}
