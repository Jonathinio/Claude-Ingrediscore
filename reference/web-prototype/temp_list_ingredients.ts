
import { getFirebaseDb } from './src/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function listAllIngredients() {
  const db = getFirebaseDb();
  const snapshot = await getDocs(collection(db, 'ingredients'));
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}, Name: ${data.name}, Studies: ${data.studies?.length || 0}`);
  });
}

listAllIngredients();
