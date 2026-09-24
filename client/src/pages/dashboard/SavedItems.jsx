import React, { useState, useEffect } from 'react';
import { Bookmark, FolderHeart } from 'lucide-react';
import api from '../../services/api';
import ItemCard from '../../components/items/ItemCard';
import EmptyState from '../../components/ui/EmptyState';
import { GridSkeleton } from '../../components/ui/LoadingSkeleton';

export default function SavedItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users/saved');
        setItems(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  const handleToggleSave = (itemId, isSaved) => {
    if (!isSaved) {
      setItems((prev) => prev.filter((i) => i._id !== itemId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Saved Items</h1>
        <p className="text-xs text-slate-500">Reports and items you bookmarked for tracking</p>
      </div>

      {loading ? (
        <GridSkeleton count={3} />
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ItemCard key={item._id} item={item} isSaved={true} onToggleSave={handleToggleSave} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderHeart}
          title="No Saved Items"
          description="Bookmark reports on the Explore or Item Details pages to follow their status updates."
          actionLabel="Explore Items"
          actionLink="/explore"
        />
      )}
    </div>
  );
}
