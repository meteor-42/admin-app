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
    loadMatches();
  }, []);

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
