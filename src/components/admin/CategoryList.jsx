import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { categoryService } from '../../services/categoryService';
import { slugify } from '../../utils/format';

const emptyCategory = { name: '', icon: 'Coffee', sortOrder: 1, active: true };

export default function CategoryList() {
  const { items, syncing, error, usingDemo, reload } = useCategories();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const save = async (payload) => {
    setSaving(true);
    setFeedback('');
    try {
      if (payload.id) await categoryService.update(payload.id, payload);
      else await categoryService.create(payload);
      setEditing(null);
      setFeedback('Categoría guardada.');
      await reload();
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category) => {
    if (!confirm(`Eliminar categoría "${category.name}"?`)) return;
    await categoryService.remove(category.id);
    reload();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><span>CRUD</span><h1>Categorías</h1></div>
        <button className="admin-primary-button" type="button" onClick={() => setEditing(emptyCategory)}>
          <Plus size={18} /> Nueva categoría
        </button>
      </div>
      {usingDemo && <div className="admin-warning">Estás viendo datos demo. Creá una categoría para guardar en Firestore.</div>}
      {syncing && <div className="admin-inline-sync"><span /> Sincronizando categorías...</div>}
      {error && <div className="admin-error">{error}</div>}
      {feedback && <div className="admin-feedback">{feedback}</div>}
      {editing && (
        <CategoryForm
          category={editing}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
      <section className="admin-list">
        {items.map((category) => (
          <article className="admin-list-item" key={category.id}>
            <div>
              <strong>{category.name}</strong>
              <span>{category.icon} · orden {category.sortOrder} · {category.active ? 'activa' : 'inactiva'}</span>
            </div>
            <div className="admin-actions">
              <button type="button" onClick={() => setEditing(category)}><Edit3 size={17} /></button>
              <button type="button" onClick={() => remove(category)}><Trash2 size={17} /></button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function CategoryForm({ category, saving, onCancel, onSave }) {
  const [form, setForm] = useState(category);

  const submit = (event) => {
    event.preventDefault();
    onSave({ ...form, slug: form.slug || slugify(form.name) });
  };

  return (
    <form className="admin-panel admin-form" onSubmit={submit}>
      <div className="form-grid">
        <label>Nombre<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Slug<input value={form.slug || slugify(form.name)} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label>
        <label>Icono<input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} placeholder="Coffee" /></label>
        <label>Orden<input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} /></label>
      </div>
      <label className="admin-checkbox"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Activa</label>
      <div className="admin-form-actions">
        <button className="admin-secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="admin-primary-button" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  );
}
