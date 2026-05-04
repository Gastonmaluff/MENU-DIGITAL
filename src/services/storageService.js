import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage, isFirebaseConfigured } from '../firebase';

export const uploadImage = async (file, folder = 'menu') => {
  if (!isFirebaseConfigured || !storage) {
    throw new Error('Firebase Storage no está configurado.');
  }
  const extension = file.name.split('.').pop();
  const safeName = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const imageRef = ref(storage, safeName);
  await uploadBytes(imageRef, file);
  return getDownloadURL(imageRef);
};
