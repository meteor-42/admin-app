import React, { createContext, useContext, useEffect } from 'react';
import PocketBase from 'pocketbase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Конфигурация URL для разных окружений
const getServerURL = () => {
  // В режиме разработки (Expo Go)
  if (__DEV__) {
    return 'http://xn--d1aigb4b.xn--p1ai:8090';
  }

  // В production APK - используем HTTPS или проверенный HTTP
  // Замените на ваш реальный production URL
  return 'http://xn--d1aigb4b.xn--p1ai:8090';
};

const PB_URL = getServerURL();

console.log('🏗️ [PocketBase] Инициализация PocketBase с URL:', PB_URL);
console.log('🔧 [PocketBase] Режим разработки:', __DEV__);
console.log('📱 [PocketBase] Платформа:', Platform.OS);

const pb = new PocketBase(PB_URL);

// Настройка таймаутов для лучшей обработки сетевых ошибок
pb.beforeSend = function (url, options) {
  // Устанавливаем таймаут для запросов
  options.timeout = 10000; // 10 секунд

  console.log('🌐 [PocketBase] Отправляем запрос:', {
    url: url,
    method: options.method || 'GET',
    timeout: options.timeout
  });

  return { url, options };
};

// Добавляем обработку ошибок
pb.afterSend = function (response, data) {
  console.log('📡 [PocketBase] Ответ получен:', {
    status: response.status,
    ok: response.ok,
    url: response.url
  });

  return data;
};

// Добавляем слушатель изменений authStore для дебага
pb.authStore.onChange((token, model) => {
  console.log('🔄 [PocketBase] AuthStore изменился:', {
    hasToken: !!token,
    hasModel: !!model,
    isValid: pb.authStore.isValid,
    modelType: model?.collectionName || 'unknown'
  });
});

const PocketBaseContext = createContext<PocketBase | undefined>(undefined);

export const PocketBaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Проверяем доступность сервера при инициализации
    const checkServerHealth = async () => {
      try {
        console.log('🔍 [PocketBase] Проверяем доступность сервера...');

        // Простой запрос для проверки доступности
        const response = await fetch(PB_URL + '/api/health', {
          method: 'GET',
          timeout: 5000,
        });

        if (response.ok) {
          console.log('✅ [PocketBase] Сервер доступен');
        } else {
          console.warn('⚠️ [PocketBase] Сервер отвечает с ошибкой:', response.status);
        }
      } catch (error) {
        console.error('❌ [PocketBase] Сервер недоступен:', error);
        console.error('🔧 [PocketBase] Проверьте:');
        console.error('   1. Интернет соединение');
        console.error('   2. URL сервера:', PB_URL);
        console.error('   3. Доступность сервера извне');
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
