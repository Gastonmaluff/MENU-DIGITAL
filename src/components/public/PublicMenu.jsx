import { useEffect, useMemo, useRef, useState } from 'react';
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
const CATEGORY_TRANSITION_MS = 320;
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
  const [visibleCategoryId, setVisibleCategoryId] = useState('');
  const [categoryTransition, setCategoryTransition] = useState(null);
  const transitionTimeoutRef = useRef(null);

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
  const contentCategoryId = activeCategories.some((category) => category.id === visibleCategoryId)
    ? visibleCategoryId
    : currentCategoryId;
  const getCategoryContent = (categoryId) => {
    const categoryProducts = activeProducts.filter((product) => product.categoryId === categoryId);
    const featuredProduct = categoryProducts.find((product) => product.featured) || categoryProducts[0];
    const gridProducts = categoryProducts.filter((product) => product.id !== featuredProduct?.id);
    const isExpanded = Boolean(expandedCategories[categoryId]);
    const visibleCount = isExpanded ? gridProducts.length : collapsedVisibleCount;

    return {
      featuredProduct,
      gridProducts,
      visibleCount,
      hasMore: !isExpanded && gridProducts.length > visibleCount,
    };
  };
  const content = getCategoryContent(contentCategoryId);
  const syncing = syncingSettings || syncingCategories || syncingProducts || syncingVariants;
  const firebaseError = settingsError || categoriesError || productsError;

  useEffect(() => {
    if (!currentCategoryId) return;
    if (!visibleCategoryId || !activeCategories.some((category) => category.id === visibleCategoryId)) {
      setVisibleCategoryId(currentCategoryId);
    }
  }, [activeCategories, currentCategoryId, visibleCategoryId]);

  useEffect(
    () => () => {
      window.clearTimeout(transitionTimeoutRef.current);
    },
    [],
  );

  const selectCategory = (categoryId) => {
    if (!categoryId || categoryId === currentCategoryId || categoryTransition) return;

    const fromCategoryId = contentCategoryId || currentCategoryId;
    const fromIndex = activeCategories.findIndex((category) => category.id === fromCategoryId);
    const toIndex = activeCategories.findIndex((category) => category.id === categoryId);
    const direction = toIndex > fromIndex ? 'forward' : 'backward';

    setSelectedProduct(null);
    setActiveCategoryId(categoryId);
    setCategoryTransition({ from: fromCategoryId, to: categoryId, direction });

    window.clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = window.setTimeout(() => {
      setVisibleCategoryId(categoryId);
      setCategoryTransition(null);
    }, CATEGORY_TRANSITION_MS);
  };

  const showMoreForCategory = () => {
    if (!contentCategoryId || categoryTransition) return;
    setExpandedCategories((current) => ({
      ...current,
      [contentCategoryId]: true,
    }));
  };

  const renderCategoryContent = ({ featuredProduct, gridProducts, visibleCount, hasMore }) => (
    <>
      <FeaturedProduct product={featuredProduct} onOpen={setSelectedProduct} />
      <ProductGrid
        products={gridProducts}
        variantGroups={variantGroups}
        visibleCount={visibleCount}
        onOpen={setSelectedProduct}
        onShowMore={showMoreForCategory}
        hasMore={hasMore}
      />
    </>
  );

  return (
    <ThemeWrapper settings={settings}>
      <main className="public-menu">
        <MenuHeader settings={settings} />
        <CategoryPills
          categories={activeCategories}
          activeCategoryId={currentCategoryId}
          onSelect={selectCategory}
          disabled={Boolean(categoryTransition)}
        />
        {syncing && (
          <div className="sync-status" aria-live="polite">
            <span /> Actualizando menú...
          </div>
        )}
        {firebaseError && !syncing && (
          <div className="sync-status sync-status--soft">Menú local activo. Firebase no respondió todavía.</div>
        )}
        <section className={`category-content-stage ${categoryTransition ? 'is-transitioning' : ''}`} aria-live="polite">
          {categoryTransition ? (
            <>
              <div className={`category-content-panel is-exiting is-${categoryTransition.direction}`}>
                {renderCategoryContent(getCategoryContent(categoryTransition.from))}
              </div>
              <div className={`category-content-panel is-entering is-${categoryTransition.direction}`}>
                {renderCategoryContent(getCategoryContent(categoryTransition.to))}
              </div>
            </>
          ) : (
            <div className="category-content-panel is-current">
              {renderCategoryContent(content)}
            </div>
          )}
        </section>
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
