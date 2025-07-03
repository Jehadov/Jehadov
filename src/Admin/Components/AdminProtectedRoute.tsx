// src/Admin/Components/AdminProtectedRoute.tsx
import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import {  type User } from 'firebase/auth';
import { FaSpinner } from 'react-icons/fa';

const AdminProtectedRoute: React.FC = () => {
  const [currentUser, ] = useState<User | null>(null);
  const [checkingAuth, ] = useState(true);
  const location = useLocation();


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
