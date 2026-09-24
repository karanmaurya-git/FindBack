import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Sun,
  Moon,
  Monitor,
  Bell,
  User,
  PlusCircle,
  Menu,
  X,
  Compass,
  Sparkles,
  MapPin,
  Shield,
  LogOut,
  FolderHeart,
  FileText,
  Building,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

export default function Navbar() {
  const { user, isAuthenticated, logout, isAdmin, isModerator } = useAuth();
  const { theme, setTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/explore?search=${encodeURIComponent(quickSearch.trim())}`);
      setQuickSearch('');
    }
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-brand-600 dark:from-white dark:to-brand-400 bg-clip-text text-transparent">
                FindBack
              </span>
              <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 -mt-1 tracking-wider uppercase">
                AI Lost & Found
              </span>
            </div>
          </Link>

          {/* Search Bar (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xs lg:max-w-sm relative items-center"
          >
            <Search className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search items, brands, keys..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:text-white transition-all placeholder:text-slate-400"
            />
          </form>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 text-sm font-medium">
            <Link
              to="/explore"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/explore'
                  ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400'
              }`}
            >
              <Compass className="w-4 h-4" />
              Explore
            </Link>

            <Link
              to="/explore?type=lost"
              className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              Lost Items
            </Link>

            <Link
              to="/explore?type=found"
              className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Found Items
            </Link>

            <Link
              to="/matches"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/matches'
                  ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              SmartMatch
            </Link>

            <Link
              to="/nearby"
              className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1"
            >
              <MapPin className="w-4 h-4" />
              Nearby
            </Link>
          </div>

          {/* Action Center: Theme, Notifications, Report, User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={cycleTheme}
              title={`Current theme: ${theme}. Click to switch.`}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'light' ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : theme === 'dark' ? (
                <Moon className="w-5 h-5 text-indigo-400" />
              ) : (
                <Monitor className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {/* Notification Bell */}
            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-3 z-50 overflow-hidden">
                    <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Notifications</h4>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 font-semibold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => {
                              if (!notif.isRead) markAsRead(notif._id);
                              if (notif.link) {
                                navigate(notif.link);
                                setNotifDropdownOpen(false);
                              }
                            }}
                            className={`p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                              !notif.isRead ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                            }`}
                          >
                            <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                              {notif.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Report Button */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Link
                to="/report/lost"
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Lost
              </Link>
              <Link
                to="/report/found"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Found
              </Link>
            </div>

            {/* User Menu / Auth Buttons */}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                >
                  {user?.avatar?.url ? (
                    <img
                      src={user.avatar.url}
                      alt={user.name}
                      className="w-8 h-8 rounded-lg object-cover ring-2 ring-brand-500/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400">
                        {user?.role}
                      </span>
                    </div>

                    <div className="py-1 text-sm text-slate-700 dark:text-slate-300">
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        Dashboard
                      </Link>
                      <Link
                        to="/dashboard/lost"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        My Reports
                      </Link>
                      <Link
                        to="/claims"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Shield className="w-4 h-4 text-slate-400" />
                        My Claims
                      </Link>
                      <Link
                        to="/dashboard/saved"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <FolderHeart className="w-4 h-4 text-slate-400" />
                        Saved Items
                      </Link>

                      {(isAdmin || isModerator) && (
                        <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                          <Link
                            to="/admin"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 font-medium"
                          >
                            <Shield className="w-4 h-4" />
                            Admin Console
                          </Link>
                        </div>
                      )}

                      <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                          }}
                          className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-600 rounded-xl transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-6 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl">
          <form onSubmit={handleSearchSubmit} className="relative mt-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </form>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link
              to="/report/lost"
              className="py-2.5 text-center rounded-xl bg-rose-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Report Lost
            </Link>
            <Link
              to="/report/found"
              className="py-2.5 text-center rounded-xl bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Report Found
            </Link>
          </div>

          <div className="space-y-1 pt-2 font-medium text-sm text-slate-700 dark:text-slate-300">
            <Link to="/explore" className="block px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900">
              🧭 Explore All Items
            </Link>
            <Link to="/explore?type=lost" className="block px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900">
              🔴 Lost Items
            </Link>
            <Link to="/explore?type=found" className="block px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900">
              🟢 Found Items
            </Link>
            <Link to="/matches" className="block px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900">
              ✨ SmartMatch AI
            </Link>
            <Link to="/nearby" className="block px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900">
              📍 Nearby Items
            </Link>
            <Link to="/organizations" className="block px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900">
              🏫 Campus & Hubs
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
