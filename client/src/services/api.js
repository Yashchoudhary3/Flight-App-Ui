import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
};

export const flightsAPI = {
  getAll: (params) => api.get('/flights', { params }),
  getById: (id) => api.get(`/flights/${id}`),
  search: (searchParams) => api.get('/flights', { params: searchParams }),
  getPopularRoutes: () => api.get('/flights/popular/routes'),
  create: (flightData) => api.post('/flights', flightData),
  update: (id, flightData) => api.put(`/flights/${id}`),
  updateStatus: (id, status) => api.put(`/flights/${id}`, { status }),
};

export const bookingsAPI = {
  getMyBookings: () => api.get('/bookings/my-bookings'),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (bookingData) => api.post('/bookings', bookingData),
  cancel: (id) => api.post(`/bookings/${id}/cancel`),
  cancelBooking: (id) => api.post(`/bookings/${id}/cancel`),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  getAll: (params) => api.get('/bookings', { params }), // Admin only
  modifyBooking: (id, data) => api.patch(`/bookings/${id}`, data),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
};