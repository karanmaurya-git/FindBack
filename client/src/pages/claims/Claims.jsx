import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Inbox,
  Send
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Claims() {
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'submitted'
  const [claimsData, setClaimsData] = useState({ submitted: [], received: [] });
  const [loading, setLoading] = useState(true);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await api.get('/claims');
      setClaimsData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleReview = async (claimId, action) => {
    try {
      await api.put(`/claims/${claimId}/review`, { action });
      toast.success(`Claim ${action}d successfully`);
      fetchClaims();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleConfirmReturn = async (claimId) => {
    try {
      await api.put(`/claims/${claimId}/confirm-return`);
      toast.success('Return confirmed! Both parties must confirm to complete.');
      fetchClaims();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const currentList = activeTab === 'received' ? claimsData.received : claimsData.submitted;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2 border border-blue-100 dark:border-blue-900">
            <Shield className="w-3.5 h-3.5" />
            <span>Ownership Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Claims & Verification Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review ownership claims submitted on your reported items and monitor claims you filed.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'received'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Received Claims ({claimsData.received?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('submitted')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'submitted'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            My Submitted Claims ({claimsData.submitted?.length || 0})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : currentList && currentList.length > 0 ? (
        <div className="space-y-4">
          {currentList.map((claim) => (
            <div
              key={claim._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Claim ID: {claim._id.slice(-6)}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                    Item: {claim.item?.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {format(new Date(claim.createdAt), 'MMM dd, yyyy')}
                  </span>
                  <StatusBadge status={claim.claimStatus} />
                </div>
              </div>

              {/* Claimant info or Item info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850">
                  <p className="font-semibold text-slate-500 mb-1">Claim Statement:</p>
                  <p className="text-slate-700 dark:text-slate-300">
                    {claim.description || 'No additional statement provided.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850">
                  <p className="font-semibold text-slate-500 mb-1">Preferred Handover:</p>
                  <p className="text-slate-700 dark:text-slate-300 capitalize">
                    {claim.handoverMethod?.replace('_', ' ') || 'Campus Security Office'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Link
                  to={`/claims/${claim._id}`}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  View Full Verification Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {activeTab === 'received' && claim.claimStatus === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReview(claim._id, 'reject')}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      Reject Claim
                    </button>
                    <button
                      onClick={() => handleReview(claim._id, 'approve')}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                    >
                      Approve & Coordinate Return
                    </button>
                  </div>
                )}

                {claim.claimStatus === 'approved' && (
                  <button
                    onClick={() => handleConfirmReturn(claim._id)}
                    className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Item Handover
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Shield}
          title={activeTab === 'received' ? 'No Received Claims' : 'No Submitted Claims'}
          description={
            activeTab === 'received'
              ? 'When community members claim items you reported, you will review their secret answers here.'
              : 'You have not submitted ownership claims on any items yet.'
          }
          actionLabel="Explore Items"
          actionLink="/explore"
        />
      )}
    </div>
  );
}
