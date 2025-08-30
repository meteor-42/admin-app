import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePocketBase } from './PocketBaseContext';
import { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pb = usePocketBase();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('🔄 [checkAuth] Начинаем проверку аутентификации');
    try {
      const token = await AsyncStorage.getItem('pb_auth');
      console.log(`🔑 [checkAuth] Токен в AsyncStorage: ${!!token}`);

      if (token) {
        console.log('📝 [checkAuth] Парсим сохраненные данные аутентификации');
        const authData = JSON.parse(token);
        console.log(`🎫 [checkAuth] Данные токена: ${!!authData.token}, модель: ${!!authData.model}`);

        console.log('💾 [checkAuth] Восстанавливаем сессию в PocketBase...');
        pb.authStore.save(authData.token, authData.model);

        // Увеличиваем задержку для полной инициализации PocketBase
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log(`✅ [checkAuth] PocketBase authStore.isValid: ${pb.authStore.isValid}`);
        console.log(`🔐 [checkAuth] PocketBase authStore.token: ${!!pb.authStore.token}`);
        console.log(`👤 [checkAuth] PocketBase authStore.model: ${!!pb.authStore.model}`);

        if (pb.authStore.isValid) {
          console.log('🎉 [checkAuth] Аутентификация успешна, устанавливаем пользователя');
          setAuthState({
            user: pb.authStore.model as User,
            token: pb.authStore.token,
            isLoading: false,
          });
        } else {
          console.log('⚠️ [checkAuth] Токен невалиден, выполняем logout');
          await logout();
        }
      } else {
        console.log('📭 [checkAuth] Нет сохраненного токена, пользователь не авторизован');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error: any) {
      console.error('❌ [checkAuth] Ошибка проверки аутентификации:', error);
      console.log('🔍 [checkAuth] Детали ошибки:', {
        message: error?.message,
        stack: error?.stack
      });
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (email: string, password: string) => {
    console.log('🔐 [login] Начинаем процесс авторизации');
    console.log(`📧 [login] Email: ${email}`);
    console.log(`🔗 [login] PocketBase URL: ${pb.baseUrl}`);

    try {
      console.log('🌐 [login] Отправляем запрос авторизации к _superusers...');
      // Используем коллекцию _superusers согласно документации
      const authData = await pb.collection('_superusers').authWithPassword(email, password);

      console.log('✅ [login] Авторизация успешна');
      console.log(`👤 [login] Получен пользователь: ${authData.record?.email || 'unknown'}`);
      console.log(`🎫 [login] Токен получен: ${!!authData.token}`);
      console.log(`🔐 [login] PocketBase authStore.isValid: ${pb.authStore.isValid}`);

      console.log('💾 [login] Сохраняем данные в AsyncStorage...');
      await AsyncStorage.setItem('pb_auth', JSON.stringify({
        token: pb.authStore.token,
        model: pb.authStore.model,
      }));
      console.log('✅ [login] Данные сохранены в AsyncStorage');

      // Добавляем небольшую задержку для стабилизации состояния
      await new Promise(resolve => setTimeout(resolve, 50));

      console.log('🎉 [login] Устанавливаем состояние пользователя');
      setAuthState({
        user: authData.record as User,
        token: pb.authStore.token,
        isLoading: false,
      });

      console.log('🚀 [login] Авторизация завершена успешно');
    } catch (error: any) {
      console.error('❌ [login] Ошибка авторизации:', error);
      console.log('🔍 [login] Детали ошибки:', {
        message: error?.message,
        status: error?.status,
        data: error?.data,
        url: error?.url
      });
      throw error;
    }
  };

  const logout = async () => {
    console.log('🚪 [logout] Начинаем процесс выхода');

    console.log('🗑️ [logout] Очищаем PocketBase authStore');
    pb.authStore.clear();

    console.log('💾 [logout] Удаляем данные из AsyncStorage');
    await AsyncStorage.removeItem('pb_auth');

    console.log('🔄 [logout] Сбрасываем состояние пользователя');
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
    });

    console.log('✅ [logout] Выход завершен');
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
