// UI Component Constants

export const ANIMATION_DURATION = {
  FAST: 0.15,
  DEFAULT: 0.2,
  SLOW: 0.3,
};

export const SPRING_CONFIGS = {
  BOUNCY: {
    type: 'spring',
    stiffness: 300,
    damping: 24,
  },
  GENTLE: {
    type: 'spring',
    stiffness: 200,
    damping: 20,
  },
  STIFF: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  },
};

export const SIZES = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
};

export const VARIANTS = {
  DEFAULT: 'default',
  MINIMAL: 'minimal',
  CARD: 'card',
  FLOATING: 'floating',
};

const COLORS = {
  DEFAULT: 'default',
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
};

export const POSITIONS = {
  TOP: 'top',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  LEFT: 'left',
};

const ICON_POSITIONS = {
  LEFT: 'left',
  RIGHT: 'right',
};

const Z_INDEX = {
  MODAL: 1000,
  DROPDOWN: 900,
  TOOLTIP: 800,
  STICKY: 700,
  FIXED: 600,
  DEFAULT: 1,
};

export const BREAKPOINTS = {
  XS: '320px',
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
};

const ANIMATION = {
  DURATION: {
    FAST: 0.2,
    NORMAL: 0.3,
    SLOW: 0.5,
  },
  SPRING: {
    STIFF: { stiffness: 300, damping: 30 },
    NORMAL: { stiffness: 200, damping: 20 },
    GENTLE: { stiffness: 100, damping: 10 },
  },
};

const COLORS_NEW = {
  PRIMARY: {
    LIGHT: '#60A5FA',
    DEFAULT: '#3B82F6',
    DARK: '#2563EB',
  },
  SECONDARY: {
    LIGHT: '#A5B4FC',
    DEFAULT: '#818CF8',
    DARK: '#6366F1',
  },
  SUCCESS: {
    LIGHT: '#34D399',
    DEFAULT: '#10B981',
    DARK: '#059669',
  },
  WARNING: {
    LIGHT: '#FBBF24',
    DEFAULT: '#F59E0B',
    DARK: '#D97706',
  },
  ERROR: {
    LIGHT: '#F87171',
    DEFAULT: '#EF4444',
    DARK: '#DC2626',
  },
};

const Z_INDEX_NEW = {
  MODAL: 1000,
  DROPDOWN: 900,
  HEADER: 800,
  TOOLTIP: 700,
  STICKY: 600,
};

const VALIDATION = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  MIN_LENGTH: (min: number): string => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number): string => `Must be at most ${max} characters`,
  MATCH: 'Fields do not match',
  NUMBER: 'Must be a number',
  MIN: (min: number): string => `Must be at least ${min}`,
  MAX: (max: number): string => `Must be at most ${max}`,
};

const ARIA_LABELS = {
  CLOSE: 'Close',
  OPEN: 'Open',
  NEXT: 'Next',
  PREVIOUS: 'Previous',
  SEARCH: 'Search',
  MENU: 'Menu',
  LOADING: 'Loading',
  ERROR: 'Error',
  SUCCESS: 'Success',
};

const TEST_IDS = {
  MODAL: 'modal',
  DROPDOWN: 'dropdown',
  TOOLTIP: 'tooltip',
  BUTTON: 'button',
  INPUT: 'input',
  FORM: 'form',
  ERROR: 'error',
  SUCCESS: 'success',
};

const TRANSITIONS = {
  DEFAULT: 'all 0.2s ease',
  FAST: 'all 0.15s ease',
  SLOW: 'all 0.3s ease',
};

const SHADOWS = {
  SM: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  MD: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  LG: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  XL: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

// Form validation messages
const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be at most ${max} characters`,
  PATTERN: 'Please enter a valid value',
  MATCH: 'Values do not match',
};

// Common aria labels
const ARIA_LABELS_COMMON = {
  CLOSE: 'Close',
  OPEN: 'Open',
  NEXT: 'Next',
  PREVIOUS: 'Previous',
  LOADING: 'Loading',
  ERROR: 'Error',
  SUCCESS: 'Success',
};

// Common test ids
const TEST_IDS_COMMON = {
  MODAL: 'modal',
  DROPDOWN: 'dropdown',
  TOOLTIP: 'tooltip',
  BUTTON: 'button',
  INPUT: 'input',
  FORM: 'form',
};

module.exports = {
  ANIMATION_DURATION,
  SPRING_CONFIGS,
  SIZES,
  VARIANTS,
  COLORS,
  POSITIONS,
  ICON_POSITIONS,
  Z_INDEX,
  BREAKPOINTS,
  ANIMATION,
  COLORS_NEW,
  Z_INDEX_NEW,
  VALIDATION,
  ARIA_LABELS,
  TEST_IDS,
  TRANSITIONS,
  SHADOWS,
  VALIDATION_MESSAGES,
  ARIA_LABELS_COMMON,
  TEST_IDS_COMMON,
};
