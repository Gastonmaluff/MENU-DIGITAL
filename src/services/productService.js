import { createDocument, deleteDocument, listCollection, updateDocument } from './firestoreService';
import { getProductFeaturedImageUrl, getProductImageUrl } from '../utils/productImages';
import { getLegacyOptionIds } from '../utils/productOptions';

const cleanArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const imageFieldAliases = [
  'id',
  'image',
  'imageSrc',
  'photo',
  'photoUrl',
  'img',
  'thumbnail',
  'demoImage',
  'featuredImage',
  'heroImageUrl',
  'heroImage',
  'coverImageUrl',
];
const legacyOptionFieldAliases = ['visualOptions', 'optionFlags'];

const stripImageAliases = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([key]) => ![...imageFieldAliases, ...legacyOptionFieldAliases].includes(key)),
  );

export const normalizeProductPayload = (payload) => {
  const rest = stripImageAliases(payload);

  return {
    ...rest,
    imageUrl: getProductImageUrl(payload),
    featuredImageUrl: getProductFeaturedImageUrl(payload),
    price: Number(payload.price || 0),
    sortOrder: Number(payload.sortOrder || 0),
    tags: cleanArray(payload.tags),
    variantGroupIds: cleanArray(payload.variantGroupIds),
    suggestedProductIds: cleanArray(payload.suggestedProductIds),
    optionIds: [...new Set([...cleanArray(payload.optionIds), ...getLegacyOptionIds(payload)])],
    active: payload.active ?? true,
    featured: payload.featured ?? false,
  };
};

export const productService = {
  list: () => listCollection('products'),
  create: (payload) => createDocument('products', normalizeProductPayload(payload)),
  update: (id, payload) => updateDocument('products', id, normalizeProductPayload(payload)),
  remove: (id) => deleteDocument('products', id),
};
