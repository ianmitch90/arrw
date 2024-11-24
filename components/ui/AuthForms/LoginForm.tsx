'use client';

import { Button, Input } from '@nextui-org/react';
import { Formik, Form, Field, FieldInputProps, FieldMetaProps } from 'formik';
import { LoginFormValues } from '@/types/auth';
import { FormError } from '../FormError';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import WordDivider from '@/components/ui/WordDivider';
import AgeVerificationModal from './AgeVerificationModal';
import { useDisclosure, Modal, ModalHeader, ModalBody, ModalFooter, ModalContent } from '@nextui-org/react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';
import { loginValidationSchema } from '@/utils/validation/auth';
import { useSessionManager } from '@/context/SessionManagerContext';
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
  const sessionManager = useSessionManager();
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
      const { data, error } = await supabase.auth.signInWithOtp({
        email: magicLinkEmail,
      });
      if (error) throw error;
      onMagicLinkClose();
      toast({
        title: 'Success',
        description: 'Check your email for the magic link',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousLogin = () => {
    setIsSignupFlow(false); // This is not a signup flow
    onAgeModalOpen();
  };

  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <p className="pb-2 text-xl font-medium">Welcome Back</p>

        <Formik
          initialValues={{
            email: '',
            password: ''
          }}
          validationSchema={loginValidationSchema}
          onSubmit={async (values: LoginFormValues, { setSubmitting }) => {
            try {
              setError(null);
              await signIn(values.email, values.password);
              router.push('/map');
            } catch (error: any) {
              setError(error.message);
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

              {error && <FormError error={error} />}

              <div className="space-y-2">
                <Button
                  type="submit"
                  color="primary"
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  Sign In
                </Button>

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
                  Don't have an account?{' '}
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
