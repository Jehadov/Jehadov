// src/Admin/Components/AdminLayout.tsx
import React from 'react';
import AdminHeader from './AdminHeader';
import AdminFooter from './AdminFooter';
import { Outlet } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <AdminHeader />
      <main className="flex-fill p-3" style={{ backgroundColor: '#f4f6f9' }}>
        <Outlet /> {/* This is where your admin page content will render */}
      </main>
      <AdminFooter />
    </div>
  );
};

export default AdminLayout;