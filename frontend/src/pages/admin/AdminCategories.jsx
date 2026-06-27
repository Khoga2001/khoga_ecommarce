import React, { useEffect, useState } from 'react';
import { categoriesApi } from '../../api';
import { resolveImage } from '../../utils/format';
import { toast } from 'sonner';
import { Plus, Upload, X, Edit, Trash2 } from 'lucide-react';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // category being edited
  const [form, setForm] = useState({ title: '', handle: '', description: '', sort_order: 0 });

  const load = () => {
    setLoading(true);
    categoriesApi.list().then(r => setCategories(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', handle: '', description: '', sort_order: 0 });
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ title: cat.title, handle: cat.handle, description: cat.description || '', sort_order: cat.sort_order || 0 });
    setShowForm(true);
  };

  const onSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        handle: form.handle || slugify(form.title),
        description: form.description,
        sort_order: parseInt(form.sort_order, 10) || 0,
      };
      if (editing) {
        await categoriesApi.update(editing.id, payload);
        toast.success('Category updated');
      } else {
        await categoriesApi.create(payload);
        toast.success('Category created');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed');
    }
  };

  const onUpload = async (catId, file) => {
    if (!file) return;
    try {
      await categoriesApi.uploadImage(catId, file);
      toast.success('Image uploaded');
      load();
    } catch (err) {
      toast.error('Upload failed');
    }
  };

  const onDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.title}"?`)) return;
    try {
      await categoriesApi.delete(cat.id);
      toast.success('Category deleted');
      load();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div data-testid="admin-categories">
      <div className="admin-section-head">
        <h2>Categories</h2>
        <button onClick={openNew} className="btn-primary" data-testid="new-category-btn">
          <Plus size={16} /> New Category
        </button>
      </div>

      {showForm && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <div className="admin-section-head" style={{ marginBottom: 12 }}>
            <h3>{editing ? 'Edit Category' : 'New Category'}</h3>
            <button onClick={() => setShowForm(false)} className="icon-action"><X size={14} /></button>
          </div>
          <form onSubmit={onSave} className="form-grid">
            <label className="auth-label">Title
              <input className="auth-input" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} data-testid="cat-title" />
            </label>
            <label className="auth-label">Handle
              <input className="auth-input" placeholder={slugify(form.title)} value={form.handle} onChange={e => setForm(p => ({ ...p, handle: e.target.value }))} />
            </label>
            <label className="auth-label" style={{ gridColumn: '1 / -1' }}>Description
              <textarea className="auth-input" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </label>
            <label className="auth-label">Sort Order
              <input className="auth-input" type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))} />
            </label>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn-primary" data-testid="save-category-btn">Save</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="admin-loading">Loading…</div> : (
        <div className="cat-grid">
          {categories.map(c => (
            <div key={c.id} className="cat-tile" data-testid={`admin-cat-${c.handle}`}>
              <div className="cat-tile-img">
                {c.image ? <img src={resolveImage(c.image)} alt={c.title} /> : <div className="cat-tile-empty">No image</div>}
              </div>
              <div className="cat-tile-body">
                <h4>{c.title}</h4>
                <p className="cat-tile-handle">{c.handle}</p>
                <div className="cat-tile-actions">
                  <label className="icon-action">
                    <Upload size={14} />
                    <input type="file" accept="image/*" onChange={e => onUpload(c.id, e.target.files?.[0])} style={{ display: 'none' }} />
                  </label>
                  <button onClick={() => openEdit(c)} className="icon-action"><Edit size={14} /></button>
                  <button onClick={() => onDelete(c)} className="icon-action danger"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
