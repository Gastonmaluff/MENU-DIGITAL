import { Eye, Layers3, Moon, ShoppingBag, Sun } from 'lucide-react';
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
            <h1>Menu digital</h1>
            <Link className="admin-secondary-button" to="/">
              <Eye size={18} /> Ver menu
            </Link>
          </div>
        </div>
      </div>

      <div className="admin-stats admin-stats--dashboard">
        <article><ShoppingBag /><strong>{products.length}</strong><span>Productos</span></article>
        <article><Layers3 /><strong>{categories.length}</strong><span>Categorias</span></article>
        <article>{settings.themeMode === 'dark' ? <Moon /> : <Sun />}<strong>{settings.themeMode === 'dark' ? 'Oscuro' : 'Claro'}</strong><span>Modo actual</span></article>
      </div>
    </div>
  );
}
