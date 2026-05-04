import { Database, Eye, Image, Layers3, Moon, ShoppingBag, Sparkles, Sun } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { useSettings } from '../../hooks/useSettings';
import { seedDemoData } from '../../services/seedService';

export default function AdminDashboard() {
  const { items: categories } = useCategories();
  const { items: products } = useProducts();
  const { settings } = useSettings();
  const [feedback, setFeedback] = useState('');
  const [seeding, setSeeding] = useState(false);
  const featuredCount = products.filter((product) => product.featured).length;

  const seed = async () => {
    setSeeding(true);
    setFeedback('');
    try {
      await seedDemoData();
      setFeedback('Datos demo cargados en Firestore. Recargá las secciones para editarlos.');
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span>Resumen</span>
          <h1>Menú digital</h1>
        </div>
        <div className="admin-form-actions">
          <button className="admin-secondary-button" type="button" onClick={seed} disabled={seeding}>
            <Database size={18} /> {seeding ? 'Cargando...' : 'Cargar demo'}
          </button>
          <Link className="admin-secondary-button" to="/">
            <Eye size={18} /> Ver menú
          </Link>
        </div>
      </div>
      {feedback && <div className="admin-feedback">{feedback}</div>}
      <div className="admin-stats">
        <article><ShoppingBag /><strong>{products.length}</strong><span>Productos</span></article>
        <article><Layers3 /><strong>{categories.length}</strong><span>Categorías</span></article>
        <article><Sparkles /><strong>{featuredCount}</strong><span>Destacados</span></article>
        <article><Image /><strong>{settings.logoUrl ? 'Sí' : 'No'}</strong><span>Logo configurado</span></article>
        <article>{settings.themeMode === 'dark' ? <Moon /> : <Sun />}<strong>{settings.themeMode === 'dark' ? 'Oscuro' : 'Claro'}</strong><span>Modo actual</span></article>
      </div>
      <section className="admin-panel">
        <h2>Flujo recomendado</h2>
        <p>
          Entrá a <strong>Editar vista pública</strong>, elegí una categoría y cargá sus productos.
          Las opciones deslactosado y vegetal se editan dentro de cada producto y aparecen como íconos en el menú.
        </p>
        <Link className="admin-primary-button" to="/admin/menu">Editar vista pública</Link>
      </section>
    </div>
  );
}
