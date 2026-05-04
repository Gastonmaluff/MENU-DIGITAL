import { AnimatedCategoryIcon } from './icons';

export default function CategoryPills({ categories, activeCategoryId, onSelect }) {
  return (
    <nav className="category-pills" aria-label="Categorías del menú">
      {categories.map((category) => (
        // Wrapper intentionally keeps icons animation-ready per category.
        <button
          className={`category-pill ${category.id === activeCategoryId ? 'is-active' : ''}`}
          type="button"
          key={category.id}
          onClick={() => onSelect(category.id)}
        >
          <AnimatedCategoryIcon name={category.icon} active={category.id === activeCategoryId} />
          <span>{category.name}</span>
        </button>
      ))}
    </nav>
  );
}
