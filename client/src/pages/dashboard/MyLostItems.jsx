import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, FileQuestion, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import ItemCard from '../../components/items/ItemCard';
import EmptyState from '../../components/ui/EmptyState';
import { GridSkeleton } from '../../components/ui/LoadingSkeleton';

export default function MyLostItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLost = async () => {
      setLoading(true);
      try {
        const res = await api.get('/items/my-items?type=lost');
        setItems(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLost();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Lost Reports</h1>
          <p className="text-xs text-slate-500">Items you reported as misplaced or lost</p>
        </div>
        <Link
          to="/report/lost"
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          Report Another Item
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
          icon={FileQuestion}
          title="No Lost Items Reported"
          description="If you misplaced a phone, laptop, keys or bag, log a report to let SmartMatch AI scan for matches."
          actionLabel="Report Lost Item"
          actionLink="/report/lost"
        />
      )}
    </div>
  );
}
