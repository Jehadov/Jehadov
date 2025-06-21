import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  FieldValue,
} from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust path as needed
import { useTranslation } from 'react-i18next';
import { FaSave, FaTimes, FaSpinner, FaTag, FaEdit } from 'react-icons/fa';
// Assuming types are correctly defined in your central types.ts file
import { type Product, type OfferType, type Offer as AppOffer } from '../../Users/pages/types';

// This interface defines the shape of the data managed by the form's state
interface OfferFormData {
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  type: OfferType;
  discountValue: number;
  targetProductIds: string[]; 
  startDate: string;
  endDate: string;
  isActive: boolean;
  bogoBuyProductId?: string;
  bogoBuyQuantity?: number;
  bogoGetProductId?: string;
  bogoGetQuantity?: number;
  bogoGetType?: 'free' | 'percentage_discount' | 'fixed_discount';
  couponCode?: string;
  discountNature?: 'percentage' | 'fixed'; // For coupon type
}

// Default state for creating a new offer
const defaultOfferFormData: OfferFormData = {
  title_en: '', title_ar: '',
  description_en: '', description_ar: '',
  type: 'percentage_discount', // Default type when form opens
  discountValue: 0,
  targetProductIds: [], 
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
  isActive: true,
  bogoBuyProductId: '', bogoBuyQuantity: 1,
  bogoGetProductId: '', bogoGetQuantity: 1,
  bogoGetType: 'free',
  couponCode: '',
  discountNature: 'fixed',
};

