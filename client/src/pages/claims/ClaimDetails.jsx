import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ArrowLeft,
  Calendar,
  MapPin,
  Lock,
  User,
  AlertTriangle,
  QrCode,
  ScanLine,
  Loader2,
  X
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ClaimDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);

  // QR handover state
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerStarting, setScannerStarting] = useState(false);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const fetchClaim = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/claims/${id}`);
      setClaim(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaim();
  }, [id]);

  // Make sure the camera is released if the user navigates away mid-scan
  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleReview = async (action) => {
    try {
      await api.put(`/claims/${id}/review`, { action });
      toast.success(`Claim ${action}d successfully`);
      fetchClaim();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleConfirmReturn = async () => {
    try {
      await api.put(`/claims/${id}/confirm-return`);
      toast.success('Return confirmation recorded');
      fetchClaim();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleShowQr = async () => {
    setLoadingQr(true);
    setQrCodeUrl(null);
    try {
      const res = await api.get(`/claims/${id}/qr-code`);
      setQrCodeUrl(res.data.qrCodeDataUrl);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingQr(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop();
        html5QrRef.current.clear();
      } catch {
        // scanner was already stopped
      }
      html5QrRef.current = null;
    }
    setShowScanner(false);
  };

  const handleOpenScanner = async () => {
    setShowScanner(true);
    setScannerStarting(true);
  };

  // Start the camera once the scanner container has actually rendered
  useEffect(() => {
    if (!showScanner) return;

    let cancelled = false;
    (async () => {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (cancelled || !scannerRef.current) return;

      const qr = new Html5Qrcode(scannerRef.current.id);
      html5QrRef.current = qr;

      try {
        await qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 220 },
          async (decodedText) => {
            await stopScanner();
            try {
              await api.post(`/claims/${id}/scan-qr`, { scannedData: decodedText });
              toast.success('Handover verified via QR scan!');
              fetchClaim();
            } catch (err) {
              toast.error(err.message);
            }
          },
          () => {} // ignore per-frame "no QR found" callbacks
        );
      } catch (err) {
        toast.error('Could not access camera. Please allow camera permission and try again.');
        setShowScanner(false);
      } finally {
        setScannerStarting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showScanner]);

  const handleStartChat = async () => {
    try {
      const otherUserId =
        claim.claimant._id === user._id ? claim.item.user._id : claim.claimant._id;

      const res = await api.post('/conversations', {
        recipientId: otherUserId,
        itemId: claim.item._id,
      });
      navigate(`/messages/${res.data._id}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <p className="text-slate-500 mb-4">Claim record not found or inaccessible.</p>
        <Link to="/claims" className="text-brand-600 font-semibold hover:underline">
          Return to Claims
        </Link>
      </div>
    );
  }

  const isReporter = user && claim.item.user._id === user._id;
  const isClaimant = user && claim.claimant._id === user._id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/claims')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Claims
      </button>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl shadow-brand-500/5 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-brand-600" />
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Claim Verification File
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Claim ID: #{claim._id} • Submitted {format(new Date(claim.createdAt), 'MMM dd, yyyy')}
            </p>
          </div>

          <StatusBadge status={claim.claimStatus} size="md" />
        </div>

        {/* Item Summary */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Target Item</span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {claim.item.name}
            </h3>
            <p className="text-xs text-slate-500">{claim.item.category?.name}</p>
          </div>
          <Link
            to={`/items/${claim.item._id}`}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            View Item Page →
          </Link>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400">Claimant</span>
            <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">
              {claim.claimant.name}
            </p>
            <p className="text-xs text-slate-500">
              {claim.claimant.isVerified ? '✓ Verified Account' : 'Standard Member'}
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400">Item Reporter</span>
            <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">
              {claim.item.user.name}
            </p>
            <p className="text-xs text-slate-500">
              {claim.item.user.isVerified ? '✓ Verified Account' : 'Standard Member'}
            </p>
          </div>
        </div>

        {/* Confidential Verification Answers */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Confidential Ownership Proof
            </h3>
          </div>

          <div className="space-y-3">
            {claim.verificationAnswers && claim.verificationAnswers.length > 0 ? (
              claim.verificationAnswers.map((va, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs space-y-1"
                >
                  <p className="font-bold text-emerald-900 dark:text-emerald-300">
                    Question: {va.question}
                  </p>
                  <p className="text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-emerald-100/80 dark:border-emerald-900/40 font-mono">
                    Answer: {va.answer || '(No answer provided)'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No answers logged.</p>
            )}
          </div>
        </div>

        {/* Handover Details */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 space-y-2 text-xs">
          <p className="font-bold uppercase tracking-wider text-slate-500">
            Handover Plan & Location
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            Method: <strong className="capitalize">{claim.handoverMethod?.replace('_', ' ')}</strong>
          </p>
          {claim.handoverLocation && (
            <p className="text-slate-700 dark:text-slate-300">
              Designated Spot: <strong>{claim.handoverLocation}</strong>
            </p>
          )}
        </div>

        {/* QR Handover — shown once the claim is approved */}
        {claim.claimStatus === 'approved' && (
          <div className="p-5 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/40 space-y-4">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-brand-600" />
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                In-Person QR Handover
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              When you meet in person, one of you shows your QR code and the other scans it with
              the button below. This proves you were both actually there, rather than just
              tapping a confirm button remotely.
            </p>

            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className={claim.confirmedByReporter ? 'text-emerald-600' : 'text-slate-400'}>
                {claim.confirmedByReporter ? '✓' : '○'} Reporter confirmed
              </span>
              <span className={claim.confirmedByClaimant ? 'text-emerald-600' : 'text-slate-400'}>
                {claim.confirmedByClaimant ? '✓' : '○'} Claimant confirmed
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleShowQr}
                disabled={loadingQr}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-900 text-brand-700 dark:text-brand-300 text-xs font-semibold hover:bg-brand-50 dark:hover:bg-brand-950/40 disabled:opacity-50"
              >
                {loadingQr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
                Show My QR Code
              </button>
              <button
                onClick={handleOpenScanner}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm"
              >
                <ScanLine className="w-3.5 h-3.5" />
                Scan Their QR Code
              </button>
            </div>

            {qrCodeUrl && (
              <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 w-fit">
                <img src={qrCodeUrl} alt="Handover QR code" className="w-48 h-48" />
                <p className="text-[11px] text-slate-400">Have the other person scan this</p>
              </div>
            )}

            {showScanner && (
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {scannerStarting ? 'Starting camera...' : 'Point your camera at their QR code'}
                  </p>
                  <button onClick={stopScanner} className="text-slate-400 hover:text-rose-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div id="qr-scanner-viewport" ref={scannerRef} className="w-full max-w-xs mx-auto rounded-xl overflow-hidden" />
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={handleStartChat}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Open Secure Chat
          </button>

          <div className="flex items-center gap-2">
            {isReporter && claim.claimStatus === 'pending' && (
              <>
                <button
                  onClick={() => handleReview('reject')}
                  className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  Reject Claim
                </button>
                <button
                  onClick={() => handleReview('approve')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                >
                  Approve Ownership & Arrange Handover
                </button>
              </>
            )}

            {claim.claimStatus === 'approved' && (
              <button
                onClick={handleConfirmReturn}
                title="Use this only if you can't scan a QR code"
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Manually (no scan)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
