import { demoCategories } from '../data/demoData';
import { categoryService } from '../services/categoryService';
import { useAsyncCollection } from './useAsyncCollection';

export const useCategories = () => useAsyncCollection(categoryService, demoCategories);
