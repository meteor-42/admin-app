import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';

// Import contexts
import { PocketBaseProvider } from './src/components/contexts/PocketBaseContext';
import { AuthProvider, useAuth } from './src/components/contexts/AuthContext';

// Import screens
import LoginScreen from './src/components/screens/LoginScreen';
import MatchListScreen from './src/components/screens/MatchListScreen';

// Import theme
import { colors } from './theme/colors';

const Stack = createStackNavigator();

// Кастомная темная тема
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    onPrimary: colors.primaryForeground,
    primaryContainer: colors.secondary,
    onPrimaryContainer: colors.secondaryForeground,
    secondary: colors.secondary,
    onSecondary: colors.secondaryForeground,
    secondaryContainer: colors.muted,
    onSecondaryContainer: colors.mutedForeground,
    background: colors.background,
    onBackground: colors.foreground,
    surface: colors.card,
    onSurface: colors.cardForeground,
    surfaceVariant: colors.muted,
    onSurfaceVariant: colors.mutedForeground,
    outline: colors.border,
    elevation: {
      level0: 'transparent',
      level1: colors.card,
      level2: colors.card,
      level3: colors.card,
      level4: colors.card,
      level5: colors.card,
    },
  },
};

function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // You can add a loading screen here
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 16,
        },
      }}
    >
      {user ? (
        <>
          <Stack.Screen
            name="MatchList"
            component={MatchListScreen}
            options={{ headerShown: false }}
          />
          {/* <Stack.Screen
            name="MatchEdit"
            component={MatchEditScreen}
            options={{ title: 'Редактировать' }}
          /> */}
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <PocketBaseProvider>
          <AuthProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
            <StatusBar style="light" />
          </AuthProvider>
        </PocketBaseProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
