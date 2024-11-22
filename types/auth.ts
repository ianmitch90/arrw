// Auth related types
export interface AuthUser {
  id: string;
  email?: string;
  is_anonymous?: boolean;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

// Form related types
export interface LoginFormValues {
  email: string;
  password: string;
}

export interface SignUpFormValues extends LoginFormValues {
  confirmPassword: string;
  fullName: string;
  username: string;
  agreeToTerms: boolean;
}

// Animation related types
export interface Variants {
  [key: string]: {
    opacity?: number;
    scale?: number;
    x?: number;
    y?: number;
    rotate?: number;
    transition?: {
      duration?: number;
      type?: string;
      stiffness?: number;
      damping?: number;
      mass?: number;
      velocity?: number;
    };
  };
}

// Field related types
export interface FieldProps {
  field: {
    name: string;
    value: string | boolean;
    onChange: (e: React.ChangeEvent<any>) => void;
    onBlur: (e: React.FocusEvent<any>) => void;
  };
  meta: {
    touched: boolean;
    error?: string;
  };
}
