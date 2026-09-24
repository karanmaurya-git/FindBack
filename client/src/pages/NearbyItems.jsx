import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Compass, Sliders, ArrowRight } from 'lucide-react';
import api from '../services/api';
import ItemCard from '../components/items/ItemCard';
import EmptyState from '../components/ui/EmptyState';
import { GridSkeleton } from '../components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';

export default function NearbyItems() {
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [distance, setDistance] = useState(10); // 1, 5, 10, 25 km
  const [type, setType] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  // Auto detect location on mount
  useEffect(() => {
    handleDetectLocation();
  }, []);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setDetecting(false);
        toast.success('Location acquired');
      },
      (err) => {
        setDetecting(false);
        // Default to New York / Campus coordinates for demo purposes if permission denied
        setCoords({ latitude: 40.748817, longitude: -73.985130 });
        toast('Using campus demonstration coordinates (GPS permission not granted)');
      }
    );
  };

  useEffect(() => {
    if (!coords.latitude || !coords.longitude) return;

    const fetchNearby = async () => {
      setLoading(true);
      try {
        let url = `/items/nearby?latitude=${coords.latitude}&longitude=${coords.longitude}&maxDistance=${distance}`;
        if (type) url += `&type=${type}`;
        const res = await api.get(url);
        setItems(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNearby();
  }, [coords, distance, type]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-2 border border-brand-200 dark:border-brand-800">
            <MapPin className="w-3.5 h-3.5" />
            <span>Geospatial Radar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Lost & Found Items Near You
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover reports filed in your vicinity using GPS proximity filtering.
          </p>
        </div>

        {/* GPS location refresh button */}
        <button
          onClick={handleDetectLocation}
          disabled={detecting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all"
        >
          <Navigation className={`w-4 h-4 text-brand-600 ${detecting ? 'animate-spin' : ''}`} />
          {detecting ? 'Locating...' : 'Refresh My GPS Location'}
        </button>
      </div>

      {/* Distance and Type Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 mb-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Radius pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            Radius:
          </span>
          {[1, 5, 10, 25].map((km) => (
            <button
              key={km}
              onClick={() => setDistance(km)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                distance === km
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Within {km} km
            </button>
          ))}
        </div>

        {/* Type toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setType('')}
            className={`px-3 py-1 rounded-lg ${!type ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
          >
            All
          </button>
          <button
            onClick={() => setType('lost')}
            className={`px-3 py-1 rounded-lg ${type === 'lost' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'}`}
          >
            Lost Only
          </button>
          <button
            onClick={() => setType('found')}
            className={`px-3 py-1 rounded-lg ${type === 'found' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}
          >
            Found Only
          </button>
        </div>
      </div>

      {/* Results grid */}
      {loading ? (
        <GridSkeleton count={6} />
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ItemCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Compass}
          title="No Nearby Items Found"
          description={`No reports found within ${distance} km of your location. Try expanding the radius to 25 km.`}
          actionLabel="Expand Radius to 25km"
          actionLink="#"
        />
      )}
    </div>
  );
}
