'use client';

import React, { useEffect } from 'react';
import { Button, Input, Link, Spinner } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { WordDivider } from '@/components/ui/WordDivider';
import { m } from 'framer-motion';
import { createSupabaseClient } from '@/utils/auth-helpers/client'; // Import the new function
import { Formik, Form, Field } from 'formik'; // Import Formik and Form
import * as Yup from 'yup'; // Import Yup
import { useToast } from '@/components/ui/Toasts/use-toast'; // Import the useToast hook
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

// Initialize Supabase client using the new function
const supabase = createSupabaseClient(); // Create Supabase client

// Define Yup validation schema
const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(10, 'Password must be at least 10 characters long')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[\W_]/, 'Password must contain at least one special character') // Ensure special character
});

export default function LoginForm({ variants }: any) {
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);
  const { toast } = useToast();
  const router = useRouter();

  // Use useEffect for client-specific logic
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Client-side only logic
    }
  }, []);

  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={validationSchema}
      validateOnChange={false}
      validateOnBlur={false}
      onSubmit={async (values, { setSubmitting }) => {
        const { email, password } = values;

        try {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) {
            // Show toast for error
            toast({
              title: 'Login Error',
              description: error.message || 'An error occurred during login.'
            });
          } else {
            // Show success toast
            toast({
              title: 'Login Successful',
              description: 'You have logged in successfully.'
            });
            router.push('/app'); // Redirect to app after successful login
          }
        } catch (error) {
          // Show toast for unexpected errors
          toast({
            title: 'Unexpected Error',
            description:
              (error as Error).message || 'An unexpected error occurred.'
          });
        } finally {
          setSubmitting(false);
        }
      }}
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
              {({ field, meta }: { field: any; meta: any }) => (
                <Input
                  {...field}
                  autoFocus
                  isRequired
                  label="Email Address"
                  type="email"
                  variant="bordered"
                  placeholder="Enter your email"
                  isInvalid={meta.touched && Boolean(meta.error)}
                  errormessage={meta.touched && meta.error}
                />
              )}
            </Field>
            <Field name="password">
              {({ field, meta }: { field: any; meta: any }) => (
                <Input
                  {...field}
                  isRequired
                  label="Password"
                  variant="bordered"
                  placeholder="Enter your password"
                  endContent={
                    <button type="button" onClick={toggleConfirmVisibility}>
                      {isConfirmVisible ? (
                        <Icon
                          className="pointer-events-none text-2xl text-default-400"
                          icon="solar:eye-closed-linear"
                        />
                      ) : (
                        <Icon
                          className="pointer-events-none text-2xl text-default-400"
                          icon="solar:eye-bold"
                        />
                      )}
                    </button>
                  }
                  type={isConfirmVisible ? 'text' : 'password'}
                  isInvalid={meta.touched && Boolean(meta.error)}
                  errormessage={meta.touched && meta.error}
                />
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
              //  onPress={handleAnonymousLogin}
            >
              Login Anonymously
            </Button>
            <Button type="button">Get Magic Link</Button>
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
