import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ReportManagement() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports?status=all');
      setReports(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleReview = async (reportId, status) => {
    try {
      await api.put(`/reports/${reportId}`, { status });
      toast.success(`Report marked as ${status}`);
      fetchReports();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
      <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Flagged Content & Abuse Reports</h2>
        <p className="text-xs text-slate-500">Review suspicious listings, scams, or reported conduct</p>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((r) => (
            <div
              key={r._id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-600 uppercase tracking-wide">
                  Reason: {r.reason.replace('_', ' ')}
                </span>
                <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                  {r.status}
                </span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                "{r.description}"
              </p>
              <p className="text-[11px] text-slate-400">
                Reporter: {r.reporter?.name} ({r.reporter?.email})
              </p>

              {r.status === 'pending' && (
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleReview(r._id, 'dismissed')}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleReview(r._id, 'resolved')}
                    className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                  >
                    Resolve & Take Action
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-xs text-slate-400">No active abuse reports logged.</p>
      )}
    </div>
  );
}
