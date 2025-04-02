import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedTestUsers() {
  // Create test users
  const testUsers = [
    { email: 'test@example.com', password: 'password123' },
    { email: 'test2@example.com', password: 'password123' }
  ];

  const createdUsers = [];

  for (const user of testUsers) {
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });

    if (authError) {
      console.error(`Failed to create user ${user.email}:`, authError);
      continue;
    }

    const userId = authData.user.id;
    createdUsers.push(userId);

    // Create profile with location privacy settings
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: `Test User ${user.email}`,
      avatar_url: 'https://picsum.photos/200',
      location_sharing: 'public',
      location_accuracy: 100
    });

    if (profileError) {
      console.error(
        `Failed to create profile for ${user.email}:`,
        profileError
      );
    }
  }

  if (createdUsers.length >= 2) {
    const [user1, user2] = createdUsers;

    // Create a chat room between the two users
    const chatRoomId = uuidv4();
    const { error: roomError } = await supabase.from('chat_rooms').insert({
      id: chatRoomId,
      name: 'Test Chat Room',
      type: 'direct',
      created_by: user1
    });

    if (roomError) {
      console.error('Failed to create chat room:', roomError);
    } else {
      // Add participants to the chat room
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { room_id: chatRoomId, user_id: user1 },
          { room_id: chatRoomId, user_id: user2 }
        ]);

      if (participantsError) {
        console.error('Failed to add chat participants:', participantsError);
      }

      // Add test messages to the chat room
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .insert([
          {
            room_id: chatRoomId,
            sender_id: user1,
            content: 'Hey, how are you?',
            message_type: 'text'
          },
          {
            room_id: chatRoomId,
            sender_id: user2,
            content: 'Im doing great, thanks for asking!',
            message_type: 'text'
          }
        ]);

      if (messagesError) {
        console.error('Failed to add chat messages:', messagesError);
      }
    }

    // Add test places with PostGIS point data
    const { error: placesError } = await supabase.from('places').insert([
      {
        name: 'Cool Cafe',
        description: 'A nice place to hang out',
        created_by: user1,
        location: 'POINT(-97.7431 30.2672)',
        place_type: 'cafe',
        status: 'active'
      },
      {
        name: 'Downtown Park',
        description: 'Beautiful city park',
        created_by: user2,
        location: 'POINT(-97.7500 30.2700)',
        place_type: 'park',
        status: 'active'
      }
    ]);

    if (placesError) {
      console.error('Failed to create places:', placesError);
    }
  }
}

seedTestUsers()
  .then(() => console.log('Seeding complete!'))
  .catch(console.error);
