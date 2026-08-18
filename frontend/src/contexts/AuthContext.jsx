import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  const getErrorMessage = (error, fallback) => {
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.status === 404) {
      return 'API not found. Backend URL may be missing /api — check VITE_API_URL.';
    }
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return 'Cannot reach server. Check backend is running and API URL is correct.';
    }
    return fallback;
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true, user: data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'Login failed') };
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true, user: data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'Registration failed') };
    }
  };

  const googleLogin = async (credential) => {
    try {
      const { data } = await api.post('/auth/google', { credential });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true, user: data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'Google login failed') };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  const value = {
    user,
    login,
    register,
    googleLogin,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
