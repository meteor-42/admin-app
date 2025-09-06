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
import { globalStyles } from '../../../theme/theme';

const MatchListScreen: React.FC = () => {
  const navigation = useNavigation();
  const pb = usePocketBase();
  const { logout } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'live' | 'upcoming' | 'completed' | 'cancelled' | 'all'>('live');

  // Используем ref для отслеживания монтирования компонента
  const isMounted = useRef(true);
  // Используем ref для предотвращения параллельных запросов
  const loadingRef = useRef(false);
  // AbortController для отмены запросов
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    console.log('🚀 [MatchListScreen] Компонент смонтирован, запускаем загрузку матчей');
    console.log(`🎫 [MatchListScreen] Начальное состояние PocketBase: isValid=${pb.authStore.isValid}, hasToken=${!!pb.authStore.token}`);

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
      console.log('🧹 [MatchListScreen] Cleanup: компонент размонтируется');
      isMounted.current = false;
      clearTimeout(timeoutId);

      // Отменяем активный запрос если он есть
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const loadMatches = async (attempt = 1) => {
    const maxAttempts = 3;

    // Предотвращаем параллельные запросы
    if (loadingRef.current && attempt === 1) {
      console.log('⏸️ [loadMatches] Уже идет загрузка, пропускаем');
      return;
    }

    // Проверяем, что компонент все еще смонтирован
    if (!isMounted.current) {
      console.log('🚫 [loadMatches] Компонент размонтирован, отменяем загрузку');
      return;
    }

    loadingRef.current = true;

    console.log(`🔄 [loadMatches] Попытка ${attempt}/${maxAttempts} загрузки матчей`);
    console.log(`🎫 [loadMatches] PocketBase authStore.isValid: ${pb.authStore.isValid}`);
    console.log(`👤 [loadMatches] PocketBase authStore.model: ${!!pb.authStore.model}`);

    // Проверяем готовность аутентификации
    if (!pb.authStore.isValid) {
      if (attempt < maxAttempts) {
        console.log(`⚠️ [loadMatches] PocketBase не готов, повторяем через ${300 * attempt}мс`);
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
      // Отменяем предыдущий запрос если он есть
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Создаем новый AbortController
      abortControllerRef.current = new AbortController();

      console.log('🌐 [loadMatches] Отправляем запрос к API...');

      // Имитируем поддержку отмены запроса через таймаут
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 10000); // 10 секунд таймаут

      const records = await pb.collection('matches').getFullList<Match>({
        sort: '-starts_at',
      });

      clearTimeout(timeoutId);

      if (!isMounted.current) {
        console.log('🚫 [loadMatches] Компонент размонтирован после запроса');
        return;
      }

      console.log(`✅ [loadMatches] Успешно загружено матчей: ${records.length}`);
      console.log(`📊 [loadMatches] Первый матч:`, records[0] ? {
        id: records[0].id,
        league: records[0].league,
        teams: `${records[0].home_team} vs ${records[0].away_team}`
      } : 'нет матчей');

      setMatches(records);
      abortControllerRef.current = null;
    } catch (error: any) {
      // Проверяем, не была ли это отмена запроса
      if (error?.name === 'AbortError' || !isMounted.current) {
        console.log('🛑 [loadMatches] Запрос был отменен');
        return;
      }

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

      if (attempt < maxAttempts && shouldRetry && isMounted.current) {
        const retryDelay = isNetworkError ? 2000 * attempt : 1000 * attempt;
        console.log(`🔄 [loadMatches] ${isNetworkError ? 'Сетевая ошибка' : 'Ошибка сервера'} - повторяем через ${retryDelay}мс...`);
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
        console.log(`🏁 [loadMatches] Завершаем loading состояние`);
        setLoading(false);
        setRefreshing(false);
        loadingRef.current = false;
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

  const filtered = matches.filter((m) => (statusFilter === 'all' ? true : m.status === statusFilter));

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

      {/* Фильтры статуса */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
        {(['live', 'upcoming', 'completed', 'cancelled', 'all'] as const).map((st) => (
          <TouchableOpacity
            key={st}
            onPress={() => setStatusFilter(st)}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: statusFilter === st ? '#FFFFFF' : '#333333',
              backgroundColor: statusFilter === st ? '#111111' : '#0b0b0b',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12 }}>
              {st === 'all' ? 'Все' : st === 'live' ? 'LIVE' : st === 'upcoming' ? 'Ожидается' : st === 'completed' ? 'Завершен' : 'Отменен'}
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
