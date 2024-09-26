'use client';

import React, { useEffect } from 'react';
import { Field, useFormikContext, FormikErrors, FormikTouched } from 'formik';
import { Input, Checkbox } from '@nextui-org/react';

interface FormValues {
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

export default function SignUpForm() {
  const { errors, touched, validateForm } = useFormikContext<FormValues>();

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Create Your Account 💖</h2>
      <p className="text-sm text-gray-500">
        Let's get you started on your journey to love!
      </p>
      <Field name="email">
        {({ field, meta }: { field: any; meta: any }) => (
          <Input
            {...field}
            label="Email"
            type="email"
            placeholder="Enter your email"
            isInvalid={meta.touched && Boolean(meta.error)}
            errorMessage={meta.touched && meta.error}
          />
        )}
      </Field>
      <Field name="password">
        {({ field, meta }: { field: any; meta: any }) => (
          <Input
            {...field}
            label="Password"
            type="password"
            placeholder="Create a password"
            isInvalid={meta.touched && Boolean(meta.error)}
            errorMessage={meta.touched && meta.error}
          />
        )}
      </Field>
      <Field name="confirmPassword">
        {({ field, meta }: { field: any; meta: any }) => (
          <Input
            {...field}
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            isInvalid={meta.touched && Boolean(meta.error)}
            errorMessage={meta.touched && meta.error}
          />
        )}
      </Field>
      <Field name="terms">
        {({ field, meta }: { field: any; meta: any }) => (
          <Checkbox {...field} color="primary">
            I agree to the Terms and Conditions
          </Checkbox>
        )}
      </Field>
      {errors.terms && touched.terms && (
        <div className="text-red-500">{errors.terms}</div>
      )}
    </div>
  );
}
