import { ImagePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { resolveAssetUrl } from '../../utils/assets';

export default function ProductImage({ src, alt, size = 'medium', loading = 'lazy' }) {
  const imageSrc = resolveAssetUrl(src);
  const [failedSrc, setFailedSrc] = useState('');
  const visibleSrc = imageSrc && imageSrc !== failedSrc;

  useEffect(() => {
    setFailedSrc('');
  }, [imageSrc]);

  return (
    <div className={`product-image-frame product-image-frame--${size}`}>
      {visibleSrc ? (
        <img
          key={imageSrc}
          className={`product-image product-image--${size}`}
          src={imageSrc}
          alt={alt}
          loading={loading}
          decoding="async"
          onError={() => setFailedSrc(imageSrc)}
        />
      ) : (
        <div className="product-image-placeholder" aria-label={alt}>
          <ImagePlus size={38} strokeWidth={1.4} />
        </div>
      )}
    </div>
  );
}
