import {
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { categoryService } from '../../services/categoryService';
import { productService } from '../../services/productService';
import { resolveAssetUrl } from '../../utils/assets';
import { formatPrice, slugify } from '../../utils/format';
import ImageUploader from './ImageUploader';

const iconOptions = ['Coffee', 'Snowflake', 'Wheat', 'CakeSlice', 'Leaf', 'CupSoda'];

const emptyCategory = {
  name: '',
  slug: '',
  icon: 'Coffee',
  sortOrder: 1,
  active: true,
};

const emptyProduct = {
  name: '',
  categoryId: '',
  price: 0,
  shortDescription: '',
  description: '',
  imageUrl: '',
  featuredImageUrl: '',
  active: true,
  featured: false,
  sortOrder: 1,
  visualOptions: {
    lactoseFree: false,
    plantBased: false,
  },
  suggestedProductIds: [],
  variantGroupIds: [],
  tags: [],
};

export default function PublicViewEditor() {
  const { items: categories, syncing: syncingCategories, error: categoriesError, usingDemo: demoCategories, reload: reloadCategories } = useCategories();
  const { items: products, syncing: syncingProducts, error: productsError, usingDemo: demoProducts, reload: reloadProducts } = useProducts();
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const activeCategory = categories.find((category) => category.id === activeCategoryId) || categories[0];
  const categoryProducts = useMemo(
    () => products.filter((product) => product.categoryId === activeCategory?.id),
    [products, activeCategory?.id],
  );

  const saveCategory = async (payload) => {
    setSaving(true);
    setFeedback('');
    try {
      const data = {
        ...payload,
        slug: payload.slug || slugify(payload.name),
        sortOrder: Number(payload.sortOrder || 0),
      };
      if (payload.id) await categoryService.update(payload.id, data);
      else await categoryService.create(data);
      setEditingCategory(null);
      setFeedback('Categoría guardada.');
      await reloadCategories();
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveProduct = async (payload) => {
    setSaving(true);
    setFeedback('');
    try {
      const data = {
        ...payload,
        categoryId: payload.categoryId || activeCategory?.id,
        tags: [],
        variantGroupIds: [],
        suggestedProductIds: payload.suggestedProductIds || [],
      };
      if (payload.id) await productService.update(payload.id, data);
      else await productService.create(data);
      setEditingProduct(null);
      setFeedback('Producto guardado. La vista pública se actualizará automáticamente.');
      await reloadProducts();
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (category) => {
    if (!confirm(`Eliminar categoría "${category.name}"?`)) return;
    await categoryService.remove(category.id);
    await reloadCategories();
  };

  const removeProduct = async (product) => {
    if (!confirm(`Eliminar producto "${product.name}"?`)) return;
    await productService.remove(product.id);
    await reloadProducts();
  };

  return (
    <div className="admin-page editor-page">
      <div className="admin-page-header">
        <div>
          <span>Contenido</span>
          <h1>Editar vista pública</h1>
        </div>
        <button
          className="admin-primary-button"
          type="button"
          onClick={() => setEditingCategory({ ...emptyCategory, sortOrder: categories.length + 1 })}
        >
          <Plus size={18} /> Nueva categoría
        </button>
      </div>

      {(demoCategories || demoProducts) && (
        <div className="admin-warning">Estás viendo datos demo si Firestore está vacío. Al guardar, se persiste en Firebase.</div>
      )}
      {(syncingCategories || syncingProducts) && <div className="admin-inline-sync"><span /> Sincronizando contenido...</div>}
      {(categoriesError || productsError) && <div className="admin-error">{categoriesError || productsError}</div>}
      {feedback && <div className="admin-feedback">{feedback}</div>}

      <div className="editor-layout">
        <aside className="editor-categories admin-panel">
          <div className="editor-panel-title">
            <strong>Categorías</strong>
            <span>{categories.length} en total</span>
          </div>
          <div className="editor-category-list">
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={`editor-category-item ${category.id === activeCategory?.id ? 'is-active' : ''}`}
                onClick={() => setActiveCategoryId(category.id)}
              >
                <GripVertical size={15} />
                <span>{category.name}</span>
                {category.active ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            ))}
          </div>
        </aside>

        <section className="editor-main">
          {activeCategory && (
            <div className="admin-panel editor-toolbar">
              <div>
                <span>Categoría seleccionada</span>
                <h2>{activeCategory.name}</h2>
              </div>
              <div className="admin-actions">
                <button type="button" onClick={() => setEditingCategory(activeCategory)}><Edit3 size={17} /></button>
                <button type="button" onClick={() => removeCategory(activeCategory)}><Trash2 size={17} /></button>
              </div>
            </div>
          )}

          {editingCategory && (
            <CategoryEditor
              category={editingCategory}
              saving={saving}
              onCancel={() => setEditingCategory(null)}
              onSave={saveCategory}
            />
          )}

          {activeCategory && (
            <div className="admin-panel">
              <div className="editor-panel-title">
                <div>
                  <strong>Productos de {activeCategory.name}</strong>
                  <span>Editá imagen, precio, destacado y opciones visuales.</span>
                </div>
                <button
                  className="admin-primary-button"
                  type="button"
                  onClick={() =>
                    setEditingProduct({
                      ...emptyProduct,
                      categoryId: activeCategory.id,
                      sortOrder: categoryProducts.length + 1,
                    })
                  }
                >
                  <Plus size={18} /> Nuevo producto
                </button>
              </div>

              <div className="editor-product-list">
                {categoryProducts.map((product) => (
                  <article className="editor-product-row" key={product.id}>
                    <img src={resolveAssetUrl(product.imageUrl || '/assets/cappuccino.png')} alt={product.name} />
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.shortDescription || 'Sin subtítulo'} · {formatPrice(product.price)}</span>
                    </div>
                    {product.featured && <span className="admin-mini-badge editor-badge"><Sparkles size={14} /> destacado</span>}
                    <div className="admin-actions">
                      <button type="button" onClick={() => setEditingProduct(product)}><Edit3 size={17} /></button>
                      <button type="button" onClick={() => removeProduct(product)}><Trash2 size={17} /></button>
                    </div>
                  </article>
                ))}
                {categoryProducts.length === 0 && (
                  <div className="admin-empty-inline">Todavía no hay productos en esta categoría.</div>
                )}
              </div>
            </div>
          )}

          {editingProduct && (
            <ProductEditor
              product={editingProduct}
              saving={saving}
              onCancel={() => setEditingProduct(null)}
              onSave={saveProduct}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function CategoryEditor({ category, saving, onCancel, onSave }) {
  const [form, setForm] = useState(category);

  const submit = (event) => {
    event.preventDefault();
    onSave({ ...form, slug: form.slug || slugify(form.name) });
  };

  return (
    <form className="admin-panel admin-form compact-editor" onSubmit={submit}>
      <div className="editor-panel-title">
        <strong>{form.id ? 'Editar categoría' : 'Nueva categoría'}</strong>
      </div>
      <div className="form-grid">
        <label>Nombre<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Orden<input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} /></label>
        <label>Icono
          <select value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })}>
            {iconOptions.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
          </select>
        </label>
        <label>Slug<input value={form.slug || slugify(form.name)} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label>
      </div>
      <label className="admin-checkbox"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Visible en el menú</label>
      <div className="admin-form-actions">
        <button className="admin-secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="admin-primary-button" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar categoría'}</button>
      </div>
    </form>
  );
}

function ProductEditor({ product, saving, onCancel, onSave }) {
  const [form, setForm] = useState({
    ...product,
    visualOptions: {
      lactoseFree: Boolean(product.visualOptions?.lactoseFree || product.optionFlags?.deslactosado),
      plantBased: Boolean(product.visualOptions?.plantBased || product.optionFlags?.vegetal),
    },
  });

  const submit = (event) => {
    event.preventDefault();
    onSave(form);
  };

  const setVisualOption = (key, value) => {
    setForm({
      ...form,
      visualOptions: {
        ...form.visualOptions,
        [key]: value,
      },
    });
  };

  return (
    <form className="admin-panel admin-form product-editor-form" onSubmit={submit}>
      <div className="editor-panel-title">
        <div>
          <strong>{form.id ? `Editar ${form.name}` : 'Nuevo producto'}</strong>
          <span>Estos datos se reflejan en la vista pública.</span>
        </div>
      </div>
      <div className="form-grid">
        <label>Nombre<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Precio<input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
        <label>Orden<input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} /></label>
        <label>Subtítulo<input value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} /></label>
      </div>
      <label>Descripción<textarea value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      <div className="form-grid">
        <ImageUploader label="Imagen principal PNG/JPG" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
        <ImageUploader label="Imagen destacada opcional" value={form.featuredImageUrl} onChange={(url) => setForm({ ...form, featuredImageUrl: url })} />
      </div>
      <section className="editor-options-box">
        <div>
          <strong>Opciones visuales</strong>
          <span>Se muestran como íconos discretos en el menú público.</span>
        </div>
        <label className="admin-checkbox"><input type="checkbox" checked={form.visualOptions.lactoseFree} onChange={(event) => setVisualOption('lactoseFree', event.target.checked)} /> Deslactosado</label>
        <label className="admin-checkbox"><input type="checkbox" checked={form.visualOptions.plantBased} onChange={(event) => setVisualOption('plantBased', event.target.checked)} /> Vegetal</label>
      </section>
      <div className="admin-switch-row">
        <label className="admin-checkbox"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Visible</label>
        <label className="admin-checkbox"><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} /> Producto destacado</label>
      </div>
      <div className="admin-form-actions">
        <button className="admin-secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="admin-primary-button" type="submit" disabled={saving}>
          <CheckCircle2 size={18} /> {saving ? 'Guardando...' : 'Guardar producto'}
        </button>
      </div>
    </form>
  );
}
