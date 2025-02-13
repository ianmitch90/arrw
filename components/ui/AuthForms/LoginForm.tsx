'use client';

import { Button, Input } from '@heroui/react';
import { Formik, Form, Field, FieldInputProps, FieldMetaProps } from 'formik';
import { LoginFormValues } from '@/types/auth';
import { FormError } from '../FormError';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import WordDivider from '@/components/ui/WordDivider';
import AgeVerificationModal from './AgeVerificationModal';
import { useDisclosure, Modal, ModalHeader, ModalBody, ModalFooter, ModalContent } from '@heroui/react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';
import { loginValidationSchema } from '@/utils/validation/auth';
import { useAgeVerification } from '@/contexts/AgeVerificationContext';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnonymousLoading, setIsAnonymousLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { isOpen: isMagicLinkOpen, onOpen: onMagicLinkOpen, onClose: onMagicLinkClose } = useDisclosure();
  const { isOpen: isAgeModalOpen, onOpen: onAgeModalOpen, onClose: onAgeModalClose } = useDisclosure();
  const supabase = useSupabaseClient();
  const { setIsSignupFlow } = useAgeVerification();

  const handleMagicLinkLogin = async () => {
    if (!magicLinkEmail) {
      toast({
        title: 'Error',
        description: 'Please enter your email',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: magicLinkEmail,
      });
      if (error) throw error;
      onMagicLinkClose();
      toast({
        title: 'Success',
        description: 'Check your email for the magic link',
      });
    } catch (error) {
      const err = error as { message: string };
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousLogin = () => {
    setIsAnonymousLoading(true);
    try {
      setIsSignupFlow(false); // This is not a signup flow
      onAgeModalOpen();
    } catch (error) {
      console.error('Anonymous login error:', error);
      toast({
        title: 'Login Failed',
        description: 'Failed to proceed with anonymous login',
        variant: 'destructive'
      });
    } finally {
      setIsAnonymousLoading(false);
    }
  };

  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Add a function to create a test user
  const createTestUser = async () => {
    try {
      const testEmail = `test${Date.now()}@example.com`;
      const testPassword = 'password123';
      
      console.log('Creating test user:', testEmail);
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });

      if (error) {
        console.error('Error creating test user:', error);
        toast({
          title: 'Error',
          description: 'Failed to create test user: ' + error.message,
          variant: 'destructive'
        });
        return;
      }

      console.log('Test user created:', data);
      toast({
        title: 'Test User Created',
        description: `Email: ${testEmail}\nPassword: ${testPassword}`,
      });
    } catch (error) {
      const err = error as { message: string };
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        {/* <p className="pb-2 text-xl font-medium">Welcome Back</p> */}

        <Formik
          initialValues={{
            email: '',
            password: ''
          }}
          validationSchema={loginValidationSchema}
          onSubmit={async (values: LoginFormValues, { setSubmitting }) => {
            try {
              setError(null);
              const { error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password
              });
              if (error) throw error;
              router.push('/map');
            } catch (error) {
              const err = error as { message: string };
              console.error('Login error:', error);
              setError(err.message);
              toast({
                title: 'Login Failed',
                description: err.message || 'An error occurred during login',
                variant: 'destructive'
              });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <Field name="email">
                {({ 
                  field,
                  meta
                }: {
                  field: FieldInputProps<string>;
                  meta: FieldMetaProps<string>;
                }) => (
                  <div>
                    <Input
                      type="email"
                      label="Email"
                      variant="bordered"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      isInvalid={meta.touched && !!meta.error}
                      errorMessage={meta.touched && meta.error}
                    />
                  </div>
                )}
              </Field>

              <Field name="password">
                {({ 
                  field,
                  meta
                }: {
                  field: FieldInputProps<string>;
                  meta: FieldMetaProps<string>;
                }) => (
                  <div>
                    <Input
                      type={isPasswordVisible ? "text" : "password"}
                      label="Password"
                      variant="bordered"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      isInvalid={meta.touched && !!meta.error}
                      errorMessage={meta.touched && meta.error}
                      endContent={
                        <button 
                          className="focus:outline-none" 
                          type="button" 
                          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        >
                          {isPasswordVisible ? (
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
                    />
                  </div>
                )}
              </Field>

              {error && <FormError error={{ message: error }} />}

              <div className="space-y-2">
                <Button
                  type="submit"
                  color="primary"
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  Sign In
                </Button>

                {process.env.NODE_ENV === 'development' && (
                  <Button
                    color="secondary"
                    onClick={createTestUser}
                    className="w-full"
                  >
                    Create Test User
                  </Button>
                )}

                <WordDivider
                  word="OR"
                  spacing="sm"
                  wordClassName="text-tiny text-default-500"
                />

                <Button
                  variant="bordered"
                  className="w-full"
                  onClick={onMagicLinkOpen}
                  isLoading={isLoading}
                  startContent={
                    !isLoading && (
                      <Icon icon="mdi:magic-staff" className="text-xl" />
                    )
                  }
                >
                  Magic Link
                </Button>

                <Button
                  variant="bordered"
                  className="w-full"
                  onClick={handleAnonymousLogin}
                  isLoading={isAnonymousLoading}
                  startContent={
                    !isAnonymousLoading && (
                      <Icon icon="mdi:incognito" className="text-xl" />
                    )
                  }
                >
                  Continue Anonymously
                </Button>

                <p className="text-center text-sm">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/signup"
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </Link>
                </p>

                <p className="text-center text-sm">
                  <Link
                    href="/auth/reset-password"
                    className="text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </p>
              </div>
            </Form>
          )}
        </Formik>
      </div>

      {/* Age Verification Modal */}
      <AgeVerificationModal
        isOpen={isAgeModalOpen}
        onClose={onAgeModalClose}
      />

      {/* Magic Link Modal */}
      <Modal isOpen={isMagicLinkOpen} onClose={onMagicLinkClose}>
        <ModalContent>
          <ModalHeader>Sign in with Magic Link</ModalHeader>
          <ModalBody>
            <Input
              type="email"
              label="Email"
              value={magicLinkEmail}
              onChange={(e) => setMagicLinkEmail(e.target.value)}
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onClick={onMagicLinkClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleMagicLinkLogin}
              isLoading={isLoading}
            >
              Send Magic Link
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
