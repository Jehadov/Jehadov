import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import i18n configuration
import './i18n'; 

// Import Layouts
import Layout from './Users/components/Layout';
import AdminLayout from './Admin/Components/AdminLayout';

// Import Context Providers
import { CartProvider } from './Users/pages/CartContext'; 

// Import User Pages
import Home from './Users/pages/Home';
import About from './Users/pages/About';
import CustomerService from './Users/pages/CustomerService';
import Careers from './Users/pages/Careers';
import RequestItem from './Users/pages/RequestItem';
import Cart from './Users/pages/Cart';
import CheckoutStepper from './Users/pages/CheckoutStepper';
import SearchResultsPage from './Users/components/SearchResultsPage'; // Assuming it's in pages

// Import Admin Pages & Protected Route
import AdminLogin from './Admin/pages/AdminLogin';
//import AdminProtectedRoute from './Admin/Components/AdminProtectedRoute';
import AdminDashboard from './Admin/pages/AdminDashboard';
import ManageProducts from './Admin/pages/ManageProducts';
import ManageCategory from './Admin/pages/ManageCategory';
import ProductEditor from './Admin/pages/ProductEditor';
import ManageAddOns from './Admin/pages/manageAddOns'; 

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import ManageOffers from './Admin/pages/ManageOffers';
import OfferForm from './Admin/pages/OfferForm';
import ProductDetails from './Users/pages/ProductDetails';
// Import any global custom CSS if you have one, e.g., App.css or index.css

const LoadingTranslationsFallback: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', backgroundColor: '#f8f9fa' }}>
    Loading Page... 
  </div>
);

const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingTranslationsFallback />}>
      <CartProvider>
        <Router>
          <Routes>
            {/* User Layout and Pages */}
            <Route path="/" element={<Layout children={undefined} />}> {/* Simplified Layout usage */}
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="customer-service" element={<CustomerService />} />
              <Route path="careers" element={<Careers />} />
              <Route path="request-item" element={<RequestItem />} />
              <Route path="product/:id" element={<ProductDetails />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<CheckoutStepper />} />
              <Route path="search" element={<SearchResultsPage />} />
              {/* <Route path="*" element={<UserNotFoundPage />} /> */}
            </Route>

            {/* Admin Login Route (this route is public) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Admin Routes */}
            {/* <Route element={<AdminProtectedRoute />}> */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="manage-products" element={<ManageProducts />} />
                <Route path="manage-categories" element={<ManageCategory />} />
                <Route path="product/new" element={<ProductEditor />} />
                <Route path="product/edit/:id" element={<ProductEditor />} />
                <Route path="manage-addons" element={<ManageAddOns />} />
                <Route path="manage-Offers" element={<ManageOffers />} />
                <Route path="offer/new" element={<OfferForm />} />
                <Route path="offer/edit/id" element={<OfferForm />} />
                {/* Routes for managing defined offers */}
                {/* <Route path="*" element={<Navigate to="/admin/dashboard" replace />} /> */}
              </Route>
            {/* </Route> */}
            
            {/* <Route path="*" element={<GlobalNotFoundPage />} /> */}
          </Routes>
        </Router>
      </CartProvider>
    </Suspense>
  );
};

export default App;
