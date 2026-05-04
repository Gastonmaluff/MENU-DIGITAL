import { demoCategories } from '../data/demoData';
import { useAsyncCollection } from './useAsyncCollection';

export const useCategories = () => useAsyncCollection('categories', demoCategories);
