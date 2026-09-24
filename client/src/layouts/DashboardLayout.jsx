import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FileQuestion,
  PackageSearch,
  Shield,
  FolderHeart,
  User,
  Settings,
  PlusCircle,
  Sparkles,
  Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const { user } = useAuth();

  const navLinks = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard, end: true },
    { name: 'My Lost Items', to: '/dashboard/lost', icon: FileQuestion },
    { name: 'My Found Items', to: '/dashboard/found', icon: PackageSearch },
    { name: 'My Claims', to: '/claims', icon: Shield },
    { name: 'SmartMatches', to: '/matches', icon: Sparkles },
    { name: 'Saved Bookmarks', to: '/dashboard/saved', icon: FolderHeart },
    { name: 'Profile & Settings', to: '/profile', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar (3 cols) */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            {/* User Mini Profile */}
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800 mb-6">
              <Link
                to="/profile"
                title="Update your profile picture"
                className="relative shrink-0 group"
              >
                {user?.avatar?.url ? (
                  <img
                    src={user.avatar.url}
                    alt={user.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-brand-500/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-extrabold text-lg flex items-center justify-center">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </span>
              </Link>
              <div className="overflow-hidden">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {user?.name}
                </h3>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 px-2 py-0.5 rounded-md">
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <NavLink
                to="/report/lost"
                className="p-2 text-center rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 transition-colors"
              >
                + Lost
              </NavLink>
              <NavLink
                to="/report/found"
                className="p-2 text-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-100 transition-colors"
              >
                + Found
              </NavLink>
            </div>

            {/* Nav list */}
            <nav className="space-y-1">
              {navLinks.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content (9 cols) */}
        <main className="lg:col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
