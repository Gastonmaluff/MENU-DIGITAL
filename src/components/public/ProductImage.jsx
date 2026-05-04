import { Coffee } from 'lucide-react';

export default function ProductImage({ src, alt, size = 'medium' }) {
  return (
    <div className={`product-image-frame product-image-frame--${size}`}>
      {src ? (
        <img className="product-image" src={src} alt={alt} loading="lazy" />
      ) : (
        <div className="product-image-placeholder" aria-label={alt}>
          <Coffee size={42} strokeWidth={1.4} />
        </div>
      )}
    </div>
  );
}
