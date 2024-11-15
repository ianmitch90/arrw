'use client';

import React from 'react';
import {
  Button,
  Input,
  Link,
  Spinner,
  Card,
  CardBody,
  CardHeader,
  Divider
} from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { m } from 'framer-motion';
import { supabase } from '@/utils/supabase/client';
import { Formik, Form } from 'formik';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { LoginFormValues, Variants } from '@/types/auth';
import { loginValidationSchema } from '@/utils/validation/auth';
import { handleMagicLinkLogin } from '@/utils/auth-helpers/magicLink';

export default function LoginForm({
  variants
}: {
  variants: Variants;
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
        title: 'Error',
        description: 'An unexpected error occurred.'
      });
    } finally {
      setIsAnonymousLoading(false);
    }
  };

  return (
    <m.div
      initial="initial"
      animate="animate"
      variants={variants}
      className="w-full max-w-md mx-auto"
    >
      <Card className="p-6">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">Welcome Back</h1>
        </CardHeader>
        <CardBody>
          <Formik
            initialValues={{
              email: '',
              password: ''
            }}
            validationSchema={loginValidationSchema}
            onSubmit={async (
              values: LoginFormValues,
              { setSubmitting, setFieldError }
            ) => {
              try {
                const { data, error } = await supabase.auth.signInWithPassword({
                  email: values.email,
                  password: values.password
                });

                if (error) {
                  setFieldError('password', error.message);
                  toast({
                    title: 'Login Error',
                    description: error.message
                  });
                  return;
                }

                if (data.session) {
                  toast({
                    title: 'Login Successful',
                    description: 'You have logged in successfully.'
                  });
                  router.push('/map');
                }
              } catch (error) {
                toast({
                  title: 'Error',
                  description: 'An unexpected error occurred.'
                });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, errors, touched, handleChange, handleBlur }) => (
              <Form className="space-y-4">
                <Input
                  name="email"
                  type="email"
                  label="Email"
                  placeholder="Enter your email"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={touched.email && !!errors.email}
                  errorMessage={touched.email && errors.email}
                  autoComplete="email"
                />

                <Input
                  name="password"
                  type={isConfirmVisible ? 'text' : 'password'}
                  label="Password"
                  placeholder="Enter your password"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={touched.password && !!errors.password}
                  errorMessage={touched.password && errors.password}
                  autoComplete="current-password"
                  endContent={
                    <button
                      type="button"
                      onClick={() => setIsConfirmVisible(!isConfirmVisible)}
                    >
                      {isConfirmVisible ? (
                        <Icon icon="solar:eye-closed-linear" className="text-2xl text-default-400" />
                      ) : (
                        <Icon icon="solar:eye-linear" className="text-2xl text-default-400" />
                      )}
                    </button>
                  }
                />

                <div className="flex justify-end">
                  <Link href="/auth/reset_password" size="sm">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  color="primary"
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>

                <div className="relative">
                  <Divider className="my-4" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-content1 px-2 text-tiny text-default-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="bordered"
                    className="w-full"
                    onClick={() => handleMagicLinkLogin(toast)}
                    isLoading={isMagicLinkLoading}
                  >
                    <Icon icon="material-symbols:magic-button" className="text-xl" />
                    Magic Link
                  </Button>

                  <Button
                    variant="bordered"
                    className="w-full"
                    onClick={handleAnonymousLogin}
                    isLoading={isAnonymousLoading}
                  >
                    <Icon icon="ph:incognito" className="text-xl" />
                    Continue Anonymously
                  </Button>
                </div>

                <div className="text-center text-sm">
                  <span className="text-default-500">
                    Don't have an account?{' '}
                  </span>
                  <Link href="/auth/sign-up" size="sm">
                    Sign up
                  </Link>
                </div>
              </Form>
            )}
          </Formik>
        </CardBody>
      </Card>
    </m.div>
  );
}
