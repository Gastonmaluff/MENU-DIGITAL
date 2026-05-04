import { Plus } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import ProductImage from './ProductImage';

export default function ProductCard({ product, variantGroups, onOpen }) {
  const groups = variantGroups.filter((group) => product.variantGroupIds?.includes(group.id));
  const variantPreview = groups.flatMap((group) =>
    (group.options || []).filter((option) => option.active).slice(0, 3).map((option) => option.name),
  );

  return (
    <button className="product-card" type="button" onClick={() => onOpen(product)}>
      <ProductImage size="small" src={product.imageUrl} alt={product.name} />
      <div className="product-card-body">
        <div>
          <h3>{product.name}</h3>
          <p>{product.shortDescription || product.description}</p>
        </div>
        {product.tags?.length > 0 && (
          <div className="tag-row">
            {product.tags.slice(0, 3).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
        {variantPreview.length > 0 && (
          <div className="variant-preview">
            {variantPreview.slice(0, 3).map((variant) => (
              <span key={variant}>{variant}</span>
            ))}
          </div>
        )}
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
