import { ArrowRight, Coffee } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductGrid({
  products,
  variantGroups,
  visibleCount,
  onOpen,
  onShowMore,
  hasMore,
}) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <Coffee size={38} strokeWidth={1.4} />
        <h3>No hay productos activos en esta categoría</h3>
        <p>Podés cargar productos desde el panel admin.</p>
      </div>
    );
  }

  return (
    <section className="product-grid" aria-label="Productos">
      {products.slice(0, visibleCount).map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          variantGroups={variantGroups}
          onOpen={onOpen}
        />
      ))}
      {hasMore && (
        <button className="see-more-card" type="button" onClick={onShowMore}>
          <span className="see-more-icon">
            <Coffee size={38} strokeWidth={1.3} />
          </span>
          <strong>Ver más</strong>
          <span className="see-more-action">
            <ArrowRight size={24} />
          </span>
        </button>
      )}
    </section>
  );
}
