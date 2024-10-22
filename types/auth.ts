// User related types
export interface User {
  id: string;
  email?: string;
  is_anonymous?: boolean;
}

// Form related types
export interface LoginFormValues {
  email: string;
  password: string;
}

export interface SignUpFormValues extends LoginFormValues {
  confirmPassword: string;
  terms: boolean;
}

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

// Animation related types
export interface Variants {
  [key: string]: {
    opacity?: number;
    scale?: number;
    transition?: {
      duration?: number;
    };
  };
}
