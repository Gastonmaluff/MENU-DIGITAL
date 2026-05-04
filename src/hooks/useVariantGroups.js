import { demoVariantGroups } from '../data/demoData';
import { variantService } from '../services/variantService';
import { useAsyncCollection } from './useAsyncCollection';

export const useVariantGroups = () => useAsyncCollection(variantService, demoVariantGroups);
