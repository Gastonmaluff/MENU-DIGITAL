import { ImagePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStorageUpload } from '../../hooks/useStorageUpload';

export default function ImageUploader({ label, value, onChange, onUploadingChange, onError, folder = 'products' }) {
  const { upload, uploading, error } = useStorageUpload();
  const [preview, setPreview] = useState(value || '');

  useEffect(() => {
    setPreview(value || '');
  }, [value]);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    const previousPreview = preview;
    setPreview(localPreview);

    try {
      const url = await upload(file, folder);
      onChange(url);
      setPreview(url);
    } catch (uploadError) {
      console.error('No se pudo subir la imagen', uploadError);
      onError?.(uploadError);
      setPreview(previousPreview);
    }
  };

  return (
    <div className="image-uploader">
      <label>{label}</label>
      <div className="image-uploader-row">
        <div className="image-uploader-preview">
          {preview ? <img src={preview} alt={label} /> : <ImagePlus size={28} />}
        </div>
        <div>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} />
          <input
            type="url"
            placeholder="O pegá una URL de imagen"
            value={value || ''}
            onChange={(event) => {
              onChange(event.target.value);
              setPreview(event.target.value);
            }}
          />
          {uploading && <small>Subiendo imagen...</small>}
          {error && <small className="admin-error-text">{error}</small>}
        </div>
      </div>
    </div>
  );
}
