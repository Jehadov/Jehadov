import { useTranslation } from 'react-i18next';
import type { ConfirmedOrderData } from './types';

interface CheckoutCompleteProps {
  confirmedOrderData: ConfirmedOrderData | null;
  onReset: () => void;
}

export default function CheckoutComplete({ confirmedOrderData, onReset }: CheckoutCompleteProps) {
  const { t } = useTranslation();

  if (!confirmedOrderData) {
    return (
      <div className="alert alert-warning" role="alert">
        {t('checkout.complete.noOrder')}
      </div>
    );
  }

  const { orderId, totalAmount, payment, serviceMethod, tableNumber } = confirmedOrderData;

  return (
    <div className="container my-5 text-center">
      <div className="card shadow-sm p-4">
        <h2 className="mb-4 text-success">
          {t('checkout.complete.thankYou')}
        </h2>
        
        <div className="order-details text-start mb-4">
          <p>
            {t('checkout.complete.orderId')}: 
            <strong> {orderId ?? t('checkout.complete.noOrderId')}</strong>
          </p>
          
          {totalAmount && (
            <p>
              {t('checkout.complete.totalPaid')}: 
              <strong> {totalAmount.toFixed(2)} {t('currency.jd')}</strong>
            </p>
          )}
          
          <p>
            {t('checkout.complete.paymentMethod')}: 
            <strong> {t(`checkout.paymentMethods.${payment.method}`)}</strong>
          </p>
          
          <p>
            {t('checkout.complete.serviceMethod')}: 
            <strong> {t(`checkout.serviceMethods.${serviceMethod}`)}</strong>
          </p>
          
          {serviceMethod === 'inRestaurant' && tableNumber && (
            <p>
              {t('checkout.complete.tableNumber')}: 
              <strong> {tableNumber}</strong>
            </p>
          )}
        </div>
        
        <p className="mb-4">
          {t('checkout.complete.confirmationMessage')}
        </p>
        
        <button 
          onClick={onReset} 
          className="btn btn-primary"
        >
          {t('checkout.complete.newOrder')}
        </button>
      </div>
    </div>
  );
}