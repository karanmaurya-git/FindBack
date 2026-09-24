import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  ShieldCheck,
  MapPin,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  Award,
  Users,
  CheckCircle2,
  FileQuestion,
  Lock
} from 'lucide-react';
import api from '../services/api';
import ItemCard from '../components/items/ItemCard';
import { GridSkeleton } from '../components/ui/LoadingSkeleton';

export default function Home() {
  const [recentLost, setRecentLost] = useState([]);
  const [recentFound, setRecentFound] = useState([]);
  const [stats, setStats] = useState({ totalReports: 142, foundItems: 68, itemsReturned: 54, activeUsers: 210 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [lostRes, foundRes] = await Promise.all([
          api.get('/items?type=lost&limit=4'),
          api.get('/items?type=found&limit=4'),
        ]);
        setRecentLost(lostRes.data || []);
        setRecentFound(foundRes.data || []);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchInput.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-brand-50/60 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Glow ambient blurs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-tr from-brand-400/20 to-indigo-500/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-spin" />
            <span>Next-Gen MERN Lost & Found Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            Find What Was <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">Lost</span>.{' '}
            Return What Was <span className="bg-gradient-to-r from-brand-600 to-emerald-500 bg-clip-text text-transparent">Found</span>.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            An AI-powered MERN platform with SmartMatch technology, helping people reconnect lost belongings with rightful owners securely and seamlessly.
          </p>

          {/* Hero Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-brand-500/5 p-2 mb-10 transition-all focus-within:ring-4 focus-within:ring-brand-500/20 focus-within:border-brand-500"
          >
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for an item: 'Lenovo laptop', 'car keys', 'brown wallet'..."
              className="w-full px-3 py-2 text-sm sm:text-base bg-transparent border-0 focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-all shrink-0 shadow-md shadow-brand-500/20"
            >
              Search
            </button>
          </form>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/report/lost"
              className="px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-all shadow-lg shadow-rose-600/20 hover:scale-105 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Report Lost Item
            </Link>
            <Link
              to="/report/found"
              className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20 hover:scale-105 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Report Found Item
            </Link>
            <Link
              to="/explore"
              className="px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              Explore Items
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. STATS BAR */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-black text-brand-600 dark:text-brand-400 mb-1">
                {stats.totalReports}+
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Total Reports
              </p>
            </div>
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
                {stats.foundItems}+
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Found Items
              </p>
            </div>
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400 mb-1">
                {stats.itemsReturned}+
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Items Reunited
              </p>
            </div>
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-black text-amber-500 mb-1">
                {stats.activeUsers}+
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Active Users
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="py-20 bg-slate-50/50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-2">
              Workflow Process
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              How FindBack Reconnects What Matters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xl mb-6 border border-rose-100 dark:border-rose-900">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Report Lost or Found
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Provide basic details, photos, approximate location, and identifying marks. Sensitive details like serial numbers remain strictly private.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl mb-6 border border-indigo-100 dark:border-indigo-900">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                SmartMatch AI Scans
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Gemini AI compares categories, locations, timestamps, and physical descriptions to automatically suggest high-probability candidate matches.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl mb-6 border border-emerald-100 dark:border-emerald-900">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Verify & Safe Handover
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Claimants provide private verification answers (such as wallpaper or keychains). After confirmation, coordinate handover at a secure campus office.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. RECENTLY LOST ITEMS */}
      <section className="py-16 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recently Lost Items</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">Help community members locate their misplaced belongings</p>
            </div>
            <Link
              to="/explore?type=lost"
              className="text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              View all lost
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <GridSkeleton count={4} />
          ) : recentLost.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentLost.map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-slate-400">No lost items reported yet</div>
          )}
        </div>
      </section>

      {/* 5. RECENTLY FOUND ITEMS */}
      <section className="py-16 bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recently Found Items</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">Check if someone found something that belongs to you</p>
            </div>
            <Link
              to="/explore?type=found"
              className="text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              View all found
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <GridSkeleton count={4} />
          ) : recentFound.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentFound.map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-slate-400">No found items registered yet</div>
          )}
        </div>
      </section>

      {/* 6. SMARTMATCH AI SHOWCASE */}
      <section className="py-20 bg-gradient-to-r from-brand-900 to-indigo-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-semibold mb-4 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-brand-300" />
                <span>SmartMatch AI Integration</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                AI that actively searches for your lost items.
              </h2>
              <p className="text-slate-300 text-base sm:text-lg mb-8 leading-relaxed">
                Rather than manually browsing thousands of postings, our Gemini AI compares reports across categories, locations, dates, and item attributes to notify both parties in real-time.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-200">
                    <strong className="text-white">Explainable AI:</strong> Detailed match reasons showing shared features (brand, colors, timestamps, geography).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-200">
                    <strong className="text-white">Non-Authoritative Safety:</strong> AI suggests potential matches; humans verify private proof of ownership.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-200">
                    <strong className="text-white">Immediate Alerts:</strong> Instant Socket.IO push notifications the moment a candidate report is logged.
                  </p>
                </div>
              </div>
            </div>

            {/* Mock SmartMatch Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-bold tracking-wide uppercase text-brand-200">
                    SmartMatch AI Report
                  </span>
                </div>
                <span className="text-lg font-black text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/30">
                  92% Match
                </span>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-xs uppercase text-slate-400 font-semibold mb-1">Items Compared</p>
                  <p className="text-sm font-bold text-white">Apple MacBook Pro 14" (Space Black)</p>
                  <p className="text-xs text-slate-300">Cafeteria Floor 3 • 2 days ago</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase text-slate-400 font-semibold">Matched Features</p>
                  <div className="text-xs space-y-1.5 text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> Same category & Apple ecosystem
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> Identical color description (Space Black in felt sleeve)
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> Proximity within 50 meters (Cafeteria Lounge)
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> Timestamp alignment within 30 minutes
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-slate-300 italic">
                    "AI matches are suggestions only. Ownership must be verified before safe handover."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SAFETY & PRIVACY PROMISE */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
              Privacy First Architecture
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Built to Protect Your Confidentiality
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Lock className="w-8 h-8 text-brand-600 mb-4" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Hidden Identifiers</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Private serial numbers, internal item marks, and wallpaper details are never published publicly.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mb-4" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Two-Way Handover</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Items are only marked returned once both finder and claimant confirm the handover was complete.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <MapPin className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Fuzzy Geolocation</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Locations are displayed as landmarks and neighborhood zones, never exact residential pinpoints.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION */}
      <section className="py-20 bg-brand-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Ready to find or return an item?
          </h2>
          <p className="text-lg text-brand-100 max-w-2xl mx-auto mb-10">
            Join thousands of students, professionals, and community members using FindBack today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-white text-brand-600 font-bold text-sm shadow-xl hover:bg-slate-100 transition-all hover:scale-105"
            >
              Get Started for Free
            </Link>
            <Link
              to="/explore"
              className="px-8 py-3.5 rounded-xl bg-brand-700/80 hover:bg-brand-800 text-white font-semibold text-sm transition-all"
            >
              Browse Active Reports
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
