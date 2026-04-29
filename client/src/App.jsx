import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';

// Role-aware dashboard redirect
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.jsx';
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage.jsx';
import { TenantDashboardPage } from './pages/tenant/TenantDashboardPage.jsx';

// Admin pages
import { UsersPage } from './pages/admin/UsersPage.jsx';
import { BookingsAdminPage } from './pages/admin/BookingsAdminPage.jsx';
import { AuditLogPage } from './pages/admin/AuditLogPage.jsx';

// Owner pages
import { MyListingsPage } from './pages/owner/MyListingsPage.jsx';
import { ListingFormPage } from './pages/owner/ListingFormPage.jsx';
import { BookingRequestsPage } from './pages/owner/BookingRequestsPage.jsx';
import { CompletedBookingsPage } from './pages/owner/CompletedBookingsPage.jsx';

// Tenant pages
import { SearchPage } from './pages/tenant/SearchPage.jsx';
import { MyBookingsPage } from './pages/tenant/MyBookingsPage.jsx';

// Shared pages
import { PGDetailPage } from './pages/shared/PGDetailPage.jsx';
import { BookingDetailPage } from './pages/shared/BookingDetailPage.jsx';
import { PaymentPage } from './pages/shared/PaymentPage.jsx';
import { ChatPage } from './pages/shared/ChatPage.jsx';
import { ChatInboxPage } from './pages/shared/ChatInboxPage.jsx';
import { NotFoundPage } from './pages/shared/NotFoundPage.jsx';
import { ProfilePage } from './pages/shared/ProfilePage.jsx';

function GuestRoute({ children }) {
  const { status } = useAuth();
  if (status === 'loading') return null;
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  return children;
}

function RoleDashboard() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboardPage />;
  if (user?.role === 'owner') return <OwnerDashboardPage />;
  return <TenantDashboardPage />;
}

function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Dashboard — role-dispatched */}
      <Route path="/dashboard" element={<ProtectedRoute><RoleDashboard /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin/users" element={<ProtectedRoute><RoleRoute roles={['admin']}><UsersPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/admin/bookings" element={<ProtectedRoute><RoleRoute roles={['admin']}><BookingsAdminPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute><RoleRoute roles={['admin']}><AuditLogPage /></RoleRoute></ProtectedRoute>} />

      {/* Owner routes */}
      <Route path="/owner/listings" element={<ProtectedRoute><RoleRoute roles={['owner']}><MyListingsPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/owner/listings/new" element={<ProtectedRoute><RoleRoute roles={['owner']}><ListingFormPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/owner/listings/:id/edit" element={<ProtectedRoute><RoleRoute roles={['owner']}><ListingFormPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/owner/requests" element={<ProtectedRoute><RoleRoute roles={['owner']}><BookingRequestsPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/owner/completed" element={<ProtectedRoute><RoleRoute roles={['owner']}><CompletedBookingsPage /></RoleRoute></ProtectedRoute>} />

      {/* Tenant routes */}
      <Route path="/pgs" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
      <Route path="/pgs/:id" element={<ProtectedRoute><PGDetailPage /></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute><RoleRoute roles={['tenant']}><MyBookingsPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>} />
      <Route path="/bookings/:id/pay" element={<ProtectedRoute><RoleRoute roles={['tenant']}><PaymentPage /></RoleRoute></ProtectedRoute>} />

      {/* Shared */}
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/chat/inbox" element={<ProtectedRoute><ChatInboxPage /></ProtectedRoute>} />
      <Route path="/chat/:bookingId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
