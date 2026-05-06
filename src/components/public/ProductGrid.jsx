import { ArrowLeft, ArrowRight, Coffee } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductGrid({
  products,
  variantGroups,
  visibleCount,
  onOpen,
  onShowMore,
  hasMore,
  onBack,
  backLabel = 'Volver',
  moreLabel = 'Ver más opciones',
  emptyTitle = 'No hay productos activos en esta categoría',
  emptyText = 'Podés cargar productos desde el panel admin.',
}) {
  if (products.length === 0 && !onBack) {
    return (
      <div className="empty-state">
        <Coffee size={38} strokeWidth={1.4} />
        <h3>{emptyTitle}</h3>
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <section className="product-grid" aria-label="Productos">
      {onBack && (
        <button className="see-more-card see-more-card--back" type="button" onClick={onBack}>
          <span className="see-more-icon">
            <ArrowLeft size={28} strokeWidth={1.45} />
          </span>
          <strong>{backLabel}</strong>
          <span className="see-more-action">
            <ArrowLeft size={24} />
          </span>
        </button>
      )}
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
          <strong>{moreLabel}</strong>
          <span className="see-more-action">
            <ArrowRight size={24} />
          </span>
        </button>
      )}
    </section>
  );
}
