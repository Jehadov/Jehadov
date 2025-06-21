import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
    FaTachometerAlt, 
    FaBoxOpen, 
    FaTags, 
    FaPuzzlePiece, 
    FaSignOutAlt,
    FaBars 
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import LanguageSwitcher from '../../Users/components/LanguageSwitcher'; // Assuming path

const AdminHeader: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log('Logout action triggered');
    try {
      await signOut(auth);
      console.log('User signed out successfully.');
      navigate('/admin/login');
    } catch (error) {
      console.error('Error signing out: ', error);
      navigate('/admin/login');
    }
  };

  const adminNavLinks = [
    { path: '/admin/dashboard', labelKey: 'adminHeader.nav.dashboard', labelFallback: 'Dashboard', icon: <FaTachometerAlt className="me-2" /> },
    { path: '/admin/manage-products', labelKey: 'adminHeader.nav.products', labelFallback: 'Products', icon: <FaBoxOpen className="me-2" /> },
    { path: '/admin/manage-categories', labelKey: 'adminHeader.nav.categories', labelFallback: 'Categories', icon: <FaTags className="me-2" /> },
    { path: '/admin/manage-addons', labelKey: 'adminHeader.nav.addons', labelFallback: 'Add-ons', icon: <FaPuzzlePiece className="me-2" /> },
    { path: '/admin/manage-Offers', labelKey: 'adminHeader.nav.Offers', labelFallback: 'Offers', icon: <FaPuzzlePiece className="me-2" /> },
  ];
  
  return (
    <header className='sticky-top shadow-sm'>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <Link className="navbar-brand fw-bold" to="/admin">
            <FaTachometerAlt className="me-2"/>{t('adminHeader.brand', 'Jehadov Admin')}
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#adminNavbarContent"
            aria-controls="adminNavbarContent"
            aria-expanded="false"
            aria-label={t('adminHeader.toggleNav', 'Toggle navigation')}
          >
            <FaBars />
          </button>
          <div className="collapse navbar-collapse" id="adminNavbarContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {adminNavLinks.map((link) => (
                <li className="nav-item" key={link.path}>
                  <NavLink
                    className={({ isActive }) => isActive ? "nav-link active fw-medium" : "nav-link"}
                    to={link.path}
                  >
                    {link.icon}{t(link.labelKey, link.labelFallback)}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="d-flex align-items-center">
                <div className="me-2"> 
                    <LanguageSwitcher/>
                </div>
                <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                    <FaSignOutAlt className="me-1" />{t('adminHeader.buttons.logout', 'Logout')}
                </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default AdminHeader;
