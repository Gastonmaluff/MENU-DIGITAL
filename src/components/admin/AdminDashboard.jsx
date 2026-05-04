import { Database, Eye, Layers3, Palette, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { useVariantGroups } from '../../hooks/useVariantGroups';
import { seedDemoData } from '../../services/seedService';

export default function AdminDashboard() {
  const { items: categories } = useCategories();
  const { items: products } = useProducts();
  const { items: variants } = useVariantGroups();
  const [feedback, setFeedback] = useState('');
  const [seeding, setSeeding] = useState(false);

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
        <article><Palette /><strong>{variants.length}</strong><span>Grupos variantes</span></article>
      </div>
      <section className="admin-panel">
        <h2>Prioridad de edición</h2>
        <p>
          Cargá primero categorías y productos. Después asociá variantes, sugerencias y ajustá la apariencia
          para la tablet de barra.
        </p>
      </section>
    </div>
  );
}
