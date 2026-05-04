import { createDocument, deleteDocument, listCollection, updateDocument } from './firestoreService';

export const normalizeVariantPayload = (payload) => ({
  ...payload,
  type: payload.type || 'single',
  required: Boolean(payload.required),
  active: payload.active ?? true,
  sortOrder: Number(payload.sortOrder || 0),
  options: (payload.options || []).map((option, index) => ({
    id: option.id || `${Date.now()}-${index}`,
    name: option.name,
    priceModifier: Number(option.priceModifier || 0),
    active: option.active ?? true,
  })),
});

export const variantService = {
  list: () => listCollection('variantGroups'),
  create: (payload) => createDocument('variantGroups', normalizeVariantPayload(payload)),
  update: (id, payload) => updateDocument('variantGroups', id, normalizeVariantPayload(payload)),
  remove: (id) => deleteDocument('variantGroups', id),
};
