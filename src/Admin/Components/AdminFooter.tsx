// src/Admin/Components/AdminFooter.tsx
import React from 'react';
import { useTranslation } from 'react-i18next'; // Import useTranslation
// No custom CSS import needed if we stick to Bootstrap, unless you have specific footer styles

const AdminFooter: React.FC = () => {
  const { t } = useTranslation(); // Initialize the hook

  return (
    <footer className="bg-light text-center py-3 mt-auto border-top"> {/* Added border-top */}
      <div className="container"> {/* Added container for consistent padding/alignment */}
        <small className="text-muted"> {/* Made text muted */}
          &copy; {new Date().getFullYear()} {t('adminFooter.copyright', 'Jehadov Admin Panel. All rights reserved.')}
          {/* You could add a version number or other links here if desired */}
          {/* Example: <span className="ms-2">- Version 1.0.0</span> */}
        </small>
      </div>
    </footer>
  );
};

export default AdminFooter;