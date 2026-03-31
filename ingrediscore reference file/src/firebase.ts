import { initializeApp, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithCredential, 
  onAuthStateChanged, 
  signOut, 
  setPersistence,
  browserLocalPersistence,
  type User, 
  type Auth 
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp, 
  getDocFromServer,
  getCountFromServer,
  type Firestore 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Global state for quota management
const QUOTA_CACHE_KEY = 'firestore_quota_exceeded';
export const quotaState = {
  isExceeded: localStorage.getItem(QUOTA_CACHE_KEY) === 'true',
  lastChecked: parseInt(localStorage.getItem(QUOTA_CACHE_KEY + '_time') || '0')
};

// Reset quota if it's been more than 24 hours
if (quotaState.isExceeded && Date.now() - quotaState.lastChecked > 24 * 60 * 60 * 1000) {
  quotaState.isExceeded = false;
  localStorage.removeItem(QUOTA_CACHE_KEY);
}

export const getFirebaseApp = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
};

export const getFirebaseAuth = () => {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    // Ensure persistence is set to local (default, but explicit for reliability)
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.error("Auth: Failed to set persistence:", err);
    });
  }
  return auth;
};

export const getFirebaseDb = () => {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    const dbId = firebaseConfig.firestoreDatabaseId;
    
    // Use initializeFirestore with long polling for better reliability in iframes
    // but only if a specific database ID is provided and it's not the default.
    // CRITICAL: Disable long polling on native platforms as it can cause connection timeouts.
    const isNative = Capacitor.isNativePlatform();
    
    if (dbId && dbId !== '(default)') {
      db = initializeFirestore(firebaseApp, {
        experimentalForceLongPolling: !isNative,
      }, dbId);
    } else {
      db = getFirestore(firebaseApp);
    }
  }
  return db;
};

export const googleProvider = new GoogleAuthProvider();

