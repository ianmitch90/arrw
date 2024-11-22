'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password')
});

interface SignUpFormProps {
  onSuccess?: () => void;
}

export default function SignUpForm({ onSuccess }: SignUpFormProps) {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // Validate input
        const validatedData = validationSchema.validateSync(values);

        // Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (error) throw error;

        if (data.user) {
          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                email: data.user.email,
                created_at: new Date().toISOString()
              }
            ]);

          if (profileError) throw profileError;

          toast({
            title: 'Success',
            description: 'Please check your email to verify your account'
          });

          if (onSuccess) {
            onSuccess();
          } else {
            router.push('/login');
          }
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'An error occurred during sign up',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <p className="pb-2 text-xl font-medium">Create Account</p>

        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={
                formik.touched.email && formik.errors.email
                  ? 'border-red-500'
                  : ''
              }
            />
            {formik.touched.email && formik.errors.email && (
              <div className="text-sm text-red-500">{formik.errors.email}</div>
            )}

            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={
                formik.touched.password && formik.errors.password
                  ? 'border-red-500'
                  : ''
              }
            />
            {formik.touched.password && formik.errors.password && (
              <div className="text-sm text-red-500">
                {formik.errors.password}
              </div>
            )}

            <Input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={
                formik.touched.confirmPassword && formik.errors.confirmPassword
                  ? 'border-red-500'
                  : ''
              }
            />
            {formik.touched.confirmPassword &&
              formik.errors.confirmPassword && (
                <div className="text-sm text-red-500">
                  {formik.errors.confirmPassword}
                </div>
              )}
          </div>

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !formik.isValid}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>

            <p className="text-center text-sm">
              Already have an account?{' '}
              <a href="/login" className="text-primary hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
