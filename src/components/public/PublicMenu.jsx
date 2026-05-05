import { useEffect, useMemo, useRef, useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { useSettings } from '../../hooks/useSettings';
import { useVariantGroups } from '../../hooks/useVariantGroups';
import { resolveAssetUrl } from '../../utils/assets';
import { getProductFeaturedImageUrl, getProductImageUrl } from '../../utils/productImages';
import CategoryPills from './CategoryPills';
import FeaturedProduct from './FeaturedProduct';
import MenuHeader from './MenuHeader';
import ProductDetailModal from './ProductDetailModal';
import ProductGrid from './ProductGrid';
import ThemeWrapper from './ThemeWrapper';

const tabletMenuQuery = '(min-width: 700px) and (max-width: 900px) and (orientation: portrait)';
const CATEGORY_TRANSITION_MS = 280;
const getInitialVisibleCount = () =>
  typeof window !== 'undefined' && window.matchMedia(tabletMenuQuery).matches ? 2 : 5;

const categoryFallbackMeta = {
  cafes: { name: 'Cafés', icon: 'Coffee', sortOrder: 1 },
  'iced-coffee': { name: 'Iced Coffee', icon: 'CupSoda', sortOrder: 2 },
  salados: { name: 'Salados', icon: 'Wheat', sortOrder: 3 },
  dulces: { name: 'Dulces', icon: 'CakeSlice', sortOrder: 4 },
  'no-coffee': { name: 'No Coffee', icon: 'Leaf', sortOrder: 5 },
};

const titleFromSlug = (slug) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const preloadImages = (urls) => {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  if (uniqueUrls.length === 0) return Promise.resolve();

  return Promise.allSettled(
    uniqueUrls.map(
      (url) =>
        new Promise((resolve) => {
          const image = new Image();
          image.decoding = 'async';
          image.onload = resolve;
          image.onerror = resolve;
          image.src = url;
        }),
    ),
  );
};

export default function PublicMenu() {
  const { settings, syncing: syncingSettings, error: settingsError } = useSettings();
  const { items: categories, syncing: syncingCategories, error: categoriesError, usingDemo: usingDemoCategories } = useCategories();
  const { items: products, syncing: syncingProducts, error: productsError, usingDemo: usingDemoProducts } = useProducts();
  const { items: variantGroups, syncing: syncingVariants, usingDemo: usingDemoVariants } = useVariantGroups();
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [collapsedVisibleCount, setCollapsedVisibleCount] = useState(getInitialVisibleCount);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [visibleCategoryId, setVisibleCategoryId] = useState('');
  const [categoryTransition, setCategoryTransition] = useState(null);
  const [initialMenuReady, setInitialMenuReady] = useState(false);
  const transitionTimeoutRef = useRef(null);

  useEffect(() => {
    const media = window.matchMedia(tabletMenuQuery);
    const syncVisibleCount = () => setCollapsedVisibleCount(getInitialVisibleCount());
    syncVisibleCount();
    media.addEventListener('change', syncVisibleCount);
    return () => media.removeEventListener('change', syncVisibleCount);
  }, []);

  const publicProducts = useMemo(() => (usingDemoProducts ? [] : products), [products, usingDemoProducts]);
  const derivedCategories = useMemo(() => {
    const categoryIds = [...new Set(publicProducts.map((product) => product.categoryId).filter(Boolean))];
    return categoryIds
      .map((categoryId, index) => {
        const fallback = categoryFallbackMeta[categoryId] || {};
        return {
          id: categoryId,
          name: fallback.name || titleFromSlug(categoryId),
          slug: categoryId,
          icon: fallback.icon || 'Coffee',
          sortOrder: fallback.sortOrder || index + 1,
          active: true,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [publicProducts]);
  const publicCategories = useMemo(
    () => (usingDemoCategories ? derivedCategories : categories),
    [categories, derivedCategories, usingDemoCategories],
  );
  const publicVariantGroups = useMemo(
    () => (usingDemoVariants ? [] : variantGroups),
    [usingDemoVariants, variantGroups],
  );
  const activeCategories = useMemo(() => publicCategories.filter((category) => category.active), [publicCategories]);
  const currentCategoryId = activeCategories.some((category) => category.id === activeCategoryId)
    ? activeCategoryId
    : activeCategories[0]?.id;
  const activeProducts = useMemo(() => publicProducts.filter((product) => product.active), [publicProducts]);
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
  const firebaseReady = !syncingSettings && !syncingCategories && !syncingProducts && !syncingVariants;
  const firebaseError = settingsError || categoriesError || productsError;
  const initialImageUrls = useMemo(() => {
    if (!firebaseReady) return [];
    const visibleGridProducts = content.gridProducts.slice(0, content.visibleCount);
    return [
      getProductFeaturedImageUrl(content.featuredProduct) || getProductImageUrl(content.featuredProduct),
      ...visibleGridProducts.map(getProductImageUrl),
    ].map(resolveAssetUrl);
  }, [content.featuredProduct, content.gridProducts, content.visibleCount, firebaseReady]);

  useEffect(() => {
    if (!currentCategoryId) return;
    if (!visibleCategoryId || !activeCategories.some((category) => category.id === visibleCategoryId)) {
      setVisibleCategoryId(currentCategoryId);
    }
  }, [activeCategories, currentCategoryId, visibleCategoryId]);

  useEffect(() => {
    let cancelled = false;
    if (initialMenuReady || !firebaseReady) return undefined;

    preloadImages(initialImageUrls).then(() => {
      if (!cancelled) setInitialMenuReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [firebaseReady, initialImageUrls, initialMenuReady]);

  useEffect(() => {
    if (!initialMenuReady || activeProducts.length === 0) return undefined;
    const allProductUrls = activeProducts
      .flatMap((product) => [getProductFeaturedImageUrl(product), getProductImageUrl(product)])
      .map(resolveAssetUrl);
    const preloadRest = () => preloadImages(allProductUrls);

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preloadRest, { timeout: 2500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(preloadRest, 700);
    return () => window.clearTimeout(timeoutId);
  }, [activeProducts, initialMenuReady]);

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
        variantGroups={publicVariantGroups}
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
        {!initialMenuReady ? (
          <PublicMenuLoader settings={settings} />
        ) : (
          <>
            <MenuHeader settings={settings} />
            <CategoryPills
              categories={activeCategories}
              activeCategoryId={currentCategoryId}
              onSelect={selectCategory}
              disabled={Boolean(categoryTransition)}
            />
            {firebaseError && (
              <div className="sync-status sync-status--soft">No pudimos sincronizar Firebase. Revisá la conexión.</div>
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
              variantGroups={publicVariantGroups}
              onClose={() => setSelectedProduct(null)}
            />
          </>
        )}
      </main>
    </ThemeWrapper>
  );
}

function PublicMenuLoader({ settings }) {
  const logoUrl = resolveAssetUrl(settings.logoUrl);

  return (
    <section className="public-loading-screen" aria-live="polite" aria-busy="true">
      {logoUrl ? (
        <img
          className="public-loading-logo"
          src={logoUrl}
          alt={`${settings.brandName} ${settings.brandSubtitle}`}
          decoding="async"
        />
      ) : (
        <div className="public-loading-brand">
          <strong>{settings.brandName}</strong>
          <span>{settings.brandSubtitle}</span>
        </div>
      )}
      <p>Cargando menú...</p>
    </section>
  );
}
