'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Card, CardBody, CardHeader } from '@heroui/react';

import { useToast } from '@/components/ui/use-toast';
import AgeVerificationForm from '@/components/ui/AuthForms/AgeVerificationForm';
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';

interface VerificationResult {
  success: boolean;
  ageVerified: boolean;
  error?: string;
}

export default function AgeVerificationPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();
  const { toast } = useToast();

  useEffect(() => {
    const checkAgeVerification = async () => {
      if (!user) return;

      const { data: verification } = await supabase
        .from('age_verifications')
        .select('verified')
        .eq('user_id', user.id)
        .single();

      if (verification?.verified) {
        router.push('/map');
      }
    };

    checkAgeVerification();
  }, [user, supabase, router]);

  const handleAgeVerification = async (birthDate: CalendarDate) => {
    if (!user) return;

    setLoading(true);
    try {
      // Convert CalendarDate to Date
      const birth = birthDate.toDate(getLocalTimeZone());
      
      const todayDate = today(getLocalTimeZone());
      let age = todayDate.year - birthDate.year;
      const monthDiff = todayDate.month - birthDate.month;
      if (monthDiff < 0 || (monthDiff === 0 && todayDate.day < birthDate.day)) {
        age--;
      }

      // Update both tables in parallel for better performance
      const [{ error: verificationError }, { error: userError }] = await Promise.all([
        supabase
          .from('age_verifications')
          .upsert({
            user_id: user.id,
            verified: true,
            verified_at: new Date().toISOString(),
            birth_date: birth.toISOString(),
            method: 'document'
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false // This will update the existing record
          }),
        supabase
          .from('users')
          .update({
            birth_date: birth.toISOString(),
            age: age,
            status: 'active'
          })
          .eq('id', user.id)
      ]);

      const result: VerificationResult = {
        success: !verificationError && !userError,
        ageVerified: age >= 18,
        error: verificationError?.message || userError?.message
      };

      if (result.success && result.ageVerified) {
        toast({
          title: 'Success',
          description: 'Age verification completed'
        });

        router.push('/map');
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 px-8 pb-0 pt-6">
          <h1 className="text-xl font-bold">Age Verification Required</h1>
          <p className="text-sm text-default-500">
            Please verify your age to continue. You must be 18 or older to use this service.
          </p>
        </CardHeader>
        <CardBody className="px-8 pb-8">
          <AgeVerificationForm
            onSubmit={handleAgeVerification}
            loading={loading}
          />
        </CardBody>
      </Card>
    </div>
  );
}
