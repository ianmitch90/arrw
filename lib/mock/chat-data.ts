import { faker } from '@faker-js/faker';
import { 
  Message, 
  ChatRoom, 
  ChatUser, 
  ChatParticipant,
  MessageType,
  RoomType,
  ParticipantRole 
} from '@/types/chat.types';

// Create mock users
const createMockUser = (id: string): ChatUser => ({
  id,
  email: faker.internet.email(),
  fullName: faker.person.fullName(),
  avatarUrl: faker.image.avatar(),
  status: faker.helpers.arrayElement(['active', 'offline', 'away'] as const),
  lastSeen: faker.date.recent(),
});

// Create mock messages
const createMockMessage = (roomId: string, senderId: string, parentId?: string): Message => ({
  id: faker.string.uuid(),
  roomId,
  senderId,
  messageType: faker.helpers.arrayElement(['text', 'image', 'system'] as MessageType[]),
  content: faker.lorem.sentence(),
  metadata: {},
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  isEdited: faker.datatype.boolean(),
  parentId,
});

// Create mock participants
const createMockParticipant = (userId: string): ChatParticipant => ({
  role: faker.helpers.arrayElement(['owner', 'admin', 'member'] as ParticipantRole[]),
  joinedAt: faker.date.past(),
  lastReadAt: faker.date.recent(),
  unreadCount: faker.number.int({ min: 0, max: 10 }),
  isPinned: faker.datatype.boolean(),
  id: userId,
  fullName: faker.person.fullName(),
  avatarUrl: faker.image.avatar(),
  isOnline: faker.datatype.boolean(),
});

// Create mock rooms
const createMockRoom = (id: string, type: RoomType = 'direct'): ChatRoom => {
  const createdBy = faker.string.uuid();
  const participants = [
    createMockParticipant(createdBy),
    createMockParticipant(faker.string.uuid()),
  ];

  const messages = Array.from({ length: faker.number.int({ min: 1, max: 20 }) }, () =>
    createMockMessage(id, faker.helpers.arrayElement(participants).id)
  );

  const lastMessage = messages[messages.length - 1];

  return {
    id,
    type,
    name: type === 'group' ? faker.word.words(2) : '',
    createdBy,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    metadata: type === 'group' ? { groupName: faker.word.words(2) } : {},
    participants,
    messages,
    lastMessagePreview: lastMessage?.content || '',
    lastMessageTimestamp: lastMessage?.createdAt || new Date(),
  };
};

// Generate mock data
export const generateMockChatData = (roomCount = 10) => {
  const rooms: ChatRoom[] = Array.from({ length: roomCount }, () =>
    createMockRoom(faker.string.uuid())
  );

  // Add one group chat
  rooms.push(createMockRoom(faker.string.uuid(), 'group'));

  return {
    rooms,
    currentUser: createMockUser(faker.string.uuid()),
  };
};

// Development check for mock data
export const useMockData = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
