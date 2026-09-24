import React, { useState, useEffect } from 'react';
import { Building, MapPin, Users, Package, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Organizations() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchOrgs = async () => {
      setLoading(true);
      try {
        const res = await api.get('/organizations');
        setOrgs(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  const handleJoin = async (orgId) => {
    if (!isAuthenticated) {
      toast.error('Please login to join a campus hub');
      return;
    }
    try {
      const res = await api.post(`/organizations/${orgId}/join`);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-2 border border-brand-200 dark:border-brand-800">
          <Building className="w-3.5 h-3.5" />
          <span>Campus & Enterprise Hubs</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Organizations & Colleges
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Connect your account to your university, office park, or library lost & found desk.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orgs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orgs.map((org) => (
            <div
              key={org._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="capitalize text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {org.type}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {org.members?.length || 1} members
                  </span>
                </div>

                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-2">
                  {org.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  {org.description}
                </p>

                {org.location?.address && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mb-4">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{org.location.address}</span>
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleJoin(org._id)}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors"
                >
                  Join Hub
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-12 text-slate-400 text-xs">No organizations registered yet.</p>
      )}
    </div>
  );
}
