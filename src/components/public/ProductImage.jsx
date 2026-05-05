import { ImagePlus } from 'lucide-react';
import { resolveAssetUrl } from '../../utils/assets';

export default function ProductImage({ src, alt, size = 'medium', loading = 'lazy' }) {
  const imageSrc = resolveAssetUrl(src);

  return (
    <div className={`product-image-frame product-image-frame--${size}`}>
      {imageSrc ? (
        <img
          className={`product-image product-image--${size}`}
          src={imageSrc}
          alt={alt}
          loading={loading}
          decoding="async"
        />
      ) : (
        <div className="product-image-placeholder" aria-label={alt}>
          <ImagePlus size={38} strokeWidth={1.4} />
        </div>
      )}
    </div>
  );
}
