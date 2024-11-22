'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Card, CardBody, CardHeader } from '@nextui-org/react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import AgeVerificationForm from '@/components/ui/AuthForms/AgeVerificationForm';
import { CalendarDate } from '@internationalized/date';

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
      // Calculate age first
      const today = new Date();
      const birth = new Date(birthDate.toString());
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
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
            birth_date: birthDate.toString(),
            method: 'document'
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false // This will update the existing record
          }),
        supabase
          .from('users')
          .update({
            birth_date: birthDate.toString(),
            age: age,
            status: 'active'
          })
          .eq('id', user.id)
      ]);

      if (verificationError) throw verificationError;
      if (userError) throw userError;

      toast({
        title: 'Success',
        description: 'Age verification completed'
      });

      router.push('/map');
    } catch (error: any) {
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
          <AgeVerificationForm onSubmit={handleAgeVerification} loading={loading} />
        </CardBody>
      </Card>
    </div>
  );
}
