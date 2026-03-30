import factsData from '../data/facts.json';
import { getFirebaseDb } from '../firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

export interface FoodFact {
  id?: string;
  fact: string;
  category: string;
  createdAt?: string;
}

export const getRandomFacts = async (count: number = 10): Promise<FoodFact[]> => {
  try {
    const db = getFirebaseDb();
    const q = query(collection(db, 'facts'), limit(count));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return factsData.sort(() => Math.random() - 0.5).slice(0, count);
    }
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        fact: data.fact,
        category: data.category,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
      };
    }).sort(() => Math.random() - 0.5).slice(0, count);
  } catch (error: any) {
    console.warn("Failed to load facts from Firestore, using local fallback facts.", error);
    return factsData.sort(() => Math.random() - 0.5).slice(0, count);
  }
};

export const getFactCount = async (): Promise<number> => {
  return factsData.length; // Simplified for now
};

export const addFact = async (fact: string, category: string) => {
  // Simplified for now
  return { id: 'local', fact, category };
};

export const generateMoreFacts = async (): Promise<number> => {
  return 0; // Simplified for now
};
