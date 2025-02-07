'use client';

import React from 'react';
import { Formik, Field, Form } from 'formik';
import { Input } from '@nextui-org/react';
import * as Yup from 'yup';

interface FormValues {
  verificationCode: string;
}

const validationSchema = Yup.object().shape({
  verificationCode: Yup.string().required('Verification code is required')
});

export default function EmailVerification({
  onNext
}: {
  onNext: (values: FormValues) => void;
}) {
  const initialValues: FormValues = {
    verificationCode: ''
  };

  const handleSubmit = (values: FormValues) => {
    onNext(values); // Call onNext with the values
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched }) => (
        <Form>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Check Your Email 📧</h2>
            <p className="text-sm text-gray-500">
              We&apos;ve sent you a special code. Enter it below to verify your
              email!
            </p>
            <Field name="verificationCode">
              {({ field, meta }: {
                field: { name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: () => void };
                meta: { touched: boolean; error?: string };
              }) => (
                <Input
                  {...field}
                  label="Verification Code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  isInvalid={meta.touched && Boolean(meta.error)}
                  errormessage={meta.touched && meta.error}
                />
              )}
            </Field>
            <errormessage name="verificationCode">
              {(msg) => <div className="text-red-500">{msg}</div>}
            </errormessage>
          </div>
        </Form>
      )}
    </Formik>
  );
}
