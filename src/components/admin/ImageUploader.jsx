import { ImagePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStorageUpload } from '../../hooks/useStorageUpload';

const analyzeImageFile = (file) =>
  new Promise((resolve) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      const sampleSize = 96;
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, sampleSize / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparentPixels = 0;
      let edgeWhitePixels = 0;
      let edgePixels = 0;

      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          const index = (y * canvas.width + x) * 4;
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const alpha = pixels[index + 3];

          if (alpha < 245) transparentPixels += 1;

          const isEdge = x < 3 || y < 3 || x >= canvas.width - 3 || y >= canvas.height - 3;
          if (isEdge) {
            edgePixels += 1;
            if (alpha > 245 && red > 238 && green > 238 && blue > 238) edgeWhitePixels += 1;
          }
        }
      }

      URL.revokeObjectURL(url);
      resolve({
        hasTransparency: transparentPixels > pixels.length / 4 * 0.015,
        hasWhiteEdge: edgePixels > 0 && edgeWhitePixels / edgePixels > 0.52,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ hasTransparency: true, hasWhiteEdge: false });
    };

    image.src = url;
  });

export default function ImageUploader({ label, value, onChange, onUploadingChange, onError, folder = 'products' }) {
  const { upload, uploading, error } = useStorageUpload();
  const [preview, setPreview] = useState(value || '');
  const [imageWarning, setImageWarning] = useState('');

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
    setImageWarning('');

    try {
      const analysis = await analyzeImageFile(file);
      if (!analysis.hasTransparency) {
        setImageWarning('Esta imagen parece tener fondo sólido. Para producto recortado conviene subir un PNG con transparencia real.');
      } else if (analysis.hasWhiteEdge) {
        setImageWarning('Esta imagen parece tener borde o matte blanco en los bordes. Puede verse como recuadro sobre la card.');
      }
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
              setImageWarning('');
              onChange(event.target.value);
              setPreview(event.target.value);
            }}
          />
          {uploading && <small>Subiendo imagen...</small>}
          {error && <small className="admin-error-text">{error}</small>}
          {imageWarning && <small className="admin-warning-text">{imageWarning}</small>}
        </div>
      </div>
    </div>
  );
}
