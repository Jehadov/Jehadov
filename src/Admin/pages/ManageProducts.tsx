import React, { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
    type Product, 
    defaultProduct,
    type Variant, 
    type VariantOption,
    type Category, // Import Category type
    defaultOption as defaultVariantOption
} from '../../Users/pages/types'; // Adjust path as needed
import ProductsTable from './ProductsTable';
import ExportImportProducts from './ExportImportProducts'; // Assuming this component exists
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSpinner } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

// transformFirebaseDataToProduct function (ensure this is the latest version from previous updates)
const transformFirebaseDataToProduct = (docId: string, dataFromFirebase: any): Product => {
    const rawData = dataFromFirebase || {};
    let productVariants: Variant[] = [];

    if (rawData.variants && Array.isArray(rawData.variants) && rawData.variants.length > 0) {
        productVariants = rawData.variants.map((variantGroup: any) => ({
            name_en: String(variantGroup.name_en || variantGroup.name || 'Default Type'),
            name_ar: String(variantGroup.name_ar || ''),
            options: Array.isArray(variantGroup.options) && variantGroup.options.length > 0
                     ? variantGroup.options.map((option: any) => ({
                        value_en: String(option.value_en || option.value || 'N/A'), value_ar: String(option.value_ar || ''),
                        price: Number(option.price) || 0, quantity: Number(option.quantity) || 0,
                        imageUrl: String(option.imageUrl || defaultVariantOption.imageUrl || ''),
                        unitLabel_en: String(option.unitLabel_en || option.unitLabel || defaultVariantOption.unitLabel_en || ''),
                        unitLabel_ar: String(option.unitLabel_ar || defaultVariantOption.unitLabel_ar || ''),
                        originalPrice: typeof option.originalPrice === 'number' ? Number(option.originalPrice) : (Number(option.price) || 0), // Ensure originalPrice
                     } as VariantOption))
                     : [{ ...defaultVariantOption, originalPrice: defaultVariantOption.price, value_en: 'Standard Option', value_ar: 'خيار قياسي' }],
        }));
    } else if (rawData.types && typeof rawData.types === 'object' && Object.keys(rawData.types).length > 0) {
        console.warn(`Product ID ${docId}: Old 'types' structure found. Converting to 'variants' array.`);
        const options: VariantOption[] = Object.entries(rawData.types).map(([key, typeValue]: [string, any]) => {
            const currentPrice = Number(typeValue.price) || 0;
            return {
                value_en: String(typeValue.value || key), value_ar: String(typeValue.value_ar || ''),
                price: currentPrice,
                originalPrice: typeof typeValue.originalPrice === 'number' ? Number(typeValue.originalPrice) : currentPrice,
                quantity: Number(typeValue.quantity) || 0,
                imageUrl: String(typeValue.imageUrl || defaultVariantOption.imageUrl || ''),
                unitLabel_en: String(typeValue.unitLabel_en || typeValue.unitLabel || defaultVariantOption.unitLabel_en || ''),
                unitLabel_ar: String(typeValue.unitLabel_ar || defaultVariantOption.unitLabel_ar || ''),
            };
        });
        if (options.length > 0) productVariants = [{ name_en: "Available Options", name_ar: "الخيارات المتاحة", options }];
    }

    if (productVariants.length === 0 || productVariants.every(vg => !vg.options || vg.options.length === 0)) {
        const fallbackImage = rawData.image || defaultVariantOption.imageUrl || '';
        const fallbackPrice = rawData.price !== undefined ? Number(rawData.price) : defaultVariantOption.price;
        const fallbackQuantity = rawData.quantity !== undefined ? Number(rawData.quantity) : defaultVariantOption.quantity;
        productVariants = [{ 
            name_en: "Standard", name_ar: "قياسي",
            options: [{ 
                ...defaultVariantOption, 
                value_en: 'Standard', value_ar: 'قياسي', 
                price: fallbackPrice, 
                originalPrice: fallbackPrice, 
                quantity: fallbackQuantity, 
                imageUrl: fallbackImage,
            }]
        }];
    }
    
    return {
        ...defaultProduct, ...rawData, id: docId,
        name_en: String(rawData.name_en || rawData.name || 'Unnamed Product'),
        name_ar: String(rawData.name_ar || ''),
        name_lowercase: String(rawData.name_en || rawData.name || '').toLowerCase(),
        name_ar_lowercase: String(rawData.name_ar || '').toLowerCase(),
        category: Array.isArray(rawData.category) ? rawData.category.map(String) : defaultProduct.category,
        shortDescription_en: String(rawData.shortDescription_en || rawData.shortDescription || ''),
        shortDescription_ar: String(rawData.shortDescription_ar || ''),
        longDescription_en: String(rawData.longDescription_en || rawData.longDescription || ''),
        longDescription_ar: String(rawData.longDescription_ar || ''),
        variants: productVariants,
        optionalAddOnIds: Array.isArray(rawData.optionalAddOnIds) ? rawData.optionalAddOnIds.map(String) : defaultProduct.optionalAddOnIds,
        isOffer: rawData.isOffer === undefined ? defaultProduct.isOffer : !!rawData.isOffer,
        image: String(rawData.image || defaultProduct.image || ''),
        manufacturedAt: rawData.manufacturedAt || defaultProduct.manufacturedAt,
        expiration: rawData.expiration || defaultProduct.expiration,
    } as Product;
};

