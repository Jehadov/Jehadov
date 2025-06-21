// import React from 'react';

// Define the exact structure of the data this component will receive from the stepper.
// This ensures type safety and consistency with the rest of your application.
interface ConfirmedOrderData {
    shipping: {
        firstName: string;
        lastName: string;
        address: string;
        city: string;
        country: string;
        phoneNumber: string;
    };
    payment: {
        method: 'card' | 'efawateercom' | 'cash';
    };
    // This is the new, crucial data that comes from your backend after the order is processed
    orderId: string;
    paymentDetails?: {
        billNumber?: string;
    };
}

interface CheckoutCompleteProps {
    confirmedOrderData: ConfirmedOrderData | null;
    onReset?: () => void;
}

export default function CheckoutComplete({ confirmedOrderData, onReset }: CheckoutCompleteProps) {
    // If the order data hasn't loaded yet, show a simple loading message.
    if (!confirmedOrderData) {
        return (
            <div className="text-center p-5">
                <h2>Loading order details...</h2>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    // Destructure the data for easier access in the JSX
    const { payment, orderId, paymentDetails } = confirmedOrderData;

    return (
        <div className="container my-5 text-center">
            <div className="py-5 px-4 border rounded-3 bg-light shadow-sm">
                <h1 className="text-success" style={{ fontSize: '4rem' }}>✔</h1>
                <h2>Thank You for Your Order!</h2>
                <p className="lead">Your order has been placed successfully.</p>
                <p className="mb-4">
                    Your Order ID is: <strong className="text-primary">{orderId}</strong>
                </p>

                {/* --- Conditional block for EFAWATEERCOM --- */}
                {/* This is the most important part. It only shows if the user chose eFAWATEERcom. */}
                {payment.method === 'efawateercom' && paymentDetails?.billNumber && (
                    <div className="alert alert-warning border-warning my-4">
                        <h4 className="alert-heading">Action Required: Complete Your Payment</h4>
                        <p>
                            To finalize your order, please use the following bill number to pay through any eFAWATEERcom service (like your banking app or the eFAWATEERcom website):
                        </p>
                        <p className="display-6 fw-bold user-select-all">{paymentDetails.billNumber}</p>
                        <hr />
                        <p className="mb-0">Your order will be prepared and shipped as soon as your payment is confirmed.</p>
                    </div>
                )}

                {/* --- Conditional block for CASH ON DELIVERY --- */}
                {/* This block only shows if the user chose cash. */}
                {payment.method === 'cash' && (
                    <div className="alert alert-info border-info my-4">
                        <h4 className="alert-heading">Your Order is Being Prepared</h4>
                        <p className="mb-0">Please prepare the total amount in cash to pay the courier upon delivery. Thank you!</p>
                    </div>
                )}
                
                {/* --- Conditional block for CARD --- */}
                {/* A simple confirmation for successful card payments. */}
                {payment.method === 'card' && (
                     <div className="alert alert-success border-success my-4">
                        <h4 className="alert-heading">Payment Successful</h4>
                        <p className="mb-0">Your payment has been processed. We are now preparing your order for shipment.</p>
                    </div>
                )}

                {/* --- Action Buttons --- */}
                <div className="mt-4">
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => window.location.href = '/'} // Redirect to homepage
                    >
                        Continue Shopping
                    </button>
                    {onReset && (
                        <button
                            className="btn btn-outline-secondary btn-lg ms-2"
                            onClick={onReset}
                        >
                            Place a New Order
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}