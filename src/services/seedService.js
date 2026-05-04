import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { defaultSettings, demoCategories, demoProducts, demoVariantGroups } from '../data/demoData';

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

  await Promise.all([
    ...demoCategories.map((category) => upsert('categories', category.id, category)),
    ...demoVariantGroups.map((group) => upsert('variantGroups', group.id, group)),
    ...demoProducts.map((product) => upsert('products', product.id, product)),
    setDoc(doc(db, 'settings', 'main'), { ...defaultSettings, updatedAt: serverTimestamp() }, { merge: true }),
  ]);
};
