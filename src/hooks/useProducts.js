import { demoProducts } from '../data/demoData';
import { normalizeProductImageFields } from '../utils/productImages';
import { useAsyncCollection } from './useAsyncCollection';

export const useProducts = () => {
  const state = useAsyncCollection('products', demoProducts);
  return {
    ...state,
    items: state.items.map(normalizeProductImageFields),
  };
};
