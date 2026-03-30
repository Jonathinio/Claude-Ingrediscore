import { INGREDIENTS as staticIngredients, type Ingredient } from '../data/ingredients';
import { withLocalStore, INGREDIENTS_STORE_NAME } from './productService';
import { getFirebaseDb, getFirebaseAuth, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, collection, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

const ADJECTIVES_TO_STRIP = [
  'organic', 'natural', 'pure', 'refined', 'unrefined', 'dehydrated', 'dried', 
  'powdered', 'ground', 'whole', 'concentrated', 'evaporated', 'filtered',
  'cold pressed', 'expeller pressed', 'raw', 'wild', 'non-gmo', 'gmo-free',
  'certified', 'premium', 'high quality', 'traditional', 'authentic'
];

export const cleanIngredientName = (name: string): string => {
  let cleaned = name.toLowerCase()
    .replace(/[*†‡§#]/g, '') // Remove symbols
    .trim();
  
  // Remove content in parentheses for matching purposes
  cleaned = cleaned.replace(/\s*\([^)]*\)/g, '');
  
  // Remove common adjectives
  for (const adj of ADJECTIVES_TO_STRIP) {
    const regex = new RegExp(`\\b${adj}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }
  
  return cleaned.replace(/\s+/g, ' ').trim();
};

export let INGREDIENTS: Ingredient[] = [...staticIngredients];
let ingredientMap: Map<string, Ingredient> | null = null;

export const getIngredientMap = (): Map<string, Ingredient> => {
  if (ingredientMap) return ingredientMap;
  
  ingredientMap = new Map();
  for (const ing of INGREDIENTS) {
    if (!ing || typeof ing.name !== 'string') continue;
    
    const lowerName = ing.name.toLowerCase();
    const cleanedName = cleanIngredientName(lowerName);
    
    ingredientMap.set(lowerName, ing);
    if (cleanedName !== lowerName) {
      ingredientMap.set(cleanedName, ing);
    }
    
    if (ing.synonyms) {
      for (const synonym of ing.synonyms) {
        if (typeof synonym === 'string') {
          const lowerSyn = synonym.toLowerCase();
          const cleanedSyn = cleanIngredientName(lowerSyn);
          ingredientMap.set(lowerSyn, ing);
          if (cleanedSyn !== lowerSyn) {
            ingredientMap.set(cleanedSyn, ing);
          }
        }
      }
    }
  }
  return ingredientMap;
};

export const updateIngredientInMemory = (ingredient: Ingredient) => {
  const index = INGREDIENTS.findIndex(ing => ing.id === ingredient.id);
  if (index !== -1) {
    INGREDIENTS[index] = ingredient;
  } else {
    INGREDIENTS.push(ingredient);
  }
  ingredientMap = null;
};

export const loadIngredients = async (force: boolean = false): Promise<Ingredient[]> => {
  // 1. Load from local cache first
  try {
    const localIngredients = await withLocalStore<Ingredient[]>(INGREDIENTS_STORE_NAME, 'readonly', (store) => store.getAll());
    if (localIngredients && localIngredients.length > 0) {
      INGREDIENTS = localIngredients;
      ingredientMap = null;
    } else {
      // Pre-populate with static ingredients if local is empty
      INGREDIENTS = [...staticIngredients];
      for (const ing of staticIngredients) {
        await withLocalStore(INGREDIENTS_STORE_NAME, 'readwrite', (store) => { store.put(ing); }).catch(() => {});
      }
    }
  } catch (e) {
    console.warn("Failed to read from local ingredients cache", e);
    INGREDIENTS = [...staticIngredients];
  }

  // 2. Sync from Firestore if forced or if we want to ensure latest
  if (force) {
    const db = getFirebaseDb();
    const path = 'ingredients';
    try {
      const snapshot = await getDocs(collection(db, path)).catch(err => handleFirestoreError(err, OperationType.LIST, path));
      
      if (snapshot && snapshot.docs.length > 0) {
        const firestoreIngredients: Ingredient[] = [];
        
        for (const doc of snapshot.docs) {
          const data = doc.data() as Ingredient;
          firestoreIngredients.push(data);
          
          // Update local cache
          await withLocalStore(INGREDIENTS_STORE_NAME, 'readwrite', (store) => { store.put(data); }).catch(() => {});
        }

        // Rebuild INGREDIENTS from scratch: Static + Firestore
        const merged = new Map<string, Ingredient>();
        
        // 1. Start with static
        staticIngredients.forEach(ing => merged.set(ing.id, ing));
        
        // 2. Add firestore (overwrites)
        firestoreIngredients.forEach(ing => merged.set(ing.id, ing));
        
        INGREDIENTS = Array.from(merged.values());
        ingredientMap = null;
      }
    } catch (error) {
      console.error("Failed to sync ingredients from Firestore:", error);
    }
  }

  return INGREDIENTS;
};

export const getIngredientById = async (id: string): Promise<Ingredient | undefined> => {
  // 1. Check in-memory/local first
  const local = INGREDIENTS.find(ing => ing.id === id);
  if (local) return local;

  // 2. Try Firestore (Lazy Load)
  const db = getFirebaseDb();
  try {
    const docRef = doc(db, 'ingredients', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const ingredientData = docSnap.data() as Ingredient;
      
      // Update local cache
      updateIngredientInMemory(ingredientData);
      await withLocalStore(INGREDIENTS_STORE_NAME, 'readwrite', (store) => { store.put(ingredientData); }).catch(() => {});
      return ingredientData;
    }
  } catch (error) {
    console.warn(`Failed to lazy load ingredient ${id}`, error);
  }

  return undefined;
};

export const subscribeToIngredients = (callback: (ingredients: Ingredient[]) => void) => {
  const auth = getFirebaseAuth();
  
  // Initial call with current data
  callback(INGREDIENTS);

  // If not authenticated, we can't subscribe to Firestore
  if (!auth.currentUser) {
    console.warn("subscribeToIngredients: Not authenticated, skipping Firestore subscription.");
    return () => {};
  }

  const db = getFirebaseDb();
  const path = 'ingredients';
  
  // Setup real-time listener
  const unsubscribe = onSnapshot(collection(db, path), async (snapshot) => {
    const firestoreIngredients: Ingredient[] = [];
    
    // Process changes for local cache synchronization
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data() as Ingredient;
      if (change.type === 'removed') {
        withLocalStore(INGREDIENTS_STORE_NAME, 'readwrite', (store) => { store.delete(data.id); }).catch(() => {});
      } else {
        // added or modified
        withLocalStore(INGREDIENTS_STORE_NAME, 'readwrite', (store) => { store.put(data); }).catch(() => {});
      }
    });

    for (const doc of snapshot.docs) {
      const data = doc.data() as Ingredient;
      firestoreIngredients.push(data);
    }

    // Rebuild INGREDIENTS from scratch: Static + Firestore
    // This ensures that deletions in Firestore are reflected locally
    const merged = new Map<string, Ingredient>();
    
    // 1. Start with static ingredients
    staticIngredients.forEach(ing => merged.set(ing.id, ing));
    
    // 2. Overwrite/Add with Firestore ingredients
    firestoreIngredients.forEach(ing => merged.set(ing.id, ing));
    
    INGREDIENTS = Array.from(merged.values());
    ingredientMap = null;
    callback(INGREDIENTS);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });

  return unsubscribe;
};

export const resetIngredientToStatic = async (ingredientId: string): Promise<boolean> => {
  const staticIng = staticIngredients.find(ing => ing.id === ingredientId);
  if (!staticIng) return false;

  try {
    // Delete from local cache
    await withLocalStore(INGREDIENTS_STORE_NAME, 'readwrite', (store) => { store.delete(ingredientId); });
    
    // Update in-memory
    const index = INGREDIENTS.findIndex(ing => ing.id === ingredientId);
    if (index !== -1) {
      INGREDIENTS[index] = staticIng;
    }
    ingredientMap = null;
    return true;
  } catch (e) {
    console.error("Failed to reset ingredient:", e);
    return false;
  }
};

export const getIngredientStats = () => {
  const totalIngredients = INGREDIENTS.length;
  const totalStudies = INGREDIENTS.reduce((acc, ing) => acc + (ing.studies?.length || 0), 0);
  return { totalIngredients, totalStudies };
};
