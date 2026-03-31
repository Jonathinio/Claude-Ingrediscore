import { getFirebaseDb, getFirebaseAuth, sanitizeData } from '../firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc, deleteDoc, where, serverTimestamp, getCountFromServer } from 'firebase/firestore';
import { type Product } from '../types';

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string | null;
  count: number;
}

export const getLeaderboard = async (limitCount: number = 50): Promise<LeaderboardEntry[]> => {
  try {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'leaderboard'),
      where('count', '>', 0),
      orderBy('count', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: data.uid,
        displayName: data.displayName || 'Anonymous',
        photoURL: data.photoURL || null,
        count: data.count || 0
      };
    });
  } catch (error) {
    console.error("Error fetching leaderboard from Firestore:", error);
    return [];
  }
};

export const recalculateUserStats = async (userOrId: any): Promise<number> => {
  if (!userOrId) return 0;
  
  const uid = typeof userOrId === 'string' ? userOrId : userOrId.uid;
  if (!uid) return 0;
  
  try {
    const db = getFirebaseDb();
    
    // Count ALL confirmed products created by this user
    // "Verified foods" = products with status 'confirmed'
    let verifiedCount = 0;
    try {
      const q = query(
        collection(db, 'products'),
        where('createdBy', '==', uid),
        where('status', '==', 'confirmed')
      );
      
      const countSnapshot = await getCountFromServer(q);
      verifiedCount = countSnapshot.data().count;
    } catch (countError: any) {
      if (countError.message?.includes('index')) {
        console.warn(`Firestore index missing for verified count query for user ${uid}. Falling back to 0. Please create the index in the Firebase Console.`);
        // Try a simpler query if the composite index is missing
        try {
          const simpleQ = query(
            collection(db, 'products'),
            where('createdBy', '==', uid)
          );
          const simpleSnapshot = await getCountFromServer(simpleQ);
          verifiedCount = simpleSnapshot.data().count;
        } catch (e) {
          verifiedCount = 0;
        }
      } else {
        throw countError;
      }
    }
    
    const leaderboardRef = doc(db, 'leaderboard', uid);
    
    let displayName = 'Anonymous';
    let photoURL = '';
    
    if (verifiedCount > 0) {
      // Try to get from users collection
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        displayName = userData.displayName || 'Anonymous';
        photoURL = userData.photoURL || '';
      } else {
        // Fallback to existing leaderboard entry
        const existing = await getDoc(leaderboardRef);
        if (existing.exists()) {
          const data = existing.data();
          displayName = data.displayName || 'Anonymous';
          photoURL = data.photoURL || '';
        }
      }
    }

    // Update leaderboard entry
    try {
      if (verifiedCount > 0) {
        await setDoc(leaderboardRef, sanitizeData({
          uid: uid,
          displayName,
          photoURL,
          count: verifiedCount,
          updatedAt: serverTimestamp()
        }), { merge: true });
      } else {
        // Remove from leaderboard if count is 0
        await deleteDoc(leaderboardRef);
      }
    } catch (permError: any) {
      if (permError.code === 'permission-denied') {
        console.warn(`Insufficient permissions to update leaderboard for user ${uid}. This is expected if you are not an admin and not the owner.`);
      } else {
        throw permError;
      }
    }
    
    return verifiedCount;
  } catch (error) {
    console.error("Error recalculating user stats:", error);
    return 0;
  }
};

export const recalculateAllStats = async (): Promise<void> => {
  try {
    const db = getFirebaseDb();
    
    // 1. Get all unique creators from products collection
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const uids = new Set<string>();
    productsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.createdBy) {
        uids.add(data.createdBy);
      }
    });

    // 2. Also get all current leaderboard entries to ensure we clean up anyone who shouldn't be there
    const leaderboardSnapshot = await getDocs(collection(db, 'leaderboard'));
    leaderboardSnapshot.docs.forEach(doc => {
      uids.add(doc.id);
    });

    // 3. Recalculate for each UID
    const promises = Array.from(uids).map(uid => recalculateUserStats(uid));
    await Promise.all(promises);
    
    console.log(`Recalculated stats for ${uids.size} users.`);
  } catch (error) {
    console.error("Error recalculating all stats:", error);
    throw error;
  }
};
