import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ActivityIndicator,
  Text,
  Modal,
  Portal,
  Button,
  TextInput,
  RadioButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { usePocketBase } from '../contexts/PocketBaseContext';
import { useAuth } from '../contexts/AuthContext';
import { Match, MatchStatus } from '../types';
import MatchCard from '../MatchCard';
import { globalStyles, colors } from '../../../theme/theme';
import { ApiError } from '../types';

const MatchListScreen: React.FC = () => {
  const navigation = useNavigation();
  const pb = usePocketBase();
  const { logout } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'live' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');

  // Modal state
  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editStatus, setEditStatus] = useState<MatchStatus>('completed');
  const [homeScore, setHomeScore] = useState<string>('0');
  const [awayScore, setAwayScore] = useState<string>('0');

  // Используем ref для отслеживания монтирования компонента
  const isMounted = useRef(true);
  // Используем ref для предотвращения параллельных запросов
  const loadingRef = useRef(false);

  useEffect(() => {
    if (__DEV__) {
      console.warn('🚀 [MatchListScreen] Компонент смонтирован, запускаем загрузку матчей');
      console.warn(`🎫 [MatchListScreen] Начальное состояние PocketBase: isValid=${pb.authStore.isValid}, hasToken=${!!pb.authStore.token}`);
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
        console.warn('🧹 [MatchListScreen] Cleanup: компонент размонтируется');
      }
      isMounted.current = false;
      clearTimeout(timeoutId);
    };
  }, [loadMatches, pb.authStore.isValid, pb.authStore.token]);

  // Перезагрузка при смене фильтра
  useEffect(() => {
    if (!loadingRef.current && isMounted.current) {
      setLoading(true);
      loadMatches();
    }
  }, [statusFilter, loadMatches]);

  const loadMatches = useCallback(async (attempt = 1) => {
    const maxAttempts = 3;

    // Предотвращаем параллельные запросы
    if (loadingRef.current && attempt === 1) {
      if (__DEV__) console.warn('⏸️ [loadMatches] Уже идет загрузка, пропускаем');
      return;
    }

    // Проверяем, что компонент все еще смонтирован
    if (!isMounted.current) {
      if (__DEV__) console.warn('🚫 [loadMatches] Компонент размонтирован, отменяем загрузку');
      return;
    }

    loadingRef.current = true;

    if (__DEV__) {
      console.warn(`🔄 [loadMatches] Попытка ${attempt}/${maxAttempts} загрузки матчей`);
      console.warn(`🎫 [loadMatches] PocketBase authStore.isValid: ${pb.authStore.isValid}`);
      console.warn(`👤 [loadMatches] PocketBase authStore.model: ${!!pb.authStore.model}`);
    }

    // Проверяем готовность аутентификации
    if (!pb.authStore.isValid) {
      if (attempt < maxAttempts) {
        if (__DEV__) console.warn(`⚠️ [loadMatches] PocketBase не готов, повторяем через ${300 * attempt}мс`);
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
      if (__DEV__) console.warn('🌐 [loadMatches] Отправляем запрос к API...');

      // Серверная фильтрация
      const filter = `status = "${statusFilter}"`;
      const records = await pb.collection('matches').getFullList<Match>({
        sort: '-starts_at',
        filter,
      });

      if (!isMounted.current) {
        if (__DEV__) console.warn('🚫 [loadMatches] Компонент размонтирован после запроса');
        return;
      }

      if (__DEV__) {
        console.warn(`✅ [loadMatches] Успешно загружено матчей: ${records.length}`);
        console.warn(`📊 [loadMatches] Первый матч:`, records[0] ? {
          id: records[0].id,
          league: records[0].league,
          teams: `${records[0].home_team} vs ${records[0].away_team}`
        } : 'нет матчей');
      }

      setMatches(records);
    } catch (error: unknown) {
      if (!isMounted.current) return;

      console.error(`❌ [loadMatches] Ошибка на попытке ${attempt}:`, error);
      if (__DEV__) {
        const apiError = error as ApiError;
        console.warn(`🔍 [loadMatches] Детали ошибки:`, {
          message: apiError.message,
          status: apiError.status,
          data: apiError.data,
          url: apiError.url,
        });
      }

      // Определяем тип ошибки для лучшего retry
      const apiError = error as ApiError;
      const isNetworkError = apiError.status === 0 || apiError.message?.includes('Network') || apiError.message?.includes('timeout');
      const isServerError = apiError.status !== undefined && apiError.status >= 500;

      const shouldRetry = isNetworkError || isServerError;

      if (attempt < maxAttempts && shouldRetry && isMounted.current) {
        const retryDelay = isNetworkError ? 2000 * attempt : 1000 * attempt;
        if (__DEV__) console.warn(`🔄 [loadMatches] ${isNetworkError ? 'Сетевая ошибка' : 'Ошибка сервера'} - повторяем через ${retryDelay}мс...`);
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
        } else if (apiError.status === 401) {
          errorMessage = 'Ошибка авторизации. Попробуйте войти заново.';
        } else if (apiError.status && apiError.status >= 500) {
          errorMessage = 'Сервер временно недоступен. Попробуйте позже.';
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }

        Alert.alert('Ошибка загрузки', errorMessage);
      }
    } finally {
      if (isMounted.current && (attempt >= maxAttempts || pb.authStore.isValid)) {
        if (__DEV__) console.warn(`🏁 [loadMatches] Завершаем loading состояние`);
        setLoading(false);
        setRefreshing(false);
        loadingRef.current = false;
      }
    }
  }, [pb, statusFilter]);

  const handleRefresh = useCallback(() => {
    if (__DEV__) console.warn('🔄 [MatchListScreen] Пользователь инициировал обновление списка');
    setRefreshing(true);
    loadMatches();
  }, [loadMatches]);

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

  // Handlers for editing
  const openEdit = (match: Match) => {
    if (statusFilter !== 'completed') return; // редактирование только в фильтре completed
    setSelectedMatch(match);
    setEditStatus(match.status);
    setHomeScore(match.home_score !== undefined ? String(match.home_score) : '0');
    setAwayScore(match.away_score !== undefined ? String(match.away_score) : '0');
    setEditVisible(true);
  };

  const closeEdit = () => {
    if (editing) return;
    setEditVisible(false);
    setSelectedMatch(null);
  };

  // Enable swipe-to-dismiss like behavior by allowing tap on backdrop and vertical drag hint
  const onDismissRequest = () => {
    if (!editing) closeEdit();
  };

  const saveEdit = async () => {
    if (!selectedMatch) return;
    // Валидация: счет можно менять только если статус completed
    if (editStatus !== 'completed') {
      // При смене статуса на не-completed обнулять счет? Оставим как есть, но не даем вводить
    }

    // Валидация чисел
    const hs = Number(homeScore);
    const as = Number(awayScore);
    if (editStatus === 'completed') {
      if (!Number.isFinite(hs) || hs < 0 || !Number.isFinite(as) || as < 0) {
        Alert.alert('Ошибка', 'Счет должен быть неотрицательными числами');
        return;
      }
    }

    try {
      setEditing(true);
      const payload: Partial<Match> = { status: editStatus } as Partial<Match>;
      if (editStatus === 'completed') {
        Object.assign(payload, { home_score: hs, away_score: as });
      }

      await pb.collection('matches').update<Match>(selectedMatch.id, payload);

      // Обновляем локальный список оптимистично
      setMatches((prev) => prev.map((m) => (m.id === selectedMatch.id ? { ...m, ...payload } as Match : m)));
      setSelectedMatch({ ...selectedMatch, ...payload } as Match);
      setEditVisible(false);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      Alert.alert('Ошибка сохранения', apiError.message || 'Не удалось сохранить изменения');
    } finally {
      setEditing(false);
    }
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
            onPress={() => openEdit(item)}
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

      {/* Edit Modal */}
      <Portal>
        <Modal
          visible={editVisible}
          onDismiss={onDismissRequest}
          dismissable
          dismissableBackButton
          contentContainerStyle={{
            backgroundColor: '#0a0a0a',
            borderColor: '#1f1f1f',
            borderWidth: 1,
            padding: 16,
            marginHorizontal: 16,
            marginVertical: 24,
            borderRadius: 12,
          }}
        >
          {/* Handle area for swipe affordance */}
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <View style={{ height: 4, width: 44, borderRadius: 2, backgroundColor: '#2a2a2a' }} />
          </View>
          <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Редактирование матча</Text>
            {selectedMatch && (
              <View>
                <Text style={{ color: '#9ca3af', marginBottom: 12 }}>
                  {selectedMatch.home_team} <Text style={{ color: '#6b7280' }}>vs</Text> {selectedMatch.away_team}
                </Text>

                {/* Статус */}
                <Text style={{ color: '#e5e7eb', marginTop: 4, marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>Статус</Text>
                <RadioButton.Group onValueChange={(value) => setEditStatus(value as MatchStatus)} value={editStatus}>
                  {(['upcoming', 'live', 'completed', 'cancelled'] as const).map((st) => (
                    <View key={st} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 2 }}>
                      <RadioButton value={st} color="#fff" />
                      <Text style={{ color: '#d1d5db', fontSize: 14 }}>{st}</Text>
                    </View>
                  ))}
                </RadioButton.Group>

                {/* Счет: только если completed */}
                <Text style={{ color: '#e5e7eb', marginTop: 12, marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>Счет (только для завершенных)</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    mode="flat"
                    label="Домашние"
                    value={homeScore}
                    onChangeText={setHomeScore}
                    keyboardType="number-pad"
                    disabled={editStatus !== 'completed'}
                    style={{ flex: 1, backgroundColor: '#0f0f0f' }}
                    underlineColor="#2a2a2a"
                    textColor="#ffffff"
                    theme={{ colors: { primary: '#ffffff', onSurfaceVariant: '#9ca3af' } }}
                  />
                  <TextInput
                    mode="flat"
                    label="Гости"
                    value={awayScore}
                    onChangeText={setAwayScore}
                    keyboardType="number-pad"
                    disabled={editStatus !== 'completed'}
                    style={{ flex: 1, backgroundColor: '#0f0f0f' }}
                    underlineColor="#2a2a2a"
                    textColor="#ffffff"
                    theme={{ colors: { primary: '#ffffff', onSurfaceVariant: '#9ca3af' } }}
                  />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18, gap: 8 }}>
                  <Button onPress={closeEdit} disabled={editing} textColor="#e5e7eb">
                    Отмена
                  </Button>
                  <Button mode="contained" onPress={saveEdit} loading={editing} disabled={editing} style={{ backgroundColor: '#111111' }}>
                    Сохранить
                  </Button>
                </View>
              </View>
            )}
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

export default MatchListScreen;
