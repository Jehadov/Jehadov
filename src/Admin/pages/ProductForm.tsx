// src/pages/admin/ProductForm.tsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  type Product,
  type Category, // Expects { id, name_en, name_ar, ... }
  type Variant,  // Expects { name_en, name_ar, options: VariantOption[] }
  type AddOn,    // Expects { id, name_en, name_ar, ... }
} from '../../Users/pages/types'; // Adjust path as needed
import ManagerVariant from './ManagerVariant'; 
import { useTranslation } from 'react-i18next';

interface ProductFormProps {
  formData: Product; 
  setFormData: React.Dispatch<React.SetStateAction<Product>>;
  categoryOptions: Category[]; // Category objects should have name_en, name_ar
  onSubmit: (formDataToSubmit: Product) => void;
  editId: string | null;
  isSubmitting: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  formData,
  setFormData,
  categoryOptions,
  onSubmit,
  editId,
  isSubmitting,
}) => {
  const { t, i18n } = useTranslation();
  const [addOnOptions, setAddOnOptions] = useState<AddOn[]>([]);
  const [loadingAddOns, setLoadingAddOns] = useState(false);

  const currentLang = i18n.language.startsWith('ar') ? 'ar' : 'en';

  useEffect(() => {
    const fetchAddOns = async () => {
      setLoadingAddOns(true);
      try {
        const snapshot = await getDocs(collection(db, "addOns"));
        const data = snapshot.docs.map((doc) => {
          const addOnData = doc.data();
          return { 
            id: doc.id,
            name_en: addOnData.name_en || addOnData.name || "", 
            name_ar: addOnData.name_ar || "", 
            extraPrice: Number(addOnData.extraPrice) || 0,
          } as AddOn;
        });
        setAddOnOptions(data);
      } catch (error) {
        console.error("Error fetching add-ons:", error);
      } finally {
        setLoadingAddOns(false);
      }
    };
    fetchAddOns();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value: categoryId } = e.target; // Value is category ID
    setFormData((prev) => {
      const currentCategories = prev.category || [];
      const updatedCategories = checked
        ? [...currentCategories, categoryId]
        : currentCategories.filter((id) => id !== categoryId);
      return { ...prev, category: updatedCategories };
    });
  };

  const handleOptionalAddOnSelectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value: addOnId } = e.target;
    setFormData((prev) => ({
      ...prev,
      optionalAddOnIds: checked
        ? [...(prev.optionalAddOnIds || []), addOnId]
        : (prev.optionalAddOnIds || []).filter((id) => id !== addOnId),
    }));
  };

  const handleVariantsChange = (updatedVariants: Variant[]) => {
    setFormData(prev => ({ ...prev, variants: updatedVariants }));
  };

  const isFormValid = 
    formData.name_en?.trim() !== '' &&
    formData.variants.length > 0 &&
    formData.variants.every(v => 
        v.name_en?.trim() !== '' && 
        v.options.length > 0 && 
        v.options.every(o => o.value_en?.trim() !== '')
    );

  const handleFormSubmitInternal = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSubmit(formData); 
    } else {
      alert(t('productForm.validation.fillRequiredFields', "Please ensure product name (English), variant type name (English), and option value (English) are filled."));
    }
  };

  return (
    <form
      onSubmit={handleFormSubmitInternal}
      className="p-3 p-md-4 bg-white rounded shadow-sm container"
      style={{ maxWidth: 900, margin: "2rem auto" }}
    >
      <h3 className="mb-4 text-center">
        {editId 
            ? t('productForm.title.edit', 'Edit Product') 
            : t('productForm.title.create', 'Create New Product')}
      </h3>

      <fieldset className="mb-3 border p-3 rounded">
        <legend className="fs-6 fw-semibold">{t('productForm.sections.productName', 'Product Name')}</legend>
        <div className="mb-3">
          <label htmlFor="name_en" className="form-label">
            {t('productForm.labels.name_en', 'Name (English)')} <span className="text-danger">*</span>
          </label>
          <input
            type="text" id="name_en" name="name_en"
            className="form-control form-control-sm"
            placeholder={t('productForm.placeholders.name_en', 'Enter product name in English')}
            value={formData.name_en || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="name_ar" className="form-label">
            {t('productForm.labels.name_ar', 'Name (Arabic)')} <span className="text-danger">*</span>
          </label>
          <input
            type="text" id="name_ar" name="name_ar"
            className="form-control form-control-sm"
            placeholder={t('productForm.placeholders.name_ar', 'أدخل اسم المنتج بالعربية')}
            value={formData.name_ar || ''}
            onChange={handleChange}
            dir="rtl" 
            required
          />
        </div>
      </fieldset>

      <fieldset className="mb-4 border p-3 rounded">
        <legend className="form-label fw-semibold mb-2 fs-6">{t('productForm.sections.categories', 'Categories')}</legend>
        <div className="d-flex flex-wrap gap-3">
          {categoryOptions.map((cat) => {
            // Display localized category name
            const categoryDisplayName = (currentLang === 'ar' && cat.name_ar) ? cat.name_ar : cat.name_en;
            return (
              <div className="form-check" key={cat.id}>
                <input
                  type="checkbox" id={`category-${cat.id}`} value={cat.id} // Value is category ID
                  className="form-check-input"
                  checked={formData.category?.includes(cat.id) ?? false}
                  onChange={handleCategoryChange}
                />
                <label htmlFor={`category-${cat.id}`} className="form-check-label">{categoryDisplayName || cat.id}</label> {/* Fallback to ID if names are empty */}
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="mb-4">
        <ManagerVariant
          variants={formData.variants}
          onVariantsChange={handleVariantsChange}
        />
      </div>

      <fieldset className="mb-3 border p-3 rounded">
        <legend className="fs-6 fw-semibold">{t('productForm.sections.descriptions', 'Descriptions')}</legend>
        <div className="mb-3">
          <label htmlFor="shortDescription_en" className="form-label fw-semibold">{t('productForm.labels.shortDescription_en', 'Short Description (English)')}</label>
          <textarea id="shortDescription_en" name="shortDescription_en" className="form-control form-control-sm" rows={2} value={formData.shortDescription_en || ''} onChange={handleChange}/>
        </div>
        <div className="mb-3">
          <label htmlFor="shortDescription_ar" className="form-label fw-semibold">{t('productForm.labels.shortDescription_ar', 'Short Description (Arabic)')}</label>
          <textarea id="shortDescription_ar" name="shortDescription_ar" className="form-control form-control-sm" rows={2} value={formData.shortDescription_ar || ''} onChange={handleChange} dir="rtl"/>
        </div>
        <div className="mb-3">
          <label htmlFor="longDescription_en" className="form-label fw-semibold">{t('productForm.labels.longDescription_en', 'Long Description (English)')}</label>
          <textarea id="longDescription_en" name="longDescription_en" className="form-control form-control-sm" rows={4} value={formData.longDescription_en || ''} onChange={handleChange}/>
        </div>
        <div className="mb-3">
          <label htmlFor="longDescription_ar" className="form-label fw-semibold">{t('productForm.labels.longDescription_ar', 'Long Description (Arabic)')}</label>
          <textarea id="longDescription_ar" name="longDescription_ar" className="form-control form-control-sm" rows={4} value={formData.longDescription_ar || ''} onChange={handleChange} dir="rtl"/>
        </div>
      </fieldset>
      
      <fieldset className="mb-4 border p-3 rounded">
        <legend className="form-label fw-semibold mb-2 fs-6">{t('productForm.sections.dates', 'Dates')}</legend>
        <div className="row g-3">
          <div className="col-md-6 mb-3">
            <label htmlFor="manufacturedAt" className="form-label fw-semibold">{t('productForm.labels.manufacturedAt', 'Manufactured At')}</label>
            <input type="date" id="manufacturedAt" name="manufacturedAt" className="form-control form-control-sm" value={formData.manufacturedAt?.substring(0, 10) || ""} onChange={handleChange} />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="expiration" className="form-label fw-semibold">{t('productForm.labels.expiration', 'Expiration Date')}</label>
            <input type="date" id="expiration" name="expiration" className="form-control form-control-sm" value={formData.expiration?.substring(0, 10) || ""} onChange={handleChange} />
          </div>
        </div>
      </fieldset>

      <fieldset className="mb-4 border p-3 rounded">
        <legend className="form-label fw-semibold mb-2 fs-6">{t('productForm.sections.optionalAddOns', 'Configure Choosable Add-Ons')}</legend>
        <p className="form-text">{t('productForm.helpText.optionalAddOns', 'Select which globally available add-ons can be chosen by customers for this specific product.')}</p>
        {loadingAddOns ? (<div className="text-muted">{t('loadingText', 'Loading...')}</div>)
        : addOnOptions.length === 0 ? (<div className="text-muted">{t('productForm.noAddOnsAvailable', 'No add-ons defined in store to select from.')}</div>)
        : ( <div className="d-flex flex-wrap gap-3">
            {addOnOptions.map((addOn) => {
                const addOnDisplayName = (currentLang === 'ar' && addOn.name_ar) ? addOn.name_ar : addOn.name_en;
                return (
                  <div className="form-check" key={addOn.id}>
                    <input type="checkbox" id={`optionalAddOn-${addOn.id}`} value={addOn.id} className="form-check-input"
                      checked={formData.optionalAddOnIds?.includes(addOn.id) ?? false}
                      onChange={handleOptionalAddOnSelectionChange} />
                    <label htmlFor={`optionalAddOn-${addOn.id}`} className="form-check-label" title={`${t('productForm.extraPrice', 'Extra Price')}: ${addOn.extraPrice.toFixed(2)} ${t('currency.jd', 'JD')}`}>
                      {addOnDisplayName || addOn.id} {/* Fallback to ID if names are empty */}
                    </label>
                  </div>
                );
            })}
          </div>
        )}
      </fieldset>
      
      <div className="form-check mb-4">
        <input className="form-check-input" type="checkbox" name="isOffer" id="isOffer"
          checked={!!formData.isOffer}
          onChange={(e) => setFormData(prev => ({...prev, isOffer: e.target.checked}))}
        />
        <label className="form-check-label fw-semibold" htmlFor="isOffer">
          {t('productForm.labels.isOffer', 'Mark as Special Offer')}
        </label>
      </div>

      <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={!isFormValid || isSubmitting}>
        {isSubmitting 
            ? t('productForm.buttons.saving', 'Saving...')
            : (editId ? t('productForm.buttons.update', 'Update Product') : t('productForm.buttons.add', 'Add Product'))
        }
      </button>
    </form>
  );
};

export default ProductForm;