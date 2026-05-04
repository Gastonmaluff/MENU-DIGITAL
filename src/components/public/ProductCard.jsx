import { formatPrice } from '../../utils/format';
import ProductImage from './ProductImage';
import ProductOptionIcons from './ProductOptionIcons';

export default function ProductCard({ product, variantGroups, onOpen }) {
  return (
    <button className="product-card" type="button" onClick={() => onOpen(product)}>
      <div className="product-card-image-area">
        <ProductImage size="small" src={product.imageUrl} alt={product.name} />
      </div>
      <div className="product-card-content">
        <div className="product-card-copy">
          <h3>{product.name}</h3>
          <p>{product.shortDescription || product.description}</p>
        </div>
        <ProductOptionIcons product={product} variantGroups={variantGroups} />
      </div>
      <div className="product-card-footer">
        <strong>{formatPrice(product.price)}</strong>
      </div>
    </button>
  );
}
