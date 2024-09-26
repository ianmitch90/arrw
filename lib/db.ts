import Dexie from 'dexie';
import { Message, Profile } from '../types';

export class AppDatabase extends Dexie {
  messages!: Dexie.Table<Message, number>;
  profiles!: Dexie.Table<Profile, string>;

  constructor() {
    super('DatingApp');
    this.version(1).stores({
      messages: '++id, senderId, recipientId, content, timestamp',
      profiles: 'id, name, bio'
    });
  }
}

export const db = new AppDatabase();