// --- Error Handling ---

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const firebaseAuth = getFirebaseAuth();
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Detect quota exceeded error
  if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('limit exceeded')) {
    quotaState.isExceeded = true;
    quotaState.lastChecked = Date.now();
    localStorage.setItem(QUOTA_CACHE_KEY, 'true');
    localStorage.setItem(QUOTA_CACHE_KEY + '_time', quotaState.lastChecked.toString());
    console.warn("Firestore Quota Exceeded detected. Switching to offline/cache-only mode.");
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: firebaseAuth.currentUser?.uid,
      email: firebaseAuth.currentUser?.email,
      emailVerified: firebaseAuth.currentUser?.emailVerified,
      isAnonymous: firebaseAuth.currentUser?.isAnonymous,
      tenantId: firebaseAuth.currentUser?.tenantId,
      providerInfo: firebaseAuth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively removes undefined values from an object to make it Firestore-compatible.
 */
export function sanitizeData(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  // Handle Firestore special objects (FieldValue, Timestamp, etc)
  // These usually have a specific structure or are instances of internal classes
  if (data._methodName || data.nanoseconds !== undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(v => sanitizeData(v));
  }

  const sanitized: any = {};
  for (const key in data) {
    const value = data[key];
    if (value !== undefined) {
      sanitized[key] = sanitizeData(value);
    }
  }
  return sanitized;
}

// Connection test
export async function testFirebaseConnection() {
  try {
    const database = getFirebaseDb();
    // Use the path defined in firestore.rules
    const testDoc = await getDocFromServer(doc(database, 'test', 'connection'));
    if (testDoc.exists()) {
      console.log("Firestore connection successful: Test document found");
    } else {
      console.log("Firestore connection successful: Backend reached (test document not found)");
    }
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    if (errorMsg.includes('the client is offline') || errorMsg.includes('Could not reach Cloud Firestore backend')) {
      console.error("Firestore connection failed: The client is offline or timed out. Check your Firebase configuration and internet connection.");
    } else if (errorMsg.includes('Missing or insufficient permissions')) {
      console.error("Firestore connection failed: Permission denied. Check your Security Rules.");
    } else {
      console.warn("Firestore connection test warning:", errorMsg);
    }
    throw error; // Re-throw so App.tsx can catch it
  }
}

let activeSignInPromise: Promise<User> | null = null;

export const signInWithGoogle = async (retryCount = 0): Promise<User> => {
  if (activeSignInPromise) {
    console.warn("Sign-in already in progress, returning active promise.");
    return activeSignInPromise;
  }

  const firebaseAuth = getFirebaseAuth();
  
  const performSignIn = async (): Promise<User> => {
    try {
      // 1. Detect the environment (Super-Detection)
      const platform = Capacitor.getPlatform();
      const isUrlNative = window.location.protocol === 'capacitor:' || window.location.hostname === 'localhost';
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isNative = platform === 'ios' || platform === 'android' || Capacitor.isNativePlatform() || (isIOS && isUrlNative);
      
      console.log(`[Auth] Sign-In Attempt. Platform: ${platform}, isNative: ${isNative}, Protocol: ${window.location.protocol}`);

      // 2. NATIVE LANE (iPhone/Android)
      if (isNative) {
        console.error("!!! NATIVE WEB-AUTH MODE ACTIVATED !!!");
        try {
          // Use @capacitor-firebase/authentication for web-based Google sign-in
          // With skipNativeAuth: true in config, this will use the Firebase JS SDK
          // but the plugin handles the Capacitor-specific environment issues.
          const result = await FirebaseAuthentication.signInWithGoogle();
          console.error("NATIVE: FirebaseAuthentication.signInWithGoogle() success");
          
          if (result.user || firebaseAuth.currentUser) {
            return firebaseAuth.currentUser as User;
          }
          
          if (!result.credential?.idToken) {
            throw new Error("NATIVE: No idToken returned from FirebaseAuthentication.signInWithGoogle()");
          }
          
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          const signInResult = await signInWithCredential(firebaseAuth, credential);
          
          return signInResult.user;
        } catch (nativeError: any) {
          console.error("NATIVE ERROR:", nativeError);
          // Fallback to direct web if native fails
          console.error("NATIVE: Falling back to direct Web Sign-In...");
        }
      }

      // 3. WEB LANE (AI Studio / Browser)
      console.log("!!! WEB MODE ACTIVATED !!!");
      try {
        const result = await signInWithPopup(firebaseAuth, googleProvider);
        return result.user;
      } catch (webError: any) {
        // Check if we actually signed in despite the error (common in iframes)
        if (firebaseAuth.currentUser) {
          console.log("Auth: Sign-in succeeded despite web error:", webError.code);
          return firebaseAuth.currentUser;
        }
        
        if (webError.code === 'auth/unauthorized-domain') {
          console.error("WEB ERROR: Domain not authorized. Please add this domain to Firebase Authorized Domains:", window.location.hostname);
        }
        throw webError;
      }
    } catch (error: any) {
      // Final check for currentUser
      if (firebaseAuth.currentUser) {
        console.log("Auth: Sign-in succeeded despite final error catch:", error.code);
        return firebaseAuth.currentUser;
      }

      console.error(`Error signing in with Google (attempt ${retryCount + 1})`, error);
      
      // Handle the specific error you are seeing
      if (error.code === 'auth/cancelled-popup-request' || error.message?.includes('cancelled')) {
        console.warn("Sign-in request was cancelled. This often happens if the window is blocked or triggered twice.");
        if (retryCount < 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          // We need to clear the active promise before retrying
          activeSignInPromise = null;
          return signInWithGoogle(retryCount + 1);
        }
      }

      // If it's an unauthorized domain error, we give a clear hint
      if (error.code === 'auth/unauthorized-domain') {
        console.error("UNAUTHORIZED DOMAIN: Please add 'localhost' and 'capacitor://localhost' to your Firebase Authorized Domains.");
      }

      // Handle IndexedDB transaction aborts or connection closing
      const isIdbError = error.message?.includes('transaction') || 
                         error.message?.includes('aborted') || 
                         error.message?.includes('database connection is closing');
      
      if (isIdbError && retryCount < 2) {
        console.log("Retrying sign-in due to IndexedDB error...");
        await new Promise(resolve => setTimeout(resolve, 500));
        // We need to clear the active promise before retrying
        activeSignInPromise = null;
        return signInWithGoogle(retryCount + 1);
      }
      
      throw error;
    } finally {
      // Clear the active promise when done
      activeSignInPromise = null;
    }
  };

  activeSignInPromise = performSignIn();
  return activeSignInPromise;
};

export const signOutUser = async () => {
  const firebaseAuth = getFirebaseAuth();
  return signOut(firebaseAuth);
};

export { onAuthStateChanged, type User };
