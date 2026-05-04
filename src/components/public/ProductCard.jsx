import { Plus } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import ProductImage from './ProductImage';
import ProductOptionIcons from './ProductOptionIcons';

export default function ProductCard({ product, variantGroups, onOpen }) {
  return (
    <button className="product-card" type="button" onClick={() => onOpen(product)}>
      <ProductImage size="small" src={product.imageUrl} alt={product.name} />
      <div className="product-card-body">
        <div>
          <h3>{product.name}</h3>
          <p>{product.shortDescription || product.description}</p>
        </div>
        <ProductOptionIcons product={product} variantGroups={variantGroups} />
        <div className="product-card-footer">
          <strong>{formatPrice(product.price)}</strong>
          <span className="round-action">
            <Plus size={18} />
          </span>
        </div>
      </div>
    </button>
  );
}
