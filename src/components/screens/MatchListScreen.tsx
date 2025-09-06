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
  Menu,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { usePocketBase } from '../contexts/PocketBaseContext';
import { useAuth } from '../contexts/AuthContext';
import { Match, MatchStatus } from '../types';
import MatchCard from '../MatchCard';
import { globalStyles, colors, spacing, typography, borderRadius } from '../../../theme/theme';
import { ApiError } from '../types';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MatchListScreen: React.FC = () => {
  const navigation = useNavigation();
  const pb = usePocketBase();
  const { logout } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'live' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');

  // Modal state - исправлено управление состоянием
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editStatus, setEditStatus] = useState<MatchStatus>('completed');
  const [homeScore, setHomeScore] = useState<string>('0');
  const [awayScore, setAwayScore] = useState<string>('0');
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

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
  }, []);

  // Перезагрузка при смене фильтра
  useEffect(() => {
    if (!loadingRef.current && isMounted.current) {
      setLoading(true);
      loadMatches();
    }
  }, [statusFilter]);

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
    setSelectedMatch(match);
    setEditStatus(match.status);
    setHomeScore(match.home_score !== undefined ? String(match.home_score) : '0');
    setAwayScore(match.away_score !== undefined ? String(match.away_score) : '0');
    setIsEditModalVisible(true);
  };

  const closeEdit = () => {
    if (editing) return;
    setIsEditModalVisible(false);
    setSelectedMatch(null);
    setStatusMenuVisible(false);
  };

  const onDismissRequest = () => {
    if (!editing) closeEdit();
  };

  const saveEdit = async () => {
    if (!selectedMatch) return;
    
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
      closeEdit();
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

  const filtered = matches.filter((m) => m.status === statusFilter);

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Header with logout on the right */}
      <View style={[globalStyles.header, { justifyContent: 'flex-end' }]}>
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
        >
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
              borderColor: statusFilter === st ? colors.primary : colors.border,
              backgroundColor: statusFilter === st ? colors.primary : colors.input,
            }}
          >
            <Text style={{ 
              color: statusFilter === st ? colors.primaryForeground : colors.foreground, 
              fontSize: 14 
            }}>
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
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[globalStyles.listContent, filtered.length === 0 ? { flex: 1, justifyContent: 'center' } : undefined]}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
            <Text style={{ fontSize: 42, color: colors.zinc[600], marginBottom: 8 }}>⚽</Text>
            <Text style={{ fontSize: 14, color: colors.mutedForeground }}>Ничего не найдено</Text>
          </View>
        }
      />

      {/* Edit Modal */}
      <Portal>
        <Modal
          visible={isEditModalVisible}
          onDismiss={onDismissRequest}
          dismissable={!editing}
          dismissableBackButton={!editing}
          contentContainerStyle={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            padding: spacing.md,
            marginHorizontal: spacing.md,
            marginVertical: spacing.xl,
            borderRadius: borderRadius.lg,
          }}
        >
          {/* Handle area for swipe affordance */}
          <View style={{ alignItems: 'center', marginBottom: spacing.sm }}>
            <View style={{ 
              height: 4, 
              width: 44, 
              borderRadius: 2, 
              backgroundColor: colors.zinc[700] 
            }} />
          </View>
          
          <KeyboardAvoidingView 
            behavior={Platform.select({ ios: 'padding', android: undefined })}
          >
            <Text style={{ 
              color: colors.foreground, 
              fontSize: typography.fontSize.lg, 
              fontWeight: typography.fontWeight.semibold, 
              marginBottom: spacing.sm 
            }}>
              Редактирование матча
            </Text>
            
            {selectedMatch && (
              <View>
                <Text style={{ 
                  color: colors.mutedForeground, 
                  marginBottom: spacing.md,
                  fontSize: typography.fontSize.sm
                }}>
                  {selectedMatch.home_team} <Text style={{ color: colors.zinc[500] }}>vs</Text> {selectedMatch.away_team}
                </Text>

                {/* Статус (dropdown) */}
                <Text style={{ 
                  color: colors.mutedForeground, 
                  marginBottom: spacing.xs, 
                  fontSize: typography.fontSize.xs, 
                  textTransform: 'uppercase', 
                  letterSpacing: 0.6 
                }}>
                  Статус
                </Text>
                
                <View style={{ alignSelf: 'stretch', marginBottom: spacing.md }}>
                  <Menu
                    visible={statusMenuVisible}
                    onDismiss={() => setStatusMenuVisible(false)}
                    anchor={
                      <TouchableOpacity
                        onPress={() => setStatusMenuVisible(true)}
                        activeOpacity={0.7}
                        disabled={editing}
                        style={{
                          borderWidth: 1,
                          borderColor: colors.border,
                          backgroundColor: colors.input,
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: borderRadius.md,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          opacity: editing ? 0.6 : 1,
                        }}
                      >
                        <Text style={{ 
                          color: colors.foreground, 
                          fontSize: typography.fontSize.sm 
                        }}>
                          {editStatus === 'live' ? 'Live' : 
                           editStatus === 'upcoming' ? 'Ожидается' : 
                           editStatus === 'completed' ? 'Завершен' : 'Отменен'}
                        </Text>
                        <Icon 
                          name={statusMenuVisible ? 'arrow-drop-up' : 'arrow-drop-down'} 
                          size={20} 
                          color={colors.mutedForeground} 
                        />
                      </TouchableOpacity>
                    }
                    contentStyle={{ 
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: borderRadius.md,
                    }}
                  >
                    {(['upcoming', 'live', 'completed', 'cancelled'] as const).map((st) => (
                      <Menu.Item
                        key={st}
                        onPress={() => { 
                          setEditStatus(st); 
                          setStatusMenuVisible(false); 
                          // При смене статуса с completed сбрасываем счет
                          if (st !== 'completed') {
                            setHomeScore('0');
                            setAwayScore('0');
                          }
                        }}
                        title={st === 'live' ? 'Live' : 
                               st === 'upcoming' ? 'Ожидается' : 
                               st === 'completed' ? 'Завершен' : 'Отменен'}
                        titleStyle={{ 
                          color: colors.foreground,
                          fontSize: typography.fontSize.sm
                        }}
                        style={{
                          backgroundColor: editStatus === st ? colors.zinc[800] : 'transparent',
                        }}
                      />)
                    )}
                  </Menu>
                </View>

                {/* Счет: только если completed */}
                {editStatus === 'completed' && (
                  <View>
                    <Text style={{ 
                      color: colors.mutedForeground, 
                      marginBottom: spacing.xs, 
                      fontSize: typography.fontSize.xs, 
                      textTransform: 'uppercase', 
                      letterSpacing: 0.6 
                    }}>
                      Счет
                    </Text>
                    
                    <View style={{ 
                      flexDirection: 'row', 
                      gap: spacing.md,
                      marginBottom: spacing.md 
                    }}>
                      {/* Домашние */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ 
                          color: colors.mutedForeground, 
                          marginBottom: spacing.xs, 
                          fontSize: typography.fontSize.xs 
                        }}>
                          Домашние
                        </Text>
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: borderRadius.md,
                          backgroundColor: colors.input,
                          overflow: 'hidden',
                        }}>
                          <TouchableOpacity
                            onPress={() => {
                              const newScore = Math.max(0, parseInt(homeScore || '0') - 1);
                              setHomeScore(String(newScore));
                            }}
                            style={{
                              padding: spacing.sm,
                              backgroundColor: colors.zinc[800],
                            }}
                            activeOpacity={0.7}
                            disabled={editing}
                          >
                            <Icon name="remove" size={20} color={colors.foreground} />
                          </TouchableOpacity>
                          
                          <TextInput
                            mode="flat"
                            value={homeScore}
                            onChangeText={(text) => {
                              // Разрешаем только цифры
                              if (/^\d*$/.test(text)) {
                                setHomeScore(text);
                              }
                            }}
                            keyboardType="number-pad"
                            style={{ 
                              flex: 1, 
                              backgroundColor: 'transparent',
                              textAlign: 'center',
                              height: 44,
                            }}
                            underlineColor="transparent"
                            textColor={colors.foreground}
                            theme={{ 
                              colors: { 
                                primary: colors.primary, 
                                onSurface: colors.foreground,
                                onSurfaceVariant: colors.mutedForeground 
                              } 
                            }}
                            editable={!editing}
                          />
                          
                          <TouchableOpacity
                            onPress={() => {
                              const newScore = parseInt(homeScore || '0') + 1;
                              setHomeScore(String(newScore));
                            }}
                            style={{
                              padding: spacing.sm,
                              backgroundColor: colors.zinc[800],
                            }}
                            activeOpacity={0.7}
                            disabled={editing}
                          >
                            <Icon name="add" size={20} color={colors.foreground} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Гости */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ 
                          color: colors.mutedForeground, 
                          marginBottom: spacing.xs, 
                          fontSize: typography.fontSize.xs 
                        }}>
                          Гости
                        </Text>
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: borderRadius.md,
                          backgroundColor: colors.input,
                          overflow: 'hidden',
                        }}>
                          <TouchableOpacity
                            onPress={() => {
                              const newScore = Math.max(0, parseInt(awayScore || '0') - 1);
                              setAwayScore(String(newScore));
                            }}
                            style={{
                              padding: spacing.sm,
                              backgroundColor: colors.zinc[800],
                            }}
                            activeOpacity={0.7}
                            disabled={editing}
                          >
                            <Icon name="remove" size={20} color={colors.foreground} />
                          </TouchableOpacity>
                          
                          <TextInput
                            mode="flat"
                            value={awayScore}
                            onChangeText={(text) => {
                              if (/^\d*$/.test(text)) {
                                setAwayScore(text);
                              }
                            }}
                            keyboardType="number-pad"
                            style={{ 
                              flex: 1, 
                              backgroundColor: 'transparent',
                              textAlign: 'center',
                              height: 44,
                            }}
                            underlineColor="transparent"
                            textColor={colors.foreground}
                            theme={{ 
                              colors: { 
                                primary: colors.primary, 
                                onSurface: colors.foreground,
                                onSurfaceVariant: colors.mutedForeground 
                              } 
                            }}
                            editable={!editing}
                          />
                          
                          <TouchableOpacity
                            onPress={() => {
                              const newScore = parseInt(awayScore || '0') + 1;
                              setAwayScore(String(newScore));
                            }}
                            style={{
                              padding: spacing.sm,
                              backgroundColor: colors.zinc[800],
                            }}
                            activeOpacity={0.7}
                            disabled={editing}
                          >
                            <Icon name="add" size={20} color={colors.foreground} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'flex-end', 
                  marginTop: spacing.md, 
                  gap: spacing.sm 
                }}>
                  <Button 
                    onPress={closeEdit} 
                    disabled={editing} 
                    textColor={colors.mutedForeground}
                    style={{ borderRadius: borderRadius.md }}
                  >
                    Отмена
                  </Button>
                  <Button 
                    mode="contained" 
                    onPress={saveEdit} 
                    loading={editing} 
                    disabled={editing} 
                    style={{ 
                      backgroundColor: colors.primary,
                      borderRadius: borderRadius.md,
                    }}
                    labelStyle={{ color: colors.primaryForeground }}
                  >
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
