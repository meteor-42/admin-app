import React, { createContext, useContext } from 'react';
import PocketBase from 'pocketbase';

// Настройка URL для PocketBase
// Используется переменная окружения из .env файла
const PB_URL = process.env.EXPO_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

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
