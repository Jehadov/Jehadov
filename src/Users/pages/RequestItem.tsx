import React, { useState } from 'react';
import { db } from '../../firebase'; // adjust the import path if needed
import { collection, addDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface RequestFormData {
  name: string;
  description: string;
  quantity: number;
  phone: string;
}

const defaultFormState: RequestFormData = {
  name: '',
  description: '',
  quantity: 0,
  phone: '',
};

const RequestItem: React.FC = () => {
  const { t, i18n } = useTranslation(); // Initialize the hook
  const [formData, setFormData] = useState<RequestFormData>(defaultFormState);
  const [loading, setLoading] = useState(false); // Added loading state for submission feedback
  const [submitted, setSubmitted] = useState(false);

  // Determine the direction based on the current language
  const pageDirection = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseInt(value, 10)) : value
      // Allow empty string for number input temporarily, default to 0 if needed or validate on submit
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation example
    if (!formData.name || !formData.phone || formData.quantity < 1) {
        alert(t('requestItem.alert.validationError', 'Please fill in all required fields and specify a valid quantity.'));
        return;
    }
    setLoading(true);
    setSubmitted(false); 

    const submissionData = {
        ...formData,
        quantity: Number(formData.quantity), // Ensure quantity is a number
        requestedAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'itemRequests'), submissionData);
      setSubmitted(true);
      setFormData(defaultFormState); // Reset form after successful submission
    } catch (error) {
      console.error('Error saving item request:', error);
      alert(t('requestItem.alert.failure', 'Failed to submit request. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    // Wrapper div for page-specific direction control
    <div dir={pageDirection} className={`request-item-page-wrapper lang-${i18n.language}`}>
      <div className="max-w-md mx-auto p-4 bg-white rounded-xl shadow-md mt-6">
        <h2 className="text-xl font-semibold mb-4 text-center"> {/* Centered heading */}
          {t('requestItem.title', 'Request an Item')}
        </h2>
        {submitted ? (
          <div className="text-center p-4">
            <p className="text-green-600 font-medium">
              {t('requestItem.successMessage', "Thanks for your request! We'll get back to you soon.")}
            </p>
            <button 
                onClick={() => setSubmitted(false)}
                className="mt-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-md transition-colors duration-150"
            >
                {t('requestItem.buttons.requestAnother', 'Request Another Item')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              {/* Optional: Add labels for accessibility */}
              {/* <label htmlFor="name" className="sr-only">{t('requestItem.placeholders.itemName', 'Item Name')}</label> */}
              <input
                type="text"
                name="name"
                id="name"
                placeholder={t('requestItem.placeholders.itemName', 'Item Name')}
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              {/* <label htmlFor="description" className="sr-only">{t('requestItem.placeholders.description', 'Why do you need it?')}</label> */}
              <textarea
                name="description"
                id="description"
                placeholder={t('requestItem.placeholders.description', 'Why do you need it? (e.g., brand, size, specific features)')}
                value={formData.description}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                rows={3}
              />
            </div>
            <div>
              {/* <label htmlFor="quantity" className="sr-only">{t('requestItem.placeholders.quantity', 'Quantity')}</label> */}
              <input
                type="number"
                name="quantity"
                id="quantity"
                placeholder={t('requestItem.placeholders.quantity', 'Quantity')}
                min={1} // Requesting at least 1 item
                value={formData.quantity === 0 && !loading ? '' : formData.quantity} // Show empty if 0 for placeholder
                onChange={handleChange}
                required // Made quantity required
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              {/* <label htmlFor="phone" className="sr-only">{t('requestItem.placeholders.phone', 'Your Phone Number')}</label> */}
              <input
                type="tel"
                name="phone"
                id="phone"
                placeholder={t('requestItem.placeholders.phone', 'Your Phone Number')}
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-dark text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading 
                ? t('requestItem.buttons.submitting', 'Submitting...')
                : t('requestItem.buttons.submit', 'Submit Request')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RequestItem;