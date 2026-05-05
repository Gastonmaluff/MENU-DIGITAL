const normalize = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const icedCoffeeCardTuning = [
  {
    match: ['iced coffee expresso', 'iced espresso'],
    scale: 0.72,
    y: '-16px',
  },
  {
    match: ['iced latte'],
    scale: 0.76,
    y: '-22px',
  },
  {
    match: ['latte caramel', 'iced caramel latte', 'iced caramel'],
    scale: 0.76,
    y: '-32px',
  },
  {
    match: ['tonic coffee'],
    scale: 1,
    y: '-42px',
  },
];

const icedCoffeeFeaturedTuning = [
  {
    match: ['iced coffee expresso', 'iced espresso'],
    scale: 0.72,
    y: '0px',
  },
];

const findTuning = (product, entries) => {
  const name = normalize(product?.name);
  if (normalize(product?.categoryId) !== 'iced-coffee') return null;
  return entries.find((entry) => entry.match.some((value) => name.includes(value)));
};

export const getProductImageTuningStyle = (product, placement = 'card') => {
  const tuning = findTuning(product, placement === 'featured' ? icedCoffeeFeaturedTuning : icedCoffeeCardTuning);
  if (!tuning) return undefined;

  return {
    '--product-image-scale': tuning.scale,
    '--product-image-x': tuning.x || '0px',
    '--product-image-y': tuning.y || '0px',
  };
};
