import { demoProducts } from '../data/demoData';
import { useAsyncCollection } from './useAsyncCollection';

export const useProducts = () => useAsyncCollection('products', demoProducts);
