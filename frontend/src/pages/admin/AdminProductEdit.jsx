import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsApi, categoriesApi } from '../../api';
import { resolveImage } from '../../utils/format';
import { toast } from 'sonner';
import { Upload, X, Plus, Trash2 } from 'lucide-react';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function AdminProductEdit() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '', handle: '', description: '',
    price: 0, compare_price: '', collection: '',
    stock: 0, is_active: true, is_featured: false,
    variants: [], images: [],
  });
  const [productId, setProductId] = useState(null);

  useEffect(() => {
    categoriesApi.list().then(r => {
      setCategories(r.data || []);
      if (isNew && r.data?.length && !form.collection) {
        setForm(prev => ({ ...prev, collection: r.data[0].handle }));
      }
    });
    if (!isNew) {
      productsApi.get(id).then(r => {
        const p = r.data;
        setProductId(p.id);
        setForm({
          title: p.title, handle: p.handle, description: p.description || '',
          price: p.price, compare_price: p.compare_price ?? '', collection: p.collection,
          stock: p.stock || 0, is_active: p.is_active, is_featured: p.is_featured || false,
          variants: p.variants || [], images: p.images || [],
        });
      }).catch(() => toast.error('Product not found')).finally(() => setLoading(false));
    }
    // eslint-disable-next-line
  }, [id]);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        handle: form.handle || slugify(form.title),
        description: form.description,
        price: parseFloat(form.price),
        compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
        collection: form.collection,
        stock: parseInt(form.stock, 10) || 0,
        is_featured: form.is_featured,
        variants: form.variants,
      };
      let resp;
      if (isNew) {
        resp = await productsApi.create(payload);
        setProductId(resp.data.id);
        toast.success('Product created');
        navigate(`/admin/products/${resp.data.id}`, { replace: true });
      } else {
        await productsApi.update(productId, { ...payload, is_active: form.is_active });
        toast.success('Product updated');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !productId) return;
    setUploading(true);
    try {
      const r = await productsApi.uploadImage(productId, file);
      setForm(prev => ({ ...prev, images: r.data.images }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onRemoveImage = async (idx) => {
    if (!productId) return;
    try {
      const r = await productsApi.removeImage(productId, idx);
      setForm(prev => ({ ...prev, images: r.data.images }));
      toast.success('Image removed');
    } catch (err) {
      toast.error('Remove failed');
    }
  };

  const addVariant = () => setForm(prev => ({ ...prev, variants: [...prev.variants, { name: '', options: [''] }] }));
  const removeVariant = (i) => setForm(prev => ({ ...prev, variants: prev.variants.filter((_, idx) => idx !== i) }));
  const updateVariant = (i, key, val) => setForm(prev => ({ ...prev, variants: prev.variants.map((v, idx) => idx === i ? { ...v, [key]: val } : v) }));

  if (loading) return <div className="admin-loading">Loading product…</div>;

  return (
    <div data-testid="admin-product-edit">
      <div className="admin-section-head">
        <div>
          <Link to="/admin/products" style={{ fontSize: 13, color: '#6b6b6b' }}>← Back to Products</Link>
          <h2 style={{ marginTop: 6 }}>{isNew ? 'New Product' : 'Edit Product'}</h2>
        </div>
        <button onClick={onSave} disabled={saving} className="btn-primary" data-testid="save-product-btn">
          {saving ? 'Saving…' : 'Save Product'}
        </button>
      </div>

      <form className="admin-form-grid" onSubmit={onSave}>
        <div className="admin-form-main">
          <div className="admin-card">
            <label className="auth-label">Title
              <input className="auth-input" required value={form.title} onChange={e => update('title', e.target.value)} data-testid="product-title" />
            </label>
            <label className="auth-label">Handle (slug)
              <input className="auth-input" placeholder={slugify(form.title)} value={form.handle} onChange={e => update('handle', e.target.value)} data-testid="product-handle" />
            </label>
            <label className="auth-label">Description
              <textarea className="auth-input" rows={6} value={form.description} onChange={e => update('description', e.target.value)} />
            </label>
          </div>

          <div className="admin-card">
            <h3>Images</h3>
            {!productId && (
              <p style={{ color: '#999' }}>Save the product first to upload images.</p>
            )}
            <div className="admin-image-grid">
              {form.images.map((img, i) => (
                <div key={i} className="admin-image-item">
                  <img src={resolveImage(img)} alt={`product ${i + 1}`} />
                  <button type="button" onClick={() => onRemoveImage(i)} className="admin-image-remove" data-testid={`remove-image-${i}`}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              {productId && (
                <label className="admin-image-upload">
                  <Upload size={20} />
                  <span>{uploading ? 'Uploading…' : 'Upload'}</span>
                  <input type="file" accept="image/*" onChange={onUploadImage} disabled={uploading} style={{ display: 'none' }} data-testid="upload-image-input" />
                </label>
              )}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-section-head" style={{ paddingBottom: 12 }}>
              <h3>Variants</h3>
              <button type="button" onClick={addVariant} className="btn-outline" data-testid="add-variant-btn">
                <Plus size={14} /> Add Variant
              </button>
            </div>
            {form.variants.length === 0 && <p style={{ color: '#999' }}>No variants. Click "Add Variant" to add options like Size or Color.</p>}
            {form.variants.map((v, i) => (
              <div key={i} className="variant-edit-row">
                <input
                  className="auth-input"
                  placeholder="Name (e.g. Size)"
                  value={v.name}
                  onChange={e => updateVariant(i, 'name', e.target.value)}
                  style={{ maxWidth: 200 }}
                />
                <input
                  className="auth-input"
                  placeholder="Options (comma separated)"
                  value={(v.options || []).join(', ')}
                  onChange={e => updateVariant(i, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                />
                <button type="button" onClick={() => removeVariant(i)} className="icon-action danger">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <aside className="admin-form-side">
          <div className="admin-card">
            <h3>Pricing</h3>
            <label className="auth-label">Price (EGP)
              <input className="auth-input" type="number" step="0.01" required value={form.price} onChange={e => update('price', e.target.value)} data-testid="product-price" />
            </label>
            <label className="auth-label">Compare-at Price (optional)
              <input className="auth-input" type="number" step="0.01" value={form.compare_price} onChange={e => update('compare_price', e.target.value)} />
            </label>
          </div>

          <div className="admin-card">
            <h3>Inventory</h3>
            <label className="auth-label">Stock
              <input className="auth-input" type="number" required value={form.stock} onChange={e => update('stock', e.target.value)} data-testid="product-stock" />
            </label>
          </div>

          <div className="admin-card">
            <h3>Organization</h3>
            <label className="auth-label">Category
              <select className="auth-input" value={form.collection} onChange={e => update('collection', e.target.value)} required data-testid="product-category">
                <option value="">Select…</option>
                {categories.map(c => <option key={c.handle} value={c.handle}>{c.title}</option>)}
              </select>
            </label>
          </div>

          <div className="admin-card">
            <h3>Visibility</h3>
            <label className="checkbox-row">
              <input type="checkbox" checked={form.is_active} onChange={e => update('is_active', e.target.checked)} />
              <span>Active (visible to customers)</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={form.is_featured} onChange={e => update('is_featured', e.target.checked)} />
              <span>Featured</span>
            </label>
          </div>
        </aside>
      </form>
    </div>
  );
}
