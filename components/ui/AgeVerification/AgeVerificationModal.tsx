import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox
} from '@nextui-org/react';
import { useAgeVerification } from '@/contexts/AgeVerificationContext';

export function AgeVerificationModal() {
  const [isChecked, setIsChecked] = useState(false);
  const { verify, isLoading, error } = useAgeVerification();
  const [isOpen, setIsOpen] = useState(true);

  const handleVerify = async () => {
    if (!isChecked) return;
    await verify('modal');
    setIsOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing without verification
      hideCloseButton
      isDismissable={false}
    >
      <ModalContent>
        <ModalHeader>Age Verification Required</ModalHeader>
        <ModalBody>
          <p>You must be 18 or older to access this site.</p>
          <Checkbox isSelected={isChecked} onValueChange={setIsChecked}>
            I confirm that I am 18 years or older
          </Checkbox>
          {error && <p className="text-red-500 text-sm">{error.message}</p>}
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onPress={handleVerify}
            isDisabled={!isChecked}
            isLoading={isLoading}
          >
            Confirm Age
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
