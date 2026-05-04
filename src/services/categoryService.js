import { createDocument, deleteDocument, listCollection, updateDocument } from './firestoreService';
import { slugify } from '../utils/format';

export const categoryService = {
  list: () => listCollection('categories'),
  create: (payload) =>
    createDocument('categories', {
      ...payload,
      slug: payload.slug || slugify(payload.name),
      active: payload.active ?? true,
      sortOrder: Number(payload.sortOrder || 0),
    }),
  update: (id, payload) =>
    updateDocument('categories', id, {
      ...payload,
      slug: payload.slug || slugify(payload.name),
      sortOrder: Number(payload.sortOrder || 0),
    }),
  remove: (id) => deleteDocument('categories', id),
};
