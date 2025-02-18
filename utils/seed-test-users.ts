import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' }); 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seedTestUsers() {
  // Create test users
  const testUsers = [
    { email: 'test@example.com', password: 'password123' },
    { email: 'test2@example.com', password: 'password123' }
  ]

  for (const user of testUsers) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true
    })

    if (authError) {
      console.error(`Failed to create user ${user.email}:`, authError)
      continue
    }

    const userId = authData.user.id

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: `Test User ${user.email}`,
        avatar_url: 'https://picsum.photos/200'
      })

    if (profileError) {
      console.error(`Failed to create profile for ${user.email}:`, profileError)
    }
  }

  // Add test places and messages after users are created
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .in('email', testUsers.map(u => u.email))

  if (users && users.length >= 2) {
    const [user1, user2] = users

    // Add test places
    await supabase.from('places').insert([
      {
        name: 'Cool Cafe',
        description: 'A nice place to hang out',
        created_by: user1.id,
        current_location: `POINT(-97.7431 30.2672)`,
        place_type: 'cafe'
      },
      {
        name: 'Downtown Park',
        description: 'Beautiful city park',
        created_by: user2.id,
        current_location: `POINT(-97.7500 30.2700)`,
        place_type: 'park'
      }
    ])

    // Add test messages
    await supabase.from('messages').insert([
      {
        content: 'Hey, how are you?',
        sender_id: user1.id,
        receiver_id: user2.id
      },
      {
        content: 'Im doing great, thanks for asking!',
        sender_id: user2.id,
        receiver_id: user1.id
      }
    ])
  }
}

seedTestUsers()
  .then(() => console.log('Seeding complete!'))
  .catch(console.error)