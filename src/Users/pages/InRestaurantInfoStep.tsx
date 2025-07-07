import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InRestaurantInfoStepProps {
  onNext: (data: { tableNumber: string }) => void;
  onBack?: () => void;
}

export default function InRestaurantInfoStep({ onNext, onBack }: InRestaurantInfoStepProps) {
  const { t } = useTranslation();
  const [tableNumber, setTableNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      alert(t('inRestaurant.validation', 'Please enter your table number.'));
      return;
    }
    onNext({ tableNumber });
  };

  return (
    <div className="container my-4" style={{ maxWidth: 500 }}>
      <h2 className="mb-4">{t('inRestaurant.title', 'Table Information')}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">
            {t('inRestaurant.tableNumberLabel', 'Table Number')}
            <span className="text-danger">*</span>
          </label>
          <input
            className="form-control"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder={t('inRestaurant.tablePlaceholder', 'Enter your table number')}
            required
            autoFocus
          />
        </div>

        <div className="d-flex justify-content-between mt-4">
          {onBack && (
            <button type="button" className="btn btn-outline-secondary" onClick={onBack}>
              {t('common.back', 'Back')}
            </button>
          )}
          <button type="submit" className="btn btn-primary">
            {t('common.next', 'Next')}
          </button>
        </div>
      </form>
    </div>
  );
}