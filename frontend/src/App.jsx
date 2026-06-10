import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="app-container items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) {
    // If not allowed, redirect to correct dashboard
    return <Navigate to={user.role === 'admin' ? '/admin' : '/driver'} replace />;
  }
  return children;
};

const MainRouter = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="app-container items-center justify-center">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/driver'} replace /> : <Login />} />
      <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/driver" element={<ProtectedRoute allowedRole="driver"><DriverDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainRouter />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
