import React, { createContext, useContext } from 'react';
import { FormikHelpers } from 'formik';

interface FormContextType {
  values: any;
  errors: any;
  touched: any;
  validateForm: () => Promise<any>;
  handleSubmit: (values: any, helpers: FormikHelpers<any>) => void;
  setValues: (values: any) => void;
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
