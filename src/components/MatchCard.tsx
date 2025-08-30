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
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'live':
        return globalStyles.statusLive;
      case 'finished':
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
      case 'finished':
        return 'Завершен';
      case 'upcoming':
        return 'Ожидается';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  return (
    <TouchableOpacity
      style={globalStyles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with league and date */}
      <View style={globalStyles.matchHeader}>
        <Text style={globalStyles.matchLeague}>{match.league}</Text>
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
            {match.status === 'finished' || match.status === 'live' ? (
              <Text style={globalStyles.matchScore}>{match.home_score || 0}</Text>
            ) : null}
          </View>

          {/* Separator */}
          <View style={globalStyles.matchSeparator} />

          {/* Away team */}
          <View style={globalStyles.matchTeamRow}>
            <Text style={globalStyles.matchTeamName} numberOfLines={1}>
              {match.away_team}
            </Text>
            {match.status === 'finished' || match.status === 'live' ? (
              <Text style={globalStyles.matchScore}>{match.away_score || 0}</Text>
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
    </TouchableOpacity>
  );
};

// Стили перенесены в globalStyles

export default MatchCard;
