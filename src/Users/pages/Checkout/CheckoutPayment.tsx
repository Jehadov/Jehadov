import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PaymentData } from '../types'; // Adjust path as needed

interface CheckoutPaymentProps {
  initialData: PaymentData;
  onNext: (data: { payment: PaymentData }) => void;
  onBack: () => void;
}

export default function CheckoutPayment({
  initialData,
  onNext,
  onBack,
}: CheckoutPaymentProps) {
  const { t, i18n } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<PaymentData['method']>(
    initialData.method
  );

  const pageDirection = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) return;
    onNext({ payment: { method: selectedMethod } });
  };

  return (
    <div dir={pageDirection} className={`container my-5 lang-${i18n.language}`}>
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <h2 className="mb-4">{t('checkoutPaymentPage.title', 'Select Payment Method')}</h2>

          <form onSubmit={handleSubmit}>
            <div className="list-group">
              {/* Cash */}
              <label className={`list-group-item ${selectedMethod === 'cash' ? 'active' : ''}`}>
                <input
                  type="radio"
                  className="form-check-input me-2"
                  name="paymentMethod"
                  value="cash"
                  checked={selectedMethod === 'cash'}
                  onChange={() => setSelectedMethod('cash')}
                />
                {t('checkoutPaymentPage.methods.cash', 'Cash')}
              </label>

              {/* CliQ */}
              <label className={`list-group-item ${selectedMethod === 'cliq' ? 'active' : ''}`}>
                <input
                  type="radio"
                  className="form-check-input me-2"
                  name="paymentMethod"
                  value="cliq"
                  checked={selectedMethod === 'cliq'}
                  onChange={() => setSelectedMethod('cliq')}
                />
                {t('checkoutPaymentPage.methods.cliq', 'CliQ Payment')}
              </label>
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-between mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onBack}
              >
                {t('checkoutPaymentPage.buttons.back', 'Back')}
              </button>
              <button type="submit" className="btn btn-primary">
                {t('checkoutPaymentPage.buttons.continue', 'Continue to Review')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
