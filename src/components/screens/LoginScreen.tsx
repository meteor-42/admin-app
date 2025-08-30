import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
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
import { colors, spacing, borderRadius, typography } from '../../../theme/colors';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && user.is_admin) {
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loginCard}>
            {/* Logo/Title Section */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>В Х О Д</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>E-Mail</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  mode="flat"
                  style={styles.input}
                  placeholder="o.palmieri@ya.ru"
                  placeholderTextColor={colors.zinc[400]}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  textColor={colors.foreground}
                  theme={{
                    colors: {
                      primary: colors.primary,
                      background: colors.zinc[50],
                    },
                  }}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Пароль</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  mode="flat"
                  style={styles.input}
                  placeholder="Введите пароль"
                  placeholderTextColor={colors.zinc[400]}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  textColor={colors.foreground}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                      color={colors.zinc[400]}
                      size={20}
                    />
                  }
                  theme={{
                    colors: {
                      primary: colors.primary,
                      background: colors.zinc[50],
                    },
                  }}
                />
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={styles.buttonText}>Войти</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loginCard: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryForeground,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
  },
  formSection: {
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.zinc[50],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    fontSize: typography.fontSize.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primaryForeground,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  footerLink: {
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
    fontWeight: typography.fontWeight.medium,
  },
});

export default LoginScreen;
