import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './app/layout';
import Login from './app/login/page';
import Register from './app/register/page';
import ResidentDashboard from './app/(dashboard)/resident/page';
import FeeList from './app/(dashboard)/list/fees/page';
import PaymentHistory from './app/(dashboard)/list/history/page';
import ResidentProfile from './app/(dashboard)/profile/page';
import AdminDashboard from './app/(dashboard)/admin/page';
import HouseholdManager from './app/(dashboard)/list/households/page';
import ResidentManager from './app/(dashboard)/list/residents/page';
import RequestManager from './app/(dashboard)/list/requests/page';
import FeeManager from './app/(dashboard)/admin/fees/page';
import InvoiceManager from './app/(dashboard)/list/invoices/page';
import RegistrationManager from './app/(dashboard)/list/registrations/page';
import ResidentRegistration from './app/(dashboard)/owner/page';
import ResidentVehicleRegistration from './app/(dashboard)/resident/vehicle-registration/page';
// Parking Management imports
import VehicleRegistrationManager from './app/(dashboard)/list/vehicle-registrations/page';
import VehicleManager from './app/(dashboard)/list/vehicles/page';
import AccessLogsManager from './app/(dashboard)/list/access-logs/page';
import FaceAccessPage from './app/(dashboard)/list/face-access/page';
import { User, Role } from './lib/types';
import { getCurrentUser, logout } from './lib/authService';

interface ProtectedRouteProps {
  user: User | null;
  allowedRoles: Role[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, allowedRoles, children }) => {
  if (!user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Đang tải...</div>;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={
            user ? (
              <Navigate to={user.role === Role.ADMIN ? "/admin" : "/resident"} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          <Route path="/login" element={
            user ? (
              <Navigate to={user.role === Role.ADMIN ? "/admin" : "/resident"} replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          } />
          <Route path="/register" element={<Register />} />

          {/* Resident Routes */}
          <Route
            path="/resident"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.RESIDENT]}>
                <ResidentDashboard user={user!} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/list/fees"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.RESIDENT]}>
                <FeeList user={user!} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/list/history"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.RESIDENT]}>
                <PaymentHistory user={user!} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.RESIDENT]}>
                <ResidentRegistration user={user!} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.RESIDENT]}>
                <ResidentProfile user={user!} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resident/vehicle-registration"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.RESIDENT]}>
                <ResidentVehicleRegistration user={user!} />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/list/households"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.ADMIN]}>
                <HouseholdManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/list/residents"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.ADMIN]}>
                <ResidentManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fees"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.ADMIN]}>
                <FeeManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/list/invoices"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.ADMIN]}>
                <InvoiceManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/list/registrations"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.ADMIN]}>
                <RegistrationManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/list/requests"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.ADMIN]}>
                <RequestManager />
              </ProtectedRoute>
            }
          />
          {/* Parking Management Routes */}
          <Route
            path="/list/vehicle-registrations"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.ADMIN]}>
                <VehicleRegistrationManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/list/vehicles"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.ADMIN]}>
                <VehicleManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/list/access-logs"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.ADMIN]}>
                <AccessLogsManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/list/face-access"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.ADMIN]}>
                <FaceAccessPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
