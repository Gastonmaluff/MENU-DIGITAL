import { demoProductOptions } from '../data/demoData';
import { normalizeProductOption } from '../utils/productOptions';
import { useAsyncCollection } from './useAsyncCollection';

export const useProductOptions = () => {
  const state = useAsyncCollection('productOptions', demoProductOptions);
  return {
    ...state,
    items: state.items.map(normalizeProductOption),
  };
};
