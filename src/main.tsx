import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client';
import './index.css'
import App from './App.tsx'
import { CartProvider } from './Users/pages/CartContext.tsx'
import React from 'react'
import './i18n'; // Import the i18n configuration
import { Suspense } from 'react'; // Import Suspense
// Optional: Add a loading fallback for Suspense
const loadingMarkup = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <h3>Loading translations...</h3>
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Suspense fallback={loadingMarkup}> {/* Wrap App with Suspense */}
      <StrictMode>
        <React.StrictMode>
          <CartProvider>  
            <App />
          </CartProvider>
        </React.StrictMode>
      </StrictMode>
    </Suspense>
  </React.StrictMode>
);


