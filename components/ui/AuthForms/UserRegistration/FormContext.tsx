import React, { createContext, useContext } from 'react';
import { FormikHelpers } from 'formik';

interface FormValues {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  avatar?: string;
  [key: string]: unknown;
}

interface FormErrors {
  [key: string]: string | undefined;
}

interface FormTouched {
  [key: string]: boolean | undefined;
}

interface FormContextType {
  values: FormValues;
  errors: FormErrors;
  touched: FormTouched;
  validateForm: () => Promise<FormErrors>;
  handleSubmit: (values: FormValues, helpers: FormikHelpers<FormValues>) => void;
  setValues: (values: FormValues) => void;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

export const FormProvider: React.FC<{
  value: FormContextType;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};
