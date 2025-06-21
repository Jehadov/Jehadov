// src/components/Header.tsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../../assets/Header.css'; // Your existing CSS
import CartIcon from "./CartIcon";
import { FaArrowLeft } from 'react-icons/fa';
import LanguageSwitcher from './LanguageSwitcher'; // Assuming LanguageSwitcher.tsx is in the same folder
import { useTranslation } from 'react-i18next';


const Header: React.FC = () => {
  const { t } = useTranslation(); // Hook for translations
  const navigate = useNavigate();
  const location = useLocation();



  const handleGoBack = () => {
    navigate(-1);
  };

  const showBackButton = location.pathname !== '/';

  return (
    <header className="header">
      {/* Your existing primary header section */}
      <div className="header-container">
        <Link to="/" className="text-decoration-none" style={{ color: 'inherit' }}>
          <h2 className="logo mb-0">Jehadov_Store</h2> 
        </Link>
        <nav className="nav-links ms-md-auto">
          <Link to="/">{t('navHome', 'Home')}</Link> |
          <Link to="/about">{t('navAbout', 'About')}</Link> |
          <Link to="/careers">{t('navCareers', 'Careers')}</Link> |
          <Link to="/products/offers">{t('navOffers', 'Offers')}</Link>
        </nav>
      </div>

      {/* === UPDATED UTILITY NAVIGATION BAR === */}
      <nav className="navbar navbar-expand navbar-light bg-light py-2 border-top border-bottom">
        <div className="container-fluid">
          {/* Left Slot: Back Button */}
        
        {/* Back Button - Conditionally Rendered on the left */}
        {showBackButton && (
          <button
            onClick={handleGoBack}
            className="btn btn-link text-dark text-decoration-none p-0 me-3" // Simple link-style button
            title={t('goBackTooltip', 'Go Back')} // Added translatable tooltip
            style={{ color: 'inherit', fontSize: '1rem' }} 
          >
            <FaArrowLeft />
            <span className="ms-1 d-none d-md-inline">{t('goBack', 'Back')}</span>
          </button>
        )}



                    {/* Language Switcher - Placed before the cart icon */}
          <div className="me-2"> {/* Added margin for spacing */}
            <LanguageSwitcher />
          </div>



          {/* Right Slot: Cart Icon */}
          <div className='text-primary'> {/* Adjust min-width for alignment */}
            <CartIcon />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;