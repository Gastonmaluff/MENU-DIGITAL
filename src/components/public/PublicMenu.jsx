import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { useProductOptions } from '../../hooks/useProductOptions';
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

const CATEGORY_TRANSITION_MS = 340;
const MAX_MAIN_PRODUCTS = 7;
const MAIN_GRID_LIMIT_WITH_MORE = 5;

const categoryFallbackMeta = {
  cafes: { name: 'Cafés', icon: 'Coffee', sortOrder: 1 },
  'iced-coffee': { name: 'Iced Coffee', icon: 'CupSoda', sortOrder: 2 },
  salados: { name: 'Salados', icon: 'Wheat', sortOrder: 3 },
  dulces: { name: 'Dulces', icon: 'CakeSlice', sortOrder: 4 },
  'no-coffee': { name: 'No Coffee', icon: 'Leaf', sortOrder: 5 },
};

const preloadingImages = new Set();

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
          preloadingImages.add(image);
          const settle = () => {
            preloadingImages.delete(image);
            resolve();
          };
          image.decoding = 'async';
          image.onload = settle;
          image.onerror = settle;
          image.src = url;
        }),
    ),
  );
};

const preloadImagesWithTimeout = (urls, timeoutMs = 8000) =>
  Promise.race([
    preloadImages(urls),
    new Promise((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    }),
  ]);

