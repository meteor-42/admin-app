import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  ActivityIndicator,
  Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { usePocketBase } from '../contexts/PocketBaseContext';
import { useAuth } from '../contexts/AuthContext';
import { Match } from '../types';
import MatchCard from '../MatchCard';
import { globalStyles } from '../../../theme/theme';

const MatchListScreen: React.FC = () => {
  const navigation = useNavigation();
  const pb = usePocketBase();
  const { logout } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log('🚀 [MatchListScreen] Компонент смонтирован, запускаем загрузку матчей');
    console.log(`🎫 [MatchListScreen] Начальное состояние PocketBase: isValid=${pb.authStore.isValid}, hasToken=${!!pb.authStore.token}`);
    loadMatches();
  }, []);

  const loadMatches = async (attempt = 1) => {
    const maxAttempts = 3;

    console.log(`🔄 [loadMatches] Попытка ${attempt}/${maxAttempts} загрузки матчей`);
    console.log(`🎫 [loadMatches] PocketBase authStore.isValid: ${pb.authStore.isValid}`);
    console.log(`🔑 [loadMatches] PocketBase authStore.token: ${!!pb.authStore.token}`);
    console.log(`👤 [loadMatches] PocketBase authStore.model: ${!!pb.authStore.model}`);

    // Проверяем готовность аутентификации
    if (!pb.authStore.isValid) {
      if (attempt < maxAttempts) {
        console.log(`⚠️ [loadMatches] PocketBase не готов, повторяем через ${200 * attempt}мс`);
        setTimeout(() => loadMatches(attempt + 1), 200 * attempt);
        return;
      } else {
        console.error(`❌ [loadMatches] PocketBase не готов после ${maxAttempts} попыток`);
        Alert.alert('Ошибка', 'Проблема с аутентификацией');
        setLoading(false);
        setRefreshing(false);
        return;
      }
    }

    try {
      console.log('🌐 [loadMatches] Отправляем запрос к API...');
      const records = await pb.collection('matches').getFullList<Match>({
        sort: '-starts_at',
      });
      console.log(`✅ [loadMatches] Успешно загружено матчей: ${records.length}`);
      console.log(`📊 [loadMatches] Первый матч:`, records[0] ? {
        id: records[0].id,
        league: records[0].league,
        teams: `${records[0].home_team} vs ${records[0].away_team}`
      } : 'нет матчей');

      setMatches(records);
    } catch (error: any) {
      console.error(`❌ [loadMatches] Ошибка на попытке ${attempt}:`, error);
      console.log(`🔍 [loadMatches] Детали ошибки:`, {
        message: error?.message,
        status: error?.status,
        data: error?.data,
        url: error?.url,
        isAbort: error?.isAbort
      });

      // Определяем тип ошибки для лучшего retry
      const isNetworkError = error?.status === 0 || error?.message?.includes('Network') || error?.message?.includes('timeout');
      const isServerError = error?.status >= 500;
      const shouldRetry = isNetworkError || isServerError;

      if (attempt < maxAttempts && shouldRetry) {
        const retryDelay = isNetworkError ? 2000 * attempt : 1000 * attempt; // Больше времени для сетевых ошибок
        console.log(`🔄 [loadMatches] ${isNetworkError ? 'Сетевая ошибка' : 'Ошибка сервера'} - повторяем через ${retryDelay}мс...`);
        setTimeout(() => loadMatches(attempt + 1), retryDelay);
        return;
      } else if (attempt < maxAttempts) {
        console.log(`⚠️ [loadMatches] Ошибка ${error?.status} не требует повтора, но попробуем еще раз`);
        setTimeout(() => loadMatches(attempt + 1), 500);
        return;
      } else {
        console.error(`❌ [loadMatches] Окончательная ошибка после ${maxAttempts} попыток`);

        // Более информативное сообщение об ошибке
        let errorMessage = 'Неизвестная ошибка';
        if (isNetworkError) {
          errorMessage = 'Проблема с сетью. Проверьте интернет соединение.';
        } else if (error?.status === 401) {
          errorMessage = 'Ошибка авторизации. Попробуйте войти заново.';
        } else if (error?.status >= 500) {
          errorMessage = 'Сервер временно недоступен. Попробуйте позже.';
        } else if (error?.message) {
          errorMessage = error.message;
        }

        Alert.alert('Ошибка загрузки', errorMessage);
      }
    } finally {
      if (attempt >= maxAttempts || pb.authStore.isValid) {
        console.log(`🏁 [loadMatches] Завершаем loading состояние`);
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const handleRefresh = useCallback(() => {
    console.log('🔄 [MatchListScreen] Пользователь инициировал обновление списка');
    setRefreshing(true);
    loadMatches();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' as never }],
            });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Custom Header with logout icon */}
      <View style={globalStyles.header}>
        <View style={globalStyles.headerIcon} />
        <TouchableOpacity
          style={globalStyles.headerIcon}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={globalStyles.logoutIcon}>⎋</Text>
        </TouchableOpacity>
      </View>


      {/* Match List */}
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            onPress={() => {}} // Убрано редактирование
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#ffffff']}
            tintColor={'#ffffff'}
          />
        }
        contentContainerStyle={globalStyles.listContent}
        ListEmptyComponent={
          <View style={globalStyles.emptyContainer}>
            <Text style={globalStyles.emptyIcon}>□</Text>
            <Text style={globalStyles.emptyTitle}>Нет команд</Text>
            <Text style={globalStyles.emptyText}>
              Команды не найдены
            </Text>
          </View>
        }
      />

    </SafeAreaView>
  );
};

export default MatchListScreen;