const OfferForm: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { offerId } = useParams<{ offerId?: string }>();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState<OfferFormData>(defaultOfferFormData);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentLang = i18n.language.startsWith('ar') ? 'ar' : 'en';
  
  const getLocalizedProductName = (product: Product | undefined) => {
    if (!product) return '';
    return (currentLang === 'ar' && product.name_ar) ? product.name_ar : product.name_en;
  };

  // Fetch all products for selection dropdowns and checkboxes
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        if (!isMounted) return;
        const productsData = productsSnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name_en: data.name_en || data.name || `Product ${docSnap.id}`,
            name_ar: data.name_ar || data.name_en || data.name || `منتج ${docSnap.id}`,
          } as Product; 
        });
        setAllProducts(productsData);
      } catch (error) {
        console.error("Error fetching products for offer form:", error);
        if (isMounted) alert(t('offerForm.alerts.fetchProductsFailed', 'Failed to load products for selection.'));
      }
    };
    fetchProducts();
    return () => { isMounted = false; };
  }, [t]); 

  // Initialize form: either for editing an existing offer or creating a new one
  useEffect(() => {
    const productIdFromUrl = searchParams.get('productId');
    const productNameFromUrl = searchParams.get('productName');
    let isMounted = true;
    setLoading(true);

    const initializeForm = async () => {
      if (offerId) { // Editing existing offer
        try {
          const offerDocRef = doc(db, 'offers', offerId);
          const offerDocSnap = await getDoc(offerDocRef);
          if (!isMounted) return;
          if (offerDocSnap.exists()) {
            const offerData = offerDocSnap.data() as AppOffer;
            setFormData({
              title_en: offerData.title_en || '',
              title_ar: offerData.title_ar || '',
              description_en: offerData.description_en || '',
              description_ar: offerData.description_ar || '',
              type: offerData.type || 'percentage_discount',
              discountValue: offerData.discountValue || 0,
              targetProductIds: offerData.targetProductIds || [],
              startDate: offerData.startDate || defaultOfferFormData.startDate,
              endDate: offerData.endDate || defaultOfferFormData.endDate,
              isActive: offerData.isActive === undefined ? true : offerData.isActive,
              bogoBuyProductId: offerData.bogoBuyProductId || '',
              bogoBuyQuantity: offerData.bogoBuyQuantity || 1,
              bogoGetProductId: offerData.bogoGetProductId || '',
              bogoGetQuantity: offerData.bogoGetQuantity || 1,
              bogoGetType: offerData.bogoGetType || 'free',
              couponCode: offerData.couponCode || '',
              discountNature: offerData.discountNature || 'fixed',
            });
          } else {
            alert(t('offerForm.alerts.offerNotFound', 'Offer not found.'));
            navigate('/admin/manage-offers');
          }
        } catch (error) {
          console.error("Error fetching offer for editing:", error);
          if (isMounted) alert(t('offerForm.alerts.fetchOfferFailed', 'Failed to load offer for editing.'));
        } finally {
            if (isMounted) setLoading(false);
        }
      } else { // Creating a new offer
        let initialData = { ...defaultOfferFormData };
        if (productIdFromUrl) {
          if (initialData.type === 'percentage_discount' || initialData.type === 'fixed_discount' || initialData.type === 'coupon') {
            initialData.targetProductIds = [productIdFromUrl];
          }
          if (productNameFromUrl) {
            initialData.title_en = t('offerForm.defaults.titleForProduct', `Offer for ${productNameFromUrl}`, { productName: productNameFromUrl });
            initialData.title_ar = t('offerForm.defaults.titleForProductAr', `عرض لـ ${productNameFromUrl}`, { productName: productNameFromUrl, lng: 'ar' });
          }
        }
        if (isMounted) {
            setFormData(initialData);
            setLoading(false); 
        }
      }
    };

    // Wait for products to load before initializing a new form that might need them
    if (allProducts.length > 0 || offerId) { 
        initializeForm();
    } else if (!offerId && allProducts.length === 0 && !loading) {
        // Products fetch finished but no products, still initialize
        initializeForm(); 
    }

    return () => { isMounted = false; };
  }, [offerId, navigate, t, searchParams, allProducts]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (["discountValue", "bogoBuyQuantity", "bogoGetQuantity"].includes(name)) {
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProductSelectionChange = (productId: string) => {
    setFormData(prev => {
      const currentSelected = prev.targetProductIds || [];
      const newSelected = currentSelected.includes(productId)
        ? currentSelected.filter(id => id !== productId)
        : [...currentSelected, productId];
      return { ...prev, targetProductIds: newSelected };
    });
  };

  const isFormValid = () => {
    if (!formData.title_en.trim() && !formData.title_ar.trim()) return false;
    if (!formData.startDate || !formData.endDate || formData.startDate > formData.endDate) return false;
    
    if (formData.type === 'percentage_discount' || formData.type === 'fixed_discount') {
        if (formData.discountValue <= 0) return false;
        if (!formData.targetProductIds || formData.targetProductIds.length === 0) return false;
    } else if (formData.type === 'bogo') {
        if (!formData.bogoBuyProductId || !formData.bogoGetProductId) return false;
        if ((formData.bogoBuyQuantity || 0) <= 0 || (formData.bogoGetQuantity || 0) <= 0) return false;
        if (formData.bogoGetType !== 'free' && (formData.discountValue || 0) <= 0) return false;
    } else if (formData.type === 'coupon') {
        if (!formData.couponCode?.trim()) return false;
        if (formData.discountValue <= 0) return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert(t('offerForm.alerts.validationFailed', 'Please fill all required fields correctly. Check discount values, dates, product selections, and BOGO/Coupon details.'));
      return;
    }
    setIsSubmitting(true);

    const dataToSave: Omit<AppOffer, 'id' | 'createdAt' | 'updatedAt'> & { updatedAt: FieldValue, createdAt?: FieldValue } = {
      title_en: formData.title_en,
      title_ar: formData.title_ar,
      description_en: formData.description_en,
      description_ar: formData.description_ar,
      type: formData.type,
      discountValue: formData.discountValue,
      targetProductIds: (formData.type === 'percentage_discount' || formData.type === 'fixed_discount' || formData.type === 'coupon') 
                        ? formData.targetProductIds 
                        : [], 
      startDate: formData.startDate,
      endDate: formData.endDate,
      isActive: formData.isActive,
      updatedAt: serverTimestamp(),
      bogoBuyProductId: formData.type === 'bogo' ? formData.bogoBuyProductId : undefined,
      bogoBuyQuantity: formData.type === 'bogo' ? formData.bogoBuyQuantity : undefined,
      bogoGetProductId: formData.type === 'bogo' ? formData.bogoGetProductId : undefined,
      bogoGetQuantity: formData.type === 'bogo' ? formData.bogoGetQuantity : undefined,
      bogoGetType: formData.type === 'bogo' ? formData.bogoGetType : undefined,
      couponCode: formData.type === 'coupon' ? formData.couponCode : undefined,
      discountNature: formData.type === 'coupon' ? formData.discountNature : undefined,
    };

    Object.keys(dataToSave).forEach(keyStr => {
        const key = keyStr as keyof typeof dataToSave;
        if (dataToSave[key] === undefined) {
            delete dataToSave[key];
        }
    });

    try {
      if (offerId) {
        const offerRef = doc(db, 'offers', offerId);
        await setDoc(offerRef, dataToSave, { merge: true }); 
        alert(t('offerForm.alerts.updateSuccess', 'Offer updated successfully!'));
      } else {
        (dataToSave as any).createdAt = serverTimestamp();
        await addDoc(collection(db, 'offers'), dataToSave);
        alert(t('offerForm.alerts.addSuccess', 'Offer created successfully!'));
      }
      navigate('/admin/manage-offers');
    } catch (error) {
      console.error("Error saving offer:", error);
      alert(t('offerForm.alerts.saveFailed', 'Failed to save offer.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) { 
    return <div className="container mt-5 text-center"><FaSpinner className="fa-spin fa-2x text-primary" /><p>{t('loadingText', 'Loading Form...')}</p></div>;
  }

  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-8">
          <div className="card shadow-sm">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h3 className="mb-0 text-primary">
                <FaTag className="me-2"/>
                {offerId ? t('offerForm.title.edit', 'Edit Offer') : t('offerForm.title.create', 'Create New Offer')}
              </h3>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <fieldset className="mb-4 border p-3 rounded">
                  <legend className="fs-6 fw-semibold">{t('offerForm.sections.offerDetails', 'Offer Details')}</legend>
                  <div className="row g-3">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="title_en" className="form-label">{t('offerForm.labels.titleEn', 'Title (English)')} <span className="text-danger">*</span></label>
                      <input type="text" className="form-control form-control-sm" id="title_en" name="title_en" value={formData.title_en} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="title_ar" className="form-label">{t('offerForm.labels.titleAr', 'Title (Arabic)')} <span className="text-danger">*</span></label>
                      <input type="text" className="form-control form-control-sm" id="title_ar" name="title_ar" value={formData.title_ar} onChange={handleInputChange} dir="rtl" required />
                    </div>
                    <div className="col-12 mb-3">
                      <label htmlFor="description_en" className="form-label">{t('offerForm.labels.descriptionEn', 'Description (English)')}</label>
                      <textarea className="form-control form-control-sm" id="description_en" name="description_en" rows={2} value={formData.description_en || ''} onChange={handleInputChange}></textarea>
                    </div>
                    <div className="col-12 mb-3">
                      <label htmlFor="description_ar" className="form-label">{t('offerForm.labels.descriptionAr', 'Description (Arabic)')}</label>
                      <textarea className="form-control form-control-sm" id="description_ar" name="description_ar" rows={2} value={formData.description_ar || ''} onChange={handleInputChange} dir="rtl"></textarea>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="mb-4 border p-3 rounded">
                  <legend className="fs-6 fw-semibold">{t('offerForm.sections.discountConfig', 'Discount Configuration')}</legend>
                  <div className="row g-3">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="type" className="form-label">{t('offerForm.labels.offerType', 'Offer Type')} <span className="text-danger">*</span></label>
                      <select className="form-select form-select-sm" id="type" name="type" value={formData.type} onChange={handleInputChange}>
                        <option value="percentage_discount">{t('offerForm.types.percentage', 'Percentage Discount')}</option>
                        <option value="fixed_discount">{t('offerForm.types.fixed', 'Fixed Amount Discount')}</option>
                        <option value="bogo">{t('offerForm.types.bogo', 'Buy X Get Y (BOGO)')}</option>
                        <option value="coupon">{t('offerForm.types.coupon', 'Coupon Code Discount')}</option>
                      </select>
                    </div>
                    {(formData.type === 'percentage_discount' || formData.type === 'fixed_discount' || formData.type === 'coupon' || (formData.type === 'bogo' && formData.bogoGetType !== 'free')) && (
                        <div className="col-md-6 mb-3">
                        <label htmlFor="discountValue" className="form-label">
                            {formData.type === 'percentage_discount' || (formData.type === 'bogo' && formData.bogoGetType === 'percentage_discount') || (formData.type === 'coupon' && formData.discountNature === 'percentage')
                            ? t('offerForm.labels.discountPercentage', 'Discount (%)')
                            : t('offerForm.labels.discountAmount', 'Discount Amount (JD)')}
                            <span className="text-danger">*</span>
                        </label>
                        <input type="number" className="form-control form-control-sm" id="discountValue" name="discountValue" value={formData.discountValue} onChange={handleInputChange} min="0" step={formData.type === 'percentage_discount' || (formData.type === 'bogo' && formData.bogoGetType === 'percentage_discount') || (formData.type === 'coupon' && formData.discountNature === 'percentage') ? "1" : "0.01"} required />
                        </div>
                    )}
                    {formData.type === 'coupon' && (
                        <div className="col-md-6 mb-3">
                            <label htmlFor="discountNature" className="form-label">{t('offerForm.labels.discountNature', 'Coupon Discount Type')}</label>
                            <select className="form-select form-select-sm" id="discountNature" name="discountNature" value={formData.discountNature} onChange={handleInputChange}>
                                <option value="fixed">{t('offerForm.types.fixed', 'Fixed Amount')}</option>
                                <option value="percentage">{t('offerForm.types.percentage', 'Percentage')}</option>
                            </select>
                        </div>
                    )}
                  </div>
                </fieldset>

                {formData.type === 'bogo' && (
                    <fieldset className="mb-4 border p-3 rounded bg-light-subtle">
                         <legend className="fs-6 fw-semibold text-info">{t('offerForm.sections.bogoDetails', 'BOGO Details')}</legend>
                        <div className="row g-3">
                            <div className="col-md-6 mb-2">
                                <label htmlFor="bogoBuyProductId" className="form-label small">{t('offerForm.labels.bogoBuyProduct', 'Product to Buy')}</label>
                                <select className="form-select form-select-sm" id="bogoBuyProductId" name="bogoBuyProductId" value={formData.bogoBuyProductId || ''} onChange={handleInputChange}>
                                    <option value="">{t('offerForm.placeholders.selectProduct', 'Select Product...')}</option>
                                    {allProducts.map(p => <option key={p.id} value={p.id}>{getLocalizedProductName(p)}</option>)}
                                </select>
                            </div>
                            <div className="col-md-6 mb-2">
                                <label htmlFor="bogoBuyQuantity" className="form-label small">{t('offerForm.labels.bogoBuyQty', 'Quantity to Buy')}</label>
                                <input type="number" className="form-control form-control-sm" id="bogoBuyQuantity" name="bogoBuyQuantity" value={formData.bogoBuyQuantity || 1} onChange={handleInputChange} min="1" />
                            </div>
                            <div className="col-md-6 mb-2">
                                <label htmlFor="bogoGetProductId" className="form-label small">{t('offerForm.labels.bogoGetProduct', 'Product to Get')}</label>
                                <select className="form-select form-select-sm" id="bogoGetProductId" name="bogoGetProductId" value={formData.bogoGetProductId || ''} onChange={handleInputChange}>
                                    <option value="">{t('offerForm.placeholders.selectProduct', 'Select Product...')}</option>
                                    {allProducts.map(p => <option key={p.id} value={p.id}>{getLocalizedProductName(p)}</option>)}
                                </select>
                            </div>
                            <div className="col-md-6 mb-2">
                                <label htmlFor="bogoGetQuantity" className="form-label small">{t('offerForm.labels.bogoGetQty', 'Quantity to Get')}</label>
                                <input type="number" className="form-control form-control-sm" id="bogoGetQuantity" name="bogoGetQuantity" value={formData.bogoGetQuantity || 1} onChange={handleInputChange} min="1" />
                            </div>
                             <div className="col-md-12 mb-2">
                                <label htmlFor="bogoGetType" className="form-label small">{t('offerForm.labels.bogoGetType', 'Discount on "Get" Item')}</label>
                                <select className="form-select form-select-sm" id="bogoGetType" name="bogoGetType" value={formData.bogoGetType || 'free'} onChange={handleInputChange}>
                                    <option value="free">{t('offerForm.types.bogoFree', 'Free')}</option>
                                    <option value="percentage_discount">{t('offerForm.types.bogoPercentage', 'Percentage Discount on "Get" Item')}</option>
                                    <option value="fixed_discount">{t('offerForm.types.bogoFixed', 'Fixed Discount on "Get" Item')}</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>
                )}

                {(formData.type === 'percentage_discount' || formData.type === 'fixed_discount' || formData.type === 'coupon') && (
                    <fieldset className="mb-4 border p-3 rounded">
                        <legend className="fs-6 fw-semibold">{t('offerForm.sections.targetProducts', 'Target Products')}</legend>
                        <p className="form-text">
                            {formData.type === 'coupon' 
                                ? t('offerForm.helpText.targetProductsCoupon', 'Select products this coupon applies to. Leave empty for a site-wide coupon (applies to all products).')
                                : t('offerForm.helpText.targetProductsDiscount', 'Select products this discount applies to.')
                            }
                        </p>
                        {allProducts.length === 0 && !loading && <p className="text-muted">{t('offerForm.noProductsToSelect', 'No products available to select.')}</p>}
                        <div className="row" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {allProducts.map(product => (
                            <div className="col-md-6" key={`target-${product.id}`}>
                                <div className="form-check d-flex align-items-center">
                                <input
                                    className="form-check-input me-2" type="checkbox"
                                    value={product.id!} id={`target-product-${product.id}`}
                                    checked={formData.targetProductIds.includes(product.id!)}
                                    onChange={() => handleProductSelectionChange(product.id!)}
                                />
                                <label className="form-check-label small" htmlFor={`target-product-${product.id}`}>
                                    {getLocalizedProductName(product)}
                                </label>
                                <Link to={`/admin/product/edit/${product.id}`} 
                                      className="btn btn-sm btn-link py-0 px-1 ms-auto" 
                                      title={t('offerForm.buttons.editProduct', 'Edit Product')}
                                      target="_blank" rel="noopener noreferrer">
                                    <FaEdit size={12} />
                                </Link>
                                </div>
                            </div>
                            ))}
                        </div>
                        { (formData.type === 'percentage_discount' || formData.type === 'fixed_discount') && formData.targetProductIds.length === 0 && 
                            <small className="text-danger d-block mt-1">{t('offerForm.validation.selectOneProductForDiscount', 'Please select at least one product for this discount type.')}</small>
                        }
                    </fieldset>
                )}

                <fieldset className="mb-4 border p-3 rounded">
                   <legend className="fs-6 fw-semibold">{t('offerForm.sections.durationAndStatus', 'Offer Duration & Status')}</legend>
                  <div className="row g-3">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="startDate" className="form-label">{t('offerForm.labels.startDate', 'Start Date')} <span className="text-danger">*</span></label>
                      <input type="date" className="form-control form-control-sm" id="startDate" name="startDate" value={formData.startDate} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="endDate" className="form-label">{t('offerForm.labels.endDate', 'End Date')} <span className="text-danger">*</span></label>
                      <input type="date" className="form-control form-control-sm" id="endDate" name="endDate" value={formData.endDate} onChange={handleInputChange} min={formData.startDate} required />
                    </div>
                  </div>
                   <div className="form-check mt-2">
                        <input className="form-check-input" type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                        <label className="form-check-label" htmlFor="isActive">{t('offerForm.labels.isActive', 'Offer is Active')}</label>
                    </div>
                </fieldset>

                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/admin/manage-offers')} disabled={isSubmitting}>
                    <FaTimes className="me-1" /> {t('buttons.cancel', 'Cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting || !isFormValid()}>
                    {isSubmitting ? <FaSpinner className="fa-spin me-1" /> : <FaSave className="me-1" />}
                    {offerId ? t('offerForm.buttons.updateOffer', 'Update Offer') : t('offerForm.buttons.createOffer', 'Create Offer')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferForm;
