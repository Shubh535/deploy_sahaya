// Utility to get Firebase ID token for current user
import { auth } from '../firebaseClient';

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  console.log('getIdToken: currentUser =', user);
  if (user) {
    return await user.getIdToken();
  }
  return null;
}
