import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ServiceMethod } from '../types';

interface CheckoutMethodSelectorProps {
  onSelect: (method: ServiceMethod) => void;
}

export default function CheckoutMethodSelector({ onSelect }: CheckoutMethodSelectorProps) {
  const { t, i18n } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<ServiceMethod | ''>('');

  const pageDirection = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const handleContinue = () => {
    if (!selectedMethod) return;
    onSelect(selectedMethod);
  };

  return (
    <div dir={pageDirection} className="container my-5">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <h2 className="mb-4">
            {t('checkout.serviceMethodSelector.title', 'How would you like to receive your order?')}
          </h2>

          <div className="list-group mb-4">
            <label className={`list-group-item ${selectedMethod === 'delivery' ? 'active' : ''}`}>
              <input
                type="radio"
                className="form-check-input me-2"
                name="serviceMethod"
                value="delivery"
                checked={selectedMethod === 'delivery'}
                onChange={() => setSelectedMethod('delivery')}
              />
              {t('checkout.serviceMethodSelector.delivery', 'Delivery')}
            </label>

            <label className={`list-group-item ${selectedMethod === 'pickup' ? 'active' : ''}`}>
              <input
                type="radio"
                className="form-check-input me-2"
                name="serviceMethod"
                value="pickup"
                checked={selectedMethod === 'pickup'}
                onChange={() => setSelectedMethod('pickup')}
              />
              {t('checkout.serviceMethodSelector.pickup', 'Pickup / Takeaway')}
            </label>

            <label className={`list-group-item ${selectedMethod === 'inRestaurant' ? 'active' : ''}`}>
              <input
                type="radio"
                className="form-check-input me-2"
                name="serviceMethod"
                value="inRestaurant"
                checked={selectedMethod === 'inRestaurant'}
                onChange={() => setSelectedMethod('inRestaurant')}
              />
              {t('checkout.serviceMethodSelector.inRestaurant', 'In Restaurant')}
            </label>
          </div>

          <div className="mt-4 text-end">
            <button
              className="btn btn-primary"
              onClick={handleContinue}
              disabled={!selectedMethod}
            >
              {t('checkout.serviceMethodSelector.continueButton', 'Continue')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}