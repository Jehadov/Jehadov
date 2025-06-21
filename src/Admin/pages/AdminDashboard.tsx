// src/Admin/pages/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust path if needed
import {
    FaBoxOpen, 
    FaTags, 
    FaPuzzlePiece, 
    FaPlusCircle, 
    FaListAlt} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import "../../assets/admin.css"

// Define a simple type for summary items
interface SummaryItem {
  titleKey: string;
  titleFallback: string;
  count: number | string; // Can be number or '...' while loading
  icon: React.ReactElement;
  link?: string;
  bgColorClass: string;
  textColorClass: string;
}

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [productCount, setProductCount] = useState<number | string>('...');
  const [categoryCount, setCategoryCount] = useState<number | string>('...');
  const [addOnCount, setAddOnCount] = useState<number | string>('...');
  // Add more states for other counts like orders, users etc.

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        setProductCount(productsSnapshot.size);

        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        setCategoryCount(categoriesSnapshot.size);

        const addOnsSnapshot = await getDocs(collection(db, 'addOns'));
        setAddOnCount(addOnsSnapshot.size);

        // TODO: Fetch other counts like orders, users when those collections are ready
      } catch (error) {
        console.error("Error fetching counts for dashboard:", error);
        // Set counts to 'N/A' or 0 on error if preferred
        setProductCount('N/A');
        setCategoryCount('N/A');
        setAddOnCount('N/A');
      }
    };

    fetchCounts();
  }, []);

  const summaryItems: SummaryItem[] = [
    { titleKey: 'dashboard.summary.totalProducts', titleFallback: 'Total Products', count: productCount, icon: <FaBoxOpen size={30} />, link: '/admin/manage-products', bgColorClass: 'bg-primary', textColorClass: 'text-white' },
    { titleKey: 'dashboard.summary.totalCategories', titleFallback: 'Total Categories', count: categoryCount, icon: <FaTags size={30} />, link: '/admin/manage-categories', bgColorClass: 'bg-info', textColorClass: 'text-dark' },
    { titleKey: 'dashboard.summary.totalAddOns', titleFallback: 'Total Add-ons', count: addOnCount, icon: <FaPuzzlePiece size={30} />, link: '/admin/manage-addons', bgColorClass: 'bg-success', textColorClass: 'text-white' },
    // { titleKey: 'dashboard.summary.totalUsers', titleFallback: 'Total Users', count: '...', icon: <FaUsers size={30} />, link: '/admin/manage-users', bgColorClass: 'bg-warning', textColorClass: 'text-dark' }, // Example
  ];

  const quickActions = [
    { path: '/admin/manage-products', labelKey: 'dashboard.actions.manageProducts', labelFallback: 'Manage Products', icon: <FaListAlt size={24}/> },
    { path: '/admin/product/new', labelKey: 'dashboard.actions.addNewProduct', labelFallback: 'Add New Product', icon: <FaPlusCircle size={24}/> },
    { path: '/admin/manage-categories', labelKey: 'dashboard.actions.manageCategories', labelFallback: 'Manage Categories', icon: <FaTags size={24}/> },
    { path: '/admin/manage-addons', labelKey: 'dashboard.actions.manageAddOns', labelFallback: 'Manage Add-ons', icon: <FaPuzzlePiece size={24}/> },
  ];

  return (
    <div className="container-fluid mt-3"> {/* Changed to container-fluid for potentially wider layout */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">{t('dashboard.title', 'Admin Dashboard')}</h1>
        {/* Optional: Date range picker or other global controls could go here */}
      </div>

      {/* Summary Cards Row */}
      <div className="row g-3 mb-4">
        {summaryItems.map((item) => (
          <div className="col-md-6 col-xl-3" key={item.titleKey}>
            <div className={`card shadow-sm h-100 ${item.bgColorClass} ${item.textColorClass}`}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="card-title mb-0">{t(item.titleKey, item.titleFallback)}</h5>
                    <h2 className="fw-bold display-5 my-1">{item.count}</h2>
                  </div>
                  <div className="opacity-50">
                    {item.icon}
                  </div>
                </div>
                {item.link && (
                  <Link to={item.link} className={`stretched-link ${item.textColorClass === 'text-white' ? 'text-white' : 'text-dark'} text-decoration-none`}>
                    <small>{t('dashboard.viewDetails', 'View Details')} &rarr;</small>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Section */}
      <div className="mb-4">
        <h3 className="h4 mb-3">{t('dashboard.quickActionsTitle', 'Quick Actions')}</h3>
        <div className="row g-3">
          {quickActions.map((action) => (
            <div className="col-md-6 col-lg-4 col-xl-3" key={action.path}>
              <Link to={action.path} className="text-decoration-none">
                <div className="card card-body text-center h-100 shadow-hover lift"> {/* Custom classes for hover effect */}
                  <div className="mb-2 text-primary opacity-75" style={{fontSize: '2.5rem'}}>
                    {action.icon}
                  </div>
                  <h5 className="fw-medium">{t(action.labelKey, action.labelFallback)}</h5>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
      
      {/* Placeholder for more sections like Recent Orders, Charts, etc. */}
      {/* <div className="row mt-4">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header">{t('dashboard.recentOrdersTitle', 'Recent Orders')}</div>
            <div className="card-body">
              <p>{t('dashboard.recentOrdersPlaceholder', 'Recent orders will be displayed here...')}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-header">{t('dashboard.siteActivityTitle', 'Site Activity')}</div>
            <div className="card-body">
              <p>{t('dashboard.siteActivityPlaceholder', 'Activity charts or stats here...')}</p>
            </div>
          </div>
        </div>
      </div> 
      */}
    </div>
  );
};

export default AdminDashboard;