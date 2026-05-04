export const formatPrice = (value) => {
  const numeric = Number(value || 0);
  return new Intl.NumberFormat('es-PY').format(numeric);
};

export const slugify = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

export const sortByOrder = (items) =>
  [...items].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
