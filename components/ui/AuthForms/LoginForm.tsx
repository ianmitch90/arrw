'use client';

import React from 'react';
import { Button, Input, Link, Spinner } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { WordDivider } from '@/components/ui/WordDivider';
import { m } from 'framer-motion';
import { supabase } from '@/utils/supabase/client';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { useRouter } from 'next/navigation';
import { LoginFormValues, FieldProps, Variants } from '@/types/auth';
import { loginValidationSchema } from '@/utils/validation/auth';
import { handleMagicLinkLogin } from '@/utils/auth-helpers/magicLink';

export default function LoginForm({
  variants
}: {
  variants: Variants; // Ensure this matches the expected type
}) {
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isAnonymousLoading, setIsAnonymousLoading] = React.useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = React.useState(false);

  const handleAnonymousLogin = async () => {
    setIsAnonymousLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        toast({
          title: 'Anonymous Login Error',
          description: error.message
        });
        return;
      }

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });

        toast({
          title: 'Login Successful',
          description: 'You have logged in anonymously successfully.'
        });
        router.push('/map');
      }
    } catch (error) {
      toast({
        title: 'Unexpected Error',
        description: (error as Error).message || 'An unexpected error occurred.'
      });
    } finally {
      setIsAnonymousLoading(false);
    }
  };

  const handleSubmit = async (
    values: LoginFormValues,
    { setSubmitting }: FormikHelpers<LoginFormValues>
  ) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });

      if (error) {
        toast({
          title: 'Login Error',
          description: error.message
        });
        return;
      }

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });

        toast({
          title: 'Login Successful',
          description: 'You have logged in successfully.'
        });
        router.push('/map');
      }
    } catch (error) {
      toast({
        title: 'Unexpected Error',
        description: (error as Error).message || 'An unexpected error occurred.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMagicLink = async () => {
    const email = (
      document.querySelector('input[name="email"]') as HTMLInputElement
    )?.value;

    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address first.'
      });
      return;
    }

    setIsMagicLinkLoading(true);
    try {
      const { error } = await handleMagicLinkLogin(email);

      if (error) {
        toast({
          title: 'Magic Link Error',
          description: error
        });
        return;
      }

      toast({
        title: 'Check your email',
        description: 'We sent you a magic link to sign in.'
      });
    } catch (error) {
      toast({
        title: 'Unexpected Error',
        description: (error as Error).message || 'An unexpected error occurred.'
      });
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={loginValidationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <Form>
          <m.div
            animate="visible"
            className="flex flex-col gap-y-3"
            exit="hidden"
            initial="hidden"
            variants={variants}
          >
            <Field name="email">
              {({ field, meta }: FieldProps) => (
                <div>
                  <Input
                    {...(field as any)}
                    autoFocus
                    isRequired
                    label="Email Address"
                    type="email"
                    variant="bordered"
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
                    isRequired
                    label="Password"
                    variant="bordered"
                    placeholder="Enter your password"
                    endContent={
                      <button
                        type="button"
                        onClick={() => setIsConfirmVisible(!isConfirmVisible)}
                      >
                        <Icon
                          className="pointer-events-none text-2xl text-default-400"
                          icon={
                            isConfirmVisible
                              ? 'solar:eye-closed-linear'
                              : 'solar:eye-bold'
                          }
                        />
                      </button>
                    }
                    type={isConfirmVisible ? 'text' : 'password'}
                    isInvalid={meta.touched && Boolean(meta.error)}
                    errorMessage={meta.touched && meta.error}
                  />
                </div>
              )}
            </Field>

            <Button
              color="primary"
              type="submit"
              spinner={<Spinner color="white" size="sm" />}
              spinnerPlacement="end"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Log In
            </Button>

            <Link className="mt-2">Forgot Password?</Link>
            {WordDivider('OR')}

            <Button
              color="secondary"
              fullWidth
              variant="flat"
              onClick={handleAnonymousLogin}
              isLoading={isAnonymousLoading}
            >
              Login Anonymously
            </Button>

            <Button
              type="button"
              onClick={handleMagicLink}
              isLoading={isMagicLinkLoading}
            >
              Get Magic Link
            </Button>

            {WordDivider('Need an account?')}

            <Button
              fullWidth
              variant="flat"
              onClick={() => router.push('/auth/sign-up')}
            >
              Sign Up
            </Button>
          </m.div>
        </Form>
      )}
    </Formik>
  );
}
