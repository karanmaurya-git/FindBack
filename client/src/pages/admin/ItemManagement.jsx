import React, { useState, useEffect } from 'react';
import { Search, Trash2, ImageOff, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function ItemManagement() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      let url = '/admin/items?limit=50';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (typeFilter) url += `&type=${typeFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await api.get(url);
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? This also leaves any matches/claims that reference it pointing at a removed item. This cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/items/${item._id}`);
      toast.success('Item removed successfully');
      setItems((prev) => prev.filter((i) => i._id !== item._id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Reported Items</h2>
          <p className="text-xs text-slate-500">Search, filter, and remove lost/found listings</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="under_review">Under Review</option>
            <option value="potential_match">Potential Match</option>
            <option value="claimed">Claimed</option>
            <option value="approved">Approved</option>
            <option value="returned">Returned</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
          </select>
        </form>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">No items match these filters.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Item</th>
                <th className="p-3">Type</th>
                <th className="p-3">Category</th>
                <th className="p-3">Reporter</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      {item.images?.[0]?.url ? (
                        <img
                          src={item.images[0].url}
                          alt={item.name}
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <ImageOff className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-slate-400">{item.brand || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.type === 'lost'
                          ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-600'
                          : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600'
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{item.category?.name || '—'}</td>
                  <td className="p-3">
                    <p className="text-slate-700 dark:text-slate-300">{item.user?.name || 'Unknown'}</p>
                    <p className="text-[11px] text-slate-400">{item.user?.email}</p>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 capitalize">
                    {item.status?.replace('_', ' ')}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Link to={`/items/${item._id}`} target="_blank" title="View" className="text-slate-400 hover:text-brand-600">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      {isAdmin && (
                        <button onClick={() => handleDelete(item)} title="Delete" className="text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
