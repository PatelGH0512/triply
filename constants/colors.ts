const Colors = {
  primary: {
    coral: '#ff6b6b',
    coralLight: '#FF8E8E',
    coralDark: '#E55555',
    coralFaded: '#FFE8E8',
  },
  secondary: {
    sand: '#FFD166',
    sandLight: '#FFE099',
    sandDark: '#E5B84D',
  },
  accent: {
    teal: '#06D6A0',
    tealLight: '#5EEAC4',
    tealDark: '#04A87D',
    sky: '#118AB2',
    skyLight: '#3DADD4',
  },
  neutral: {
    white: '#FFFFFF',
    offWhite: '#F9F7F4',
    background: '#F5F3EF',
    border: '#E8E4DE',
    borderLight: '#F0EDE8',
    placeholder: '#B8B0A6',
    disabled: '#D4CEC6',
  },
  text: {
    primary: '#1A1614',
    secondary: '#6B6560',
    tertiary: '#9E9590',
    inverse: '#FFFFFF',
    link: '#FF6B6B',
  },
  status: {
    success: '#06D6A0',
    successLight: '#E6FAF5',
    warning: '#FFD166',
    warningLight: '#FFF8E6',
    error: '#EF233C',
    errorLight: '#FDE8EB',
    info: '#118AB2',
    infoLight: '#E6F3F9',
  },
  trip: {
    planning: '#FFD166',
    active: '#06D6A0',
    completed: '#118AB2',
    cancelled: '#9E9590',
  },
} as const;

export default Colors;