export default function PublicMenu() {
  const { settings, syncing: syncingSettings, error: settingsError } = useSettings();
  const { items: categories, syncing: syncingCategories, error: categoriesError, usingDemo: usingDemoCategories } = useCategories();
  const { items: products, syncing: syncingProducts, error: productsError, usingDemo: usingDemoProducts } = useProducts();
  const { items: productOptions, syncing: syncingProductOptions } = useProductOptions();
  const { items: variantGroups, syncing: syncingVariants, usingDemo: usingDemoVariants } = useVariantGroups();
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [moreCategoryId, setMoreCategoryId] = useState('');
  const [visibleCategoryId, setVisibleCategoryId] = useState('');
  const [categoryTransition, setCategoryTransition] = useState(null);
  const [initialMenuReady, setInitialMenuReady] = useState(false);
  const [isPreparingCategory, setIsPreparingCategory] = useState(false);
  const [showPreparationOverlay, setShowPreparationOverlay] = useState(false);
  const [stageHeight, setStageHeight] = useState(0);
  const currentPanelRef = useRef(null);
  const stageRef = useRef(null);
  const transitionRequestRef = useRef(0);
  const transitionTimeoutRef = useRef(null);
  const preparationTimeoutRef = useRef(null);

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
  const publicProductOptions = useMemo(() => productOptions, [productOptions]);
  const activeCategories = useMemo(() => publicCategories.filter((category) => category.active), [publicCategories]);
  const currentCategoryId = activeCategories.some((category) => category.id === activeCategoryId)
    ? activeCategoryId
    : activeCategories[0]?.id;
  const activeProducts = useMemo(() => publicProducts.filter((product) => product.active), [publicProducts]);
  const contentCategoryId = activeCategories.some((category) => category.id === visibleCategoryId)
    ? visibleCategoryId
    : currentCategoryId;
  const getCategoryContent = useCallback((categoryId, viewMode = 'main') => {
    const category = activeCategories.find((item) => item.id === categoryId);
    const categoryProducts = activeProducts.filter((product) => product.categoryId === categoryId);
    const featuredProduct = categoryProducts.find((product) => product.featured) || categoryProducts[0];
    const secondaryProducts = categoryProducts.filter((product) => product.id !== featuredProduct?.id);
    const hasMore = categoryProducts.length > MAX_MAIN_PRODUCTS;
    const mainProducts = hasMore ? secondaryProducts.slice(0, MAIN_GRID_LIMIT_WITH_MORE) : secondaryProducts;
    const moreProducts = hasMore ? secondaryProducts.slice(MAIN_GRID_LIMIT_WITH_MORE) : [];
    const isMoreView = viewMode === 'more' && hasMore;
    const gridProducts = isMoreView ? moreProducts : mainProducts;

    return {
      category,
      isMoreView,
      featuredProduct: isMoreView ? null : featuredProduct,
      gridProducts,
      visibleCount: gridProducts.length,
      hasMore: !isMoreView && hasMore,
    };
  }, [activeCategories, activeProducts]);
  const contentViewMode = moreCategoryId === contentCategoryId ? 'more' : 'main';
  const content = getCategoryContent(contentCategoryId, contentViewMode);
  const firebaseReady = !syncingSettings && !syncingCategories && !syncingProducts && !syncingVariants && !syncingProductOptions;
  const firebaseError = settingsError || categoriesError || productsError;
  const getVisibleCategoryImageUrls = useCallback((categoryId, viewMode = 'main') => {
    const categoryContent = getCategoryContent(categoryId, viewMode);
    const visibleGridProducts = categoryContent.gridProducts.slice(0, categoryContent.visibleCount);
    return [
      getProductFeaturedImageUrl(categoryContent.featuredProduct) || getProductImageUrl(categoryContent.featuredProduct),
      ...visibleGridProducts.map(getProductImageUrl),
    ].map(resolveAssetUrl);
  }, [getCategoryContent]);
  const initialImageUrls = useMemo(() => {
    if (!firebaseReady) return [];
    return getVisibleCategoryImageUrls(contentCategoryId);
  }, [contentCategoryId, firebaseReady, getVisibleCategoryImageUrls]);

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

  useEffect(() => {
    if (categoryTransition || !currentPanelRef.current) return undefined;

    const updateHeight = () => {
      const nextHeight = Math.ceil(currentPanelRef.current?.getBoundingClientRect().height || 0);
      if (nextHeight) setStageHeight(nextHeight);
    };

    updateHeight();

    if (!('ResizeObserver' in window)) return undefined;
    const observer = new ResizeObserver(updateHeight);
    observer.observe(currentPanelRef.current);
    return () => observer.disconnect();
  }, [categoryTransition, contentCategoryId, content.gridProducts.length, content.visibleCount, contentViewMode]);

  useEffect(
    () => () => {
      transitionRequestRef.current += 1;
      window.clearTimeout(transitionTimeoutRef.current);
      window.clearTimeout(preparationTimeoutRef.current);
    },
    [],
  );

  const selectCategory = (categoryId) => {
    if (!categoryId || !activeCategories.some((category) => category.id === categoryId)) return;

    const fromCategoryId = contentCategoryId || currentCategoryId;
    const fromViewMode = moreCategoryId === fromCategoryId ? 'more' : 'main';
    if (
      categoryId === activeCategoryId &&
      categoryId === fromCategoryId &&
      fromViewMode === 'main' &&
      !categoryTransition &&
      !isPreparingCategory
    ) {
      return;
    }

    const requestId = transitionRequestRef.current + 1;
    transitionRequestRef.current = requestId;
    window.clearTimeout(transitionTimeoutRef.current);
    window.clearTimeout(preparationTimeoutRef.current);

    const lockedHeight = Math.ceil(
      currentPanelRef.current?.getBoundingClientRect().height ||
        stageRef.current?.getBoundingClientRect().height ||
        stageHeight ||
        0,
    );
    if (lockedHeight) setStageHeight(lockedHeight);

    setSelectedProduct(null);
    setActiveCategoryId(categoryId);
    setMoreCategoryId('');
    setCategoryTransition(null);
    setIsPreparingCategory(false);
    setShowPreparationOverlay(false);

    if (categoryId === fromCategoryId) {
      return;
    }

    const fromIndex = activeCategories.findIndex((category) => category.id === fromCategoryId);
    const toIndex = activeCategories.findIndex((category) => category.id === categoryId);
    const direction = toIndex > fromIndex ? 'forward' : 'backward';

    setIsPreparingCategory(true);
    preparationTimeoutRef.current = window.setTimeout(() => {
      if (transitionRequestRef.current === requestId) {
        setShowPreparationOverlay(true);
      }
    }, 150);

    preloadImages(getVisibleCategoryImageUrls(categoryId)).then(() => {
      if (transitionRequestRef.current !== requestId) return;

      window.clearTimeout(preparationTimeoutRef.current);
      setIsPreparingCategory(false);
      setShowPreparationOverlay(false);
      setCategoryTransition({ from: fromCategoryId, fromViewMode, to: categoryId, direction, requestId });

      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = window.setTimeout(() => {
        if (transitionRequestRef.current !== requestId) return;
        setVisibleCategoryId(categoryId);
        setCategoryTransition(null);
      }, CATEGORY_TRANSITION_MS);
    });
  };

  const showMoreForCategory = () => {
    if (!contentCategoryId || categoryTransition) return;
    const requestId = transitionRequestRef.current + 1;
    transitionRequestRef.current = requestId;
    window.clearTimeout(preparationTimeoutRef.current);
    setIsPreparingCategory(true);
    preparationTimeoutRef.current = window.setTimeout(() => {
      if (transitionRequestRef.current === requestId) {
        setShowPreparationOverlay(true);
      }
    }, 150);

    preloadImagesWithTimeout(getVisibleCategoryImageUrls(contentCategoryId, 'more')).then(() => {
      if (transitionRequestRef.current !== requestId) return;
      window.clearTimeout(preparationTimeoutRef.current);
      setIsPreparingCategory(false);
      setShowPreparationOverlay(false);
      setMoreCategoryId(contentCategoryId);
    }).catch((error) => {
      console.error('Error precargando más opciones', error);
      if (transitionRequestRef.current !== requestId) return;
      window.clearTimeout(preparationTimeoutRef.current);
      setIsPreparingCategory(false);
      setShowPreparationOverlay(false);
      setMoreCategoryId(contentCategoryId);
    });
  };

  const closeMoreForCategory = () => {
    if (!contentCategoryId || categoryTransition) return;
    transitionRequestRef.current += 1;
    window.clearTimeout(preparationTimeoutRef.current);
    setIsPreparingCategory(false);
    setShowPreparationOverlay(false);
    setMoreCategoryId('');
  };

  const renderCategoryContent = ({ isMoreView, featuredProduct, gridProducts, visibleCount, hasMore }) => (
    <div className={`category-view ${isMoreView ? 'category-view--more' : ''}`}>
      {!isMoreView && (
        <FeaturedProduct
          product={featuredProduct}
          productOptions={publicProductOptions}
          variantGroups={publicVariantGroups}
          onOpen={setSelectedProduct}
        />
      )}
      {(gridProducts.length > 0 || !featuredProduct || isMoreView) && (
        <ProductGrid
          products={gridProducts}
          productOptions={publicProductOptions}
          variantGroups={publicVariantGroups}
          visibleCount={visibleCount}
          onOpen={setSelectedProduct}
          onShowMore={showMoreForCategory}
          hasMore={hasMore}
          onBack={isMoreView ? closeMoreForCategory : undefined}
          backLabel="Volver"
          emptyTitle={isMoreView ? 'No hay más opciones disponibles' : undefined}
          emptyText={isMoreView ? 'Volvé a la categoría principal para ver los productos destacados.' : undefined}
        />
      )}
    </div>
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
            />
            {firebaseError && (
              <div className="sync-status sync-status--soft">No pudimos sincronizar Firebase. Revisá la conexión.</div>
            )}
            <section
              className={`category-content-stage ${categoryTransition ? 'is-transitioning' : ''} ${
                isPreparingCategory ? 'is-preparing' : ''
              }`}
              style={stageHeight ? { '--category-stage-height': `${stageHeight}px` } : undefined}
              aria-live="polite"
              ref={stageRef}
            >
              {showPreparationOverlay && <CategoryTransitionSkeleton />}
              {categoryTransition ? (
                <>
                  <div
                    className={`category-content-panel is-exiting is-${categoryTransition.direction}`}
                    key={`exit-${categoryTransition.from}-${categoryTransition.requestId}`}
                  >
                    {renderCategoryContent(getCategoryContent(categoryTransition.from, categoryTransition.fromViewMode))}
                  </div>
                  <div
                    className={`category-content-panel is-entering is-${categoryTransition.direction}`}
                    key={`enter-${categoryTransition.to}-${categoryTransition.requestId}`}
                  >
                    {renderCategoryContent(getCategoryContent(categoryTransition.to))}
                  </div>
                </>
              ) : (
                <div className="category-content-panel is-current" key={`current-${contentCategoryId}`} ref={currentPanelRef}>
                  {renderCategoryContent(content)}
                </div>
              )}
            </section>
            {settings.showFooter && <footer className="menu-footer">{settings.footerText}</footer>}
            <ProductDetailModal
              product={selectedProduct}
              products={activeProducts}
              productOptions={publicProductOptions}
              variantGroups={publicVariantGroups}
              onClose={() => setSelectedProduct(null)}
            />
          </>
        )}
      </main>
    </ThemeWrapper>
  );
}

function CategoryTransitionSkeleton() {
  return (
    <div className="category-transition-skeleton" aria-hidden="true">
      <span className="category-transition-skeleton__hero" />
      <span className="category-transition-skeleton__grid" />
      <span className="category-transition-skeleton__grid" />
      <span className="category-transition-skeleton__grid" />
    </div>
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
