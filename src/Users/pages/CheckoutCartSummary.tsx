import { useCart } from './CartContext';
import { useTranslation } from 'react-i18next';

export default function CheckoutCartSummary() {
  const { cart } = useCart();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language.startsWith('ar') ? 'ar' : 'en';

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const getLocalizedDataDisplay = (item: any, fieldPrefix: string, fallbackToEnglishFieldKey?: string): string => {
    if (!item) return fallbackToEnglishFieldKey && item ? item[fallbackToEnglishFieldKey] || '' : '';
    const langField = item[`${fieldPrefix}_${currentLang}`];
    const englishField = item[fallbackToEnglishFieldKey || `${fieldPrefix}_en`];
    const baseField = item[fieldPrefix]; // Fallback for non-suffixed fields
    return langField || englishField || baseField || '';
  };

  return (
    <>
      <h5 className="card-title mb-3">
        {t('checkoutReviewPage.orderSummary.title', 'Order Summary')}
      </h5>

      <ul className="list-group list-group-flush mb-4">
        {cart.map(item => (
          <li
            key={item.id + (item.variant?.value || '') + (item.addOns?.map(a => a.id).join('-') || '')}
            className="list-group-item d-flex justify-content-between align-items-start px-0 py-2"
          >
            <div className="me-3">
              <div className="fw-medium">{item.name}</div>
              <small className="d-block text-muted">
                {item.variant?.name}: {item.variant?.value || ''} × {item.quantity}
              </small>

              {item.addOns && item.addOns.length > 0 && (
                <ul className="list-unstyled mb-0 mt-1 ps-2">
                  {item.addOns.map(addOn => (
                    <li key={addOn.id} className="text-muted small">
                      + {getLocalizedDataDisplay(addOn, 'name', 'name_en')}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <span className="fw-medium">
              {(item.price * item.quantity).toFixed(2)} {t('currency.jd', 'JD')}
            </span>
          </li>
        ))}

        <li className="list-group-item d-flex justify-content-between align-items-center px-0 pt-3 mt-2 border-top fw-bold fs-5">
          <span>{t('checkoutReviewPage.orderSummary.total', 'Total')}</span>
          <span>{totalAmount.toFixed(2)} {t('currency.jd', 'JD')}</span>
        </li>
      </ul>
    </>
  );
}

