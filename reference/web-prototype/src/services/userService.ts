import { getFirebaseDb, handleFirestoreError, OperationType, sanitizeData } from '../firebase';
import { doc, getDoc, setDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { recalculateUserStats } from './leaderboardService';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  lastLogin: number;
}

export const syncUserProfile = async (user: any): Promise<void> => {
  const profile = {
    uid: user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL,
    lastLogin: Date.now(),
    updatedAt: Date.now()
  };

  const db = getFirebaseDb();
  const path = 'users';

  try {
    await setDoc(doc(db, path, user.uid), sanitizeData({
      ...profile,
      lastLogin: serverTimestamp()
    }), { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, path));

    // Also update leaderboard entry with latest name/photo and RECALCULATE count
    await recalculateUserStats(user.uid);
  } catch (error) {
    console.error("Error syncing user profile to Firestore:", error);
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const db = getFirebaseDb();
  const path = 'users';
  try {
    const docSnap = await getDoc(doc(db, path, uid)).catch(err => handleFirestoreError(err, OperationType.GET, path));
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile from Firestore:", error);
  }
  return null;
};

export const getUserProfiles = async (uids: string[]): Promise<Map<string, UserProfile>> => {
  const profiles = new Map<string, UserProfile>();
  if (uids.length === 0) return profiles;

  const db = getFirebaseDb();
  const path = 'users';

  try {
    // Firestore 'in' query is limited to 10-30 items depending on version, 
    // but for small batches it's fine.
    const q = query(collection(db, path), where('uid', 'in', uids));
    const snapshot = await getDocs(q).catch(err => handleFirestoreError(err, OperationType.LIST, path));
    
    snapshot.docs.forEach((doc) => {
      const p = doc.data() as UserProfile;
      profiles.set(p.uid, p);
    });
  } catch (error) {
    console.error("Error getting user profiles from Firestore:", error);
  }
  return profiles;
};

export const getAllUserProfiles = async (): Promise<Map<string, UserProfile>> => {
  const profiles = new Map<string, UserProfile>();
  const db = getFirebaseDb();
  const path = 'users';

  try {
    const snapshot = await getDocs(collection(db, path)).catch(err => handleFirestoreError(err, OperationType.LIST, path));
    
    snapshot.docs.forEach((doc) => {
      const p = doc.data() as UserProfile;
      profiles.set(p.uid, p);
    });
  } catch (error) {
    console.error("Error getting all user profiles from Firestore:", error);
  }
  return profiles;
};
