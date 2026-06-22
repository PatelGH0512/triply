export const colors = {
  primary: {
    50:  '#FFF1EE',
    100: '#FFE0D9',
    200: '#FFC4B6',
    300: '#FF9E8A',
    400: '#FF6B4A',
    500: '#F04E2D',
    600: '#D93A1A',
    700: '#B52E12',
  },

  neutral: {
    0:   '#FFFFFF',
    50:  '#FAF9F7',
    100: '#F3F1EE',
    200: '#E8E4DF',
    300: '#D4CEC7',
    400: '#ADA79E',
    500: '#827C74',
    600: '#5C5750',
    700: '#3D3935',
    800: '#252220',
    900: '#0F0E0D',
  },

  success: '#3DBD7D',
  warning: '#F5A623',
  error:   '#E53E3E',

  glass: {
    light:  'rgba(255, 255, 255, 0.25)',
    medium: 'rgba(255, 255, 255, 0.15)',
    dark:   'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.35)',
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
};

export const typography = {
  fonts: {
    regular:  'Inter_400Regular',
    medium:   'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold:     'Inter_700Bold',
  },
  sizes: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    xxl:  30,
    xxxl: 36,
  },
  lineHeights: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.75,
  },
};

export const spacing = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 999,
};

export const shadows = {
  sm: {
    shadowColor: '#0F0E0D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F0E0D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#0F0E0D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: {
    shadowColor: '#FF6B4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
};
