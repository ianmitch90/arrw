'use client';

import React, { useEffect } from 'react';
import { Field, useFormikContext, FormikErrors, FormikTouched } from 'formik';
import { Input } from '@nextui-org/react';

interface FormValues {
  verificationCode: string;
}

export default function EmailVerification() {
  const { errors, touched, validateForm } = useFormikContext<FormValues>();

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Check Your Email 📧</h2>
      <p className="text-sm text-gray-500">
        We've sent you a special code. Enter it below to verify your email!
      </p>
      <Field name="verificationCode">
        {({ field, meta }: { field: any; meta: any }) => (
          <Input
            {...field}
            label="Verification Code"
            type="text"
            placeholder="Enter 6-digit code"
            isInvalid={meta.touched && Boolean(meta.error)}
            errorMessage={meta.touched && meta.error}
          />
        )}
      </Field>
    </div>
  );
}
