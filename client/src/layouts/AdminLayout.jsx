import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  BarChart3,
  ArrowLeft,
  Tags
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user, isAdmin, isModerator } = useAuth();

  if (!isAdmin && !isModerator) {
    return <Navigate to="/dashboard" replace />;
  }

  const links = [
    { name: 'Analytics & Overview', to: '/admin', icon: LayoutDashboard, end: true },
    { name: 'User Management', to: '/admin/users', icon: Users },
    { name: 'Reports & Flagged Content', to: '/admin/reports', icon: AlertTriangle },
    { name: 'Categories', to: '/admin/categories', icon: Tags },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2 border border-indigo-200 dark:border-indigo-800">
            <Shield className="w-3.5 h-3.5" />
            <span>Platform Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Admin & Moderator Center
          </h1>
        </div>

        <NavLink
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit to User Dashboard
        </NavLink>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`
              }
            >
              <link.icon className="w-4 h-4" />
              {link.name}
            </NavLink>
          ))}
        </div>

        {/* Content Outlet */}
        <div className="lg:col-span-9">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
