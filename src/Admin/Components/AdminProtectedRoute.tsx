// src/Admin/Components/AdminProtectedRoute.tsx
import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../firebase';
import { FaSpinner } from 'react-icons/fa';

const AdminProtectedRoute: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          if (idTokenResult.claims.admin) {
            setCurrentUser(user); // ✅ Set only if user is admin
          } else {
            console.warn("User is authenticated but not an admin. Redirecting.");
            setCurrentUser(null); // Treat as unauthorized
          }
        } catch (err) {
          console.error("Error checking token claims:", err);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setCheckingAuth(false); // ✅ Finish loading
    });

    return () => unsubscribe();
  }, []);

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <FaSpinner className="fa-spin fa-2x text-primary" />
        <span className="ms-2">Verifying access...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;
