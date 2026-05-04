import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage, isFirebaseConfigured } from '../firebase';
import { formatFirebaseWriteError } from '../utils/firebaseErrors';
import { requireAuthenticatedUser } from './firestoreService';

export const uploadImage = async (file, folder = 'menu') => {
  if (!isFirebaseConfigured || !storage) {
    throw new Error('Firebase Storage no está configurado.');
  }
  requireAuthenticatedUser();
  const extension = file.name.split('.').pop();
  const safeName = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const imageRef = ref(storage, safeName);

  try {
    await uploadBytes(imageRef, file);
    return getDownloadURL(imageRef);
  } catch (error) {
    console.error('Firebase Storage upload failed', error);
    throw new Error(formatFirebaseWriteError(error));
  }
};
