import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PickupInfoStepProps {
  initialName?: string;
  onNext: (data: { name: string; phoneNumber: string }) => void;
  onBack?: () => void;
}

export default function PickupInfoStep({ initialName = '', onNext, onBack }: PickupInfoStepProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim()) {
      alert(t('pickupInfo.validation', 'Please enter your name and phone number.'));
      return;
    }
    onNext({ name, phoneNumber });
  };

  return (
    <div className="container my-4" style={{ maxWidth: 500 }}>
      <h2 className="mb-4">{t('pickupInfo.title', 'Pickup Information')}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">
            {t('pickupInfo.nameLabel', 'Name')}
            <span className="text-danger">*</span>
          </label>
          <input
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            {t('pickupInfo.phoneLabel', 'Phone Number')}
            <span className="text-danger">*</span>
          </label>
          <input
            className="form-control"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder={t('pickupInfo.phonePlaceholder', '07...')}
            required
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