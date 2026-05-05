import { useEffect, useMemo, useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { useSettings } from '../../hooks/useSettings';
import { useVariantGroups } from '../../hooks/useVariantGroups';
import CategoryPills from './CategoryPills';
import FeaturedProduct from './FeaturedProduct';
import MenuHeader from './MenuHeader';
import ProductDetailModal from './ProductDetailModal';
import ProductGrid from './ProductGrid';
import ThemeWrapper from './ThemeWrapper';

const tabletMenuQuery = '(min-width: 700px) and (max-width: 900px) and (orientation: portrait)';
const getInitialVisibleCount = () =>
  typeof window !== 'undefined' && window.matchMedia(tabletMenuQuery).matches ? 2 : 5;

export default function PublicMenu() {
  const { settings, syncing: syncingSettings, error: settingsError } = useSettings();
  const { items: categories, syncing: syncingCategories, error: categoriesError } = useCategories();
  const { items: products, syncing: syncingProducts, error: productsError } = useProducts();
  const { items: variantGroups, syncing: syncingVariants } = useVariantGroups();
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [collapsedVisibleCount, setCollapsedVisibleCount] = useState(getInitialVisibleCount);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    const media = window.matchMedia(tabletMenuQuery);
    const syncVisibleCount = () => setCollapsedVisibleCount(getInitialVisibleCount());
    syncVisibleCount();
    media.addEventListener('change', syncVisibleCount);
    return () => media.removeEventListener('change', syncVisibleCount);
  }, []);

  const activeCategories = useMemo(() => categories.filter((category) => category.active), [categories]);
  const currentCategoryId = activeCategories.some((category) => category.id === activeCategoryId)
    ? activeCategoryId
    : activeCategories[0]?.id;
  const activeProducts = useMemo(() => products.filter((product) => product.active), [products]);
  const categoryProducts = useMemo(
    () => activeProducts.filter((product) => product.categoryId === currentCategoryId),
    [activeProducts, currentCategoryId],
  );
  const featuredProduct = categoryProducts.find((product) => product.featured) || categoryProducts[0];
  const gridProducts = categoryProducts.filter((product) => product.id !== featuredProduct?.id);
  const isExpanded = Boolean(expandedCategories[currentCategoryId]);
  const visibleCount = isExpanded ? gridProducts.length : collapsedVisibleCount;
  const hasMore = !isExpanded && gridProducts.length > visibleCount;
  const syncing = syncingSettings || syncingCategories || syncingProducts || syncingVariants;
  const firebaseError = settingsError || categoriesError || productsError;

  const selectCategory = (categoryId) => {
    setSelectedProduct(null);
    setActiveCategoryId(categoryId);
  };

  const showMoreForCategory = () => {
    if (!currentCategoryId) return;
    setExpandedCategories((current) => ({
      ...current,
      [currentCategoryId]: true,
    }));
  };

  return (
    <ThemeWrapper settings={settings}>
      <main className="public-menu">
        <MenuHeader settings={settings} />
        <CategoryPills
          categories={activeCategories}
          activeCategoryId={currentCategoryId}
          onSelect={selectCategory}
        />
        {syncing && (
          <div className="sync-status" aria-live="polite">
            <span /> Actualizando menú...
          </div>
        )}
        {firebaseError && !syncing && (
          <div className="sync-status sync-status--soft">Menú local activo. Firebase no respondió todavía.</div>
        )}
        <FeaturedProduct product={featuredProduct} onOpen={setSelectedProduct} />
        <ProductGrid
          products={gridProducts}
          variantGroups={variantGroups}
          visibleCount={visibleCount}
          onOpen={setSelectedProduct}
          onShowMore={showMoreForCategory}
          hasMore={hasMore}
        />
        {settings.showFooter && <footer className="menu-footer">{settings.footerText}</footer>}
        <ProductDetailModal
          product={selectedProduct}
          products={activeProducts}
          variantGroups={variantGroups}
          onClose={() => setSelectedProduct(null)}
        />
      </main>
    </ThemeWrapper>
  );
}
