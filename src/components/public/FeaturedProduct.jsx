import { Sparkles } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import { getProductImageTuningStyle } from '../../utils/productImageTuning';
import { getProductFeaturedImageUrl, getProductImageUrl } from '../../utils/productImages';
import ProductImage from './ProductImage';

export default function FeaturedProduct({ product, onOpen }) {
  if (!product) return null;

  return (
    <button
      className="featured-product"
      type="button"
      style={getProductImageTuningStyle(product, 'featured')}
      onClick={() => onOpen(product)}
    >
      <div className="featured-copy">
        {product.featured && (
          <span className="featured-chip">
            <Sparkles size={14} /> Más popular
          </span>
        )}
        <h3>{product.name}</h3>
        <p className="featured-tags">{product.shortDescription}</p>
        <strong>{formatPrice(product.price)}</strong>
        <p>{product.description}</p>
      </div>
      <div className="featured-visual">
        <ProductImage
          size="featured"
          src={getProductFeaturedImageUrl(product) || getProductImageUrl(product)}
          alt={product.name}
          loading="eager"
        />
      </div>
    </button>
  );
}
