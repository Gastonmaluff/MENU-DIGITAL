import { Sparkles } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import { getProductImageTuningStyle } from '../../utils/productImageTuning';
import { getProductFeaturedImageUrl, getProductImageUrl } from '../../utils/productImages';
import ProductImage from './ProductImage';
import ProductOptionIcons from './ProductOptionIcons';

export default function FeaturedProduct({ product, productOptions, variantGroups, onOpen }) {
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
        <ProductOptionIcons product={product} productOptions={productOptions} variantGroups={variantGroups} size="featured" />
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
