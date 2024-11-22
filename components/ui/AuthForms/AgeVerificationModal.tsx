import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure
} from '@nextui-org/react';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AgeVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  onCancel
}: AgeVerificationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      classNames={{
        backdrop: 'bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20'
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Age Verification Required</ModalHeader>
        <ModalBody>
          <p>
            You must be 18 years or older to use this service. By continuing, you confirm that you meet this age requirement.
          </p>
          <p className="text-sm text-gray-400">
            Please note that providing false information about your age may result in account termination.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={() => {
              onCancel();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={() => {
              onConfirm();
              onClose();
            }}
          >
            I am 18 or older
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
