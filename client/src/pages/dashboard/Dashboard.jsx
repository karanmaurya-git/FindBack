import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileQuestion,
  PackageSearch,
  Shield,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
    stats: { lostItems: 0, foundItems: 0, activeClaims: 0, returned: 0 },
    recentLost: [],
    recentFound: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users/dashboard-stats');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const { stats, recentLost, recentFound } = data;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-brand-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-brand-100 mt-1 max-w-lg">
            Track your lost items, review incoming claims, and check real-time AI matches.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            to="/report/lost"
            className="px-4 py-2.5 rounded-xl bg-white text-brand-600 font-bold text-xs shadow-md hover:bg-slate-100 transition-all"
          >
            + Report Lost
          </Link>
          <Link
            to="/report/found"
            className="px-4 py-2.5 rounded-xl bg-brand-700/80 hover:bg-brand-800 text-white font-bold text-xs shadow-md transition-all"
          >
            + Report Found
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
            <FileQuestion className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.lostItems}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Lost Items Reported</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <PackageSearch className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.foundItems}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Found Items Logged</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <Shield className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.activeClaims}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Active Claims</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.returned}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Successfully Returned</p>
        </div>
      </div>

      {/* Recent Lost Reports */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-rose-500" />
            Your Recent Lost Reports
          </h2>
          <Link
            to="/dashboard/lost"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentLost && recentLost.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {recentLost.map((item) => (
              <div key={item._id} className="py-3 flex items-center justify-between gap-4">
                <div className="overflow-hidden">
                  <Link
                    to={`/items/${item._id}`}
                    className="font-bold text-sm text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.location?.area || 'Location noted'} •{' '}
                    {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={item.status} size="sm" />
                  <Link
                    to={`/items/${item._id}`}
                    className="p-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">No lost items reported yet</p>
        )}
      </div>

      {/* Recent Found Reports */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PackageSearch className="w-4 h-4 text-emerald-500" />
            Your Recent Found Reports
          </h2>
          <Link
            to="/dashboard/found"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentFound && recentFound.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {recentFound.map((item) => (
              <div key={item._id} className="py-3 flex items-center justify-between gap-4">
                <div className="overflow-hidden">
                  <Link
                    to={`/items/${item._id}`}
                    className="font-bold text-sm text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.location?.area || 'Location noted'} •{' '}
                    {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={item.status} size="sm" />
                  <Link
                    to={`/items/${item._id}`}
                    className="p-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">No found items registered yet</p>
        )}
      </div>
    </div>
  );
}
