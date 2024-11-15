import { createContext, useContext, useState, useEffect } from 'react';
import { AgeVerificationState, AgeVerificationContextType } from '@/types/auth.types';
import { supabase } from '@/lib/supabase';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const AgeVerificationContext = createContext<AgeVerificationContextType | undefined>(undefined);

export function AgeVerificationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AgeVerificationState>({
    isVerified: false,
    verifiedAt: null,
    method: null,
    isAnonymous: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const supabaseClient = createClientComponentClient();

  // Check initial verification status
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.user) {
          const { data } = await supabaseClient
            .from('users')
            .select('age_verified_at, age_verification_method, is_anonymous')
            .eq('id', session.user.id)
            .single();

          if (data?.age_verified_at) {
            setState({
              isVerified: true,
              verifiedAt: new Date(data.age_verified_at),
              method: data.age_verification_method,
              isAnonymous: data.is_anonymous
            });
          }
        }
      } catch (err) {
        console.error('Error checking age verification:', err);
        setError(err instanceof Error ? err : new Error('Failed to check age verification'));
      }
    };

    checkVerification();
  }, []);

  const verifyAge = async ({ 
    birthDate,
    method,
    isAnonymous 
  }: { 
    birthDate: Date;
    method: 'modal' | 'document';
    isAnonymous: boolean;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session && !isAnonymous) {
        throw new Error('User must be logged in to verify age');
      }

      const verificationData = {
        age_verified_at: new Date().toISOString(),
        age_verification_method: method,
        birth_date: birthDate.toISOString(),
        is_anonymous: isAnonymous
      };

      if (session?.user) {
        const { error: updateError } = await supabaseClient
          .from('users')
          .update(verificationData)
          .eq('id', session.user.id);

        if (updateError) throw updateError;
      }

      setState({
        isVerified: true,
        verifiedAt: new Date(),
        method,
        isAnonymous
      });
    } catch (err) {
      console.error('Error verifying age:', err);
      setError(err instanceof Error ? err : new Error('Failed to verify age'));
      throw err;
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
      value={{
        state,
        verifyAge,
        reset,
        isLoading,
        error
      }}
    >
      {children}
    </AgeVerificationContext.Provider>
  );
}

export function useAgeVerification() {
  const context = useContext(AgeVerificationContext);
  if (context === undefined) {
    throw new Error('useAgeVerification must be used within an AgeVerificationProvider');
  }
  return context;
}
