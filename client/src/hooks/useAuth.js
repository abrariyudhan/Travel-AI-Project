import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { initializeAuth, login as loginAction, logout as logoutAction } from '../store/authSlice';


export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  // Initialize auth on mount (seperti useEffect di AuthContext)
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Login function - API sama dengan AuthContext
  const login = (token) => {
    dispatch(loginAction(token));
  };

  // Logout function - API sama dengan AuthContext
  const logout = () => {
    dispatch(logoutAction());
    navigate('/login');
  };

  // Return object yang sama dengan AuthContext
  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
