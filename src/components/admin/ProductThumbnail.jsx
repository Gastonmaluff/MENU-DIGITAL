import { ImagePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { resolveAssetUrl } from '../../utils/assets';
import { getProductImageUrl } from '../../utils/productImages';

export default function ProductThumbnail({ product, alt }) {
  const imageUrl = resolveAssetUrl(getProductImageUrl(product));
  const [failedSrc, setFailedSrc] = useState('');
  const visibleSrc = imageUrl && imageUrl !== failedSrc;

  useEffect(() => {
    setFailedSrc('');
  }, [imageUrl]);

  return (
    <div className="admin-product-thumbnail">
      {visibleSrc ? (
        <img src={imageUrl} alt={alt || product.name} onError={() => setFailedSrc(imageUrl)} />
      ) : (
        <ImagePlus size={24} strokeWidth={1.5} />
      )}
    </div>
  );
}
