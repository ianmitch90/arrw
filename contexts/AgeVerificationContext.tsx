import { createContext, useContext, useState, useEffect } from 'react';
import {
  AgeVerificationState,
  AgeVerificationContextType
} from '@/types/auth.types';
import { supabase, auth } from '@/utils/supabase/client';

const AgeVerificationContext = createContext<
  AgeVerificationContextType | undefined
>(undefined);

export function AgeVerificationProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<AgeVerificationState>({
    isVerified: false,
    verifiedAt: null,
    method: null,
    isAnonymous: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Check initial verification status
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const isVerified = await auth.checkAgeVerification();
        if (isVerified) {
          const user = await auth.getUser();
          const { data } = await supabase
            .from('users')
            .select('age_verified_at, age_verification_method')
            .eq('id', user?.id)
            .single();

          setState({
            isVerified: true,
            verifiedAt: data?.age_verified_at
              ? new Date(data.age_verified_at)
              : new Date(),
            method: data?.age_verification_method as
              | 'modal'
              | 'document'
              | null,
            isAnonymous: false
          });
        }
      } catch (err) {
        console.error('Error checking verification:', err);
      }
    };

    checkVerification();
  }, []);

  const verify = async (method: 'modal' | 'document') => {
    setIsLoading(true);
    setError(null);
    try {
      await auth.verifyAge(method);
      setState({
        isVerified: true,
        verifiedAt: new Date(),
        method,
        isAnonymous: false
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Verification failed'));
      throw err; // Re-throw for component handling
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setState({
      isVerified: false,
      verifiedAt: null,
      method: null,
      isAnonymous: false
    });
    setError(null);
  };

  return (
    <AgeVerificationContext.Provider
      value={{ state, verify, reset, isLoading, error }}
    >
      {children}
    </AgeVerificationContext.Provider>
  );
}

export const useAgeVerification = () => {
  const context = useContext(AgeVerificationContext);
  if (context === undefined) {
    throw new Error(
      'useAgeVerification must be used within an AgeVerificationProvider'
    );
  }
  return context;
};
