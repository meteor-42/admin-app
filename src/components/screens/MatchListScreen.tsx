import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Searchbar,
  FAB,
  ActivityIndicator,
  Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { usePocketBase } from '../contexts/PocketBaseContext';
import { useAuth } from '../contexts/AuthContext';
import { Match } from '../types';
import MatchCard from '../MatchCard';
import { colors, spacing, borderRadius, typography } from '../../../theme/colors';

const MatchListScreen: React.FC = () => {
  const navigation = useNavigation();
  const pb = usePocketBase();
  const { logout } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filterOptions = [
    { value: 'all', label: 'Все' },
    { value: 'upcoming', label: 'Ожидаются' },
    { value: 'live', label: 'Live' },
    { value: 'finished', label: 'Завершены' },
  ];

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    filterMatches();
  }, [matches, searchQuery, statusFilter]);

  const loadMatches = async () => {
    try {
      const records = await pb.collection('matches').getFullList<Match>({
        sort: '-starts_at',
      });
      setMatches(records);
    } catch (error) {
      console.error('Failed to load matches:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить матчи');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterMatches = () => {
    let filtered = [...matches];

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    // Фильтр по поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.home_team.toLowerCase().includes(query) ||
        m.away_team.toLowerCase().includes(query) ||
        m.league.toLowerCase().includes(query)
      );
    }

    setFilteredMatches(filtered);
  };

  const handleRefresh = useCallback(() => {
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

  const handleMatchPress = (match: Match) => {
    navigation.navigate('MatchEdit' as never, { match } as never);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Поиск по командам или лиге..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor={colors.mutedForeground}
          placeholderTextColor={colors.mutedForeground}
          theme={{
            colors: {
              onSurface: colors.foreground,
              primary: colors.primary,
            },
          }}
        />
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutIcon}>⎋</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterContainer}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterTab,
              statusFilter === option.value && styles.filterTabActive,
            ]}
            onPress={() => setStatusFilter(option.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                statusFilter === option.value && styles.filterTabTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Match List */}
      <FlatList
        data={filteredMatches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            onPress={() => handleMatchPress(item)}
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
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>□</Text>
            <Text style={styles.emptyTitle}>Нет матчей</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Попробуйте изменить параметры поиска'
                : 'Добавьте первый матч с помощью кнопки ниже'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('MatchEdit' as never)}
        color={colors.primaryForeground}
        theme={{
          colors: {
            primaryContainer: colors.primary,
          },
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchbar: {
    flex: 1,
    backgroundColor: colors.zinc[50],
    elevation: 0,
    borderRadius: borderRadius.lg,
    height: 44,
  },
  searchInput: {
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
  },
  logoutButton: {
    marginLeft: spacing.sm,
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.zinc[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 20,
    color: colors.mutedForeground,
  },
  filterScrollView: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.mutedForeground,
  },
  filterTabTextActive: {
    color: colors.primaryForeground,
  },
  listContent: {
    paddingVertical: spacing.sm,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    color: colors.zinc[200],
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});

export default MatchListScreen;
