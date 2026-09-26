import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  Award,
  Shield,
  MessageSquare,
  Bookmark,
  Flag,
  Share2,
  CheckCircle2,
  ArrowLeft,
  Lock,
  Sparkles,
  Info,
  ImageOff
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [item, setItem] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [saved, setSaved] = useState(false);

  // Claim Modal
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimData, setClaimData] = useState({
    description: '',
    q1: '', // Private detail e.g. wallpaper / keychain
    q2: '', // Identifying scratch / inside contents
    handoverMethod: 'organization_office',
    handoverLocation: '',
  });
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Abuse Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('fake_listing');
  const [reportDesc, setReportDesc] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/items/${id}`);
        setItem(res.data.item);
        setTimeline(res.data.timeline || []);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to bookmark items');
      return;
    }
    try {
      const res = await api.post(`/users/saved/${item._id}`);
      setSaved(res.data.saved);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to message the reporter');
      navigate('/login');
      return;
    }

    if (item.user._id === user._id) {
      toast.error('You cannot message yourself');
      return;
    }

    try {
      const res = await api.post('/conversations', {
        recipientId: item.user._id,
        itemId: item._id,
      });
      navigate(`/messages/${res.data._id}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to submit an ownership claim');
      return;
    }

    setSubmittingClaim(true);
    try {
      const verificationAnswers = [
        { question: 'What is inside or attached to this item that is not in the photo?', answer: claimData.q1 },
        { question: 'What private identifying detail can you provide?', answer: claimData.q2 },
      ];

      const res = await api.post('/claims', {
        itemId: item._id,
        description: claimData.description,
        verificationAnswers,
        handoverMethod: claimData.handoverMethod,
        handoverLocation: claimData.handoverLocation,
      });

      toast.success('Ownership claim submitted! The reporter will review your verification details.');
      setClaimModalOpen(false);
      setItem((prev) => ({ ...prev, status: 'claimed' }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleReportAbuse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reports', {
        reportedItemId: item._id,
        reportedUserId: item.user._id,
        reason: reportReason,
        description: reportDesc,
      });
      toast.success('Abuse report submitted. Platform moderators will review this listing.');
      setReportModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Item Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">This listing may have been removed or resolved.</p>
        <Link to="/explore" className="text-brand-600 font-semibold text-sm hover:underline">
          Return to Explore
        </Link>
      </div>
    );
  }

  const isOwner = user && user._id === item.user._id;
  const isLost = item.type === 'lost';
  const itemDate = item.lostDate || item.foundDate || item.createdAt;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Listings
      </button>

      {/* Main Grid: Images + Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left: Image Gallery (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative w-full h-80 sm:h-[420px] rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center">
            {item.images && item.images.length > 0 ? (
              <img
                src={item.images[activeImage]?.url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <ImageOff className="w-12 h-12 stroke-1" />
                <span className="text-xs font-medium">No photo provided</span>
              </div>
            )}

            <div className="absolute top-4 left-4 flex gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                  isLost ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {isLost ? 'Lost Item' : 'Found Item'}
              </span>
              <StatusBadge status={item.status} size="md" />
            </div>
          </div>

          {/* Thumbnails */}
          {item.images && item.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {item.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImage === idx
                      ? 'border-brand-600 shadow-md'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Item Details & Primary Actions (7 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                {item.category?.name || 'General'}
              </span>
              {item.brand && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {item.brand}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 dark:text-white leading-tight">
              {item.name}
            </h1>

            {/* Date and Location Pills */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-600" />
                {itemDate ? format(new Date(itemDate), 'MMMM dd, yyyy') : 'Date not specified'}
              </span>
              {item.approximateTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-600" />
                  {item.approximateTime}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-600" />
                {item.location?.area || item.location?.address || 'Vicinity listed'}
              </span>
            </div>
          </div>

          {/* Reward Callout */}
          {item.reward?.offered && item.reward?.amount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-amber-900 dark:text-amber-200">
                    Reward Offered by Reporter
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {item.reward.description || 'Awarded upon verified safe return'}
                  </p>
                </div>
              </div>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                ${item.reward.amount}
              </span>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Description
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {/* Identifying Features */}
          {item.identifyingFeatures && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                Distinct Characteristics
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {item.identifyingFeatures}
              </p>
            </div>
          )}

          {/* Current Custody / Possession */}
          {item.currentPossession && (
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Current Custody: <strong>{item.currentPossession}</strong></span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {!isOwner ? (
              <div className={`grid grid-cols-1 ${!isLost ? 'sm:grid-cols-2' : ''} gap-3`}>
                {/* Only Found items can be claimed — there's nothing to
                    hand over on a Lost item report, so claiming one makes
                    no sense. In that case, messaging is the only action. */}
                {!isLost && (
                  <button
                    onClick={() => setClaimModalOpen(true)}
                    disabled={item.status === 'returned' || item.status === 'closed'}
                    className="py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Shield className="w-4 h-4" />
                    I Think This Is Mine
                  </button>
                )}

                <button
                  onClick={handleStartChat}
                  className="py-3 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contact Reporter
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900 text-xs text-brand-700 dark:text-brand-300 font-medium">
                You created this report. You can review submitted claims in your Dashboard.
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleToggleSave}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 flex items-center gap-1.5"
              >
                <Bookmark className="w-4 h-4" />
                {saved ? 'Saved' : 'Save for Later'}
              </button>

              <button
                onClick={() => setReportModalOpen(true)}
                className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1.5"
              >
                <Flag className="w-4 h-4" />
                Report Listing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Item Activity Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-600" />
          Item Activity Timeline
        </h3>

        {timeline.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {timeline.map((act) => (
              <div key={act._id} className="relative text-xs">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-brand-600 ring-4 ring-white dark:ring-slate-900" />
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-slate-900 dark:text-white capitalize">
                    {act.action.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {format(new Date(act.createdAt), 'MMM dd, hh:mm a')}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">{act.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Initial report filed. No further activities recorded.</p>
        )}
      </div>

      {/* CLAIM SUBMISSION MODAL */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Submit Ownership Claim
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Provide private verification details that only the genuine owner would know.
              </p>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  General Claim Statement
                </label>
                <textarea
                  rows={2}
                  required
                  value={claimData.description}
                  onChange={(e) => setClaimData({ ...claimData, description: e.target.value })}
                  placeholder="Explain why you believe this is your item..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Secret Identifying Detail 1 <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-500" /> Private
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={claimData.q1}
                  onChange={(e) => setClaimData({ ...claimData, q1: e.target.value })}
                  placeholder="e.g. Phone wallpaper, contents inside wallet, engraved initials..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Secret Identifying Detail 2 (Optional)
                </label>
                <input
                  type="text"
                  value={claimData.q2}
                  onChange={(e) => setClaimData({ ...claimData, q2: e.target.value })}
                  placeholder="e.g. Exact receipt date, private stickers, scratches..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Safe Handover Method
                </label>
                <select
                  value={claimData.handoverMethod}
                  onChange={(e) => setClaimData({ ...claimData, handoverMethod: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="organization_office">College / Campus Security Office</option>
                  <option value="public_meeting">Public Meeting Point (Coffee shop / library)</option>
                  <option value="moderator_assisted">Platform Moderator-Assisted</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm disabled:opacity-50"
                >
                  {submittingClaim ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT ABUSE MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Report Listing</h3>
            <form onSubmit={handleReportAbuse} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="fake_listing">Fake or Suspicious Listing</option>
                  <option value="spam">Spam / Duplicate Posting</option>
                  <option value="fraud">Fraud / Extortion</option>
                  <option value="harassment">Harassment</option>
                  <option value="inappropriate_content">Inappropriate Content</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Details</label>
                <textarea
                  rows={3}
                  required
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Provide context for moderators..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-xl"
                >
                  Submit Abuse Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
