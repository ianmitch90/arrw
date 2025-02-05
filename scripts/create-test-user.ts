import { supabaseClient } from '../lib/supabaseClient';

async function createTestUser() {
  const { data, error } = await supabaseClient().auth.signUp({
    email: 'test2@example.com',
    password: 'password123',
  });

  if (error) {
    console.error('Error creating test user:', error);
    return;
  }

  console.log('Test user created successfully:', data);
}

createTestUser();
