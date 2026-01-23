import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Initialize auth state from localStorage
    initializeAuth: (state) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        state.isAuthenticated = true;
        state.token = token;
      }
      state.isLoading = false;
    },
    
    // Login action
    login: (state, action) => {
      const token = action.payload;
      localStorage.setItem('access_token', token);
      state.isAuthenticated = true;
      state.token = token;
    },
    
    // Logout action
    logout: (state) => {
      localStorage.removeItem('access_token');
      state.isAuthenticated = false;
      state.token = null;
    },
    
    // Set loading state
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { initializeAuth, login, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
