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
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { formatFirebaseWriteError } from '../utils/firebaseErrors';

const requireDb = () => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase no está configurado. Revisá las variables .env.');
  }
  return db;
};

export const requireAuthenticatedUser = () => {
  const user = auth?.currentUser;
  if (!user) {
    const error = new Error('No tenés permisos para guardar. Iniciá sesión como administrador.');
    error.code = 'auth/unauthenticated';
    throw error;
  }
  return user;
};

const runAuthenticatedWrite = async (operation, context) => {
  requireAuthenticatedUser();
  try {
    return await operation();
  } catch (error) {
    console.error(`Firebase write failed: ${context}`, error);
    throw new Error(formatFirebaseWriteError(error));
  }
};

export const listCollection = async (collectionName) => {
  const database = requireDb();
  const ref = collection(database, collectionName);
  const snapshot = await getDocs(query(ref, orderBy('sortOrder', 'asc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const createDocument = async (collectionName, payload) => {
  const database = requireDb();
  return runAuthenticatedWrite(async () => {
    const ref = collection(database, collectionName);
    const result = await addDoc(ref, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return result.id;
  }, `create ${collectionName}`);
};

export const updateDocument = async (collectionName, id, payload) => {
  const database = requireDb();
  await runAuthenticatedWrite(async () => {
    const documentRef = doc(database, collectionName, id);
    const snapshot = await getDoc(documentRef);
    await setDoc(
      documentRef,
      {
        ...payload,
        ...(!snapshot.exists() ? { createdAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }, `update ${collectionName}/${id}`);
};

export const deleteDocument = async (collectionName, id) => {
  const database = requireDb();
  await runAuthenticatedWrite(
    () => deleteDoc(doc(database, collectionName, id)),
    `delete ${collectionName}/${id}`,
  );
};

export const getSettings = async () => {
  const database = requireDb();
  const snapshot = await getDoc(doc(database, 'settings', 'main'));
  return snapshot.exists() ? snapshot.data() : null;
};

export const saveSettings = async (payload) => {
  const database = requireDb();
  await runAuthenticatedWrite(
    () =>
      setDoc(
        doc(database, 'settings', 'main'),
        { ...payload, updatedAt: serverTimestamp() },
        { merge: true },
      ),
    'save settings/main',
  );
};
