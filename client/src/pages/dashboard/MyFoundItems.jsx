import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, PackageSearch } from 'lucide-react';
import api from '../../services/api';
import ItemCard from '../../components/items/ItemCard';
import EmptyState from '../../components/ui/EmptyState';
import { GridSkeleton } from '../../components/ui/LoadingSkeleton';

export default function MyFoundItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFound = async () => {
      setLoading(true);
      try {
        const res = await api.get('/items/my-items?type=found');
        setItems(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFound();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Found Reports</h1>
          <p className="text-xs text-slate-500">Items you recovered and submitted to help the owner</p>
        </div>
        <Link
          to="/report/found"
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          Log Found Item
        </Link>
      </div>

      {loading ? (
        <GridSkeleton count={3} />
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              showDelete
              onDelete={(id) => setItems((prev) => prev.filter((i) => i._id !== id))}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PackageSearch}
          title="No Found Items Logged"
          description="Did you spot misplaced headphones or a wallet? Log a found report to help reunite it."
          actionLabel="Log Found Item"
          actionLink="/report/found"
        />
      )}
    </div>
  );
}
