import { X } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import ProductImage from './ProductImage';
import SuggestedProducts from './SuggestedProducts';

export default function ProductDetailModal({ product, products, variantGroups, onClose }) {
  if (!product) return null;
  const groups = variantGroups.filter((group) => product.variantGroupIds?.includes(group.id) && group.active);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <article className="product-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar detalle">
          <X size={22} />
        </button>
        <div className="modal-hero">
          <ProductImage size="large" src={product.featuredImageUrl || product.imageUrl} alt={product.name} />
          <div>
            <span className="modal-kicker">Detalle del producto</span>
            <h3>{product.name}</h3>
            <strong>{formatPrice(product.price)}</strong>
            <p>{product.description || product.shortDescription}</p>
            {product.tags?.length > 0 && (
              <div className="tag-row">
                {product.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        {groups.length > 0 && (
          <section className="variant-groups">
            <h4>Variantes disponibles</h4>
            {groups.map((group) => (
              <div className="variant-group" key={group.id}>
                <div>
                  <strong>{group.name}</strong>
                  <span>{group.required ? 'Obligatoria' : 'Opcional'} · {group.type === 'multiple' ? 'Múltiple' : 'Única'}</span>
                </div>
                <div className="variant-options">
                  {(group.options || [])
                    .filter((option) => option.active)
                    .map((option) => (
                      <span key={option.id}>
                        {option.name}
                        {Number(option.priceModifier) > 0 ? ` +${formatPrice(option.priceModifier)}` : ''}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </section>
        )}
        <SuggestedProducts product={product} products={products} />
      </article>
    </div>
  );
}
