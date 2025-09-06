import React, { createContext, useContext, useEffect } from 'react';
import PocketBase from 'pocketbase';
import Constants from 'expo-constants';

// Читаем базовый URL из expo.extra (app.json)
const getServerURL = () => {
  const extra = (Constants?.expoConfig as any)?.extra || {};
  const url = extra.apiBaseUrl as string | undefined;
  return url || 'http://xn--d1aigb4b.xn--p1ai:8090';
};

const PB_URL = getServerURL();

if (__DEV__) {
  console.log('🏗️ [PocketBase] Инициализация PocketBase с URL:', PB_URL);
}

const pb = new PocketBase(PB_URL);

// Настройка логирования запросов (только dev)
pb.beforeSend = function (url, options) {
  if (__DEV__) {
    console.log('🌐 [PocketBase] Отправляем запрос:', {
      url: url,
      method: options.method || 'GET',
    });
  }

  return { url, options };
};

pb.afterSend = function (response, data) {
  if (__DEV__) {
    console.log('📡 [PocketBase] Ответ получен:', {
      status: response.status,
      ok: response.ok,
      url: response.url,
    });
  }

  return data;
};

// Логи authStore только в dev
if (__DEV__) {
  pb.authStore.onChange((token, model) => {
    console.log('🔄 [PocketBase] AuthStore изменился:', {
      hasToken: !!token,
      hasModel: !!model,
      isValid: pb.authStore.isValid,
      modelType: model?.collectionName || 'unknown',
    });
  });
}

const PocketBaseContext = createContext<PocketBase | undefined>(undefined);

export const PocketBaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Проверяем доступность сервера при инициализации
    const checkServerHealth = async () => {
      try {
        if (__DEV__) {
          console.log('🔍 [PocketBase] Проверяем доступность сервера...');
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(PB_URL + '/api/health', {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (__DEV__) {
          console.log(response.ok ? '✅ [PocketBase] Сервер доступен' : `⚠️ [PocketBase] Сервер отвечает с ошибкой: ${response.status}`);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('❌ [PocketBase] Сервер недоступен:', error);
          console.error('🔧 [PocketBase] Проверьте URL сервера:', PB_URL);
        }
      }
    };

    checkServerHealth();
  }, []);

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
