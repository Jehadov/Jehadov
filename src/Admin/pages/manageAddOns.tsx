// src/Admin/pages/ManageAddOns.tsx (or your path)
import React, { useState, useEffect, useCallback } from 'react';
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useTranslation } from 'react-i18next';
import type { AddOn } from '../../Users/pages/types'; // Ensure this AddOn has name_en, name_ar
import { FaPlus, FaSave, FaTimes, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';

interface AddOnFormData {
  name_en: string;
  name_ar: string;
  extraPrice: number;
}

const defaultAddOnFormState: AddOnFormData = {
  name_en: '',
  name_ar: '',
  extraPrice: 0,
};

// --- NEW: Price Formatting Helper ---
const formatPriceForDisplay = (price: number | undefined | null, currencySymbol: string = "JD"): string => {
  if (typeof price === 'number' && !isNaN(price)) {
    return `${price.toFixed(2)} ${currencySymbol}`;
  }
  return `0.00 ${currencySymbol}`; // Default display for invalid or missing price
};
// --- END: Price Formatting Helper ---

const ManageAddOns: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(false); // For fetching list
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
  const pageDirection = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const [formData, setFormData] = useState<AddOnFormData>(defaultAddOnFormState);
  const [editingId, setEditingId] = useState<string | null>(null);

  const currentLang = i18n.language.startsWith('ar') ? 'ar' : 'en';

  const fetchAddOns = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "addOns"));
      const data: AddOn[] = querySnapshot.docs.map((docSnap) => {
        const docData = docSnap.data();
        return {
          id: docSnap.id,
          name_en: docData.name_en || docData.name || "",
          name_ar: docData.name_ar || "",
          extraPrice: Number(docData.extraPrice) || 0,
        } as AddOn;
      });
      setAddOns(data);
    } catch (error) {
      console.error("Error fetching add-ons:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAddOns();
  }, [fetchAddOns]);

  const resetForm = () => {
    setFormData(defaultAddOnFormState);
    setEditingId(null);
  };

  
  // Refined handleInputChange for better number handling
   const handleRefinedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "extraPrice") {
        // Allow empty string for user to clear input, default to 0 if parsing fails or empty
        const parsedPrice = parseFloat(value);
        setFormData(prev => ({ ...prev, extraPrice: isNaN(parsedPrice) ? (value === '' ? 0 : prev.extraPrice) : parsedPrice }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };


  const handleAddOrUpdate = async () => {
    if (!formData.name_en.trim() && !formData.name_ar.trim()) {
      alert(t('manageAddOns.alerts.nameRequired', "Add-on name (at least in one language) cannot be empty."));
      return;
    }
    // extraPrice is already a number in state due to parseFloat in handleChange or initialization.
    // A check for negative is still good.
    if (formData.extraPrice < 0) {
      alert(t('manageAddOns.alerts.priceNegative', "Extra price cannot be negative."));
      return;
    }

    setIsSubmitting(true);
    const dataToSave = {
      name_en: formData.name_en.trim(),
      name_ar: formData.name_ar.trim(),
      extraPrice: formData.extraPrice, // Already a number
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        const docRef = doc(db, "addOns", editingId);
        await updateDoc(docRef, dataToSave);
        alert(t('manageAddOns.alerts.updateSuccess', 'Add-on updated successfully!'));
      } else {
        // For addDoc, don't include 'updatedAt' in the initial object, let Firestore handle it with 'createdAt'
        await addDoc(collection(db, "addOns"), { ...dataToSave, createdAt: serverTimestamp() });
        alert(t('manageAddOns.alerts.addSuccess', 'Add-on added successfully!'));
      }
      await fetchAddOns();
      resetForm();
    } catch (error) {
      console.error("Error saving add-on:", error);
      alert(t('manageAddOns.alerts.saveFailure', 'Failed to save add-on.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (addOn: AddOn) => {
    setFormData({
      name_en: addOn.name_en || '',
      name_ar: addOn.name_ar || '',
      extraPrice: addOn.extraPrice, // This is already a number from fetchAddOns
    });
    setEditingId(addOn.id || null);
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!window.confirm(t('manageAddOns.confirmDelete', "Are you sure you want to delete this add-on?"))) return;
    try {
      await deleteDoc(doc(db, "addOns", id));
      await fetchAddOns();
      alert(t('manageAddOns.alerts.deleteSuccessSingle', 'Add-on deleted successfully!'));
    } catch (error) {
      console.error("Error deleting add-on:", error);
      alert(t('manageAddOns.alerts.deleteFailureSingle', 'Failed to delete add-on.'));
    }
  };

  const getLocalizedAddOnName = (addOn: AddOn) => {
    return (currentLang === 'ar' && addOn.name_ar) ? addOn.name_ar : addOn.name_en;
  }

  return (
    <div dir={pageDirection} className="container my-5">
      <h2 className="mb-4 text-primary">
        {editingId 
          ? t('manageAddOns.formTitle.edit', 'Edit Add-on') 
          : t('manageAddOns.formTitle.add', 'Add New Add-on')}
      </h2>

      <div className="card shadow-sm mb-5">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="name_en" className="form-label">{t('manageAddOns.labels.nameEn', 'Add-on Name (English)')}<span className="text-danger">*</span></label>
              <input
                type="text" name="name_en" id="name_en" className="form-control form-control-sm"
                value={formData.name_en} onChange={handleRefinedInputChange}
                placeholder={t('manageAddOns.placeholders.nameEn', 'e.g., Extra Cheese')} />
            </div>
            <div className="col-md-6">
              <label htmlFor="name_ar" className="form-label">{t('manageAddOns.labels.nameAr', 'Add-on Name (Arabic)')}<span className="text-danger">*</span></label>
              <input
                type="text" name="name_ar" id="name_ar" className="form-control form-control-sm"
                value={formData.name_ar} onChange={handleRefinedInputChange}
                placeholder={t('manageAddOns.placeholders.nameAr', 'مثال: جبنة إضافية')} dir="rtl" />
            </div>
            <div className="col-md-12">
              <label htmlFor="extraPrice" className="form-label">{t('manageAddOns.labels.extraPrice', 'Extra Price (JD)')}<span className="text-danger">*</span></label>
            <input
              type="number"
              name="extraPrice"
              id="extraPrice"
              min={0}
              step="0.25"
              className="form-control form-control-sm"
              value={
                formData.extraPrice === 0 &&
                !isSubmitting &&
                editingId === null &&
                formData.name_en === '' &&
                formData.name_ar === ''
                  ? ''
                  : Number(formData.extraPrice).toFixed(2)
              }
              onChange={handleRefinedInputChange}
            />

            </div>
          </div>
          <div className="mt-3">
            <button className="btn btn-primary me-2" onClick={handleAddOrUpdate} disabled={isSubmitting}>
              {isSubmitting 
                ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>{t('buttons.saving', 'Saving...')}</>
                : (editingId 
                    ? <><FaSave className="me-1"/> {t('manageAddOns.buttons.update', 'Update Add-on')}</> 
                    : <><FaPlus className="me-1"/> {t('manageAddOns.buttons.add', 'Add Add-on')}</>)
              }
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={isSubmitting}>
                <FaTimes className="me-1"/> {t('buttons.cancel', 'Cancel')}
              </button>
            )}
          </div>
        </div>
      </div>
      
      <hr className="my-4" />

      <h3 className="mb-3">{t('manageAddOns.listTitle', 'Existing Add-ons')}</h3>
      {loading && <div className="text-center"><FaSpinner className="fa-spin fa-2x text-primary" /><p>{t('loadingText', 'Loading...')}</p></div>}
      {!loading && addOns.length === 0 && <p className="text-muted">{t('manageAddOns.noAddOns', 'No add-ons found.')}</p>}

      <div className="row">
        {addOns.map((addOn) => (
          <div key={addOn.id} className="col-md-6 col-lg-4 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body d-flex flex-column">
                <div>
                  <h5 className="card-title">{getLocalizedAddOnName(addOn)}</h5>
                  {currentLang === 'ar' && addOn.name_en && addOn.name_en !== addOn.name_ar ? 
                    <p className="card-text text-muted small">(EN: {addOn.name_en})</p> : null
                  }
                  <p className="card-text">
                    {t('manageAddOns.labels.extraPrice', 'Extra Price')}: {formatPriceForDisplay(addOn.extraPrice, t('currency.jd', 'JD'))}
                  </p>
                </div>
                <div className="mt-auto pt-2">
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(addOn)} title={t('buttons.edit', 'Edit')}><FaEdit /></button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(addOn.id)} title={t('buttons.delete', 'Delete')}><FaTrash /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageAddOns;