'use client';

import React, { forwardRef } from 'react';
import { Formik, Form, Field, FormikHelpers, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Input, Checkbox } from '@nextui-org/react';
import { useFormContext } from './FormContext'; // Import the context

interface FormValues {
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Password Confirmation is required'),
  terms: Yup.boolean().oneOf([true], 'You must accept the terms and conditions')
});

export default function SignUpForm({
  onNext
}: {
  onNext: (values: FormValues) => void;
}) {
  const { setValues, isValid, isDirty, isSubmitting } = useFormContext(); // Get context values

  const initialValues: FormValues = {
    email: '',
    password: '',
    confirmPassword: '',
    terms: false
  };

  const handleSubmit = (
    values: FormValues,
    { setSubmitting }: FormikHelpers<FormValues>
  ) => {
    // Call the onNext function to pass values up to MultiStepSignUp
    onNext(values);
    setSubmitting(false);
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched, isValid, dirty, isSubmitting }) => {
        // Update context with current form state
        setValues({ isValid, isDirty: dirty, isSubmitting });

        return (
          <Form>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Create Your Account 💖</h2>
              <p className="text-sm text-gray-500">
                Let's get you started on your journey to love!
              </p>
              <Field name="email">
                {({ field }: { field: any }) => (
                  <Input
                    {...field}
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                    isInvalid={touched.email && Boolean(errors.email)}
                    errormessage={touched.email && errors.email}
                  />
                )}
              </Field>
              <Field name="password">
                {({ field }: { field: any }) => (
                  <Input
                    {...field}
                    label="Password"
                    type="password"
                    placeholder="Create a password"
                    isInvalid={touched.password && Boolean(errors.password)}
                    errormessage={touched.password && errors.password}
                  />
                )}
              </Field>
              <Field name="confirmPassword">
                {({ field }: { field: any }) => (
                  <Input
                    {...field}
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm your password"
                    isInvalid={
                      touched.confirmPassword && Boolean(errors.confirmPassword)
                    }
                    errormessage={
                      touched.confirmPassword && errors.confirmPassword
                    }
                  />
                )}
              </Field>
              <Field name="terms">
                {({ field }: { field: any }) => (
                  <Checkbox
                    {...field}
                    color="primary"
                    isInvalid={touched.terms && Boolean(errors.terms)}
                  >
                    I agree to the Terms and Conditions
                  </Checkbox>
                )}
              </Field>
              <ErrorMessage name="terms">
                {(msg) => <div className="text-red-500">{msg}</div>}
              </ErrorMessage>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
