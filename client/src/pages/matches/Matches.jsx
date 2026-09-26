import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Eye,
  X,
  CheckCircle2,
  Calendar,
  MapPin,
  AlertTriangle,
  Camera,
  ImageOff,
  MessageSquare
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const res = await api.get('/matches');
        setMatches(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const handleDismiss = async (matchId) => {
    try {
      await api.put(`/matches/${matchId}/dismiss`);
      setMatches((prev) => prev.filter((m) => m._id !== matchId));
      toast.success('Match dismissed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Works from EITHER side of the match: if you own the lost item, this
  // messages the found item's reporter, and vice versa — so both people
  // can start talking before any claim is ever submitted.
  const handleMessage = async (otherItem) => {
    if (!otherItem?.user?._id) {
      toast.error('Could not find that reporter');
      return;
    }
    try {
      const res = await api.post('/conversations', {
        recipientId: otherItem.user._id,
        itemId: otherItem._id,
      });
      navigate(`/messages/${res.data._id}`, { state: { conversation: res.data } });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2 border border-indigo-100 dark:border-indigo-900">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SmartMatch AI Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Potential Item Matches
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Our Gemini AI scans new lost and found reports to identify high-probability connections.
          </p>
        </div>

        {/* AI Disclaimer Alert */}
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 max-w-sm text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>AI matches are suggestions only. Human verification is required to confirm actual ownership.</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : matches.length > 0 ? (
        <div className="space-y-6">
          {matches.map((m) => {
            const lost = m.lostItem;
            const found = m.foundItem;
            if (!lost || !found) return null;

            // Whichever of the two items ISN'T yours is "their" side —
            // that's who you'd message or claim against. This works
            // correctly no matter which side of the match you're on.
            const iOwnLost = lost.user?._id === user?._id;
            const otherItem = iOwnLost ? found : lost;
            const otherLabel = iOwnLost ? 'Found' : 'Lost';

            return (
              <div
                key={m._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Top Match Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Potential Match Detected
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {m.visualAnalysisUsed && (
                      <div
                        title="The AI compared the actual photos, not just the text descriptions"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Photo Analyzed</span>
                      </div>
                    )}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs">
                      <span>{m.similarityScore}% Estimated Match</span>
                    </div>

                    <button
                      onClick={() => handleDismiss(m._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Dismiss this match"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Lost Item Card */}
                  <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold uppercase">
                        Lost Item
                      </span>
                      {lost.images?.[0]?.url ? (
                        <img
                          src={lost.images[0].url}
                          alt={lost.name}
                          className="w-12 h-12 rounded-lg object-cover border border-rose-200 dark:border-rose-900"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-rose-100 dark:bg-rose-950 flex items-center justify-center border border-rose-200 dark:border-rose-900">
                          <ImageOff className="w-4 h-4 text-rose-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                      {lost.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                      {lost.description}
                    </p>
                    <div className="text-[11px] text-slate-400 space-y-1">
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        {lost.location?.area || lost.location?.address || 'Area listed'}
                      </p>
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-rose-500" />
                        {lost.lostDate ? new Date(lost.lostDate).toLocaleDateString() : 'Date listed'}
                      </p>
                    </div>
                  </div>

                  {/* Found Item Card */}
                  <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase">
                        Found Item
                      </span>
                      {found.images?.[0]?.url ? (
                        <img
                          src={found.images[0].url}
                          alt={found.name}
                          className="w-12 h-12 rounded-lg object-cover border border-emerald-200 dark:border-emerald-900"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center border border-emerald-200 dark:border-emerald-900">
                          <ImageOff className="w-4 h-4 text-emerald-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                      {found.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                      {found.description}
                    </p>
                    <div className="text-[11px] text-slate-400 space-y-1">
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-500" />
                        {found.location?.area || found.location?.address || 'Area listed'}
                      </p>
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-500" />
                        {found.foundDate ? new Date(found.foundDate).toLocaleDateString() : 'Date listed'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Explanation Box */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 mb-6">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Why the AI Suggested This Match</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {m.aiExplanation}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <Link
                    to={`/items/${otherItem._id}`}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Inspect {otherLabel} Item
                  </Link>
                  <button
                    onClick={() => handleMessage(otherItem)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Message Reporter
                  </button>
                  {/* Only claimable when the OTHER item is a Found item —
                      if you own the Found item, there's nothing to claim
                      on the matching Lost report, so only messaging applies. */}
                  {iOwnLost && (
                    <Link
                      to={`/items/${otherItem._id}`}
                      className="px-5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Verify Ownership & Claim
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No SmartMatches Yet"
          description="When you report lost or found items, our AI continuously scans matching listings and will alert you here."
          actionLabel="Report an Item"
          actionLink="/report/lost"
        />
      )}
    </div>
  );
}
