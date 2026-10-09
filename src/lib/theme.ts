// Ben Fight design tokens — aggressive MMA broadcast aesthetic

export const colors = {
  // Backgrounds
  bg: '#0A0A0B',
  bgElevated: '#151517',
  bgCard: '#1A1A1D',
  bgCardBorder: '#2A2A2E',

  // Neon accents
  salmon: '#FF6B6B',
  salmonBright: '#FF4C5E',
  salmonDim: 'rgba(255, 107, 107, 0.15)',
  yellow: '#F4D03F',
  yellowBright: '#FFE45C',
  yellowDim: 'rgba(244, 208, 63, 0.15)',

  // Neutrals
  white: '#F5F5F3',
  offWhite: '#D8D8D6',
  grey: '#8B8B8F',
  greyDim: '#5A5A5E',
  greyDark: '#38383C',
  black: '#000000',

  // Semantic
  win: '#4ADE80',
  loss: '#FF6B6B',
  veto: '#C41E3A',
  mercy: '#3A3A3E',

  overlay: 'rgba(0, 0, 0, 0.75)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
};

export const fonts = {
  display: 'BebasNeue_400Regular', // headers, numbers, aggressive labels
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const shadows = {
  salmonGlow: {
    shadowColor: colors.salmon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  yellowGlow: {
    shadowColor: colors.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
};
