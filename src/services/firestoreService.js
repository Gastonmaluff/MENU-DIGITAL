import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

const requireDb = () => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase no está configurado. Revisá las variables .env.');
  }
  return db;
};

export const listCollection = async (collectionName) => {
  const database = requireDb();
  const ref = collection(database, collectionName);
  const snapshot = await getDocs(query(ref, orderBy('sortOrder', 'asc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const createDocument = async (collectionName, payload) => {
  const database = requireDb();
  const ref = collection(database, collectionName);
  const result = await addDoc(ref, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return result.id;
};

export const updateDocument = async (collectionName, id, payload) => {
  const database = requireDb();
  await updateDoc(doc(database, collectionName, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
};

export const deleteDocument = async (collectionName, id) => {
  const database = requireDb();
  await deleteDoc(doc(database, collectionName, id));
};

export const getSettings = async () => {
  const database = requireDb();
  const snapshot = await getDoc(doc(database, 'settings', 'main'));
  return snapshot.exists() ? snapshot.data() : null;
};

export const saveSettings = async (payload) => {
  const database = requireDb();
  await setDoc(
    doc(database, 'settings', 'main'),
    { ...payload, updatedAt: serverTimestamp() },
    { merge: true },
  );
};
