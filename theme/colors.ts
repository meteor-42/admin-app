// Монохромная палитра в стиле shadcn/ui
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

  // Семантические цвета (монохромные варианты)
  background: '#FFFFFF',
  foreground: '#09090B',

  card: '#FFFFFF',
  cardForeground: '#09090B',

  popover: '#FFFFFF',
  popoverForeground: '#09090B',

  primary: '#18181B',
  primaryForeground: '#FAFAFA',

  secondary: '#F4F4F5',
  secondaryForeground: '#18181B',

  muted: '#F4F4F5',
  mutedForeground: '#71717A',

  accent: '#F4F4F5',
  accentForeground: '#18181B',

  destructive: '#18181B',
  destructiveForeground: '#FAFAFA',

  border: '#E4E4E7',
  input: '#E4E4E7',
  ring: '#18181B',

  // Статусы (минималистичные)
  status: {
    live: '#18181B',
    upcoming: '#71717A',
    finished: '#A1A1AA',
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
