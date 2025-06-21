import React, { useState } from 'react'; // Ensured React is imported for FC
import { useTranslation } from 'react-i18next'; // Import useTranslation
import i18n from '../../i18n';

// Define a strict type for our shipping data.
interface AddressData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  city: string;
  country: string;
}

// Use the new AddressData type in the component's props
interface CheckoutShippingProps {
  initialData: AddressData;
  onNext: (data: AddressData) => void;
}

// Assuming jordanianCities is defined or imported elsewhere if still needed for the dropdown.
// If it's only for this component, defining it here is fine.
const jordanianCities = [
    "Irbid", "Amman", "Zarqa", "Aqaba", "Salt", 
    "Jerash", "Karak", "Madaba", "Mafraq", "Tafilah", "Maan"
];

export default function CheckoutShipping({ initialData, onNext }: CheckoutShippingProps) {
  const { t } = useTranslation(); // Initialize the hook
  const [formData, setFormData] = useState<AddressData>(initialData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const pageDirection = i18n.language === 'ar' ? 'rtl' : 'ltr';


  return (
    // This component will inherit the global page direction (LTR by your preference)
    <div dir={pageDirection} className={`checkout-shipping-wrapper lang-${i18n.language}`}> {/* Optional: lang class */}
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <h2 className="mb-4">{t('checkoutShippingPage.title', 'Shipping Information')}</h2>
            <form onSubmit={handleSubmit} className="row g-3">
              {/* First Name */}
              <div className="col-md-6">
                <label htmlFor="firstName" className="form-label">
                  {t('checkoutShippingPage.labels.firstName', 'First Name')} 
                  <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder={t('checkoutShippingPage.placeholders.firstName', 'Enter first name')}
                  required
                />
              </div>

              {/* Last Name */}
              <div className="col-md-6">
                <label htmlFor="lastName" className="form-label">
                  {t('checkoutShippingPage.labels.lastName', 'Last Name')}
                  <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder={t('checkoutShippingPage.placeholders.lastName', 'Enter last name')}
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="col-12">
                <label htmlFor="phoneNumber" className="form-label">
                    {t('checkoutShippingPage.labels.phoneNumber', 'Phone Number')}
                    <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  className="form-control"
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder={t('checkoutShippingPage.placeholders.phoneNumber', '07...')}
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Address */}
              <div className="col-12">
                <label htmlFor="address" className="form-label">
                    {t('checkoutShippingPage.labels.address', 'Address (Street, Building, Apartment)')}
                    <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="address"
                  name="address"
                  placeholder={t('checkoutShippingPage.placeholders.address', 'e.g., University Street, Al-Amal Bldg, Apt 5')}
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* City */}
              <div className="col-md-6">
                <label htmlFor="city" className="form-label">
                    {t('checkoutShippingPage.labels.city', 'City')}
                    <span className="text-danger">*</span>
                </label>
                <select
                  id="city"
                  name="city"
                  className="form-select"
                  value={formData.city}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>{t('checkoutShippingPage.placeholders.chooseCity', 'Choose...')}</option>
                  {jordanianCities.map(city => (
                    // For city names in the dropdown, if they need translation,
                    // they should ideally come from a translated list or your translation JSON.
                    // For now, displaying them as is.
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              
              {/* Country (Read-only) */}
              <div className="col-md-6">
                  <label htmlFor="country" className="form-label">
                    {t('checkoutShippingPage.labels.country', 'Country')}
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="country" 
                    name="country"
                    value={formData.country} // Assuming this is pre-filled, e.g., "Jordan"
                    readOnly 
                    disabled // Good for read-only fields that are pre-determined
                  />
              </div>

              {/* Submit Button */}
              <div className="col-12 text-end mt-4"> {/* text-end will align to right in LTR */}
                <button type="submit" className="btn btn-primary">
                  {t('checkoutShippingPage.buttons.continueToPayment', 'Continue to Payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}