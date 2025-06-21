import React, { useState } from 'react'; // Added React for FC type
import { useCart } from './CartContext'; // Adjust path if needed
import { useTranslation } from 'react-i18next'; // Import useTranslation

// Define the type for the payment data
interface PaymentData {
  method: 'card' | 'efawateercom' | 'cash';
}

// Define the precise props that this component expects to receive from the stepper
interface CheckoutPaymentProps {
  initialData: PaymentData;
  onNext: (data: { payment: PaymentData }) => void;
  onBack: () => void;
}

export default function CheckoutPayment({ initialData, onNext, onBack }: CheckoutPaymentProps) {
  const { t, i18n } = useTranslation(); // Initialize the hook
  const { cart } = useCart();
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [paymentMethod, setPaymentMethod] = useState(initialData.method || 'card');

  // Determine the direction based on the current language
  const pageDirection = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      payment: {
        method: paymentMethod,
      }
    });
  };

  return (
    // Wrapper div for page-specific direction control
    <div dir={pageDirection} className={`checkout-payment-wrapper lang-${i18n.language}`}>
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <form onSubmit={handleSubmit}>
              <h2 className="mb-4">{t('checkoutPaymentPage.title', 'Payment Method')}</h2>

              <div className="alert alert-info">
                <strong>{t('checkoutPaymentPage.orderTotalLabel', 'Order Total:')} {totalAmount.toFixed(2)} {t('currency.jd', 'JD')}</strong>
              </div>

              <div className="list-group mb-4">
                <label className="list-group-item list-group-item-action d-flex align-items-center cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    className="form-check-input me-3" // me-3 will become margin-end in RTL if Bootstrap RTL is active globally, or style manually
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                  />
                  {t('checkoutPaymentPage.methods.card', 'Credit / Debit Card')}
                </label>
                <label className="list-group-item list-group-item-action d-flex align-items-center cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    className="form-check-input me-3"
                    checked={paymentMethod === 'efawateercom'}
                    onChange={() => setPaymentMethod('efawateercom')}
                  />
                  {t('checkoutPaymentPage.methods.efawateercom', 'eFAWATEERcom')}
                </label>
                
                <label className="list-group-item list-group-item-action d-flex align-items-center cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    className="form-check-input me-3"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                  />
                  {t('checkoutPaymentPage.methods.cash', 'Cash on Delivery')}
                </label>
              </div>

              {paymentMethod === 'cash' && (
                <div className="info-placeholder p-3 border rounded bg-light mb-3 text-start"> {/* Added text-start */}
                  <p className="mb-0">{t('checkoutPaymentPage.cashInfo', 'You will pay the courier in cash when your order arrives.')}</p>
                </div>
              )}
              
              {paymentMethod === 'card' && (
                <div className="card-details-placeholder p-3 border rounded bg-light mb-3 text-start"> {/* Added text-start */}
                  {/* Your original text below. My previous suggestion had a more detailed security notice. */}
                  <p className="fw-semibold mb-0">{t('checkoutPaymentPage.cardInfo', 'A secure form for card details from your payment provider will be rendered here.')}</p>
                </div>
              )}

              <div className="d-flex justify-content-between mt-4">
                <button type="button" onClick={onBack} className="btn btn-secondary">
                  {t('checkoutPaymentPage.buttons.backToShipping', 'Back to Shipping')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('checkoutPaymentPage.buttons.continueToReview', 'Continue to Review')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}