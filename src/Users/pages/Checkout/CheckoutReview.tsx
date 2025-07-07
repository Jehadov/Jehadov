import React, { useState } from 'react';
import { useCart } from '../CartContext';
import { useTranslation } from 'react-i18next';
import type { OrderData, ServiceMethod, CartItem } from '../types';

interface CheckoutReviewProps {
  orderData: OrderData;
  onConfirm: (finalOrderData: { orderId: string; paymentDetails?: any }) => void;
  onBack: () => void;
}

export default function CheckoutReview({ orderData, onConfirm, onBack }: CheckoutReviewProps) {
  const { t, i18n } = useTranslation();
  const { cart, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const fullOrderPayload = {
        orderData: { ...orderData, totalAmount },
        cart,
        serviceMethod: orderData.serviceMethod,
        tableNumber: orderData.tableNumber
      };

      const endpoint = orderData.payment.method === 'cliq' 
        ? '/api/pay-with-cliq' 
        : '/api/create-cash-order';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullOrderPayload),
      });

      if (!response.ok) throw new Error(t('checkoutReview.errors.submissionFailed'));
      
      const result = await response.json();
      clearCart();
      onConfirm({ orderId: result.orderId, paymentDetails: result.paymentDetails });
    } catch (error) {
      console.error("Order submission failed:", error);
      alert(error instanceof Error ? error.message : t('checkoutReview.errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceMethodDisplay = (method?: ServiceMethod) => {
    switch (method) {
      case 'delivery': return t('checkoutReview.methods.delivery');
      case 'pickup': return t('checkoutReview.methods.pickup');
      case 'inRestaurant': return t('checkoutReview.methods.inRestaurant');
      default: return t('checkoutReview.methods.unknown');
    }
  };

  const getPaymentMethodDisplay = () => {
    switch (orderData.payment.method) {
      case 'cliq': return t('checkoutReview.payment.cliq');
      case 'cash':
        return orderData.serviceMethod === 'inRestaurant'
          ? t('checkoutReview.payment.cashAtTable')
          : orderData.serviceMethod === 'pickup'
          ? t('checkoutReview.payment.cashOnPickup')
          : t('checkoutReview.payment.cashOnDelivery');
    }
  };

  const renderAddOns = (item: CartItem) => {
    if (!item.addOns || item.addOns.length === 0) return null;
    
    return (
      <ul className="list-unstyled mb-0 mt-1 ps-2">
        {item.addOns.map(addOn => (
          <li key={addOn.id} className="text-muted small">
            + {i18n.language === 'ar' ? addOn.name_ar : addOn.name_en}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={`checkout-review lang-${i18n.language}`}>
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <h2 className="mb-4">{t('checkoutReview.title')}</h2>
            
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title mb-3">{t('checkoutReview.orderSummary')}</h5>
                <ul className="list-group list-group-flush">
                  {cart.map(item => (
                    <li 
                      key={`${item.id}-${item.variant?.value || ''}-${item.addOns?.map(a => a.id).join('-') || ''}`}
                      className="list-group-item d-flex justify-content-between align-items-start px-0 py-2"
                    >
                      <div className="me-3">
                        <div className="fw-medium">{item.name}</div>
                        {item.variant && (
                          <small className="d-block text-muted">
                            {item.variant.name}: {item.variant.value} × {item.quantity}
                            {item.variant.unitLabel && ` (${item.variant.unitLabel})`}
                          </small>
                        )}
                        {renderAddOns(item)}
                      </div>
                      <span className="fw-medium">
                        {(item.price * item.quantity).toFixed(2)} {t('currency.jd')}
                      </span>
                    </li>
                  ))}
                  <li className="list-group-item d-flex justify-content-between align-items-center px-0 pt-3 mt-2 border-top fw-bold fs-5">
                    <span>{t('checkoutReview.total')}</span>
                    <span>{totalAmount.toFixed(2)} {t('currency.jd')}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <h5>{t('checkoutReview.serviceDetails')}</h5>
                    <p className="fw-medium mb-1">
                      {getServiceMethodDisplay(orderData.serviceMethod)}
                    </p>
                    {orderData.serviceMethod === 'inRestaurant' && orderData.tableNumber && (
                      <p className="text-muted mb-0">
                        {t('checkoutReview.tableNumber')}: {orderData.tableNumber}
                      </p>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <h5>{t('checkoutReview.paymentMethod')}</h5>
                    <p className="fw-medium mb-0">
                      {getPaymentMethodDisplay()}
                    </p>
                  </div>

                  {(orderData.serviceMethod === 'delivery' || orderData.serviceMethod === 'pickup') && (
                    <div className="col-12">
                      <h5>{t('checkoutReview.customerInfo')}</h5>
                      <address className="mb-0">
                        <strong>{orderData.shipping.firstName} {orderData.shipping.lastName}</strong><br />
                        {orderData.serviceMethod === 'delivery' && (
                          <>
                            {orderData.shipping.address}<br />
                            {orderData.shipping.city}, {orderData.shipping.country}<br />
                          </>
                        )}
                        {t('checkoutReview.phone')}: {orderData.shipping.phoneNumber}
                      </address>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="d-flex justify-content-between mt-4">
              <button 
                type="button" 
                onClick={onBack} 
                className="btn btn-outline-secondary" 
                disabled={isLoading}
              >
                {t('checkoutReview.back')}
              </button>
              <button 
                type="submit" 
                className="btn btn-primary btn-lg" 
                disabled={isLoading || totalAmount <= 0}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    {t('checkoutReview.processing')}
                  </>
                ) : (
                  t('checkoutReview.placeOrder')
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}