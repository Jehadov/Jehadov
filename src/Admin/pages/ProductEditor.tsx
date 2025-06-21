import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../firebase';
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import {
  defaultProduct,
  type Product,
  type Category,
  type Variant,
  type VariantOption,
  defaultOption as defaultVariantOption,
  defaultVariant,
} from '../../Users/pages/types'; // Adjust path as needed
import ProductForm from './ProductForm';
import { FaSpinner } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

// This helper transforms raw Firestore data into the consistent Product object your app uses.
// It handles both old ('types' object) and new ('variants' array) data structures.
const transformFirebaseDataToProduct = (docId: string | undefined, dataFromFirebase: any): Product => {
    const rawData = dataFromFirebase || {};
    let productVariants: Variant[] = [];

    if (rawData.variants && Array.isArray(rawData.variants) && rawData.variants.length > 0) {
        productVariants = rawData.variants.map((variantGroup: any) => ({
            name_en: String(variantGroup.name_en || variantGroup.name || 'Default Type'),
            name_ar: String(variantGroup.name_ar || ''),
            options: Array.isArray(variantGroup.options) && variantGroup.options.length > 0
                     ? variantGroup.options.map((option: any) => {
                         const currentPrice = Number(option.price) || 0;
                         return {
                            ...defaultVariantOption, // Ensure all fields are present
                            ...option,
                            price: currentPrice,
                            originalPrice: typeof option.originalPrice === 'number' ? Number(option.originalPrice) : currentPrice,
                            quantity: Number(option.quantity) || 0,
                         } as VariantOption;
                       })
                     : [{ ...defaultVariantOption, value_en: 'Standard Option', value_ar: 'خيار قياسي' }],
        }));
    } else if (rawData.types && typeof rawData.types === 'object' && Object.keys(rawData.types).length > 0) {
        const options: VariantOption[] = Object.entries(rawData.types)
            .map(([key, typeValue]: [string, any]) => {
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

    if (productVariants.length === 0) {
        productVariants = [{...defaultVariant}];
    }
    
    return {
        ...defaultProduct, ...rawData, id: docId || defaultProduct.id,
        name_en: String(rawData.name_en || rawData.name || ''),
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
        isOffer: !!rawData.isOffer,
        image: String(rawData.image || defaultProduct.image || ''),
        manufacturedAt: rawData.manufacturedAt || defaultProduct.manufacturedAt,
        expiration: rawData.expiration || defaultProduct.expiration,
    };
};

const ProductEditor: React.FC = () => {
  const { id: editId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<Product>(() => JSON.parse(JSON.stringify(defaultProduct)));
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      setCategoryOptions(categoriesSnapshot.docs.map(doc => {
          const catData = doc.data();
          return { 
            id: doc.id, 
            name_en: catData.name_en || catData.name || "",
            name_ar: catData.name_ar || ""
          } as Category;
      }));

      if (editId) {
        const productDocRef = doc(db, 'products', editId);
        const productDocSnap = await getDoc(productDocRef);

        if (productDocSnap.exists()) {
          setFormData(transformFirebaseDataToProduct(productDocSnap.id, productDocSnap.data()));
        } else {
          alert('Product not found');
          navigate('/admin/manage-products'); 
        }
      } else {
        const isCreatingOfferFromState = !!location.state?.isCreatingOffer;
        // Use a fresh defaultProduct, but respect the isCreatingOffer flag passed from ManageOffers
        setFormData({ ...defaultProduct, isOffer: isCreatingOfferFromState }); 
      }
    } catch (error) {
      console.error("Error fetching initial data for Product Editor: ", error);
      alert("Failed to load data. Please try again.");
    } finally {
      setLoadingData(false);
    }
  }, [editId, navigate, location.state]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (submittedFormData: Product) => {
    setIsSubmitting(true);

    const dataToSave: Omit<Product, 'id'> & { id?: string; createdAt?: any; updatedAt?: any } = { 
      ...submittedFormData, 
      name_lowercase: (submittedFormData.name_en || '').toLowerCase().trim(),
      name_ar_lowercase: (submittedFormData.name_ar || '').toLowerCase().trim(),
      // Ensure variants and their options have clean data, especially offer fields
      variants: submittedFormData.variants.map(variant => ({
          name_en: variant.name_en || '',
          name_ar: variant.name_ar || '',
          options: variant.options.map(option => {
              const cleanOption: Partial<VariantOption> = {
                value_en: option.value_en || '',
                value_ar: option.value_ar || '',
                price: Number(option.price) || 0,
                quantity: Number(option.quantity) || 0,
                imageUrl: option.imageUrl || '',
                unitLabel_en: option.unitLabel_en || '',
                unitLabel_ar: option.unitLabel_ar || '',
              };
              // Only include offer fields if the offer is active for that option
              if(option.offerType && option.offerType !== 'none') {
                  cleanOption.originalPrice = Number(option.originalPrice) || 0;
                  cleanOption.offerType = option.offerType;
                  cleanOption.offerValue = Number(option.offerValue) || 0;
              }
              return cleanOption as VariantOption;
          })
      }))
    };
    
    if (!editId && dataToSave.id === '') {
        delete dataToSave.id;
    }
    
    try {
      if (editId) {
        const productRef = doc(db, 'products', editId);
        dataToSave.updatedAt = serverTimestamp();
        await updateDoc(productRef, dataToSave);
        alert(t('productForm.alerts.updateSuccess', 'Product updated successfully!'));
      } else {
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, 'products'), dataToSave);
        alert(t('productForm.alerts.addSuccess', 'Product added successfully!'));
      }
      navigate('/admin/manage-products'); 
    } catch (error) {
      console.error('Error saving product:', error);
      alert(t('productForm.alerts.saveFailure', 'Failed to save product.'));
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="container py-5 text-center">
        <FaSpinner className="fa-spin fa-2x text-primary" />
        <p className="mt-2">{t('productForm.loadingEditor', 'Loading Product Editor...')}</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-9">
          <ProductForm
            formData={formData}
            setFormData={setFormData}
            categoryOptions={categoryOptions}
            onSubmit={handleSubmit} 
            editId={editId || null}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductEditor;

