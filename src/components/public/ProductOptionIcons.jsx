import { getProductVisualOptions, visualOptionList } from '../../utils/productOptions';

export default function ProductOptionIcons({ product, variantGroups = [], size = 'card' }) {
  const options = getProductVisualOptions(product, variantGroups);
  const visibleOptions = visualOptionList.filter((option) => options[option.key]);

  if (visibleOptions.length === 0) return null;

  return (
    <div className={`product-option-icons product-option-icons--${size}`} aria-label="Opciones disponibles">
      {visibleOptions.map(({ key, label, Icon }) => (
        <span key={key} title={label} aria-label={label}>
          <Icon size={size === 'modal' ? 19 : 16} strokeWidth={1.6} />
        </span>
      ))}
    </div>
  );
}
