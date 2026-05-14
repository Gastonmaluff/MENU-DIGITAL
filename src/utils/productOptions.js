import { Coffee, CupSoda, Droplet, Leaf, MilkOff, Plus, Snowflake, Sparkles } from 'lucide-react';
import { formatPrice } from './format';

const normalized = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const productOptionIconMap = {
  leaf: Leaf,
  milkOff: MilkOff,
  coffee: Coffee,
  cupSoda: CupSoda,
  droplet: Droplet,
  snowflake: Snowflake,
  sparkles: Sparkles,
  plus: Plus,
};

export const productOptionIconChoices = [
  { value: '', label: 'Sin icono' },
  { value: 'leaf', label: 'Hoja' },
  { value: 'milkOff', label: 'Sin lactosa' },
  { value: 'coffee', label: 'Cafe' },
  { value: 'cupSoda', label: 'Vaso frio' },
  { value: 'droplet', label: 'Gota' },
  { value: 'snowflake', label: 'Frio' },
  { value: 'sparkles', label: 'Especial' },
  { value: 'plus', label: 'Extra' },
];

const legacyOptionAliases = {
  lactoseFree: 'deslactosada',
  plantBased: 'leche-vegetal',
};

const getLegacyOptionFlags = (product, variantGroups = []) => {
  const explicit = product.visualOptions || product.optionFlags || {};
  const groups = variantGroups.filter((group) => product.variantGroupIds?.includes(group.id));
  const optionNames = groups.flatMap((group) => (group.options || []).map((option) => normalized(option.name)));

  return {
    lactoseFree:
      Boolean(explicit.lactoseFree || explicit.deslactosado) ||
      optionNames.some((name) => name.includes('deslactos')),
    plantBased:
      Boolean(explicit.plantBased || explicit.vegetal) ||
      optionNames.some((name) => name.includes('vegetal')),
  };
};

export const getLegacyOptionIds = (product, variantGroups = []) => {
  const flags = getLegacyOptionFlags(product, variantGroups);
  return Object.entries(legacyOptionAliases)
    .filter(([key]) => flags[key])
    .map(([, optionId]) => optionId);
};

export const getProductOptionIds = (product, variantGroups = []) => [
  ...new Set([...(product.optionIds || []), ...getLegacyOptionIds(product, variantGroups)]),
];

export const normalizeProductOption = (option = {}) => ({
  id: option.id || '',
  nombre: option.nombre || option.name || '',
  precioExtra: Number(option.precioExtra ?? option.priceExtra ?? option.priceModifier ?? 0),
  icono: option.icono || option.icon || '',
  enabled: option.enabled ?? option.active ?? true,
  sortOrder: Number(option.sortOrder || 0),
});

export const getEnabledProductOptions = (product, productOptions = [], variantGroups = []) => {
  const optionIds = getProductOptionIds(product, variantGroups);
  return productOptions
    .map(normalizeProductOption)
    .filter((option) => option.enabled && optionIds.includes(option.id));
};

export const formatOptionPrice = (precioExtra) => {
  const value = Number(precioExtra || 0);
  return value > 0 ? `+${formatPrice(value)}` : '';
};
