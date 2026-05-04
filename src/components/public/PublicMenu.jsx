import { useMemo, useState } from 'react';
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

export default function PublicMenu() {
  const { settings, usingDemo: settingsDemo } = useSettings();
  const { items: categories, loading: loadingCategories } = useCategories();
  const { items: products, loading: loadingProducts, usingDemo: productsDemo } = useProducts();
  const { items: variantGroups } = useVariantGroups();
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);

  const activeCategories = useMemo(() => categories.filter((category) => category.active), [categories]);
  const currentCategoryId = activeCategoryId || activeCategories[0]?.id;
  const activeProducts = useMemo(() => products.filter((product) => product.active), [products]);
  const categoryProducts = useMemo(
    () => activeProducts.filter((product) => product.categoryId === currentCategoryId),
    [activeProducts, currentCategoryId],
  );
  const featuredProduct = categoryProducts.find((product) => product.featured) || categoryProducts[0];
  const gridProducts = categoryProducts.filter((product) => product.id !== featuredProduct?.id);
  const loading = loadingCategories || loadingProducts;

  const selectCategory = (categoryId) => {
    setActiveCategoryId(categoryId);
    setVisibleCount(5);
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
        {(productsDemo || settingsDemo) && (
          <div className="demo-note">Vista demo activa hasta que cargues datos en Firebase.</div>
        )}
        {loading ? (
          <div className="loading-card">Cargando menú...</div>
        ) : (
          <>
            <FeaturedProduct product={featuredProduct} onOpen={setSelectedProduct} />
            <ProductGrid
              products={gridProducts}
              variantGroups={variantGroups}
              visibleCount={visibleCount}
              onOpen={setSelectedProduct}
              onShowMore={() => setVisibleCount((count) => count + 6)}
              hasMore={gridProducts.length > visibleCount}
            />
          </>
        )}
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
