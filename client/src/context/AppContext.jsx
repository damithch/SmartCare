import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const AppContext = createContext(null);
const AUTH_STORAGE_KEY = 'smartcare.auth';

const roleLandingPage = {
  patient: 'patient-dashboard',
  doctor: 'doctor-dashboard',
  pharmacist: 'pharmacist-dashboard',
  student: 'profile'
};

export const getRoleLandingPage = (role) => roleLandingPage[String(role || '').toLowerCase()] || 'home';

export const getRoleLandingPath = (role) => {
  const page = getRoleLandingPage(role);
  return page === 'home' ? '/' : `/${page}`;
};

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  const fullName = user.fullName || user.name || 'User';

  return {
    ...user,
    id: user.id || user._id || '',
    name: fullName,
    fullName,
    avatar: user.avatar || '',
    coverImage: user.coverImage || ''
  };
};

const getStoredSession = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const session = JSON.parse(raw);
    return {
      ...session,
      user: normalizeUser(session.user)
    };
  } catch {
    return null;
  }
};

export const AppProvider = ({ children }) => {
  const storedSession = getStoredSession();
  const [user, setUser] = useState(storedSession?.user || null);
  const [token, setToken] = useState(storedSession?.token || null);
  const [socket, setSocket] = useState(null);
  
  const routerNavigate = useNavigate();
  const location = useLocation();
  
  const currentPage = location.pathname === '/' ? 'home' : location.pathname.substring(1);

  useEffect(() => {
    let newSocket = null;

    if (user && token) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
      
      const socketUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
      newSocket = io(socketUrl);
      
      newSocket.on('connect', () => {
        newSocket.emit('join-room', user.role); 
        newSocket.emit('join-room', user.id); 
      });

      newSocket.on('notification', (data) => {
        if (data.type === 'success') toast.success(data.message);
        else if (data.type === 'error') toast.error(data.message);
        else toast(data.message, { icon: '🔔' });
      });

      setSocket(newSocket);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [token, user]);

  const login = (session) => {
    const normalizedUser = normalizeUser(session.user);
    setUser(normalizedUser);
    setToken(session.token);
    routerNavigate(getRoleLandingPath(normalizedUser.role));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    routerNavigate('/');
  };

  const navigate = (page) => {
    if (page === 'home') {
      routerNavigate('/');
    } else {
      routerNavigate('/' + page.replace(/^\//, ''));
    }
  };

  const updateUser = (nextUser) => {
    setUser(normalizeUser(nextUser));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
        currentPage,
        navigate,
        socket
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
