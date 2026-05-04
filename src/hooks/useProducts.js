import { demoProducts } from '../data/demoData';
import { productService } from '../services/productService';
import { useAsyncCollection } from './useAsyncCollection';

export const useProducts = () => useAsyncCollection(productService, demoProducts);
