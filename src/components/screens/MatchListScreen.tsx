import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { globalStyles, colors } from '../../../theme/theme';

const MatchListScreen: React.FC = () => {
  const navigation = useNavigation();
  const pb = usePocketBase();
  const { logout } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'live' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');

  // Используем ref для отслеживания монтирования компонента
  const isMounted = useRef(true);
  // Используем ref для предотвращения параллельных запросов
  const loadingRef = useRef(false);

  useEffect(() => {
    if (__DEV__) {
      console.log('🚀 [MatchListScreen] Компонент смонтирован, запускаем загрузку матчей');
      console.log(`🎫 [MatchListScreen] Начальное состояние PocketBase: isValid=${pb.authStore.isValid}, hasToken=${!!pb.authStore.token}`);
    }

    // Сбрасываем флаг монтирования
    isMounted.current = true;

    // Загружаем матчи с небольшой задержкой для стабилизации состояния
    const timeoutId = setTimeout(() => {
      if (isMounted.current) {
        loadMatches();
      }
    }, 100);

    // Cleanup функция
    return () => {
      if (__DEV__) {
        console.log('🧹 [MatchListScreen] Cleanup: компонент размонтируется');
      }
      isMounted.current = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Перезагрузка при смене фильтра
  useEffect(() => {
    if (!loadingRef.current && isMounted.current) {
      setLoading(true);
      loadMatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadMatches = async (attempt = 1) => {
    const maxAttempts = 3;

    // Предотвращаем параллельные запросы
    if (loadingRef.current && attempt === 1) {
      if (__DEV__) console.log('⏸️ [loadMatches] Уже идет загрузка, пропускаем');
      return;
    }

    // Проверяем, что компонент все еще смонтирован
    if (!isMounted.current) {
      if (__DEV__) console.log('🚫 [loadMatches] Компонент размонтирован, отменяем загрузку');
      return;
    }

    loadingRef.current = true;

    if (__DEV__) {
      console.log(`🔄 [loadMatches] Попытка ${attempt}/${maxAttempts} загрузки матчей`);
      console.log(`🎫 [loadMatches] PocketBase authStore.isValid: ${pb.authStore.isValid}`);
      console.log(`👤 [loadMatches] PocketBase authStore.model: ${!!pb.authStore.model}`);
    }

    // Проверяем готовность аутентификации
    if (!pb.authStore.isValid) {
      if (attempt < maxAttempts) {
        if (__DEV__) console.log(`⚠️ [loadMatches] PocketBase не готов, повторяем через ${300 * attempt}мс`);
        setTimeout(() => {
          if (isMounted.current) {
            loadMatches(attempt + 1);
          }
        }, 300 * attempt);
        return;
      } else {
        console.error(`❌ [loadMatches] PocketBase не готов после ${maxAttempts} попыток`);
        if (isMounted.current) {
          Alert.alert('Ошибка', 'Проблема с аутентификацией');
          setLoading(false);
          setRefreshing(false);
        }
        loadingRef.current = false;
        return;
      }
    }

    try {
      if (__DEV__) console.log('🌐 [loadMatches] Отправляем запрос к API...');

      // Серверная фильтрация
      const filter = `status = "${statusFilter}"`;
      const records = await pb.collection('matches').getFullList<Match>({
        sort: '-starts_at',
        filter,
      });

      if (!isMounted.current) {
        if (__DEV__) console.log('🚫 [loadMatches] Компонент размонтирован после запроса');
        return;
      }

      if (__DEV__) {
        console.log(`✅ [loadMatches] Успешно загружено матчей: ${records.length}`);
        console.log(`📊 [loadMatches] Первый матч:`, records[0] ? {
          id: records[0].id,
          league: records[0].league,
          teams: `${records[0].home_team} vs ${records[0].away_team}`
        } : 'нет матчей');
      }

      setMatches(records);
    } catch (error: any) {
      if (!isMounted.current) return;

      console.error(`❌ [loadMatches] Ошибка на попытке ${attempt}:`, error);
      if (__DEV__) {
        console.log(`🔍 [loadMatches] Детали ошибки:`, {
          message: error?.message,
          status: error?.status,
          data: error?.data,
          url: error?.url,
        });
      }

      // Определяем тип ошибки для лучшего retry
      const isNetworkError = error?.status === 0 || error?.message?.includes('Network') || error?.message?.includes('timeout');
      const isServerError = error?.status >= 500;
      const shouldRetry = isNetworkError || isServerError;

      if (attempt < maxAttempts && shouldRetry && isMounted.current) {
        const retryDelay = isNetworkError ? 2000 * attempt : 1000 * attempt;
        if (__DEV__) console.log(`🔄 [loadMatches] ${isNetworkError ? 'Сетевая ошибка' : 'Ошибка сервера'} - повторяем через ${retryDelay}мс...`);
        setTimeout(() => {
          if (isMounted.current) {
            loadMatches(attempt + 1);
          }
        }, retryDelay);
        return;
      } else if (attempt >= maxAttempts) {
        console.error(`❌ [loadMatches] Окончательная ошибка после ${maxAttempts} попыток`);

        if (!isMounted.current) return;

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
      if (isMounted.current && (attempt >= maxAttempts || pb.authStore.isValid)) {
        if (__DEV__) console.log(`🏁 [loadMatches] Завершаем loading состояние`);
        setLoading(false);
        setRefreshing(false);
        loadingRef.current = false;
      }
    }
  };

  const handleRefresh = useCallback(() => {
    if (__DEV__) console.log('🔄 [MatchListScreen] Пользователь инициировал обновление списка');
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

  const filtered = matches.filter((m) => ( m.status === statusFilter));

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Header with logout on the right */}
      <View style={[globalStyles.header, { justifyContent: 'flex-end' }]}>
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          {/* Простая и центрированная стрелка выхода */}
          <Text style={{
            fontSize: 14,
            color: colors.zinc[300],
            backgroundColor: colors.zinc[900],
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}>
            Выход
          </Text>
        </TouchableOpacity>
      </View>

      {/* Фильтры статуса */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
        {(['upcoming', 'live', 'completed', 'cancelled'] as const).map((st) => (
          <TouchableOpacity
            key={st}
            onPress={() => setStatusFilter(st)}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: statusFilter === st ? '#FFFFFF' : '#333333',
              backgroundColor: statusFilter === st ? '#111111' : '#0b0b0b',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14 }}>
              {st === 'live' ? 'Live' : st === 'upcoming' ? 'Ожидается' : st === 'completed' ? 'Завершен' : 'Отменен'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Match List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MatchCard
            match={item}
            onPress={() => {}}
            index={index}
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
        contentContainerStyle={[globalStyles.listContent, filtered.length === 0 ? { flex: 1, justifyContent: 'center' } : undefined]}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
            <Text style={{ fontSize: 42, color: '#444', marginBottom: 8 }}>⚽</Text>
            <Text style={{ fontSize: 14, color: '#9ca3af' }}>Ничего не найдено</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default MatchListScreen;
