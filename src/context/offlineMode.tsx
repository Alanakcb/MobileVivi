

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface OfflineModeContextType {
  isOfflineModeEnabled: boolean;
  toggleOfflineMode: () => void;
}

const OfflineModeContext = createContext<OfflineModeContextType>({
  isOfflineModeEnabled: false,
  toggleOfflineMode: () => {},
});

export const useOfflineMode = () => useContext(OfflineModeContext);

interface OfflineModeProviderProps {
  children: ReactNode;
}

export const OfflineModeProvider: React.FC<OfflineModeProviderProps> = ({ children }) => {
  const [isOfflineModeEnabled, setIsOfflineModeEnabled] = useState(false);

  const toggleOfflineMode = () => {
    setIsOfflineModeEnabled(prev => !prev);
  };

  return (
    <OfflineModeContext.Provider value={{ isOfflineModeEnabled, toggleOfflineMode }}>
      {children}
    </OfflineModeContext.Provider>
  );
};
