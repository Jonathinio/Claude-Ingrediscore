import { addLog } from './logger';
import { getFirebaseAuth, getFirebaseDb, handleFirestoreError, OperationType, sanitizeData, testFirebaseConnection } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { type Ingredient } from '../data/ingredients';
import { updateIngredientInMemory } from './ingredientService';
import { type ProductAnalysis, type Product } from '../types';
import { recalculateUserStats } from './leaderboardService';

const DB_NAME = 'ProductDatabase';
const DB_VERSION = 4; 
const STORE_NAME = 'products';
const MAPPINGS_STORE_NAME = 'ingredientMappings';
export const INGREDIENTS_STORE_NAME = 'ingredients';

export interface IngredientMapping {
  originalName: string;
  mappedId: string;
  confidence: number;
  status: 'confirmed' | 'pending';
  reasoning?: string;
}

// --- Local IndexedDB (Cache/Fallback) ---

let dbPromise: Promise<IDBDatabase> | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'barcode' });
        }
        if (!db.objectStoreNames.contains(MAPPINGS_STORE_NAME)) {
          db.createObjectStore(MAPPINGS_STORE_NAME, { keyPath: 'originalName' });
        }
        if (!db.objectStoreNames.contains(INGREDIENTS_STORE_NAME)) {
          db.createObjectStore(INGREDIENTS_STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        resolve(db);
      };

      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    } catch (error) {
      dbPromise = null;
      reject(error);
    }
  });

  return dbPromise;
};

export const withLocalStore = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> => {
  const database = await initDB();
  return await new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = callback(store);
    if (request instanceof IDBRequest) {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } else {
      transaction.oncomplete = () => resolve(undefined as any);
    }
  });
};

// --- Public API (Firestore + Local Sync) ---

export const saveProduct = async (product: Product): Promise<void> => {
  addLog(`Saving product: ${product.barcode} ${product.name}`);
  
  const now = Date.now();
  const productWithMeta = {
    ...product,
    updatedAt: now,
    scannedAt: product.scannedAt || now
  };

  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  const db = getFirebaseDb();

  // 1. Save to Firestore
  try {
    // Prune analysis to save space in Firestore
    const pruneIngredient = (ing: any): any => {
      const { studies, subIngredients, ...rest } = ing;
      return {
        ...rest,
        subIngredients: subIngredients ? subIngredients.map(pruneIngredient) : undefined
      };
    };

    const prunedAnalysis = productWithMeta.analysis ? {
      ...productWithMeta.analysis,
      ingredients: productWithMeta.analysis.ingredients.map(pruneIngredient)
    } : undefined;

    const productRef = doc(db, 'products', productWithMeta.barcode);
    
    // Fetch existing product to preserve createdBy if it exists
    const existingDoc = await getDoc(productRef);
    const existingData = existingDoc.exists() ? existingDoc.data() as Product : null;
    
    const dataToSave = sanitizeData({
      ...productWithMeta,
      analysis: prunedAnalysis,
      createdBy: existingData?.createdBy || (user ? user.uid : 'anonymous'),
      updatedAt: serverTimestamp()
    });

    await setDoc(productRef, dataToSave, { merge: true });

    // Update leaderboard if this is a verified product or was previously verified
    // We recalculate for the CREATOR of the product
    if (dataToSave.status === 'confirmed' || existingData?.status === 'confirmed') {
      if (dataToSave.createdBy !== 'anonymous') {
        await recalculateUserStats(dataToSave.createdBy);
      }
    }
  } catch (error: any) {
    if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
      console.warn("Permission denied saving product to Firestore. Saving locally only.", error);
      addLog(`Permission denied saving product to Firestore: ${product.barcode}`);
    } else {
      handleFirestoreError(error, OperationType.WRITE, 'products/' + productWithMeta.barcode);
    }
  }

  // 2. Always save to Local
  return withLocalStore(STORE_NAME, 'readwrite', (store) => {
    store.put(productWithMeta);
  });
};

export const deleteProduct = async (barcode: string): Promise<void> => {
  addLog(`Deleting product: ${barcode}`);
  
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  const db = getFirebaseDb();

  if (user) {
    try {
      // Fetch product first to know who the creator was
      const productRef = doc(db, 'products', barcode);
      const productSnap = await getDoc(productRef);
      const productData = productSnap.exists() ? productSnap.data() as Product : null;
      const creatorId = productData?.createdBy;

      addLog(`Deleting product from Firestore: ${barcode}`);
      await deleteDoc(productRef);
      addLog(`Deleted product from Firestore: ${barcode}`);
      
      // Recalculate stats after deletion for the creator
      if (creatorId) {
        await recalculateUserStats(creatorId);
      }
    } catch (error) {
      addLog(`Firestore delete failed for ${barcode}: ${error}`);
      console.warn("Firestore delete failed", error);
    }
  }

  addLog(`Deleting product from local store: ${barcode}`);
  return withLocalStore(STORE_NAME, 'readwrite', (store) => {
    store.delete(barcode);
  });
};

