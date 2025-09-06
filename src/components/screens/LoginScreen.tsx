import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Text,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { globalStyles, colors } from '../../../theme/theme';
import { ApiError } from '../types';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { login, user, isLoading } = useAuth();
  // Предзаполненные поля согласно требованиям
  const [email, setEmail] = useState('oleg.palmieri@ya.ru');
  const [password, setPassword] = useState('2BjnKE63!');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Используем ref для предотвращения двойной навигации
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (user && !hasNavigated.current) {
      if (__DEV__) {
        console.warn('🚀 [LoginScreen] Пользователь авторизован, переходим к списку матчей');
        console.warn(`👤 [LoginScreen] Данные пользователя: ${user.email}`);
      }

      // Устанавливаем флаг, чтобы предотвратить повторную навигацию
      hasNavigated.current = true;

      // Небольшая задержка для завершения анимации
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MatchList' as never }],
        });
      }, 100);
    }
  }, [user, navigation]);

  const handleLogin = async () => {
    if (__DEV__) console.warn('🔐 [LoginScreen] Пользователь нажал кнопку входа');

    if (!email || !password) {
      if (__DEV__) console.warn('⚠️ [LoginScreen] Пустые поля email или пароль');
      Alert.alert('Ошибка', 'Введите email и пароль');
      return;
    }

    // Предотвращаем повторные нажатия
    if (loading) {
      if (__DEV__) console.warn('⏸️ [LoginScreen] Уже идет авторизация, пропускаем');
      return;
    }

    if (__DEV__) console.warn('🔄 [LoginScreen] Начинаем процесс авторизации');
    setLoading(true);
    try {
      await login(email, password);
      if (__DEV__) console.warn('✅ [LoginScreen] Авторизация завершена успешно');
      // Не сбрасываем loading здесь, так как будет переход на другой экран
    } catch (error: unknown) {
      console.error('❌ [LoginScreen] Ошибка авторизации:', error);

      // Более детальная обработка ошибок
      let errorMessage = 'Неправильный email или пароль';
      const apiError = error as ApiError;

      if (apiError.status === 0 || apiError.message?.includes('Network')) {
        errorMessage = 'Проблема с сетью. Проверьте интернет соединение.';
      } else if (apiError.status === 400) {
        errorMessage = 'Неверный email или пароль';
      } else if (apiError.status && apiError.status >= 500) {
        errorMessage = 'Сервер временно недоступен. Попробуйте позже.';
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }

      Alert.alert('Ошибка входа', errorMessage);

      // Сбрасываем loading только при ошибке
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={globalStyles.loginLoadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={globalStyles.loginContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={globalStyles.loginKeyboardView}
      >
        <ScrollView
          contentContainerStyle={globalStyles.loginScrollView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={globalStyles.loginCard}>
            {/* Logo/Title Section */}
            <View style={globalStyles.loginHeaderSection}>
              <Text style={globalStyles.loginTitle}>В Х О Д</Text>
            </View>

            {/* Form Section */}
            <View style={globalStyles.loginFormSection}>
              <View style={globalStyles.loginInputContainer}>
                <Text style={globalStyles.loginLabel}>E-Mail</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  mode="flat"
                  style={globalStyles.loginInput}
                  placeholder="oleg.palmieri@ya.ru"
                  placeholderTextColor={colors.mutedForeground}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  textColor={colors.foreground}
                  editable={!loading}
                  theme={{
                    colors: {
                      primary: colors.primary,
                      background: colors.input,
                    },
                  }}
                />
              </View>

              <View style={globalStyles.loginInputContainer}>
                <Text style={globalStyles.loginLabel}>Пароль</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  mode="flat"
                  style={globalStyles.loginInput}
                  placeholder="2BjnKE63!"
                  placeholderTextColor={colors.mutedForeground}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  textColor={colors.foreground}
                  editable={!loading}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                      color={colors.mutedForeground}
                      size={20}
                      disabled={loading}
                    />
                  }
                  theme={{
                    colors: {
                      primary: colors.primary,
                      background: colors.input,
                    },
                  }}
                />
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[globalStyles.loginButton, loading && globalStyles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={globalStyles.loginButtonText}>Войти</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
