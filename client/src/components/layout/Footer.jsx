import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, ShieldCheck, Sparkles, MapPin, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                <Search className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white">
                FindBack
              </span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Find What Was Lost. Return What Was Found. An AI-powered MERN platform connecting lost belongings with their rightful owners safely.
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Powered by Google Gemini AI</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link to="/explore" className="hover:text-brand-600">All Listings</Link></li>
              <li><Link to="/explore?type=lost" className="hover:text-brand-600">Lost Items</Link></li>
              <li><Link to="/explore?type=found" className="hover:text-brand-600">Found Items</Link></li>
              <li><Link to="/matches" className="hover:text-brand-600">SmartMatch AI</Link></li>
              <li><Link to="/nearby" className="hover:text-brand-600">Nearby Map</Link></li>
            </ul>
          </div>

          {/* Verification & Safety */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Safety & Verification
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link to="/report/lost" className="hover:text-brand-600">Report Lost Item</Link></li>
              <li><Link to="/report/found" className="hover:text-brand-600">Report Found Item</Link></li>
              <li><Link to="/claims" className="hover:text-brand-600">Ownership Claims</Link></li>
              <li><Link to="/organizations" className="hover:text-brand-600">College & Campus Desks</Link></li>
            </ul>
          </div>

          {/* Safety Disclaimer */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Safety Guarantee
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We never disclose private contact numbers, exact home addresses, or private serial identifiers publicly. Always arrange item handovers at official security desks or well-lit public spots.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} FindBack. Complete MERN Stack AI Platform.</p>
          <p className="flex items-center gap-1">
            Built with modern MERN, Tailwind & Gemini AI
          </p>
        </div>
      </div>
    </footer>
  );
}
