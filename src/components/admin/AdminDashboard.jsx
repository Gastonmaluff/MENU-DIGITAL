import { Coffee, CreditCard, Eye, Layers3, Moon, ShoppingBag, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { useSettings } from '../../hooks/useSettings';

export default function AdminDashboard() {
  const { items: categories } = useCategories();
  const { items: products } = useProducts();
  const { settings } = useSettings();

  return (
    <div className="admin-page">
      <div className="admin-page-header admin-page-header--dashboard">
        <div>
          <span>Resumen</span>
          <div className="admin-title-row">
            <h1>Menú digital</h1>
            <div className="admin-quick-actions" aria-label="Accesos rápidos">
              <Link className="admin-icon-button" to="/" title="Ver menú" aria-label="Ver menú">
                <Eye size={18} />
              </Link>
              <Link className="admin-icon-button" to="/barista" title="Panel barista" aria-label="Panel barista">
                <Coffee size={18} />
              </Link>
              <Link className="admin-icon-button" to="/cajera" title="Panel cajera" aria-label="Panel cajera">
                <CreditCard size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-stats admin-stats--dashboard">
        <article><ShoppingBag /><strong>{products.length}</strong><span>Productos</span></article>
        <article><Layers3 /><strong>{categories.length}</strong><span>Categorías</span></article>
        <article>{settings.themeMode === 'dark' ? <Moon /> : <Sun />}<strong>{settings.themeMode === 'dark' ? 'Oscuro' : 'Claro'}</strong><span>Modo actual</span></article>
      </div>
    </div>
  );
}
