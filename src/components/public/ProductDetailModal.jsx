import { X } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import { getProductFeaturedImageUrl, getProductImageUrl } from '../../utils/productImages';
import ProductImage from './ProductImage';
import ProductOptionIcons from './ProductOptionIcons';
import SuggestedProducts from './SuggestedProducts';

export default function ProductDetailModal({ product, products, variantGroups, onClose }) {
  if (!product) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <article className="product-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar detalle">
          <X size={22} />
        </button>
        <div className="modal-hero">
          <ProductImage size="large" src={getProductFeaturedImageUrl(product) || getProductImageUrl(product)} alt={product.name} loading="eager" />
          <div>
            <span className="modal-kicker">Detalle del producto</span>
            <h3>{product.name}</h3>
            <strong>{formatPrice(product.price)}</strong>
            <p>{product.description || product.shortDescription}</p>
            <ProductOptionIcons product={product} variantGroups={variantGroups} size="modal" />
          </div>
        </div>
        <SuggestedProducts product={product} products={products} />
      </article>
    </div>
  );
}
