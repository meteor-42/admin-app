import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Match } from './types';
import { colors, spacing, borderRadius, typography } from '../theme/colors';

interface MatchCardProps {
  match: Match;
  onPress: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'live':
        return styles.statusLive;
      case 'finished':
        return styles.statusFinished;
      case 'upcoming':
        return styles.statusUpcoming;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return styles.statusDefault;
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
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with league and date */}
      <View style={styles.header}>
        <Text style={styles.league}>{match.league}</Text>
        <Text style={styles.date}>{formatDate(match.starts_at)}</Text>
      </View>

      {/* Main content with teams and score */}
      <View style={styles.content}>
        <View style={styles.teamsContainer}>
          {/* Home team */}
          <View style={styles.teamRow}>
            <Text style={styles.teamName} numberOfLines={1}>
              {match.home_team}
            </Text>
            {match.status === 'finished' || match.status === 'live' ? (
              <Text style={styles.score}>{match.home_score || 0}</Text>
            ) : null}
          </View>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Away team */}
          <View style={styles.teamRow}>
            <Text style={styles.teamName} numberOfLines={1}>
              {match.away_team}
            </Text>
            {match.status === 'finished' || match.status === 'live' ? (
              <Text style={styles.score}>{match.away_score || 0}</Text>
            ) : null}
          </View>
        </View>

        {/* Status badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, getStatusStyle(match.status)]}>
            <Text style={styles.statusText}>
              {getStatusText(match.status)}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer with match info */}
      {match.info && (
        <View style={styles.footer}>
          <Text style={styles.infoText} numberOfLines={1}>
            {match.info}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  league: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
  },
  content: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  teamsContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  teamName: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.foreground,
    marginRight: spacing.sm,
  },
  score: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.foreground,
    minWidth: 24,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  statusContainer: {
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusLive: {
    backgroundColor: colors.primary,
  },
  statusFinished: {
    backgroundColor: colors.zinc[200],
  },
  statusUpcoming: {
    backgroundColor: colors.zinc[100],
  },
  statusCancelled: {
    backgroundColor: colors.zinc[50],
  },
  statusDefault: {
    backgroundColor: colors.zinc[100],
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoText: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    fontStyle: 'italic',
  },
});

export default MatchCard;
