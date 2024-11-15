// Common types used across UI components

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface WithVariant {
  variant?: 'default' | 'minimal' | 'card' | 'floating';
}

export interface WithSize {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface WithColor {
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export interface WithLoading {
  isLoading?: boolean;
}

export interface WithDisabled {
  isDisabled?: boolean;
}

export interface WithAnimation {
  animate?: boolean;
  animationDuration?: number;
}

export interface WithIcon {
  icon?: string;
  iconPosition?: 'left' | 'right';
}

// Animation variants used across components
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 }
  }
};

export const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 }
  }
};

export const slideInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.2 }
  }
};

// Common utility types
export type ComponentVariant = 'default' | 'minimal' | 'card' | 'floating';
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';
export type ComponentColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
export type IconPosition = 'left' | 'right' | 'top' | 'bottom';

// Utility type helpers
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Common validation types
export interface ValidationError {
  message: string;
  field?: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationError[];
}