const ManageProducts: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const productsPromise = getDocs(collection(db, 'products'));
      const categoriesPromise = getDocs(collection(db, 'categories'));

      const [productsSnapshot, categoriesSnapshot] = await Promise.all([
        productsPromise,
        categoriesPromise,
      ]);

      const productsData = productsSnapshot.docs.map(docSnap => 
        transformFirebaseDataToProduct(docSnap.id, docSnap.data())
      );
      setProducts(productsData);

      const categoriesData: Category[] = categoriesSnapshot.docs.map(docSnap => {
        const catData = docSnap.data();
        return {
          id: docSnap.id,
          name_en: catData.name_en || catData.name || '',
          name_ar: catData.name_ar || '',
          image: catData.image || '',
        } as Category;
      });
      setAllCategories(categoriesData);

    } catch (error) {
      console.error('Error fetching initial data for ManageProducts:', error);
      alert(t('manageProducts.alerts.fetchFailed', 'Failed to fetch initial data.'));
    } finally {
      setLoading(false);
    }
  }, [t]); // Added t to dependency array as it's used in alert

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm(t('manageProducts.confirmDelete', 'Are you sure you want to delete this product? This action cannot be undone.'))) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.id !== id)); 
      alert(t('manageProducts.alerts.deleteSuccess', 'Product deleted successfully!'));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(t('manageProducts.alerts.deleteFailure', 'Failed to delete product. Please try again.'));
    }
    // Removed window.location.reload(); for better SPA experience
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/admin/product/edit/${product.id}`);
  };

  const handleAddNew = () => {
    navigate('/admin/product/new');
  };

  return (
    <div className="container mt-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="mb-1">{t('manageProducts.title', 'Product Manager')}</h2>
          <p className="text-muted mb-0">{t('manageProducts.subtitle', 'View, add, edit, or delete products.')}</p>
        </div>
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2">
          <ExportImportProducts />
          <button className="btn btn-primary" onClick={handleAddNew}>
            <FaPlus className="me-1" /> {t('manageProducts.buttons.addNew', 'Add New Product')}
          </button>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-light">
          <h5 className="mb-0">{t('manageProducts.listTitle', 'Product List')}</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <FaSpinner className="fa-spin me-2" /> {t('manageProducts.loading', 'Loading products...')}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-3">
                <p className="text-muted">{t('manageProducts.noProducts', 'No products found. Click "Add New Product" to get started.')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <ProductsTable
                products={products}
                allCategories={allCategories} 
                onEdit={handleEditProduct} 
                onDelete={handleDeleteProduct}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageProducts;
