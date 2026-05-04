import { Edit3, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { useVariantGroups } from '../../hooks/useVariantGroups';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils/format';
import ImageUploader from './ImageUploader';

const emptyProduct = {
  name: '',
  categoryId: '',
  price: 0,
  shortDescription: '',
  description: '',
  imageUrl: '',
  featuredImageUrl: '',
  tags: [],
  active: true,
  featured: false,
  sortOrder: 1,
  variantGroupIds: [],
  suggestedProductIds: [],
};

export default function ProductList() {
  const { items: products, loading, error, usingDemo, reload } = useProducts();
  const { items: categories } = useCategories();
  const { items: variantGroups } = useVariantGroups();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const save = async (payload) => {
    setSaving(true);
    setFeedback('');
    try {
      if (payload.id) await productService.update(payload.id, payload);
      else await productService.create(payload);
      setEditing(null);
      setFeedback('Producto guardado.');
      await reload();
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (product) => {
    if (!confirm(`Eliminar producto "${product.name}"?`)) return;
    await productService.remove(product.id);
    reload();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><span>CRUD</span><h1>Productos</h1></div>
        <button className="admin-primary-button" type="button" onClick={() => setEditing({ ...emptyProduct, categoryId: categories[0]?.id || '' })}>
          <Plus size={18} /> Nuevo producto
        </button>
      </div>
      {usingDemo && <div className="admin-warning">Estás viendo productos demo. Al guardar un producto nuevo se cargará en Firestore.</div>}
      {error && <div className="admin-error">{error}</div>}
      {feedback && <div className="admin-feedback">{feedback}</div>}
      {editing && (
        <ProductForm
          product={editing}
          products={products}
          categories={categories}
          variantGroups={variantGroups}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
      <section className="admin-card-grid">
        {loading ? 'Cargando...' : products.map((product) => (
          <article className="admin-product-card" key={product.id}>
            {product.imageUrl && <img src={product.imageUrl} alt={product.name} />}
            <div>
              <strong>{product.name}</strong>
              <span>{categories.find((category) => category.id === product.categoryId)?.name || 'Sin categoría'}</span>
              <b>{formatPrice(product.price)}</b>
            </div>
            {product.featured && <span className="admin-mini-badge"><Star size={14} /> destacado</span>}
            <div className="admin-actions">
              <button type="button" onClick={() => setEditing(product)}><Edit3 size={17} /></button>
              <button type="button" onClick={() => remove(product)}><Trash2 size={17} /></button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function ProductForm({ product, products, categories, variantGroups, saving, onCancel, onSave }) {
  const [form, setForm] = useState({
    ...product,
    tags: Array.isArray(product.tags) ? product.tags.join(', ') : product.tags || '',
  });

  const toggleArray = (field, id) => {
    const list = form[field] || [];
    setForm({
      ...form,
      [field]: list.includes(id) ? list.filter((item) => item !== id) : [...list, id],
    });
  };

  const submit = (event) => {
    event.preventDefault();
    onSave(form);
  };

  return (
    <form className="admin-panel admin-form" onSubmit={submit}>
      <div className="form-grid">
        <label>Nombre<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Categoría<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required>
          <option value="">Seleccionar</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select></label>
        <label>Precio<input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
        <label>Orden<input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} /></label>
      </div>
      <label>Descripción corta<input value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} /></label>
      <label>Descripción completa<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      <label>Tags separados por coma<input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} /></label>
      <ImageUploader label="Imagen principal" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
      <ImageUploader label="Imagen destacada opcional" value={form.featuredImageUrl} onChange={(url) => setForm({ ...form, featuredImageUrl: url })} />
      <div className="admin-switch-row">
        <label className="admin-checkbox"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Activo</label>
        <label className="admin-checkbox"><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} /> Destacado</label>
      </div>
      <fieldset>
        <legend>Variantes asociadas</legend>
        <div className="admin-chip-list">
          {variantGroups.map((group) => (
            <label key={group.id}><input type="checkbox" checked={(form.variantGroupIds || []).includes(group.id)} onChange={() => toggleArray('variantGroupIds', group.id)} /> {group.name}</label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Productos sugeridos</legend>
        <div className="admin-chip-list">
          {products.filter((item) => item.id !== form.id).map((item) => (
            <label key={item.id}><input type="checkbox" checked={(form.suggestedProductIds || []).includes(item.id)} onChange={() => toggleArray('suggestedProductIds', item.id)} /> {item.name}</label>
          ))}
        </div>
      </fieldset>
      <div className="admin-form-actions">
        <button className="admin-secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="admin-primary-button" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar producto'}</button>
      </div>
    </form>
  );
}
