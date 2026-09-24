import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { Plus, Pencil, Trash2, X, Tags, Package } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const emptyForm = { name: '', icon: 'Package', description: '', subcategories: '' };

// Renders a lucide-react icon by its string name, falling back to Package.
function DynamicIcon({ name, className }) {
  const IconComponent = Icons[name] || Package;
  return <IconComponent className={className} />;
}

export default function CategoryManagement() {
  const { isAdmin } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (cat) => {
    setFormData({
      name: cat.name,
      icon: cat.icon || 'Package',
      description: cat.description || '',
      subcategories: (cat.subcategories || []).join(', '),
    });
    setEditingId(cat._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      icon: formData.icon.trim() || 'Package',
      description: formData.description.trim(),
      subcategories: formData.subcategories
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    setSaving(true);
    try {
      if (editingId) {
        const res = await api.put(`/categories/${editingId}`, payload);
        setCategories((prev) => prev.map((c) => (c._id === editingId ? res.data : c)));
        toast.success('Category updated');
      } else {
        const res = await api.post('/categories', payload);
        setCategories((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success('Category created');
      }
      resetForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete "${cat.name}"? Items already using this category will keep a reference to a deleted category, so only remove categories that are no longer in use.`)) {
      return;
    }
    try {
      await api.delete(`/categories/${cat._id}`);
      setCategories((prev) => prev.filter((c) => c._id !== cat._id));
      toast.success('Category deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      const res = await api.put(`/categories/${cat._id}`, { isActive: !cat.isActive });
      setCategories((prev) => prev.map((c) => (c._id === cat._id ? res.data : c)));
      toast.success(cat.isActive ? 'Category deactivated' : 'Category activated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Tags className="w-5 h-5 text-brand-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Item Categories</h2>
            <p className="text-xs text-slate-500">Manage the categories users pick from when reporting items</p>
          </div>
        </div>

        {isAdmin && !showForm && (
          <button
            onClick={() => {
              setFormData(emptyForm);
              setEditingId(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-400">
          Only admins can add, edit, or delete categories. You're viewing this in read-only mode.
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && isAdmin && (
        <form
          onSubmit={handleSubmit}
          className="p-4 rounded-2xl border border-brand-200 dark:border-brand-900 bg-brand-50/50 dark:bg-brand-950/30 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {editingId ? 'Edit Category' : 'New Category'}
            </h3>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Musical Instruments"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Icon (lucide-react name)
              </label>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 shrink-0 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <DynamicIcon name={formData.icon} className="w-4 h-4 text-brand-600" />
                </div>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Package"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short description shown to users"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Subcategories (comma-separated)
              </label>
              <input
                type="text"
                value={formData.subcategories}
                onChange={(e) => setFormData({ ...formData, subcategories: e.target.value })}
                placeholder="e.g. Guitars, Keyboards, Drums"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Category'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Categories Table */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">No categories yet. Add the first one above.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3">Subcategories</th>
                <th className="p-3">Items</th>
                <th className="p-3">Status</th>
                {isAdmin && <th className="p-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-brand-50 dark:bg-brand-950/60 border border-brand-100 dark:border-brand-900 flex items-center justify-center">
                        <DynamicIcon name={cat.icon} className="w-4 h-4 text-brand-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{cat.name}</p>
                        {cat.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1">{cat.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">
                    {cat.subcategories && cat.subcategories.length > 0
                      ? cat.subcategories.slice(0, 3).join(', ') + (cat.subcategories.length > 3 ? '…' : '')
                      : '—'}
                  </td>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{cat.itemCount ?? 0}</td>
                  <td className="p-3">
                    <button
                      onClick={() => isAdmin && handleToggleActive(cat)}
                      disabled={!isAdmin}
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cat.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600'
                          : 'bg-rose-50 dark:bg-rose-950/80 text-rose-600'
                      } ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  {isAdmin && (
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => startEdit(cat)}
                          title="Edit"
                          className="text-slate-400 hover:text-brand-600"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          title="Delete"
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
