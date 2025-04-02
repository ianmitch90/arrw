import { faker } from '@faker-js/faker';
import { Message, ChatRoom } from '@/types/chat';
import { generateMockChatData } from './chat-data';

export class MockChatProvider {
  private static instance: MockChatProvider;
  private subscribers: Map<string, Set<(data: any) => void>>;
  private rooms: ChatRoom[];
  private mockTypingUsers: Map<string, Set<string>>;
  private typingTimeouts: Map<string, NodeJS.Timeout>;
  private mockData: ReturnType<typeof generateMockChatData>;

  private constructor() {
    this.mockData = generateMockChatData();
    this.rooms = this.mockData.rooms;
    this.subscribers = new Map();
    this.mockTypingUsers = new Map();
    this.typingTimeouts = new Map();
  }

  public static getInstance(): MockChatProvider {
    if (!MockChatProvider.instance) {
      MockChatProvider.instance = new MockChatProvider();
    }
    return MockChatProvider.instance;
  }

  public subscribe(channel: string, callback: (data: any) => void) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(channel)?.delete(callback);
      if (this.subscribers.get(channel)?.size === 0) {
        this.subscribers.delete(channel);
      }
    };
  }

  private broadcast(channel: string, data: any) {
    this.subscribers.get(channel)?.forEach(callback => callback(data));
  }

  public getMockData() {
    // Ensure dates are properly handled
    const processedData = {
      ...this.mockData,
      rooms: this.mockData.rooms.map(room => ({
        ...room,
        createdAt: new Date(room.createdAt),
        updatedAt: new Date(room.updatedAt),
        lastMessageAt: room.lastMessageAt ? new Date(room.lastMessageAt) : undefined,
        lastMessageTimestamp: room.lastMessageTimestamp ? new Date(room.lastMessageTimestamp) : undefined,
        messages: room.messages.map(msg => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
          updatedAt: new Date(msg.updatedAt)
        })),
        participants: room.participants.map(p => ({
          ...p,
          joinedAt: new Date(p.joinedAt),
          lastReadAt: new Date(p.lastReadAt),
          lastSeen: p.lastSeen ? new Date(p.lastSeen) : undefined
        }))
      }))
    };
    return processedData;
  }

  public getRooms(): ChatRoom[] {
    return this.mockData.rooms.map(room => ({
      ...room,
      createdAt: new Date(room.createdAt),
      updatedAt: new Date(room.updatedAt),
      lastMessageAt: room.lastMessageAt ? new Date(room.lastMessageAt) : undefined,
      lastMessageTimestamp: room.lastMessageTimestamp ? new Date(room.lastMessageTimestamp) : undefined,
      messages: room.messages.map(msg => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
        updatedAt: new Date(msg.updatedAt)
      })),
      participants: room.participants.map(p => ({
        ...p,
        joinedAt: new Date(p.joinedAt),
        lastReadAt: new Date(p.lastReadAt),
        lastSeen: p.lastSeen ? new Date(p.lastSeen) : undefined
      }))
    }));
  }

  public startTyping(roomId: string, userId: string) {
    if (!this.mockTypingUsers.has(roomId)) {
      this.mockTypingUsers.set(roomId, new Set());
    }
    this.mockTypingUsers.get(roomId)?.add(userId);

    // Clear existing timeout if any
    const existingTimeout = this.typingTimeouts.get(`${roomId}:${userId}`);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.stopTyping(roomId, userId);
    }, 3000);

    this.typingTimeouts.set(`${roomId}:${userId}`, timeout);

    this.broadcast(`room:${roomId}`, {
      type: 'typing_start',
      userId,
      timestamp: Date.now(),
    });
  }

  public stopTyping(roomId: string, userId: string) {
    this.mockTypingUsers.get(roomId)?.delete(userId);
    if (this.mockTypingUsers.get(roomId)?.size === 0) {
      this.mockTypingUsers.delete(roomId);
    }

    const timeoutKey = `${roomId}:${userId}`;
    const timeout = this.typingTimeouts.get(timeoutKey);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(timeoutKey);
    }

    this.broadcast(`room:${roomId}`, {
      type: 'typing_stop',
      userId,
      timestamp: Date.now(),
    });
  }

  public getTypingUsers(roomId: string): Set<string> {
    return this.mockTypingUsers.get(roomId) || new Set();
  }

  public async sendMessage(roomId: string, senderId: string, content: string): Promise<void> {
    // Stop typing when sending a message
    this.stopTyping(roomId, senderId);

    const newMessage: Message = {
      id: faker.string.uuid(),
      roomId,
      senderId,
      messageType: 'text',
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      isEdited: false,
    };

    // Update room
    const roomIndex = this.rooms.findIndex(r => r.id === roomId);
    if (roomIndex === -1) return;

    const room = this.rooms[roomIndex];
    const updatedRoom = {
      ...room,
      messages: [...(room.messages || []), newMessage],
      lastMessagePreview: content,
      lastMessageTimestamp: new Date(),
    };

    this.rooms[roomIndex] = updatedRoom;

    // Broadcast message
    this.broadcast(`room:${roomId}`, {
      type: 'new_message',
      message: newMessage,
    });

    // Simulate other user typing
    this.simulateTyping(roomId);
  }

  private simulateTyping(roomId: string) {
    // Clear any existing typing timeout
    if (this.mockTypingUsers.has(roomId)) {
      clearTimeout(this.mockTypingUsers.get(roomId)!);
      this.mockTypingUsers.delete(roomId);
    }

    // 30% chance of simulating typing
    if (Math.random() > 0.3) return;

    // Broadcast typing start
    this.broadcast(`room:${roomId}`, {
      type: 'typing_start',
      userId: faker.string.uuid(),
    });

    // Set timeout to stop typing
    const timeout = setTimeout(() => {
      this.broadcast(`room:${roomId}`, {
        type: 'typing_stop',
        userId: faker.string.uuid(),
      });

      // 50% chance of sending a response
      if (Math.random() > 0.5) {
        setTimeout(() => {
          this.sendMessage(
            roomId,
            faker.string.uuid(),
            faker.helpers.arrayElement([
              'Thanks for letting me know!',
              'That sounds great!',
              'I will get back to you soon.',
              'Perfect, thanks!',
              'Got it! 👍',
              'Makes sense to me.',
            ])
          );
        }, faker.number.int({ min: 1000, max: 3000 }));
      }
    }, faker.number.int({ min: 2000, max: 5000 }));

    this.mockTypingUsers.set(roomId, timeout);
  }
}

export const mockChatProvider = MockChatProvider.getInstance();