export const getProduct = async (barcode: string): Promise<Product | undefined> => {
  const db = getFirebaseDb();
  
  // 1. Try Firestore first
  try {
    const docRef = doc(db, 'products', barcode);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as Product;
      await withLocalStore(STORE_NAME, 'readwrite', (store) => { store.put(data); });
      return data;
    }
  } catch (error) {
    console.warn("Firestore get failed, falling back to local", error);
  }

  // 2. Fallback to local
  return withLocalStore(STORE_NAME, 'readonly', (store) => store.get(barcode));
};

export const getAllProducts = async (force: boolean = false): Promise<Product[]> => {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  const db = getFirebaseDb();
  const path = 'products';

  // 1. Get local products first for speed
  const localProducts = await withLocalStore<Product[]>(STORE_NAME, 'readonly', (store) => store.getAll());
  const sortedLocal = localProducts.sort((a, b) => (b.scannedAt || 0) - (a.scannedAt || 0));

  // 2. If not authenticated, we still want to fetch from Firestore for the shared database
  // but we'll return local immediately for speed and then sync in the background
  if (!user) {
    // Background sync for unauthenticated users too
    (async () => {
      try {
        const q = query(
          collection(db, path), 
          orderBy('scannedAt', 'desc'),
          limit(100)
        );
        const snapshot = await getDocs(q);
        for (const doc of snapshot.docs) {
          const data = doc.data() as Product;
          withLocalStore(STORE_NAME, 'readwrite', (store) => { store.put(data); }).catch(() => {});
        }
      } catch (e) {
        console.warn("Background sync failed (unauthenticated)", e);
      }
    })();
    return sortedLocal;
  }

  // 3. If we have local products and not forced, return them immediately
  // but trigger a background sync
  if (sortedLocal.length > 0 && !force) {
    // Background sync
    (async () => {
      try {
        const q = query(
          collection(db, path), 
          orderBy('scannedAt', 'desc'),
          limit(100)
        );
        const snapshot = await getDocs(q);
        const firestoreIds = new Set(snapshot.docs.map(doc => doc.id));
        
        for (const doc of snapshot.docs) {
          const data = doc.data() as Product;
          withLocalStore(STORE_NAME, 'readwrite', (store) => { store.put(data); }).catch(() => {});
        }
        
        // Note: We don't delete everything not in firestoreIds because of the limit(100)
        // but we ensure the ones we just fetched are updated.
      } catch (e) {
        console.warn("Background sync failed", e);
      }
    })();
    return sortedLocal;
  }

  // 4. Try Firestore if authenticated and (forced or no local data)
  try {
    const q = query(
      collection(db, path), 
      orderBy('scannedAt', 'desc'),
      limit(100)
    );
    
    const snapshot = await getDocs(q).catch(err => {
      if (err.message?.includes('index')) {
        console.warn("Firestore index missing for products query, retrying without orderBy");
        return getDocs(collection(db, path));
      }
      return handleFirestoreError(err, OperationType.LIST, path);
    });
    
    if (snapshot && snapshot.docs.length > 0) {
      const firestoreProducts: Product[] = [];
      const firestoreIds = new Set(snapshot.docs.map(doc => doc.id));
      
      for (const doc of snapshot.docs) {
        const data = doc.data() as Product;
        firestoreProducts.push(data);
        // Update local cache
        withLocalStore(STORE_NAME, 'readwrite', (store) => { store.put(data); }).catch(() => {});
      }
      
      // If we got a full set, we could potentially reconcile deletions here too
      // but let's stick to the onSnapshot fix as the primary driver for real-time consistency.
      
      if (snapshot.query.toString().indexOf('orderBy') === -1) {
        firestoreProducts.sort((a, b) => (b.scannedAt || 0) - (a.scannedAt || 0));
      }
      
      return firestoreProducts;
    }
  } catch (error) {
    console.warn("Firestore getAllProducts failed, using local", error);
  }

  return sortedLocal;
};

export const subscribeToProducts = (callback: (products: Product[]) => void): () => void => {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  const db = getFirebaseDb();
  const path = 'products';

  // 1. Initial local load
  withLocalStore<Product[]>(STORE_NAME, 'readonly', (store) => store.getAll()).then(localProducts => {
    if (localProducts.length > 0) {
      const sortedLocal = localProducts.sort((a, b) => (b.scannedAt || 0) - (a.scannedAt || 0));
      callback(sortedLocal);
    }
  });

  // 2. Firestore listener (Always listen for shared updates, even if not logged in)
  const q = query(
    collection(db, path),
    orderBy('scannedAt', 'desc'),
    limit(100)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    addLog("onSnapshot triggered for products");
    const firestoreProducts: Product[] = [];
    
    // Process changes for local cache synchronization
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data() as Product;
      addLog(`Change type: ${change.type} for product: ${data.barcode}`);
      if (change.type === 'removed') {
        withLocalStore(STORE_NAME, 'readwrite', (store) => { store.delete(data.barcode); }).catch(() => {});
      } else {
        // added or modified
        withLocalStore(STORE_NAME, 'readwrite', (store) => { store.put(data); }).catch(() => {});
      }
    });

    snapshot.docs.forEach(doc => {
      const data = doc.data() as Product;
      firestoreProducts.push(data);
    });
    callback(firestoreProducts);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });

  return unsubscribe;
};

