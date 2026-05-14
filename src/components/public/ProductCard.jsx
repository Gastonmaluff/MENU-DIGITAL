import { formatPrice } from '../../utils/format';
import { getProductImageTuningStyle } from '../../utils/productImageTuning';
import { getProductImageUrl } from '../../utils/productImages';
import ProductImage from './ProductImage';
import ProductOptionIcons from './ProductOptionIcons';

export default function ProductCard({ product, productOptions, variantGroups, onOpen }) {
  return (
    <button
      className="product-card floating-product"
      type="button"
      style={getProductImageTuningStyle(product, 'card')}
      onClick={() => onOpen(product)}
    >
      <div className="product-card-image-area">
        <ProductImage size="small" src={getProductImageUrl(product)} alt={product.name} />
      </div>
      <div className="product-card-content">
        <div className="product-card-copy">
          <h3>{product.name}</h3>
          <p>{product.shortDescription || product.description}</p>
        </div>
        <ProductOptionIcons product={product} productOptions={productOptions} variantGroups={variantGroups} />
      </div>
      <div className="product-card-footer">
        <strong>{formatPrice(product.price)}</strong>
      </div>
    </button>
  );
}
