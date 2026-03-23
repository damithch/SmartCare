import React, { createContext, useContext, useEffect, useState } from 'react';

const AppContext = createContext(null);
const AUTH_STORAGE_KEY = 'smartcare.auth';

const roleLandingPage = {
  patient: 'patient-dashboard',
  doctor: 'doctor-dashboard',
  pharmacist: 'pharmacist-dashboard'
};

const getStoredSession = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AppProvider = ({ children }) => {
  const storedSession = getStoredSession();
  const [user, setUser] = useState(storedSession?.user || null);
  const [token, setToken] = useState(storedSession?.token || null);
  const [currentPage, setCurrentPage] = useState(
    storedSession?.user ? roleLandingPage[storedSession.user.role] || 'home' : 'home'
  );

  useEffect(() => {
    if (user && token) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
      return;
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [token, user]);

  const login = (session) => {
    setUser(session.user);
    setToken(session.token);
    setCurrentPage(roleLandingPage[session.user.role] || 'home');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setCurrentPage('home');
  };

  const navigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        currentPage,
        navigate
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }

  return context;
};
