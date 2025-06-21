import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // FIX: Import the Link component for navigation
import { db } from '../../firebase'; // Adjust the path to your Firebase config
import { collection, getDocs } from 'firebase/firestore';
import type { Product } from '../../Users/pages/types';
import { FaDownload, FaUpload, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

// This component now requires the 'xlsx' library.
// You should add it to your project with: npm install xlsx
// Or include it via a script tag in your index.html:
// <script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>

const ExportImportProducts: React.FC = () => {
  // FIX: Removed state and refs related to importing, as that is now on a different page.
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleExport = async () => {
    setIsLoading(true);
    clearMessages();
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const products: Product[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

      // 1. Flatten the data into a spreadsheet-friendly format
      const flattenedData = products.flatMap(product => {
        if (!product.variants || product.variants.length === 0) {
          return [{
            product_id: product.id,
            product_name_en: product.name_en,
            variant_group_en: 'Default',
            option_value_en: 'Standard',
            price: product.price || 0,
            originalPrice: product.originalPrice || '',
            quantity: product.quantity || 0,
            imageUrl: product.image || ''
          }];
        }
        return product.variants.flatMap(group => 
          group.options.map(option => ({
            product_id: product.id,
            product_name_en: product.name_en,
            variant_group_en: group.name_en,
            option_value_en: option.value_en,
            price: option.price,
            originalPrice: option.originalPrice || '',
            quantity: option.quantity,
            imageUrl: option.imageUrl || ''
          }))
        );
      });

      // 2. Create an Excel worksheet and workbook
      // @ts-ignore (This assumes the xlsx library is available globally from a script tag)
      const ws = XLSX.utils.json_to_sheet(flattenedData);
      // @ts-ignore
      const wb = XLSX.utils.book_new();
      // @ts-ignore
      XLSX.utils.book_append_sheet(wb, ws, 'Products');

      // 3. Trigger the download of the .xlsx file
      // @ts-ignore
      XLSX.writeFile(wb, `products-export-${new Date().toISOString().split('T')[0]}.xlsx`);

      setSuccessMessage("Products exported successfully!");
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export products.');
    } finally {
      setIsLoading(false);
    }
  };

  // FIX: The handleImport function has been removed from this component.

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-light">
        <h5 className="mb-0">Export / Import Product Variants</h5>
      </div>
      <div className="card-body">
        <p className="card-text text-muted small">
          Export product variants as an Excel file to make bulk edits. To import data, please use the dedicated import tool.
        </p>
        <div className="d-flex gap-2">
          {/* FIX: The "Import" button is now a Link that navigates to the import page */}
          <Link to="/admin/import" className="btn btn-success">
            <FaUpload className="me-2" />
            Go to Import Tool
          </Link>

          <button className="btn btn-primary" onClick={handleExport} disabled={isLoading}>
            <FaDownload className="me-2" />
            Export to Excel
          </button>
        </div>
         {isLoading && (
            <div className="d-flex align-items-center text-primary mt-3">
                <FaSpinner className="fa-spin me-2" />
                <span>Processing... Please wait.</span>
            </div>
        )}
        {error && (
            <div className="alert alert-danger d-flex align-items-center mt-3" role="alert">
                <FaExclamationTriangle className="me-2" />
                {error}
            </div>
        )}
        {successMessage && (
            <div className="alert alert-success mt-3">{successMessage}</div>
        )}
      </div>
    </div>
  );
};

export default ExportImportProducts;
