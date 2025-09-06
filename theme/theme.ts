import { StyleSheet } from 'react-native';

// ============================
// ЦВЕТА И КОНСТАНТЫ
// ============================

// Основные цвета
export const colors = {
  // Основные цвета
  black: '#000000',
  white: '#FFFFFF',

  // Оттенки серого (Zinc scale)
  zinc: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },

  // Семантические цвета (черная тема)
  background: '#000000',
  foreground: '#FFFFFF',

  card: '#111111',
  cardForeground: '#FFFFFF',

  popover: '#111111',
  popoverForeground: '#FFFFFF',

  primary: '#FFFFFF',
  primaryForeground: '#000000',

  secondary: '#222222',
  secondaryForeground: '#FFFFFF',

  muted: '#222222',
  mutedForeground: '#888888',

  accent: '#222222',
  accentForeground: '#FFFFFF',

  destructive: '#FF3333',
  destructiveForeground: '#FFFFFF',

  border: '#333333',
  input: '#222222',
  ring: '#FFFFFF',

  // Статусы (минималистичные)
  status: {
    live: '#18181B',
    upcoming: '#71717A',
    completed: '#A1A1AA',
    cancelled: '#D4D4D8',
  }
};

// Размеры и отступы
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

// Радиусы границ
export const borderRadius = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 6,
  xl: 8,
  full: 9999,
};

// Тени (минималистичные)
export const shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
};

// Типографика
export const typography = {
  // Размеры шрифтов
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  // Высота строки
  lineHeight: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.75,
  },
  // Вес шрифта
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// ============================
// ГЛОБАЛЬНЫЕ СТИЛИ
// ============================

export const globalStyles = StyleSheet.create({
  // Layout
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

  // Cards
  card: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  // Match Card specific styles
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  matchLeague: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchDate: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
  },
  matchContent: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  matchTeamsContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  matchTeamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  matchTeamName: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.foreground,
    marginRight: spacing.sm,
  },
  matchScore: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.foreground,
    minWidth: 24,
    textAlign: 'center',
  },
  matchSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },

  // Status styles (темные и стильные)
  statusContainer: {
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
    backgroundColor: colors.muted,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,

  },
  statusLive: {
    color: colors.status.live,
  },
  statusFinished: {
    color: colors.status.completed,
  },
  statusUpcoming: {
    color: colors.status.upcoming,
  },
  statusCancelled: {
    color: colors.status.cancelled,
  },

  // List styles
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
    color: colors.zinc[600],
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

  // Header styles (симметричные отступы)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    height: 56,
  },
  headerTitle: {
    color: colors.foreground,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
    textAlign: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 20,
    color: colors.foreground,
  },

  // Login Screen styles
  loginContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loginKeyboardView: {
    flex: 1,
  },
  loginScrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  loginLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loginCard: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  loginHeaderSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  loginTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  loginFormSection: {
    marginBottom: spacing.xl,
  },
  loginInputContainer: {
    marginBottom: spacing.lg,
  },
  loginLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  loginInput: {
    backgroundColor: colors.input,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    fontSize: typography.fontSize.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primaryForeground,
  },
});
