import React, { useState, forwardRef } from 'react';
import { Button, Input, Link, Checkbox, Spinner } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { WordDivider } from '@/components/ui/WordDivider';
import { m } from 'framer-motion';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { createSupabaseClient } from '@/utils/auth-helpers/client';
import { useToast } from '@/components/ui/Toasts/use-toast';

const supabase = createSupabaseClient(); // Initialize Supabase client

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
    .matches(/[\W_]/, 'Password must contain at least one special character'), // Ensure special character
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  terms: Yup.bool()
    .oneOf([true], 'You must accept the terms and conditions')
    .required('You must accept the terms and conditions')
});

export default function SignUpForm({
  setIsLoginVisible,
  variants
}: {
  setIsLoginVisible: (visible: boolean) => void;
  variants: any;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);
  const { toast } = useToast();

  return (
    <Formik
      initialValues={{
        email: '',
        password: '',
        confirmPassword: '',
        terms: false
      }}
      validationSchema={validationSchema}
      validateOnChange={false}
      validateOnBlur={false}
      onSubmit={async (values, { setSubmitting }) => {
        const { email, password } = values;

        try {
          const { error } = await supabase.auth.signUp({
            email,
            password
          });

          if (error) {
            // Show toast for error
            toast({
              title: 'Sign Up Error',
              description: error.message || 'An error occurred during sign up.'
            });
          } else {
            // Show success toast
            toast({
              title: 'Sign Up Successful',
              description: 'Please check your email to confirm your account.'
            });
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
                  errorMessage={meta.touched && meta.error}
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
                    <button type="button" onClick={toggleVisibility}>
                      {isVisible ? (
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
                  type={isVisible ? 'text' : 'password'}
                  isInvalid={meta.touched && Boolean(meta.error)}
                  errorMessage={meta.touched && meta.error}
                />
              )}
            </Field>
            <Field name="confirmPassword">
              {({ field, meta }: { field: any; meta: any }) => (
                <Input
                  {...field}
                  isRequired
                  label="Confirm Password"
                  variant="bordered"
                  placeholder="Confirm your password"
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
                  errorMessage={meta.touched && meta.error}
                />
              )}
            </Field>
            <Field name="terms" type="checkbox">
              {({ field, meta }: { field: any; meta: any }) => (
                <Checkbox
                  isRequired
                  size="sm"
                  isSelected={field.value}
                  onChange={field.onChange}
                  name="terms"
                >
                  I agree with the&nbsp;
                  <Link href="#" size="sm">
                    Terms
                  </Link>
                  &nbsp; and&nbsp;
                  <Link href="#" size="sm">
                    Privacy Policy
                  </Link>
                </Checkbox>
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
              Sign Up
            </Button>
            {WordDivider('OR')}
            <Button
              fullWidth
              variant="flat"
              onPress={() => setIsLoginVisible(true)}
            >
              Login
            </Button>
          </m.div>
        </Form>
      )}
    </Formik>
  );
}
