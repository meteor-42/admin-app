import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  SegmentedButtons,
  HelperText,
  ActivityIndicator,
  Portal,
  Modal,
  Text,
  IconButton,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePocketBase } from '../contexts/PocketBaseContext';
import { Match, MatchStatus } from '../types';

const MatchEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const pb = usePocketBase();
  const matchData = (route.params as any)?.match;

  const [loading, setLoading] = useState(false);
  const [match, setMatch] = useState<Partial<Match>>({
    league: '',
    tour: 1,
    home_team: '',
    away_team: '',
    starts_at: new Date().toISOString(),
    status: 'upcoming',
    home_score: undefined,
    away_score: undefined,
    odd_home: undefined,
    odd_draw: undefined,
    odd_away: undefined,
  });

  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (matchData) {
      setMatch(matchData);
    }
  }, [matchData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!match.league?.trim()) {
      newErrors.league = 'Лига обязательна';
    }
    if (!match.home_team?.trim()) {
      newErrors.home_team = 'Домашняя команда обязательна';
    }
    if (!match.away_team?.trim()) {
      newErrors.away_team = 'Гостевая команда обязательна';
    }
    if (!match.tour || match.tour < 1) {
      newErrors.tour = 'Тур должен быть больше 0';
    }

    // Валидация счета для завершенных матчей
    if (match.status === 'finished') {
      if (match.home_score === undefined || match.home_score < 0) {
        newErrors.home_score = 'Счет домашней команды обязателен';
      }
      if (match.away_score === undefined || match.away_score < 0) {
        newErrors.away_score = 'Счет гостевой команды обязателен';
      }
    }

    // Валидация коэффициентов
    if (match.odd_home !== undefined && match.odd_home <= 0) {
      newErrors.odd_home = 'Коэффициент должен быть больше 0';
    }
    if (match.odd_draw !== undefined && match.odd_draw <= 0) {
      newErrors.odd_draw = 'Коэффициент должен быть больше 0';
    }
    if (match.odd_away !== undefined && match.odd_away <= 0) {
      newErrors.odd_away = 'Коэффициент должен быть больше 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const data = {
        league: match.league,
        tour: match.tour,
        home_team: match.home_team,
        away_team: match.away_team,
        starts_at: match.starts_at,
        status: match.status,
        home_score: match.status === 'finished' ? match.home_score : null,
        away_score: match.status === 'finished' ? match.away_score : null,
        odd_home: match.odd_home || null,
        odd_draw: match.odd_draw || null,
        odd_away: match.odd_away || null,
      };

      if (matchData?.id) {
        // Обновление существующего матча
        await pb.collection('matches').update(matchData.id, data);
        Alert.alert('Успех', 'Матч успешно обновлен', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        // Создание нового матча
        await pb.collection('matches').create(data);
        Alert.alert('Успех', 'Матч успешно создан', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось сохранить матч');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!matchData?.id) return;

    Alert.alert(
      'Удаление матча',
      'Вы уверены, что хотите удалить этот матч? Это действие необратимо.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await pb.collection('matches').delete(matchData.id);
              Alert.alert('Успех', 'Матч успешно удален', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось удалить матч');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleDateSave = () => {
    if (tempDate) {
      const [year, month, day] = tempDate.split('-').map(Number);
      if (year && month && day) {
        const current = new Date(match.starts_at || new Date());
        current.setFullYear(year);
        current.setMonth(month - 1);
        current.setDate(day);
        setMatch({ ...match, starts_at: current.toISOString() });
      }
    }
    setShowDateModal(false);
  };

  const handleTimeSave = () => {
    if (tempTime) {
      const [hours, minutes] = tempTime.split(':').map(Number);
      if (hours !== undefined && minutes !== undefined) {
        const current = new Date(match.starts_at || new Date());
        current.setHours(hours);
        current.setMinutes(minutes);
        setMatch({ ...match, starts_at: current.toISOString() });
      }
    }
    setShowTimeModal(false);
  };

  const openDateModal = () => {
    const date = new Date(match.starts_at || new Date());
    setTempDate(formatDateForInput(date));
    setShowDateModal(true);
  };

  const openTimeModal = () => {
    const date = new Date(match.starts_at || new Date());
    setTempTime(formatTimeForInput(date));
    setShowTimeModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor="#ffffff"
          onPress={() => navigation.goBack()}
        />
        <Title style={styles.title}>
          {matchData ? 'Редактировать матч' : 'Новый матч'}
        </Title>
        {matchData && (
          <IconButton
            icon="delete"
            size={24}
            iconColor="#ef4444"
            onPress={handleDelete}
          />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Основная информация</Title>

              <TextInput
                label="Лига"
                value={match.league}
                onChangeText={(text) => setMatch({ ...match, league: text })}
                style={styles.input}
                mode="outlined"
                error={!!errors.league}
                theme={{ colors: { background: '#1a1a1a', text: '#ffffff' } }}
              />
              <HelperText type="error" visible={!!errors.league}>
                {errors.league}
              </HelperText>

              <TextInput
                label="Тур"
                value={match.tour?.toString()}
                onChangeText={(text) => setMatch({ ...match, tour: parseInt(text) || 1 })}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                error={!!errors.tour}
                theme={{ colors: { background: '#1a1a1a', text: '#ffffff' } }}
              />
              <HelperText type="error" visible={!!errors.tour}>
                {errors.tour}
              </HelperText>

              <TextInput
                label="Домашняя команда"
                value={match.home_team}
                onChangeText={(text) => setMatch({ ...match, home_team: text })}
                style={styles.input}
                mode="outlined"
                error={!!errors.home_team}
                theme={{ colors: { background: '#1a1a1a', text: '#ffffff' } }}
              />
              <HelperText type="error" visible={!!errors.home_team}>
                {errors.home_team}
              </HelperText>

              <TextInput
                label="Гостевая команда"
                value={match.away_team}
                onChangeText={(text) => setMatch({ ...match, away_team: text })}
                style={styles.input}
                mode="outlined"
                error={!!errors.away_team}
                theme={{ colors: { background: '#1a1a1a', text: '#ffffff' } }}
              />
              <HelperText type="error" visible={!!errors.away_team}>
                {errors.away_team}
              </HelperText>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Дата и время</Title>

              <View style={styles.dateTimeContainer}>
                <Button
                  mode="outlined"
                  onPress={openDateModal}
                  style={styles.dateButton}
                  textColor="#ffffff"
                >
                  {new Date(match.starts_at || new Date()).toLocaleDateString()}
                </Button>
                <Button
                  mode="outlined"
                  onPress={openTimeModal}
                  style={styles.dateButton}
                  textColor="#ffffff"
                >
                  {new Date(match.starts_at || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Button>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Статус матча</Title>

              <SegmentedButtons
                value={match.status || 'upcoming'}
                onValueChange={(value) => setMatch({ ...match, status: value as MatchStatus })}
                buttons={[
                  { value: 'upcoming', label: 'Предстоящий' },
                  { value: 'live', label: 'Live' },
                  { value: 'finished', label: 'Завершен' },
                  { value: 'cancelled', label: 'Отменен' },
                ]}
                style={styles.segmented}
                theme={{
                  colors: {
                    secondaryContainer: '#ffffff',
                    onSecondaryContainer: '#000000',
                  },
                }}
              />
            </Card.Content>
          </Card>

          {match.status === 'finished' && (
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Счет матча</Title>

                <View style={styles.scoreContainer}>
                  <TextInput
                    label="Домашняя"
                    value={match.home_score?.toString() || ''}
                    onChangeText={(text) => setMatch({ ...match, home_score: parseInt(text) || 0 })}
                    style={[styles.input, styles.scoreInput]}
                    mode="outlined"
                    keyboardType="numeric"
                    error={!!errors.home_score}
                    theme={{ colors: { background: '#1a1a1a', text: '#ffffff' } }}
                  />
                  <Text style={styles.scoreSeparator}>:</Text>
                  <TextInput
                    label="Гостевая"
                    value={match.away_score?.toString() || ''}
                    onChangeText={(text) => setMatch({ ...match, away_score: parseInt(text) || 0 })}
                    style={[styles.input, styles.scoreInput]}
                    mode="outlined"
                    keyboardType="numeric"
                    error={!!errors.away_score}
                    theme={{ colors: { background: '#1a1a1a', text: '#ffffff' } }}
                  />
                </View>
                <HelperText type="error" visible={!!errors.home_score || !!errors.away_score}>
                  {errors.home_score || errors.away_score}
                </HelperText>
              </Card.Content>
            </Card>
          )}

          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Коэффициенты (опционально)</Title>

              <TextInput
                label="Победа домашней"
                value={match.odd_home?.toString() || ''}
                onChangeText={(text) => setMatch({ ...match, odd_home: parseFloat(text) || undefined })}
                style={styles.input}
                mode="outlined"
                keyboardType="decimal-pad"
                error={!!errors.odd_home}
                theme={{ colors: { background: '#1a1a1a', text: '#ffffff' } }}
              />
              <HelperText type="error" visible={!!errors.odd_home}>
                {errors.odd_home}
              </HelperText>

              <TextInput
                label="Ничья"
                value={match.odd_draw?.toString() || ''}
                onChangeText={(text) => setMatch({ ...match, odd_draw: parseFloat(text) || undefined })}
                style={styles.input}
                mode="outlined"
                keyboardType="decimal-pad"
                error={!!errors.odd_draw}
                theme={{ colors: { background: '#1a1a1a', text: '#ffffff' } }}
              />
              <HelperText type="error" visible={!!errors.odd_draw}>
                {errors.odd_draw}
              </HelperText>

              <TextInput
                label="Победа гостевой"
                value={match.odd_away?.toString() || ''}
                onChangeText={(text) => setMatch({ ...match, odd_away: parseFloat(text) || undefined })}
                style={styles.input}
                mode="outlined"
                keyboardType="decimal-pad"
                error={!!errors.odd_away}
                theme={{ colors: { background: '#1a1a1a', text: '#ffffff' } }}
              />
              <HelperText type="error" visible={!!errors.odd_away}>
                {errors.odd_away}
              </HelperText>
            </Card.Content>
          </Card>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              style={styles.saveButton}
              buttonColor="#ffffff"
              textColor="#000000"
            >
              {matchData ? 'Сохранить изменения' : 'Создать матч'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Portal>
        <Modal
          visible={showDateModal}
          onDismiss={() => setShowDateModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Title style={styles.modalTitle}>Выберите дату</Title>
          <TextInput
            label="Дата (ГГГГ-ММ-ДД)"
            value={tempDate}
            onChangeText={setTempDate}
            style={styles.modalInput}
            mode="outlined"
            placeholder="2024-12-25"
            theme={{ colors: { background: '#1a1a1a', text: '#ffffff' } }}
          />
          <View style={styles.modalButtons}>
            <Button
              mode="text"
              onPress={() => setShowDateModal(false)}
              textColor="#999999"
            >
              Отмена
            </Button>
            <Button
              mode="contained"
              onPress={handleDateSave}
              buttonColor="#ffffff"
              textColor="#000000"
            >
              Сохранить
            </Button>
          </View>
        </Modal>

        <Modal
          visible={showTimeModal}
          onDismiss={() => setShowTimeModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Title style={styles.modalTitle}>Выберите время</Title>
          <TextInput
            label="Время (ЧЧ:ММ)"
            value={tempTime}
            onChangeText={setTempTime}
            style={styles.modalInput}
            mode="outlined"
            placeholder="14:30"
            theme={{ colors: { background: '#1a1a1a', text: '#ffffff' } }}
          />
          <View style={styles.modalButtons}>
            <Button
              mode="text"
              onPress={() => setShowTimeModal(false)}
              textColor="#999999"
            >
              Отмена
            </Button>
            <Button
              mode="contained"
              onPress={handleTimeSave}
              buttonColor="#ffffff"
              textColor="#000000"
            >
              Сохранить
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    backgroundColor: '#1a1a1a',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#1a1a1a',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    borderColor: '#333333',
  },
  segmented: {
    marginTop: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreInput: {
    flex: 1,
  },
  scoreSeparator: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  saveButton: {
    paddingVertical: 8,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});

export default MatchEditScreen;
