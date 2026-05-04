import { DynamicIcon } from './icons';

export default function CategoryPills({ categories, activeCategoryId, onSelect }) {
  return (
    <nav className="category-pills" aria-label="Categorías del menú">
      {categories.map((category) => (
        <button
          className={`category-pill ${category.id === activeCategoryId ? 'is-active' : ''}`}
          type="button"
          key={category.id}
          onClick={() => onSelect(category.id)}
        >
          <DynamicIcon name={category.icon} />
          <span>{category.name}</span>
        </button>
      ))}
    </nav>
  );
}
