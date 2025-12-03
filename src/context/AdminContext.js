// context/AdminContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const router = useRouter();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    // Check admin authentication on mount and route change
    checkAdminAuth();
  }, [router.pathname]);

  const checkAdminAuth = () => {
    if (typeof window === 'undefined') return false;
    
    const authStatus = localStorage.getItem('adminAuthenticated');
    const loginTime = localStorage.getItem('adminLoginTime');
    
    if (authStatus === 'true' && loginTime) {
      // Optional: Check if session is expired (e.g., 8 hours)
      const loginDate = new Date(loginTime);
      const currentDate = new Date();
      const hoursDiff = (currentDate - loginDate) / (1000 * 60 * 60);
      
      if (hoursDiff > 8) { // Session expired after 8 hours
        logoutAdmin();
        return false;
      }
      
      setIsAdminAuthenticated(true);
      return true;
    }
    
    setIsAdminAuthenticated(false);
    return false;
  };

  const loginAdmin = (username, password) => {
    // Hardcoded credentials - use environment variables in production
    const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem('adminAuthenticated', 'true');
      localStorage.setItem('adminLoginTime', new Date().toISOString());
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminLoginTime');
    setIsAdminAuthenticated(false);
    router.push('/admin-login');
  };

  return (
    <AdminContext.Provider value={{
      isAdminAuthenticated,
      loginAdmin,
      logoutAdmin,
      checkAdminAuth
    }}>
      {children}
    </AdminContext.Provider>
  );
};