// src/components/Layout.tsx
import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';


interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = () => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />
        <main className="flex-fill">
          <div className="container my-4">
            <div className="row justify-content-center">
              <div className="">
                <div className="p-3 bg-white shadow rounded">
                  <Outlet />
                </div>
              </div>
            </div>
          </div>
        </main>

      <Footer />
    </div>   
  );
};

export default Layout;
