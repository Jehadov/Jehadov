import React, { useState } from 'react'; // Removed useEffect and useCallback as they are not used directly in this version
import { useCart } from './CartContext';
// Ensure types are imported from your central types.ts
import { useTranslation } from 'react-i18next';
// Removed: import { collection, getDocs } from "firebase/firestore"; // Not used directly here
// Removed: import { db } from "../../firebase"; // Not used directly here
// Removed: Fa icons if not used directly in this component's JSX for buttons (they are in t() calls)

// Define the strict types for all the data this component uses
interface AddressData {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address: string;
    city: string;
    country: string;
}

interface PaymentData {
    method: 'card' | 'efawateercom' | 'cash';
}

interface OrderData { // This now also includes serviceMethod and tableNumber for context
    shipping: AddressData; // Conditionally shown based on serviceMethod
    payment: PaymentData;
    serviceMethod?: 'delivery' | 'pickup' | 'dineIn';
    tableNumber?: string;
}

interface CheckoutReviewProps {
    orderData: OrderData;
    onConfirm: (finalOrderData: { orderId: string; paymentDetails?: any }) => void;
    onBack: () => void;
}

export default function CheckoutReview({ orderData, onConfirm, onBack }: CheckoutReviewProps) {
    const { t, i18n } = useTranslation();
    const { cart, clearCart } = useCart();
    const [isLoading, setIsLoading] = useState(false);

    const currentLang = i18n.language.startsWith('ar') ? 'ar' : 'en';

    // Helper to get localized text for dynamic data IF your data objects have _en/_ar fields
    // For CartItem.name, item.variant.value etc., these are assumed to be ALREADY TRANSLATED when added to cart.
    // This helper is primarily for things like AddOn names if they were full objects here.
    const getLocalizedDataDisplay = (item: any, fieldPrefix: string, fallbackToEnglishFieldKey?: string): string => {
        if (!item) return fallbackToEnglishFieldKey && item ? item[fallbackToEnglishFieldKey] || '' : '';
        const langField = item[`${fieldPrefix}_${currentLang}`];
        const englishField = item[fallbackToEnglishFieldKey || `${fieldPrefix}_en`];
        const baseField = item[fieldPrefix]; // Fallback for non-suffixed fields
        return langField || englishField || baseField || '';
    };

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const cardPaymentFailedMsg = t('checkoutReviewPage.alerts.cardPaymentFailed', 'Card payment failed.');
        const efawateercomBillFailedMsg = t('checkoutReviewPage.alerts.efawateercomBillFailed', 'Failed to create eFAWATEERcom bill.');
        const placeOrderFailedMsg = t('checkoutReviewPage.alerts.placeOrderFailed', 'Failed to place order.');
        const unexpectedErrorMsg = t('checkoutReviewPage.alerts.unexpectedError', 'An unexpected error occurred. Please try again.');

        try {
            const fullOrderPayload = {
                orderData: { ...orderData },
                cart,
                totalAmount 
            };

            if (orderData.payment.method === 'card') {
                console.log("Initiating card payment flow...", fullOrderPayload);
                const response = await fetch('/api/pay-with-card', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fullOrderPayload),
                });
                if (!response.ok) throw new Error(cardPaymentFailedMsg);
                const result = await response.json(); 
                clearCart();
                onConfirm({ orderId: result.orderId });

            } else if (orderData.payment.method === 'efawateercom') {
                console.log("Initiating eFAWATEERcom payment flow...", fullOrderPayload);
                const response = await fetch('/api/create-efawateercom-bill', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fullOrderPayload),
                });
                if (!response.ok) throw new Error(efawateercomBillFailedMsg);
                const result = await response.json(); 
                clearCart();
                onConfirm({ orderId: result.orderId, paymentDetails: { billNumber: result.billNumber } });
            
            } else if (orderData.payment.method === 'cash') {
                console.log("Initiating cash on delivery/pickup/dine-in order...", fullOrderPayload);
                const response = await fetch('/api/create-cash-order', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fullOrderPayload),
                });
                if (!response.ok) throw new Error(placeOrderFailedMsg);
                const result = await response.json(); 
                clearCart();
                onConfirm({ orderId: result.orderId });
            }
        } catch (error) {
            console.error("Order submission failed:", error);
            alert((error instanceof Error && error.message) ? error.message : unexpectedErrorMsg);
        } finally { 
            setIsLoading(false);
        }
    };

    const getPaymentMethodDisplayName = (method: 'card' | 'efawateercom' | 'cash') => {
        switch (method) {
            case 'card': return t('checkoutPaymentPage.methods.card', 'Credit / Debit Card');
            case 'efawateercom': return t('checkoutPaymentPage.methods.efawateercom', 'eFAWATEERcom');
            case 'cash':
                if (orderData.serviceMethod === 'dineIn') {
                    return t('checkoutPaymentPage.methods.payAtVenue', 'Pay at Venue');
                } else if (orderData.serviceMethod === 'pickup') {
                    return t('checkoutPaymentPage.methods.payOnPickup', 'Pay on Pickup');
                }
                return t('checkoutPaymentPage.methods.cashOnDelivery', 'Cash on Delivery');
            default: return '';
        }
    };
    
    const getServiceMethodDisplayName = (serviceMethod?: 'delivery' | 'pickup' | 'dineIn') => {
        switch(serviceMethod) {
            case 'delivery': return t('checkoutReviewPage.serviceMethods.delivery', 'Delivery');
            case 'pickup': return t('checkoutReviewPage.serviceMethods.pickup', 'Pickup / Take Away');
            case 'dineIn': return t('checkoutReviewPage.serviceMethods.dineIn', 'Dine-in');
            default: return t('checkoutReviewPage.serviceMethods.notSelected', 'Service method not selected');
        }
    };

    return (
        // No dir attribute here to maintain default LTR
        <div className={`checkout-review-wrapper lang-${i18n.language}`}> 
            <div className="container my-5">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <h2 className="mb-4">{t('checkoutReviewPage.title', 'Review Your Order')}</h2>
                        <div className="card shadow-sm">
                            <div className="card-body p-4">
                                <div className="mb-4 pb-3 border-bottom">
                                    <h5 className="mb-2">{t('checkoutReviewPage.serviceMethodLabel', 'Service Method')}</h5>
                                    <p className="mb-0 fw-medium">{getServiceMethodDisplayName(orderData.serviceMethod)}
                                        {orderData.serviceMethod === 'dineIn' && orderData.tableNumber && (
                                            <span className="text-muted"> - {t('checkoutReviewPage.tableNumberLabel', 'Table')}: {orderData.tableNumber}</span>
                                        )}
                                    </p>
                                </div>
                                
                                <h5 className="card-title mb-3">{t('checkoutReviewPage.orderSummary.title', 'Order Summary')}</h5>
                                <ul className="list-group list-group-flush mb-4">
                                    {cart.map(item => (
                                        <li key={item.id + (item.variant?.value || '') + (item.addOns?.map(a=>a.id).join('-') || '')} className="list-group-item d-flex justify-content-between align-items-start px-0 py-2">
                                            <div className="me-3">
                                                <div className="fw-medium">{item.name}</div>
                                                <small className="d-block text-muted">
                                                    {item.variant?.name}: {item.variant?.value || ''}
                                                    {' '} &times; {item.quantity}
                                                </small>
                                                {item.addOns && item.addOns.length > 0 && (
                                                    <ul className="list-unstyled mb-0 mt-1 ps-2">
                                                        {item.addOns.map(addOn => (
                                                            <li key={addOn.id} className="text-muted small">
                                                                {/* Assuming item.addOns stores AddOn objects with name_en, name_ar */}
                                                                + {getLocalizedDataDisplay(addOn, 'name', addOn.name_en)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                            <span className="fw-medium">{(item.price * item.quantity).toFixed(2)} {t('currency.jd', 'JD')}</span>
                                        </li>
                                    ))}
                                    <li className="list-group-item d-flex justify-content-between align-items-center px-0 pt-3 mt-2 border-top fw-bold fs-5">
                                        <span>{t('checkoutReviewPage.orderSummary.total', 'Total')}</span>
                                        <span>{totalAmount.toFixed(2)} {t('currency.jd', 'JD')}</span>
                                    </li>
                                </ul>

                                <div className="row">
                                    {orderData.serviceMethod === 'delivery' && (
                                        <div className="col-md-6 mb-3 mb-md-0">
                                            <h5 className="mb-3">{t('checkoutReviewPage.shippingTo', 'Shipping To')}</h5>
                                            <address className="mb-0 text-start">
                                                <strong>{orderData.shipping.firstName} {orderData.shipping.lastName}</strong><br />
                                                {orderData.shipping.address}<br />
                                                {orderData.shipping.city}, {orderData.shipping.country}<br />
                                                {t('checkoutReviewPage.phoneLabel', 'Phone:')} {orderData.shipping.phoneNumber}
                                            </address>
                                        </div>
                                    )}
                                    
                                    <div className={orderData.serviceMethod === 'delivery' ? "col-md-6 text-start" : "col-12 text-start"}>
                                        <h5 className="mb-3">{t('checkoutReviewPage.paymentMethodLabel', 'Payment Method')}</h5>
                                        <p className="mb-0 fw-medium">
                                            {getPaymentMethodDisplayName(orderData.payment.method)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="d-flex justify-content-between mt-4">
                            <button type="button" onClick={onBack} className="btn btn-outline-secondary" disabled={isLoading}>
                                {t('checkoutReviewPage.buttons.back', 'Back')}
                            </button>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading || totalAmount <= 0}>
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        <span>{t('checkoutReviewPage.buttons.processing', 'Processing...')}</span>
                                    </>
                                ) : (
                                    t('checkoutReviewPage.buttons.placeOrder', 'Place Order') 
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
