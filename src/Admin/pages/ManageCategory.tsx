// src/Admin/pages/ManageCategory.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from 'react-i18next';
import type { Category } from '../../Users/pages/types'; // Adjust path to your types.ts
import { FaEdit, FaTrash, FaPlus, FaSave, FaTimes, FaSpinner } from 'react-icons/fa';


interface CategoryFormData {
  name_en: string;
  name_ar: string;
  image?: string;
}

const defaultCategoryFormState: CategoryFormData = {
  name_en: '',
  name_ar: '',
  image: '',
};

const ManageCategory: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<CategoryFormData>(defaultCategoryFormState);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // For fetching list
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
  const pageDirection = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const currentLang = i18n.language.startsWith('ar') ? 'ar' : 'en';

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const cats: Category[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name_en: data.name_en || data.name || '', // Fallback for old data
          name_ar: data.name_ar || '',
          image: data.image || '',
        } as Category; // Cast to your Category type from types.ts
      });
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert(t('manageCategories.alerts.fetchFailed', 'Failed to fetch categories.'));
    }
    setLoading(false);
  }, [t]); // Added t to dependencies as it's used in error alert

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(defaultCategoryFormState);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_en.trim() && !formData.name_ar.trim()) {
      alert(t('manageCategories.alerts.nameRequired', 'Category name (in at least one language) is required.'));
      return;
    }
    setIsSubmitting(true);

    const dataToSave = {
      name_en: formData.name_en.trim(),
      name_ar: formData.name_ar.trim(),
      image: formData.image?.trim() || '',
      updatedAt: serverTimestamp()
    };

    try {
      if (editId) {
        const docRef = doc(db, 'categories', editId);
        await updateDoc(docRef, dataToSave);
        alert(t('manageCategories.alerts.updateSuccess', 'Category updated successfully!'));
      } else {
        await addDoc(collection(db, 'categories'), { ...dataToSave, createdAt: serverTimestamp() });
        alert(t('manageCategories.alerts.addSuccess', 'Category added successfully!'));
      }
      resetForm();
      fetchCategories(); // Refetch categories after save
    } catch (error) {
      console.error('Error saving category:', error);
      alert(t('manageCategories.alerts.saveFailed', 'Failed to save category.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (category: Category) => {
    setFormData({
      name_en: category.name_en || '',
      name_ar: category.name_ar || '',
      image: category.image || '',
    });
    setEditId(category.id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('manageCategories.confirmDelete', 'Are you sure you want to delete this category?'))) return;

    try {
      await deleteDoc(doc(db, 'categories', id));
      alert(t('manageCategories.alerts.deleteSuccessSingle', 'Category deleted successfully!'));
      fetchCategories(); // Refetch categories
      if (id === editId) { // If deleting the category being edited, reset form
        resetForm();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(t('manageCategories.alerts.deleteFailureSingle', 'Failed to delete category.'));
    }
  };
  
  const getLocalizedCategoryName = (category: Category) => {
    return (currentLang === 'ar' && category.name_ar) ? category.name_ar : category.name_en;
  };

  return (
    <div dir={pageDirection} className="container my-5">
      <h2 className="mb-4 text-primary">
        {editId ? t('manageCategories.formTitle.edit', 'Edit Category') : t('manageCategories.formTitle.add', 'Add New Category')}
      </h2>

      <form onSubmit={handleSubmit} className="mb-5 p-4 border rounded shadow-sm bg-light">
        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="name_en" className="form-label">
              {t('manageCategories.labels.nameEn', 'Category Name (English)')} <span className="text-danger">*</span>
            </label>
            <input
              type="text" name="name_en" id="name_en"
              className="form-control form-control-sm"
              placeholder={t('manageCategories.placeholders.nameEn', 'e.g., Electronics')}
              value={formData.name_en}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="name_ar" className="form-label">
              {t('manageCategories.labels.nameAr', 'Category Name (Arabic)')} <span className="text-danger">*</span>
            </label>
            <input
              type="text" name="name_ar" id="name_ar"
              className="form-control form-control-sm"
              placeholder={t('manageCategories.placeholders.nameAr', 'مثال: إلكترونيات')}
              value={formData.name_ar}
              onChange={handleInputChange}
              dir="rtl"
            />
          </div>
          <div className="col-12">
            <label htmlFor="imageUrl" className="form-label">
              {t('manageCategories.labels.imageUrl', 'Image URL (Optional)')}
            </label>
            <input
              type="text" name="image" id="imageUrl"
              className="form-control form-control-sm"
              placeholder={t('manageCategories.placeholders.imageUrl', 'https://example.com/image.png')}
              value={formData.image || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className="mt-3">
          <button type="submit" className="btn btn-primary me-2" disabled={isSubmitting}>
            {isSubmitting 
              ? <><FaSpinner className="fa-spin me-1" />{t('buttons.saving', 'Saving...')}</>
              : (editId 
                  ? <><FaSave className="me-1" />{t('manageCategories.buttons.update', 'Update Category')}</>
                  : <><FaPlus className="me-1" />{t('manageCategories.buttons.add', 'Add Category')}</>)
            }
          </button>
          {editId && (
            <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={isSubmitting}>
              <FaTimes className="me-1" />{t('buttons.cancel', 'Cancel')}
            </button>
          )}
        </div>
      </form>

      <h3 className="mb-3">{t('manageCategories.listTitle', 'Existing Categories')}</h3>
      {loading && <div className="text-center py-3"><FaSpinner className="fa-spin fa-2x text-primary" /><p className="mt-2">{t('loadingText', 'Loading...')}</p></div>}
      {!loading && categories.length === 0 && (
        <p className="text-muted">{t('manageCategories.noCategories', 'No categories found. Please add some!')}</p>
      )}
      {!loading && categories.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered table-hover table-striped">
            <thead className="table-light">
              <tr>
                <th>{t('manageCategories.tableHeaders.image', 'Image')}</th>
                <th>{t('manageCategories.tableHeaders.name', 'Name')}</th>
                <th style={{ width: '150px' }}>{t('manageCategories.tableHeaders.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td>
                    {cat.image ? (
                      <img src={cat.image} alt={getLocalizedCategoryName(cat)} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <span className="text-muted small">{t('manageCategories.noImage', 'No image')}</span>
                    )}
                  </td>
                  <td>{getLocalizedCategoryName(cat)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => startEdit(cat)} title={t('buttons.edit', 'Edit')}><FaEdit /></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => cat.id && handleDelete(cat.id)} title={t('buttons.delete', 'Delete')}><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageCategory;