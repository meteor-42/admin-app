import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';

// Import contexts
import { PocketBaseProvider } from './src/components/contexts/PocketBaseContext';
import { AuthProvider, useAuth } from './src/components/contexts/AuthContext';

// Import screens
import LoginScreen from './src/components/screens/LoginScreen';
import MatchListScreen from './src/components/screens/MatchListScreen';

// Import styles
import { colors } from './theme/theme';

const Stack = createStackNavigator();

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
      <PaperProvider>
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
