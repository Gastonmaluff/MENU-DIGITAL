import { formatOptionPrice, getEnabledProductOptions, productOptionIconMap } from '../../utils/productOptions';

export default function ProductOptionIcons({ product, productOptions = [], variantGroups = [], size = 'card' }) {
  const visibleOptions = getEnabledProductOptions(product, productOptions, variantGroups);

  if (visibleOptions.length === 0) return null;

  return (
    <div className={`product-option-icons product-option-icons--${size}`} aria-label="Opciones disponibles">
      {visibleOptions.map((option) => {
        const Icon = productOptionIconMap[option.icono];
        const price = formatOptionPrice(option.precioExtra);

        return (
          <span key={option.id} title={option.nombre} aria-label={option.nombre}>
            {Icon && <Icon size={size === 'modal' ? 18 : 13} strokeWidth={1.7} />}
            <b>{option.nombre}</b>
            {price && <em>{price}</em>}
        </span>
        );
      })}
    </div>
  );
}
