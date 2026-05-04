import { formatPrice } from '../../utils/format';
import ProductImage from './ProductImage';

export default function SuggestedProducts({ product, products }) {
  const suggested = (product.suggestedProductIds || [])
    .map((id) => products.find((item) => item.id === id))
    .filter(Boolean)
    .slice(0, 4);

  if (suggested.length === 0) return null;

  return (
    <section className="suggested-products">
      <h4>Combina bien con</h4>
      <div className="suggested-list">
        {suggested.map((item) => (
          <article className="suggested-item" key={item.id}>
            <ProductImage size="tiny" src={item.imageUrl} alt={item.name} />
            <div>
              <strong>{item.name}</strong>
              <span>{formatPrice(item.price)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
