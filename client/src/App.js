import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { getCurrentUser } from './store/slices/authSlice';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import FlightDetails from './pages/FlightDetails';
import BookingForm from './pages/BookingForm';
import MyBookings from './pages/MyBookings';
import BookingDetails from './pages/BookingDetails';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';
import LoadingSpinner from './components/UI/LoadingSpinner';
import Dashboard from './pages/Dashboard';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    toast.error('Access denied. Admin privileges required.');
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const dispatch = useDispatch();
  const { token, loading, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (token && !loading && !isAuthenticated) {
      dispatch(getCurrentUser());
    }
    if (isAuthenticated && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
      navigate('/dashboard', { replace: true });
    }
  }, [dispatch, token, loading, isAuthenticated, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="flights/:id" element={<FlightDetails />} />
        {/* Protected Dashboard Route */}
        <Route path="dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        {/* Protected Routes */}
        <Route path="booking/:flightId" element={
          <ProtectedRoute>
            <BookingForm />
          </ProtectedRoute>
        } />
        
        <Route path="my-bookings" element={
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        } />
        
        <Route path="bookings/:id" element={
          <ProtectedRoute>
            <BookingDetails />
          </ProtectedRoute>
        } />
        
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="admin" element={
          <ProtectedRoute requireAdmin>
            <AdminPanel />
          </ProtectedRoute>
        } />
        
        {/*
        <Route path="admin/flights" element={
          <ProtectedRoute requireAdmin>
            <AdminFlights />
          </ProtectedRoute>
        } />
        <Route path="admin/bookings" element={
          <ProtectedRoute requireAdmin>
            <AdminBookings />
          </ProtectedRoute>
        } />
        <Route path="admin/users" element={
          <ProtectedRoute requireAdmin>
            <AdminUsers />
          </ProtectedRoute>
        } />
        */}
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App; 