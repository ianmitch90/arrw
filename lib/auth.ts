import { signIn as supabaseSignIn, getCurrentUser } from './supabaseClient';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabaseSignIn(email, password);
  if (data.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  return { user: data.user, error };
}

export async function getUser() {
  const {
    data: { user }
  } = await getCurrentUser();
  if (user) {
    return user;
  }
  const localUser = localStorage.getItem('user');
  return localUser ? JSON.parse(localUser) : null;
}

// Remove or comment out GitHub sign-in logic
// export async function signInWithGitHub() {
//   const { user, error } = await supabase.auth.signIn({
//     provider: 'github', // Remove this line
//   });
//   return { user, error };
// }
