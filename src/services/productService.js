import { createDocument, deleteDocument, listCollection, updateDocument } from './firestoreService';
import { getProductFeaturedImageUrl, getProductImageUrl } from '../utils/productImages';

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

const stripImageAliases = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([key]) => !imageFieldAliases.includes(key)));

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
    active: payload.active ?? true,
    featured: payload.featured ?? false,
    visualOptions: {
      lactoseFree: Boolean(payload.visualOptions?.lactoseFree),
      plantBased: Boolean(payload.visualOptions?.plantBased),
    },
  };
};

export const productService = {
  list: () => listCollection('products'),
  create: (payload) => createDocument('products', normalizeProductPayload(payload)),
  update: (id, payload) => updateDocument('products', id, normalizeProductPayload(payload)),
  remove: (id) => deleteDocument('products', id),
};