export const verifyProduct = async (barcode: string): Promise<void> => {
  const product = await getProduct(barcode);
  if (product) {
    product.status = 'confirmed';
    return saveProduct(product);
  }
};

export const saveIngredientMapping = async (mapping: IngredientMapping): Promise<void> => {
  addLog(`Saving ingredient mapping: ${mapping.originalName} -> ${mapping.mappedId}`);
  
  const db = getFirebaseDb();
  try {
    await setDoc(doc(db, MAPPINGS_STORE_NAME, mapping.originalName.toLowerCase().trim()), sanitizeData({
      ...mapping,
      updatedAt: serverTimestamp()
    }), { merge: true });
  } catch (error: any) {
    if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
      console.warn("Permission denied saving mapping to Firestore. Saving locally only.", error);
    } else {
      handleFirestoreError(error, OperationType.WRITE, MAPPINGS_STORE_NAME + '/' + mapping.originalName);
    }
  }

  return withLocalStore(MAPPINGS_STORE_NAME, 'readwrite', (store) => {
    store.put(mapping);
  });
};

export const saveIngredient = async (ingredient: Ingredient): Promise<void> => {
  addLog(`Saving ingredient: ${ingredient.id} ${ingredient.name}`);
  
  const now = Date.now();
  const ingredientWithMeta = {
    ...ingredient,
    updatedAt: now
  };
  
  updateIngredientInMemory(ingredientWithMeta);
  
  const db = getFirebaseDb();
  try {
    await setDoc(doc(db, 'ingredients', ingredientWithMeta.id), sanitizeData({
      ...ingredientWithMeta,
      updatedAt: serverTimestamp()
    }), { merge: true });
    addLog(`Ingredient saved to Firestore: ${ingredient.id}`);
  } catch (error: any) {
    if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
      console.warn("Permission denied saving ingredient to Firestore. Saving locally only.", error);
    } else {
      handleFirestoreError(error, OperationType.WRITE, 'ingredients/' + ingredientWithMeta.id);
    }
  }

  return withLocalStore(INGREDIENTS_STORE_NAME, 'readwrite', (store) => {
    store.put(ingredientWithMeta);
  });
};

export const deleteIngredient = async (id: string): Promise<void> => {
  addLog(`Deleting ingredient: ${id}`);
  
  const db = getFirebaseDb();
  try {
    await deleteDoc(doc(db, 'ingredients', id));
  } catch (error) {
    console.warn("Firestore delete failed", error);
  }

  return withLocalStore(INGREDIENTS_STORE_NAME, 'readwrite', (store) => {
    store.delete(id);
  });
};

export const deleteIngredientMapping = async (originalName: string): Promise<void> => {
  addLog(`Deleting ingredient mapping for: ${originalName}`);
  const lower = originalName.toLowerCase().trim();
  
  const db = getFirebaseDb();
  try {
    const q = query(collection(db, MAPPINGS_STORE_NAME), where('originalName', '==', lower));
    const snapshot = await getDocs(q);
    for (const d of snapshot.docs) {
      await deleteDoc(d.ref);
    }
  } catch (error) {
    console.warn("Firestore mapping delete failed", error);
  }

  return withLocalStore(MAPPINGS_STORE_NAME, 'readwrite', (store) => {
    store.delete(lower);
  });
};

export const getIngredientMapping = async (originalName: string): Promise<IngredientMapping | undefined> => {
  return withLocalStore(MAPPINGS_STORE_NAME, 'readonly', (store) => store.get(originalName));
};

export const getAllIngredientMappings = async (force: boolean = false): Promise<IngredientMapping[]> => {
  const localMappings = await withLocalStore(MAPPINGS_STORE_NAME, 'readonly', (store) => store.getAll());
  
  if (localMappings.length > 0 && !force) {
    return localMappings;
  }

  addLog("Fetching all ingredient mappings from Firestore...");
  const db = getFirebaseDb();
  const path = MAPPINGS_STORE_NAME;
  try {
    const snapshot = await getDocs(collection(db, path)).catch(err => handleFirestoreError(err, OperationType.LIST, path));
    const mappings = snapshot.docs.map(doc => doc.data() as IngredientMapping);
    
    // Update local store
    await withLocalStore(MAPPINGS_STORE_NAME, 'readwrite', (store) => {
      mappings.forEach(m => store.put(m));
    });
    
    return mappings;
  } catch (error) {
    console.warn("Failed to fetch mappings from Firestore", error);
    return localMappings;
  }
};

export const getGlobalStats = async (): Promise<{ ingredients: number, products: number }> => {
  return { ingredients: 0, products: 0 }; 
};

export const getDatabaseStats = async () => {
  return { products: 0, ingredients: 0, mappings: 0 }; 
};

export async function testConnection() {
  addLog("testConnection: Testing Firestore connection...");
  await testFirebaseConnection();
}
