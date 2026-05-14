import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { defaultSettings, demoCategories, demoProductOptions, demoProducts, demoVariantGroups } from '../data/demoData';
import { requireAuthenticatedUser } from './firestoreService';

const upsert = (collectionName, id, payload) =>
  setDoc(
    doc(db, collectionName, id),
    {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

export const seedDemoData = async () => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase no está configurado.');
  }
  requireAuthenticatedUser();

  await Promise.all([
    ...demoCategories.map((category) => upsert('categories', category.id, category)),
    ...demoVariantGroups.map((group) => upsert('variantGroups', group.id, group)),
    ...demoProductOptions.map((option) => upsert('productOptions', option.id, option)),
    ...demoProducts.map((product) => upsert('products', product.id, product)),
    setDoc(doc(db, 'settings', 'main'), { ...defaultSettings, updatedAt: serverTimestamp() }, { merge: true }),
  ]);
};
