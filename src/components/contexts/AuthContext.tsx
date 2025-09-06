import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePocketBase } from './PocketBaseContext';
import { User, AuthState } from '../types';

/* eslint-disable @typescript-eslint/no-unused-vars */
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
/* eslint-enable @typescript-eslint/no-unused-vars */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pb = usePocketBase();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  const logout = useCallback(async () => {
    if (__DEV__) console.warn('🚪 [logout] Начинаем процесс выхода');

    if (__DEV__) console.warn('🗑️ [logout] Очищаем PocketBase authStore');
    pb.authStore.clear();

    if (__DEV__) console.warn('💾 [logout] Удаляем данные из AsyncStorage');
    await AsyncStorage.removeItem('pb_auth');

    if (__DEV__) console.warn('🔄 [logout] Сбрасываем состояние пользователя');
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
    });

    if (__DEV__) console.warn('✅ [logout] Выход завершен');
  }, [pb.authStore]);

  const checkAuth = useCallback(async () => {
    if (__DEV__) console.warn('🔄 [checkAuth] Начинаем проверку аутентификации');
    try {
      const token = await AsyncStorage.getItem('pb_auth');
      if (__DEV__) console.warn(`🔑 [checkAuth] Токен в AsyncStorage: ${!!token}`);

      if (token) {
        if (__DEV__) console.warn('📝 [checkAuth] Парсим сохраненные данные аутентификации');
        const authData = JSON.parse(token);
        if (__DEV__) console.warn(`🎫 [checkAuth] Данные токена: ${!!authData.token}, модель: ${!!authData.model}`);

        if (__DEV__) console.warn('💾 [checkAuth] Восстанавливаем сессию в PocketBase...');
        pb.authStore.save(authData.token, authData.model);

        // Увеличиваем задержку для полной инициализации PocketBase
        await new Promise(resolve => setTimeout(resolve, 100));

        if (__DEV__) {
          console.warn(`✅ [checkAuth] PocketBase authStore.isValid: ${pb.authStore.isValid}`);
          console.warn(`🔐 [checkAuth] PocketBase authStore.token: ${!!pb.authStore.token}`);
          console.warn(`👤 [checkAuth] PocketBase authStore.model: ${!!pb.authStore.model}`);
        }

        if (pb.authStore.isValid) {
          if (__DEV__) console.warn('🎉 [checkAuth] Аутентификация успешна, устанавливаем пользователя');
          setAuthState({
            user: pb.authStore.model as User,
            token: pb.authStore.token,
            isLoading: false,
          });
        } else {
          if (__DEV__) console.warn('⚠️ [checkAuth] Токен невалиден, выполняем logout');
          await logout();
        }
      } else {
        if (__DEV__) console.warn('📭 [checkAuth] Нет сохраненного токена, пользователь не авторизован');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error: unknown) {
      console.error('❌ [checkAuth] Ошибка проверки аутентификации:', error);
      if (__DEV__) {
        console.warn('🔍 [checkAuth] Детали ошибки:', {
          message: (error as any)?.message,
          stack: (error as any)?.stack
        });
      }
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [pb.authStore, logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    if (__DEV__) {
      console.warn('🔐 [login] Начинаем процесс авторизации');
      console.warn(`📧 [login] Email: ${email}`);
      console.warn(`🔗 [login] PocketBase URL: ${pb.baseUrl}`);
    }

    try {
      if (__DEV__) console.warn('🌐 [login] Отправляем запрос авторизации к _superusers...');
      // Используем коллекцию _superusers согласно документации
      const authData = await pb.collection('_superusers').authWithPassword(email, password);

      if (__DEV__) {
        console.warn('✅ [login] Авторизация успешна');
        console.warn(`👤 [login] Получен пользователь: ${authData.record?.email || 'unknown'}`);
        console.warn(`🎫 [login] Токен получен: ${!!authData.token}`);
        console.warn(`🔐 [login] PocketBase authStore.isValid: ${pb.authStore.isValid}`);
      }

      if (__DEV__) console.warn('💾 [login] Сохраняем данные в AsyncStorage...');
      await AsyncStorage.setItem('pb_auth', JSON.stringify({
        token: pb.authStore.token,
        model: pb.authStore.model,
      }));
      if (__DEV__) console.warn('✅ [login] Данные сохранены в AsyncStorage');

      // Добавляем небольшую задержку для стабилизации состояния
      await new Promise(resolve => setTimeout(resolve, 50));

      if (__DEV__) console.warn('🎉 [login] Устанавливаем состояние пользователя');
      setAuthState({
        user: authData.record as User,
        token: pb.authStore.token,
        isLoading: false,
      });

      if (__DEV__) console.warn('🚀 [login] Авторизация завершена успешно');
    } catch (error: unknown) {
      console.error('❌ [login] Ошибка авторизации:', error);
      if (__DEV__) {
        console.warn('🔍 [login] Детали ошибки:', {
          // narrow as any for logging only
          message: (error as any)?.message,
          status: (error as any)?.status,
          data: (error as any)?.data,
          url: (error as any)?.url,
          name: (error as any)?.name
        });
      }

      // Улучшенная обработка сетевых ошибок
      let userFriendlyMessage = 'Ошибка авторизации';

      if ((error as any)?.name === 'TypeError' && (error as any)?.message?.includes('fetch')) {
        userFriendlyMessage = 'Проблема с сетью. Проверьте интернет соединение.';
        console.error('🌐 [login] Сетевая ошибка - сервер недоступен');
      } else if ((error as any)?.status === 400) {
        userFriendlyMessage = 'Неверный email или пароль';
      } else if ((error as any)?.status === 0 || (error as any)?.message?.includes('Network request failed')) {
        userFriendlyMessage = 'Сервер недоступен. Проверьте подключение к интернету.';
        console.error('🌐 [login] Сетевая ошибка - нет подключения к серверу');
      } else if ((error as any)?.status >= 500) {
        userFriendlyMessage = 'Ошибка сервера. Попробуйте позже.';
      }

      // Создаем новую ошибку с понятным сообщением
      const friendlyError = new Error(userFriendlyMessage);
      (friendlyError as any).originalError = error as any;
      throw friendlyError;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
