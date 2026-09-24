import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Award, Bookmark, Sparkles, ImageOff, X } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ItemCard({ item, isSaved = false, onToggleSave, showDelete = false, onDelete }) {
  const { isAuthenticated, user } = useAuth();
  const [saved, setSaved] = React.useState(isSaved);
  const [deleting, setDeleting] = React.useState(false);

  const isLost = item.type === 'lost';
  const displayImage = item.images && item.images.length > 0 ? item.images[0].url : null;
  const itemDate = item.lostDate || item.foundDate || item.createdAt;

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to bookmark items');
      return;
    }

    try {
      const res = await api.post(`/users/saved/${item._id}`);
      setSaved(res.data.saved);
      toast.success(res.message);
      if (onToggleSave) onToggleSave(item._id, res.data.saved);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Delete this ${isLost ? 'lost' : 'found'} report? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/items/${item._id}`);
      toast.success('Report deleted');
      if (onDelete) onDelete(item._id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Link
      to={`/items/${item._id}`}
      className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-1"
    >
      {/* Image Thumbnail Container */}
      <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
            <ImageOff className="w-8 h-8 opacity-60" />
            <span className="text-xs font-medium">No photo provided</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm ${
              isLost
                ? 'bg-rose-600 text-white shadow-rose-600/20'
                : 'bg-emerald-600 text-white shadow-emerald-600/20'
            }`}
          >
            {isLost ? 'Lost' : 'Found'}
          </span>
          <StatusBadge status={item.status} size="sm" />
        </div>

        {/* Top Right Action Buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {showDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete this report"
              className="p-2 rounded-full backdrop-blur-md shadow-sm bg-white/80 dark:bg-slate-900/80 text-rose-600 hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Save Bookmark button */}
          <button
            onClick={handleSave}
            title={saved ? 'Remove bookmark' : 'Save item'}
            className={`p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${
              saved
                ? 'bg-brand-600 text-white'
                : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Reward Tag */}
        {item.reward?.offered && item.reward?.amount > 0 && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/90 text-white text-xs font-semibold backdrop-blur-md shadow-sm">
            <Award className="w-3.5 h-3.5" />
            <span>Reward: ${item.reward.amount}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-md border border-brand-100 dark:border-brand-900">
            {item.category?.name || 'General'}
          </span>
          {itemDate && (
            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(itemDate), { addSuffix: true })}
            </span>
          )}
        </div>

        <h3 className="font-bold text-slate-900 dark:text-white text-lg line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {item.name}
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 mb-4 flex-1">
          {item.description}
        </p>

        {/* Footer Meta */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1 line-clamp-1 max-w-[180px]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{item.location?.area || item.location?.address || 'Location noted'}</span>
          </span>
          {item.brand && (
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {item.brand}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
