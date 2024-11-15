import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Avatar,
  User
} from '@nextui-org/react';
import { MapPin, MessageCircle } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    avatar: string;
    location: string;
    distance: string;
    status: string;
  };
  onMessage?: (userId: string) => void;
}

export function UserProfileModal({
  isOpen,
  onClose,
  user,
  onMessage
}: UserProfileModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="bottom"
      classNames={{
        base: 'rounded-t-large'
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <User
            name={user.name}
            description={user.status}
            avatarProps={{
              src: user.avatar,
              size: 'lg',
              isBordered: true,
              color: 'primary'
            }}
          />
        </ModalHeader>
        <ModalBody className="pb-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-default-500">
              <MapPin size={16} />
              <span>
                {user.location} • {user.distance}
              </span>
            </div>
            <Button
              fullWidth
              color="primary"
              startContent={<MessageCircle size={18} />}
              onPress={() => onMessage?.(user.id)}
            >
              Message
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
