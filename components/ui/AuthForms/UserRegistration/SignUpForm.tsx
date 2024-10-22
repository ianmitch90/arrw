'use client';

import React from 'react';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import { Input, Checkbox } from '@nextui-org/react';
import { useFormContext } from './FormContext';
import { supabase } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { useRouter } from 'next/navigation';
import { FormError } from '@/components/ui/FormError';
import { SignUpFormValues, FieldProps } from '@/types/auth';
import { signUpValidationSchema } from '@/utils/validation/auth';

export default function SignUpForm({
  onNext
}: {
  onNext: (values: SignUpFormValues) => void;
}) {
  const { setValues } = useFormContext();
  const { toast } = useToast();
  const router = useRouter();

  // Define initial values for the form
  const initialValues: SignUpFormValues = {
    email: '',
    password: '',
    confirmPassword: '',
    terms: false
  };

  const handleSubmit = async (
    values: SignUpFormValues,
    { setSubmitting }: FormikHelpers<SignUpFormValues>
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password
      });

      if (error) {
        toast({
          title: 'Signup Error',
          description: error.message
        });
        return;
      }

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        router.push('/map');
      }
    } catch (error) {
      toast({
        title: 'Unexpected Error',
        description: (error as Error).message || 'An unexpected error occurred'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={signUpValidationSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched, isValid, dirty, isSubmitting }) => {
        setValues({ isValid, isDirty: dirty, isSubmitting });

        return (
          <Form>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Create Your Account 💖</h2>
              <p className="text-sm text-gray-500">
                Let's get you started on your journey to love!
              </p>

              <Field name="email">
                {({ field, meta }: FieldProps) => (
                  <div>
                    <Input
                      {...(field as any)}
                      label="Email"
                      type="email"
                      placeholder="Enter your email"
                      isInvalid={meta.touched && Boolean(meta.error)}
                      errorMessage={meta.touched && meta.error}
                    />
                  </div>
                )}
              </Field>

              <Field name="password">
                {({ field, meta }: FieldProps) => (
                  <div>
                    <Input
                      {...(field as any)}
                      label="Password"
                      type="password"
                      placeholder="Enter your password"
                      isInvalid={meta.touched && Boolean(meta.error)}
                      errorMessage={meta.touched && meta.error}
                    />
                  </div>
                )}
              </Field>

              <Field name="confirmPassword">
                {({ field, meta }: FieldProps) => (
                  <div>
                    <Input
                      {...(field as any)}
                      label="Confirm Password"
                      type="password"
                      placeholder="Confirm your password"
                      isInvalid={meta.touched && Boolean(meta.error)}
                      errorMessage={meta.touched && meta.error}
                    />
                  </div>
                )}
              </Field>

              <Field name="terms">
                {({ field, meta }: FieldProps) => (
                  <div>
                    <Checkbox
                      {...(field as any)}
                      isSelected={field.value as boolean}
                      onValueChange={field.onChange}
                      isInvalid={meta.touched && Boolean(meta.error)}
                    >
                      I agree to the Terms and Conditions
                    </Checkbox>
                    <FormError error={meta.error} touched={meta.touched} />
                  </div>
                )}
              </Field>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
