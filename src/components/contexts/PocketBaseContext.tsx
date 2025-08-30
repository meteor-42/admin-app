import React, { createContext, useContext } from 'react';
import PocketBase from 'pocketbase';

// Настройка URL для PocketBase
// URL сервера согласно требованиям
const PB_URL = 'http://xn--d1aigb4b.xn--p1ai:8090';

const pb = new PocketBase(PB_URL);

const PocketBaseContext = createContext<PocketBase | undefined>(undefined);

export const PocketBaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PocketBaseContext.Provider value={pb}>
      {children}
    </PocketBaseContext.Provider>
  );
};

export const usePocketBase = () => {
  const context = useContext(PocketBaseContext);
  if (!context) {
    throw new Error('usePocketBase must be used within a PocketBaseProvider');
  }
  return context;
};
