import { useState } from 'react';
import { uploadImage } from '../services/storageService';

export const useStorageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file, folder) => {
    if (!file) return '';
    setUploading(true);
    setError('');
    try {
      return await uploadImage(file, folder);
    } catch (err) {
      console.error('Image upload failed', err);
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
};
