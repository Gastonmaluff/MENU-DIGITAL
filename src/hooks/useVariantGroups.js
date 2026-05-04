import { demoVariantGroups } from '../data/demoData';
import { useAsyncCollection } from './useAsyncCollection';

export const useVariantGroups = () => useAsyncCollection('variantGroups', demoVariantGroups, { orderField: null });
