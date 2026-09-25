import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import RootLayout from './layouts/RootLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import NearbyItems from './pages/NearbyItems';
import Organizations from './pages/organization/Organizations';
import ItemDetails from './pages/items/ItemDetails';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Item Reports
import ReportLost from './pages/items/ReportLost';
import ReportFound from './pages/items/ReportFound';

// Features
import Matches from './pages/matches/Matches';
import Claims from './pages/claims/Claims';
import ClaimDetails from './pages/claims/ClaimDetails';
import Chat from './pages/messages/Chat';
import Profile from './pages/profile/Profile';

// Dashboard Views
import Dashboard from './pages/dashboard/Dashboard';
import MyLostItems from './pages/dashboard/MyLostItems';
import MyFoundItems from './pages/dashboard/MyFoundItems';
import SavedItems from './pages/dashboard/SavedItems';

// Admin Views
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ReportManagement from './pages/admin/ReportManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import ItemManagement from './pages/admin/ItemManagement';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="explore" element={<Explore />} />
        <Route path="nearby" element={<NearbyItems />} />
        <Route path="organizations" element={<Organizations />} />
        <Route path="items/:id" element={<ItemDetails />} />

        {/* Auth Routes */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />

        {/* Protected Item Reports */}
        <Route
          path="report/lost"
          element={
            <ProtectedRoute>
              <ReportLost />
            </ProtectedRoute>
          }
        />
        <Route
          path="report/found"
          element={
            <ProtectedRoute>
              <ReportFound />
            </ProtectedRoute>
          }
        />

        {/* Protected AI & Claims */}
        <Route
          path="matches"
          element={
            <ProtectedRoute>
              <Matches />
            </ProtectedRoute>
          }
        />
        <Route
          path="claims"
          element={
            <ProtectedRoute>
              <Claims />
            </ProtectedRoute>
          }
        />
        <Route
          path="claims/:id"
          element={
            <ProtectedRoute>
              <ClaimDetails />
            </ProtectedRoute>
          }
        />

        {/* Real-time Chat */}
        <Route
          path="messages"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="messages/:conversationId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* User Dashboard Nested Routes */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="lost" element={<MyLostItems />} />
          <Route path="found" element={<MyFoundItems />} />
          <Route path="saved" element={<SavedItems />} />
        </Route>

        {/* Profile Settings */}
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Admin Console Nested Routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'moderator']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="items" element={<ItemManagement />} />
          <Route path="reports" element={<ReportManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
        </Route>

        {/* 404 Fallback */}
        <Route
          path="*"
          element={
            <div className="py-24 text-center">
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">404</h2>
              <p className="text-slate-500 mb-6">Page not found</p>
              <a href="/" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm">
                Return Home
              </a>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}

