import { deleteDocument, listCollection, updateDocument } from './firestoreService';
import { slugify } from '../utils/format';
import { normalizeProductOption } from '../utils/productOptions';

const normalizeProductOptionPayload = (payload) => {
  const option = normalizeProductOption(payload);
  return {
    nombre: option.nombre,
    precioExtra: option.precioExtra,
    icono: option.icono,
    enabled: option.enabled,
    sortOrder: option.sortOrder,
  };
};

export const productOptionService = {
  list: () => listCollection('productOptions'),
  create: async (payload) => {
    const id = payload.id || slugify(payload.nombre || payload.name);
    await updateDocument('productOptions', id, normalizeProductOptionPayload({ ...payload, id }));
    return id;
  },
  update: async (id, payload) => {
    const normalizedPayload = normalizeProductOptionPayload({ ...payload, id });
    await updateDocument('productOptions', id, normalizedPayload);
    return { id, ...normalizedPayload };
  },
  remove: (id) => deleteDocument('productOptions', id),
};
