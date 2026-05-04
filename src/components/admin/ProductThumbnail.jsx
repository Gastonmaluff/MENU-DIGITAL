import { ImagePlus } from 'lucide-react';
import { resolveAssetUrl } from '../../utils/assets';
import { getProductImageUrl } from '../../utils/productImages';

export default function ProductThumbnail({ product, alt }) {
  const imageUrl = resolveAssetUrl(getProductImageUrl(product));

  return (
    <div className="admin-product-thumbnail">
      {imageUrl ? <img src={imageUrl} alt={alt || product.name} /> : <ImagePlus size={24} strokeWidth={1.5} />}
    </div>
  );
}
