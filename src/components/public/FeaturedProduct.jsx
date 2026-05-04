import { Sparkles } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import ProductImage from './ProductImage';

export default function FeaturedProduct({ product, onOpen }) {
  if (!product) return null;

  return (
    <button className="featured-product" type="button" onClick={() => onOpen(product)}>
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
      <ProductImage
        size="featured"
        src={product.featuredImageUrl || product.imageUrl}
        alt={product.name}
      />
    </button>
  );
}
