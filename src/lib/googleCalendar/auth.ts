import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';
import { saveGCalSettings, clearGCalSettings } from './storage';

// Initialize Firebase App instance singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google OAuth provider with minimal required Calendar scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.calendarlist.readonly');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory access token cache (mandatory: never stored in persistent storage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuthListener = (
  onAuthChange?: (user: User | null, token: string | null) => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthChange) {
        onAuthChange(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthChange) {
        onAuthChange(null, null);
      }
    }
  });
};

/**
 * Initiates popup Google sign-in and captures the OAuth access token in memory.
 */
export async function googleSignIn(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Google Calendar access token was not returned by authorization.');
    }

    cachedAccessToken = credential.accessToken;

    saveGCalSettings({
      isConnected: true,
      userEmail: result.user.email || undefined,
      userName: result.user.displayName || undefined,
      userPhotoUrl: result.user.photoURL || undefined,
      lastError: undefined,
    });

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled. You closed the Google sign-in window.');
    }
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in request was cancelled.');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups for this site.');
    }
    console.error('[Google Calendar Auth Error]', err);
    throw new Error(error.message || 'Failed to authenticate with Google Calendar.');
  } finally {
    isSigningIn = false;
  }
}

/**
 * Retrieves the current in-memory access token, or prompts the user if expired/missing.
 */
export async function getAccessToken(): Promise<string | null> {
  return cachedAccessToken;
}

/**
 * Sets access token in memory (e.g. after refresh or prompt).
 */
export function setCachedAccessToken(token: string | null): void {
  cachedAccessToken = token;
}

/**
 * Disconnects Google Calendar, signs out of Firebase, and clears credentials.
 */
export async function googleSignOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.warn('Error signing out of Firebase:', e);
  }
  cachedAccessToken = null;
  clearGCalSettings();
}
