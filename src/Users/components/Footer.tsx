// src/components/Footer.tsx
import React from 'react';
import '../../assets/Footer.css'; // Your existing CSS
import { useTranslation } from 'react-i18next'; // Import the hook
import { Link } from 'react-router-dom'; // Import Link for internal navigation

const Footer: React.FC = () => {
  const { t } = useTranslation(); // Initialize the hook

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-links">
          {/* Consider using <Link> from react-router-dom for internal navigation 
            to prevent full page reloads, e.g., <Link to="/about"> 
            If these are indeed internal app routes.
          */}
          <Link to="/about">{t('footerAbout', 'About')}</Link>
          <Link to="/customer-service">{t('footerCustomerService', 'Customer Service')}</Link>
          <Link to="/careers">{t('footerCareers', 'Careers')}</Link>
        </div>
        <p className="mt-4">
          &copy; {new Date().getFullYear()} {t('footerCopyrightNotice', 'Jehadov Store. All rights reserved.')}
        </p>
      </div>
    </footer>
  );
};

export default Footer;