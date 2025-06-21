import React, { useState, useMemo, useEffect } from 'react';
import { 
    type Variant, 
    type VariantOption,
    type VariantOfferType,
    defaultVariant, 
    defaultOption 
} from '../../Users/pages/types';
import { FaEdit, FaTrash, FaPlus, FaSave, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface ManagerVariantProps {
  variants: Variant[];
  onVariantsChange: (variants: Variant[]) => void;
}

const ManagerVariant: React.FC<ManagerVariantProps> = ({ 
    variants, 
    onVariantsChange,
}) => {
  const { t, i18n } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const [formState, setFormState] = useState<Variant>(() => JSON.parse(JSON.stringify(defaultVariant)));

  const displayLang = i18n.language.startsWith('ar') ? 'ar' : 'en';

  const getLocalizedText = (item: any, fieldPrefix: string, fallback?: string): string => {
    if (!item) return fallback || '';
    const langField = item[`${fieldPrefix}_${displayLang}`];
    const englishField = item[`${fieldPrefix}_en`];
    const baseField = item[fieldPrefix];
    return langField || englishField || baseField || fallback || '';
  };

  const isFormValid = useMemo(() => {
    if (!formState.name_en?.trim()) return false; 
    if (formState.options.length === 0) return false;
    return formState.options.every(opt => opt.value_en?.trim() !== '' && (opt.originalPrice || 0) >= 0);
  }, [formState]);

  useEffect(() => {
    setFormState(currentFormState => {
        const newOptions = currentFormState.options.map(opt => {
            const originalPrice = opt.originalPrice || 0;
            const offerType = opt.offerType || 'none';
            const offerValue = opt.offerValue || 0;
            let newPrice = originalPrice;

            if (offerType === 'percentage') {
                newPrice = originalPrice - (originalPrice * (offerValue / 100));
            } else if (offerType === 'fixed') {
                newPrice = originalPrice - offerValue;
            }

            newPrice = Math.max(0, parseFloat(newPrice.toFixed(2)));

            if (newPrice !== opt.price) {
                return { ...opt, price: newPrice };
            }
            return opt;
        });

        if (JSON.stringify(newOptions) !== JSON.stringify(currentFormState.options)) {
            return { ...currentFormState, options: newOptions };
        }
        return currentFormState;
    });
  }, [formState.options.map(o => `${o.originalPrice}-${o.offerType}-${o.offerValue}`).join(',')]);


  const resetAndCloseForm = () => {
    setFormState(JSON.parse(JSON.stringify(defaultVariant))); 
    setEditingIndex(null);
    setShowForm(false);
  };

  const handleAddNewClick = () => {
    setFormState(JSON.parse(JSON.stringify(defaultVariant))); 
    setEditingIndex(null);
    setShowForm(true);
  };

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    const variantToEdit = JSON.parse(JSON.stringify(variants[index]));
    variantToEdit.options = variantToEdit.options.map((opt: VariantOption) => ({
        ...defaultOption,
        ...opt,
        originalPrice: opt.originalPrice || opt.price,
    }));
    setFormState(variantToEdit);
    setShowForm(true);
  };

  const handleDeleteClick = (index: number) => {
    if (window.confirm(t('managerVariant.confirmDeleteVariant', 'Are you sure you want to delete this variant type and all its options?'))) {
      const newVariants = variants.filter((_, i) => i !== index);
      onVariantsChange(newVariants);
      if (editingIndex === index) {
        resetAndCloseForm();
      }
    }
  };

  const handleSaveClick = () => {
    if (!isFormValid) {
        alert(t('managerVariant.validation.fillRequiredEnFields'));
        return;
    }
    const updatedVariants = [...variants];
    
    const finalFormState = {
        ...formState,
        options: formState.options.map(opt => {
            if (opt.offerType === 'none' || !opt.offerType) {
                const { offerType, offerValue, originalPrice, ...rest } = opt;
                return { ...rest, price: originalPrice || opt.price, originalPrice: 0 };
            }
            return opt;
        })
    };

    if (editingIndex !== null) {
      updatedVariants[editingIndex] = finalFormState;
    } else {
      if (variants.some(v => v.name_en?.toLowerCase() === formState.name_en?.toLowerCase())) {
          alert(t('managerVariant.validation.nameExists', {name: formState.name_en}));
          return;
      }
      updatedVariants.push(finalFormState);
    }
    onVariantsChange(updatedVariants);
    resetAndCloseForm();
  };
  
  const handleVariantGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>, lang: 'en' | 'ar') => {
    const { value } = e.target;
    setFormState(prev => ({ ...prev, [`name_${lang}`]: value }));
  };

  const handleOptionDetailChange = (optionIndex: number, field: keyof VariantOption, value: string | number) => {
    setFormState(prev => {
        const newOptions = [...prev.options];
        const optionToUpdate = { ...newOptions[optionIndex] };

        if (field === 'price' || field === 'quantity' || field === 'originalPrice' || field === 'offerValue') {
            const numericValue = parseFloat(value as string);
            (optionToUpdate as any)[field] = isNaN(numericValue) ? 0 : numericValue;
        } else {
            (optionToUpdate as any)[field] = value;
        }
        
        newOptions[optionIndex] = optionToUpdate;
        return { ...prev, options: newOptions };
    });
  };

  const addOptionRow = () => {
    setFormState(prev => ({
      ...prev,
      options: [...prev.options, JSON.parse(JSON.stringify(defaultOption))], 
    }));
  };

  const deleteOptionRow = (optionIndex: number) => {
    if (formState.options.length <= 1) {
        alert(t('managerVariant.validation.minOneOption'));
        return;
    }
    setFormState(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== optionIndex),
    }));
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
        <h5 className="mb-0 text-primary">{t('managerVariant.title', 'Manage Variants & Options')}</h5>
        {!showForm && (
          <button type="button" className="btn btn-primary btn-sm" onClick={handleAddNewClick}>
            <FaPlus className="me-1" /> {t('managerVariant.buttons.addVariantType', 'Add Variant Type')}
          </button>
        )}
      </div>
      <div className="card-body">
        {showForm && (
          <div className="mb-3 p-3 border rounded bg-light">
            <h6 className="fw-semibold">
              {editingIndex !== null 
                ? t('managerVariant.formTitle.edit', { name: getLocalizedText(variants[editingIndex], 'name', variants[editingIndex].name_en) }) 
                : t('managerVariant.formTitle.add', 'Add New Variant Type')}
            </h6>
            
            <div className="row gx-2 mb-3">
              <div className="col-md-6">
                <label htmlFor="variantName_en" className="form-label small">{t('managerVariant.labels.variantTypeNameEn', 'Variant Type Name (English)')} <span className="text-danger">*</span></label>
                <input id="variantName_en" type="text" className="form-control form-control-sm" 
                       placeholder={t('managerVariant.placeholders.variantTypeNameEn', 'e.g., Size')} 
                       value={formState.name_en || ''} 
                       onChange={(e) => handleVariantGroupNameChange(e, 'en')} required />
              </div>
              <div className="col-md-6">
                <label htmlFor="variantName_ar" className="form-label small">{t('managerVariant.labels.variantTypeNameAr', 'Variant Type Name (Arabic)')}</label>
                <input id="variantName_ar" type="text" className="form-control form-control-sm" 
                       placeholder={t('managerVariant.placeholders.variantTypeNameAr', 'مثال: الحجم')} 
                       value={formState.name_ar || ''} 
                       onChange={(e) => handleVariantGroupNameChange(e, 'ar')} dir="rtl" />
              </div>
            </div>

            <div className="mb-2">
              <h6 className="form-label fw-semibold mb-2">{t('managerVariant.labels.optionsFor', 'Options for "{{variantName}}"', { variantName: getLocalizedText(formState, 'name', formState.name_en) })}</h6>
              
              {formState.options.map((option, idx) => {
                const offerType = option.offerType || 'none';
                return (
                    <div key={idx} className="bg-white border rounded p-3 mb-3">
                        <div className="row g-3">
                            <div className="col-12 col-md-6 col-lg-3">
                                <label className="form-label small">{t('managerVariant.tableHeaders.valueEn', 'Value (En)')}*</label>
                                <input type="text" className="form-control form-control-sm" value={option.value_en || ''} onChange={(e) => handleOptionDetailChange(idx, 'value_en', e.target.value)} required />
                            </div>
                            <div className="col-12 col-md-6 col-lg-3">
                                <label className="form-label small">{t('managerVariant.tableHeaders.valueAr', 'Value (Ar)')}</label>
                                <input type="text" className="form-control form-control-sm" value={option.value_ar || ''} onChange={(e) => handleOptionDetailChange(idx, 'value_ar', e.target.value)} dir="rtl" />
                            </div>
                            <div className="col-12 col-md-6 col-lg-4">
                                <label className="form-label small">{t('managerVariant.tableHeaders.imgUrl', 'Image URL')}</label>
                                <input type="text" className="form-control form-control-sm" placeholder="https://" value={option.imageUrl || ''} onChange={(e) => handleOptionDetailChange(idx, 'imageUrl', e.target.value)} />
                            </div>
                            <div className="col-12 col-md-6 col-lg-2">
                                <label className="form-label small">{t('managerVariant.tableHeaders.qty', 'Stock Qty')}</label>
                                <input type="number" min="0" className="form-control form-control-sm" value={option.quantity} onChange={(e) => handleOptionDetailChange(idx, 'quantity', e.target.value)} />
                            </div>
                        </div>
                        <hr className="my-3"/>
                        <div className="row g-3 align-items-end">
                             <div className="col-12 col-md-6 col-lg-3">
                                <label className="form-label small">{t('managerVariant.tableHeaders.originalPrice', 'Original Price')}*</label>
                                <input type="number" step="0.01" min="0" className="form-control form-control-sm" value={option.originalPrice || 0} onChange={(e) => handleOptionDetailChange(idx, 'originalPrice', e.target.value)} required />
                            </div>
                             <div className="col-12 col-md-6 col-lg-4">
                                <label className="form-label small">{t('managerVariant.tableHeaders.offer', 'Offer')}</label>
                                <div className="input-group input-group-sm">
                                    <select className="form-select" value={offerType} onChange={(e) => handleOptionDetailChange(idx, 'offerType', e.target.value as VariantOfferType)}>
                                        <option value="none">No Offer</option>
                                        <option value="percentage">Percentage %</option>
                                        <option value="fixed">Fixed Amount</option>
                                    </select>
                                    {offerType !== 'none' && <input type="number" className="form-control" placeholder={offerType === 'percentage' ? '%' : 'JD'} value={option.offerValue || 0} onChange={e => handleOptionDetailChange(idx, 'offerValue', parseFloat(e.target.value) || 0)} />}
                                </div>
                            </div>
                            <div className="col-12 col-md-6 col-lg-3">
                                <label className="form-label small">{t('managerVariant.tableHeaders.finalPrice', 'Final Price')}</label>
                                <input type="text" className="form-control form-control-sm bg-light" value={`${option.price.toFixed(2)} ${t('currency.jd')}`} readOnly disabled title={t('managerVariant.tooltips.finalPrice', 'Final price is calculated automatically.')} />
                            </div>
                            <div className="col-12 col-md-6 col-lg-2 d-flex justify-content-end align-items-end">
                                <button type="button" className="btn btn-outline-danger btn-sm w-100" onClick={() => deleteOptionRow(idx)} disabled={formState.options.length <= 1} title={t('managerVariant.buttons.deleteOption', 'Delete Option')}><FaTrash /></button>
                            </div>
                        </div>
                    </div>
                );
              })}
              <button type="button" className="btn btn-outline-secondary btn-sm mt-2" onClick={addOptionRow}>
                <FaPlus className="me-1" /> {t('managerVariant.buttons.addOptionValue')}
              </button>
            </div>
            
            <hr className="my-3"/>
            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={resetAndCloseForm}><FaTimes className="me-1" /> {t('buttons.cancel')}</button>
              <button type="button" className="btn btn-success" onClick={handleSaveClick} disabled={!isFormValid}><FaSave className="me-1" /> {t('managerVariant.buttons.saveVariantType')}</button>
            </div>
          </div>
        )}

        {variants.length > 0 && !showForm && (
            variants.map((variant, idx) => (
              <div key={idx} className="d-flex justify-content-between align-items-center border p-2 mb-2 rounded bg-white">
                <div>
                  <strong className="d-block">{getLocalizedText(variant, 'name', variant.name_en)}</strong>
                  <small className="text-muted">
                    {t('managerVariant.display.optionsLabel', 'Options:')} {variant.options.map((o) => getLocalizedText(o, 'value', o.value_en)).join(', ')}
                  </small>
                </div>
                <div>
                  <button type="button" className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEditClick(idx)} title={t('managerVariant.buttons.editVariantType', 'Edit Variant Type')}><FaEdit /></button>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteClick(idx)} title={t('managerVariant.buttons.deleteVariantType', 'Delete Variant Type')}><FaTrash /></button>
                </div>
              </div>
            ))
        )}
        {variants.length === 0 && !showForm && (
            <div className="text-center text-muted p-3">{t('managerVariant.noVariantsYet', 'No variant types created yet. Click "Add Variant Type" to define options.')}</div>
        )}
      </div>
    </div>
  );
};

export default ManagerVariant;
