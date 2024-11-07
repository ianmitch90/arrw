import { AgeVerificationModal } from '@/components/ui/AgeVerification';
import { AgeVerificationProvider } from '@/contexts/AgeVerificationContext';

export default function VerifyAgePage() {
  return (
    <AgeVerificationProvider>
      <div className="min-h-screen flex items-center justify-center">
        <AgeVerificationModal />
      </div>
    </AgeVerificationProvider>
  );
}
