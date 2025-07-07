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
        {t('checkout.complete.noOrder', 'No order data available.')}
      </div>
    );
  }

  const { orderId, totalAmount, payment, serviceMethod, tableNumber } = confirmedOrderData;

  return (
    <div className="container my-5 text-center">
      <div className="card shadow-sm p-4">
        <h2 className="mb-4 text-success">
          {t('checkout.complete.thankYou', 'Thank you for your order!')}
        </h2>
        
        <div className="order-details text-start mb-4">
          <p>
            {t('checkout.complete.orderId', 'Order ID')}: 
            <strong> {orderId ?? t('checkout.complete.noOrderId', 'N/A')}</strong>
          </p>
          
          {totalAmount && (
            <p>
              {t('checkout.complete.totalPaid', 'Total Paid')}: 
              <strong> {totalAmount.toFixed(2)} JD</strong>
            </p>
          )}
          
          <p>
            {t('checkout.complete.paymentMethod', 'Payment Method')}: 
            <strong> {t(`checkout.paymentMethods.${payment.method}`, payment.method)}</strong>
          </p>
          
          <p>
            {t('checkout.complete.serviceMethod', 'Service Method')}: 
            <strong> {t(`checkout.serviceMethods.${serviceMethod}`, serviceMethod ?? '')}</strong>
          </p>
          
          {serviceMethod === 'dineIn' && tableNumber && (
            <p>
              {t('checkout.complete.tableNumber', 'Table Number')}: 
              <strong> {tableNumber}</strong>
            </p>
          )}
        </div>
        
        <p className="mb-4">
          {t('checkout.complete.confirmationMessage', 
             'Your order is being processed and you will receive updates shortly.')}
        </p>
        
        <button 
          onClick={onReset} 
          className="btn btn-primary"
        >
          {t('checkout.complete.newOrder', 'Place New Order')}
        </button>
      </div>
    </div>
  );
}