import { Leaf, MilkOff } from 'lucide-react';

const normalized = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const getProductVisualOptions = (product, variantGroups = []) => {
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

export const visualOptionList = [
  { key: 'lactoseFree', label: 'Sin lactosa', Icon: MilkOff },
  { key: 'plantBased', label: 'Leche vegetal', Icon: Leaf },
];
