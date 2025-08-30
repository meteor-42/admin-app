import React, { useState, useEffect } from 'react';
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

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { login, user, isLoading } = useAuth();
  // Предзаполненные поля согласно требованиям
  const [email, setEmail] = useState('oleg.palmieri@ya.ru');
  const [password, setPassword] = useState('2BjnKE63!');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MatchList' as never }],
      });
    }
  }, [user, navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Введите email и пароль');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert(
        'Ошибка входа',
        error.message || 'Неправильный email или пароль'
      );
    } finally {
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
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                      color={colors.mutedForeground}
                      size={20}
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
