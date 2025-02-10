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

// Helper to create dates relative to now
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

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
const createMockMessage = (roomId: string, senderId: string, messageAge?: number, parentId?: string): Message => {
  const timestamp = messageAge ? daysAgo(messageAge) : faker.date.recent();
  return {
    id: faker.string.uuid(),
    roomId,
    senderId,
    messageType: faker.helpers.arrayElement(['text', 'image', 'system'] as MessageType[]),
    content: faker.lorem.sentence(),
    metadata: {},
    createdAt: timestamp,
    updatedAt: timestamp,
    isEdited: faker.datatype.boolean(),
    parentId,
  };
};

// Create mock participants
const createMockParticipant = (userId: string, messageAge?: number): ChatParticipant => {
  // If the chat is recent (< 7 days) and randomly chosen, mark as unread
  const isRecentAndUnread = messageAge ? messageAge < 7 && faker.datatype.boolean() : false;
  const lastReadAt = isRecentAndUnread ? daysAgo(messageAge + 1) : faker.date.recent();
  
  return {
    role: faker.helpers.arrayElement(['owner', 'admin', 'member'] as ParticipantRole[]),
    joinedAt: faker.date.past(),
    lastReadAt,
    unreadCount: isRecentAndUnread ? faker.number.int({ min: 1, max: 5 }) : 0,
    isPinned: faker.datatype.boolean(),
    id: userId,
    fullName: faker.person.fullName(),
    avatarUrl: faker.image.avatar(),
    status: faker.helpers.arrayElement(['active', 'offline', 'away'] as const),
  };
};

// Create mock rooms
const createMockRoom = (id: string, type: RoomType = 'direct', messageAge?: number): ChatRoom => {
  const createdBy = faker.string.uuid();
  const participants = [
    createMockParticipant(createdBy, messageAge),
    createMockParticipant(faker.string.uuid(), messageAge),
  ];

  // Create messages with timestamps leading up to the target age
  const messages = Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, (_, i) => {
    const age = messageAge ? messageAge - faker.number.int({ min: 0, max: 2 }) : undefined;
    return createMockMessage(id, faker.helpers.arrayElement(participants).id, age);
  }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // Sort by date

  const lastMessage = messages[messages.length - 1];
  const lastMessageTimestamp = lastMessage?.createdAt || new Date();

  return {
    id,
    type,
    name: type === 'group' ? faker.word.words(2) : participants[0].fullName,
    createdBy,
    createdAt: faker.date.past(),
    updatedAt: lastMessageTimestamp,
    metadata: type === 'group' ? {
      description: faker.lorem.sentence(),
      imageUrl: faker.image.avatar(),
      groupName: faker.word.words(2)
    } : {},
    participants,
    messages,
    lastMessagePreview: lastMessage?.content || '',
    lastMessageTimestamp,
    lastMessageAt: lastMessageTimestamp,
    isArchived: faker.datatype.boolean()
  };
};

// Generate mock data
export const generateMockChatData = (roomCount = 10) => {
  const rooms: ChatRoom[] = [
    // Recent chats (0-5 days old)
    ...Array.from({ length: 3 }, () =>
      createMockRoom(faker.string.uuid(), 'direct', faker.number.int({ min: 0, max: 5 }))
    ),
    // Medium-age chats (6-20 days old)
    ...Array.from({ length: 2 }, () =>
      createMockRoom(faker.string.uuid(), 'direct', faker.number.int({ min: 6, max: 20 }))
    ),
    // Expiring soon chats (25-29 days old)
    ...Array.from({ length: 3 }, () =>
      createMockRoom(faker.string.uuid(), 'direct', faker.number.int({ min: 25, max: 29 }))
    ),
    // Almost expired chats (29-30 days old)
    ...Array.from({ length: 2 }, () =>
      createMockRoom(faker.string.uuid(), 'direct', faker.number.int({ min: 29, max: 30 }))
    ),
    // Expired chats (>30 days old)
    ...Array.from({ length: 3 }, () =>
      createMockRoom(faker.string.uuid(), 'direct', faker.number.int({ min: 31, max: 45 }))
    ),
    // Group chats (mix of ages)
    createMockRoom(faker.string.uuid(), 'group', 2), // Recent
    createMockRoom(faker.string.uuid(), 'group', 27), // Expiring soon
    createMockRoom(faker.string.uuid(), 'group', 35) // Expired
  ];

  return {
    rooms: rooms.sort((a, b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime()),
    currentUser: createMockUser(faker.string.uuid()),
  };
};

// Development check for mock data
export const useMockData = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
