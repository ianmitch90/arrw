import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  Input
} from '@nextui-org/react';
import { useAgeVerification } from '@/contexts/AgeVerificationContext';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { useSessionManager } from '@/context/SessionManagerContext';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgeVerificationModal({
  isOpen,
  onClose,
}: AgeVerificationModalProps) {
  const { verifyAge, isLoading: contextLoading, error: contextError, state, isSignupFlow } = useAgeVerification();
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const router = useRouter();
  const sessionManager = useSessionManager();

  const handleVerification = async () => {
    setValidationError(null);
    setIsLoading(true);

    try {
      if (!hasAcknowledged) {
        setValidationError('Please acknowledge that you are 18 or older');
        return;
      }

      if (!birthDate) {
        setValidationError('Please enter your birth date');
        return;
      }

      const birthDateObj = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDateObj.getFullYear();
      const monthDiff = today.getMonth() - birthDateObj.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
      }

      if (age < 18) {
        setValidationError('You must be 18 or older to use this service');
        return;
      }

      // If not in signup flow, handle anonymous sign in
      if (!isSignupFlow) {
        const { data: { user, session }, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        if (!session) throw new Error('No session returned');
        if (!user) throw new Error('No user returned');

        // Initialize session management
        await sessionManager.handleNewSession(session);

        // Set the session in Supabase client
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
      }

      // Verify age through context
      await verifyAge({
        birthDate: birthDateObj,
        method: 'modal',
        isAnonymous: !isSignupFlow,
        hasAcknowledged
      });

      // Close modal first before any other UI operations
      onClose();
      
      if (!isSignupFlow) {
        toast({
          title: 'Success',
          description: 'Signed in anonymously',
        });

        // Use router.replace instead of push to avoid back button issues
        router.replace('/map');
      }
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Failed to verify age');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to verify age',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      size="lg"
      classNames={{
        backdrop: 'bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20'
      }}
      isDismissable={!isLoading}
      hideCloseButton={isLoading}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Age Verification Required</ModalHeader>
        <ModalBody className="gap-4">
          <p className="text-default-500">
            To ensure compliance with legal requirements, we need to verify your age.
            Please complete both steps below:
          </p>

          <div className="flex flex-col gap-4 p-4 bg-content2 rounded-lg">
            <Checkbox
              isSelected={hasAcknowledged}
              onValueChange={setHasAcknowledged}
              size="sm"
              isDisabled={isLoading}
            >
              I confirm that I am 18 years or older
            </Checkbox>

            <Input
              type="date"
              label="Birth Date"
              placeholder="Enter your birth date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              isInvalid={!!validationError && !birthDate}
              errorMessage={!birthDate && validationError}
              classNames={{
                input: 'text-small',
                label: 'text-small'
              }}
              isDisabled={isLoading}
            />
          </div>

          {validationError && (
            <p className="text-danger text-sm">{validationError}</p>
          )}

          <p className="text-sm text-gray-400">
            Please note that providing false information about your age may result in account termination.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
            isDisabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleVerification}
            isLoading={isLoading}
          >
            Verify Age
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
