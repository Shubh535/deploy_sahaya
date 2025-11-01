// Utility to get Firebase ID token for current user
import { auth as getAuth } from '../firebaseClient';

export async function getIdToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const user = getAuth().currentUser;
  console.log('getIdToken: currentUser =', user);
  if (user) {
    return await user.getIdToken();
  }
  return null;
}
