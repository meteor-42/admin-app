import React from 'react';
import {
  View,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Match } from './types';
import { globalStyles } from '../../theme/theme';

interface MatchCardProps {
  match: Match;
  onPress: () => void;
  index?: number; // порядковый номер внутри списка
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onPress, index }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // День. Месяц (3 буквы) / ЧЧ:ММ
    const day = date.toLocaleString('ru-RU', { day: '2-digit' });
    const mon = date
      .toLocaleString('ru-RU', { month: 'long' })
      .slice(0, 3)
      .replace(/\.$/, ''); // без точки
    const time = date.toLocaleString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${day} ${mon} / ${time}`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'live':
        return globalStyles.statusLive;
      case 'completed':
        return globalStyles.statusFinished;
      case 'upcoming':
        return globalStyles.statusUpcoming;
      case 'cancelled':
        return globalStyles.statusCancelled;
      default:
        return globalStyles.statusUpcoming;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live':
        return 'LIVE';
      case 'completed':
        return 'Завершен';
      case 'upcoming':
        return 'Ожидается';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  const isCompleted =  match.status === 'live';

  return (
    <TouchableOpacity
      style={[globalStyles.card, { flexDirection: 'row' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Левая вертикальная плашка с порядковым номером и id */}
      <View
        style={{
          backgroundColor: '#2B2B2B',
          paddingHorizontal: 3,
          paddingVertical: 6,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: '#A1A1AA',
            transform: [{ rotate: '-90deg' }],
            fontSize: 9,
          }}
        >
          {(index !== undefined ? `${index + 1}` : '') + (match.id ? ` • ${match.id}` : '')}
        </Text>
      </View>

      {/* Контент карточки */}
      <View style={{ flex: 1 }}>
        {/* Header with league and date, and tour after league via separator */}
        <View style={globalStyles.matchHeader}>
          <Text style={globalStyles.matchLeague}>
            {match.league}
            {typeof match.tour !== 'undefined' && match.tour !== null ? ` · Тур ${match.tour}` : ''}
          </Text>
          <Text style={globalStyles.matchDate}>{formatDate(match.starts_at)}</Text>
        </View>

        {/* Main content with teams and score */}
        <View style={globalStyles.matchContent}>
          <View style={globalStyles.matchTeamsContainer}>
            {/* Home team */}
            <View style={globalStyles.matchTeamRow}>
              <Text style={globalStyles.matchTeamName} numberOfLines={1}>
                {match.home_team}
              </Text>
              {isCompleted ? (
                <Text style={globalStyles.matchScore}>{match.home_score ?? 0}</Text>
              ) : null}
            </View>

            {/* Separator */}
            <View style={globalStyles.matchSeparator} />

            {/* Away team */}
            <View style={globalStyles.matchTeamRow}>
              <Text style={globalStyles.matchTeamName} numberOfLines={1}>
                {match.away_team}
              </Text>
              {isCompleted ? (
                <Text style={globalStyles.matchScore}>{match.away_score ?? 0}</Text>
              ) : null}
            </View>
          </View>

          {/* Status badge */}
          <View style={globalStyles.statusContainer}>
            <View style={[globalStyles.statusBadge, getStatusStyle(match.status)]}>
              <Text style={globalStyles.statusText}>
                {getStatusText(match.status)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Стили перенесены в globalStyles

export default MatchCard;
