import { useState } from 'react';
import CheckoutShipping from './CheckoutShipping';
import CheckoutPayment from './CheckoutPayment';
import CheckoutReview from './CheckoutReview';
import CheckoutComplete from './CheckoutComplete';

// Define the final, correct interfaces for our data structures
interface AddressData {
    firstName: string;
    lastName: string;
    phoneNumber: string; // Add phoneNumber, which is in our new form
    address: string;
    city: string;
    country: string;
}

interface PaymentData {
  method: 'card' | 'efawateercom' | 'cash'; // Add 'cash' here
}

// This represents the data we build during the checkout process
interface OrderData {
    shipping: AddressData;
    payment: PaymentData;
}

// This represents the final data after the order is confirmed by the backend
interface ConfirmedOrderData extends OrderData {
    orderId: string;
    paymentDetails?: {
        billNumber?: string;
    };
}

const steps = ['Shipping', 'Payment', 'Review', 'Complete'];

export default function CheckoutStepper() {
    const [activeStep, setActiveStep] = useState(0);

    // State for the data being collected
    const [orderData, setOrderData] = useState<OrderData>({
        shipping: {
            firstName: '',
            lastName: '',
            phoneNumber: '', // Add phoneNumber
            address: '',
            city: 'Amman', // Default city
            country: 'Jordan',
        },
        payment: {
            method: 'card'
        }
    });

    // --- FIX: Add new state just for the final confirmed order ---
    const [confirmedOrderData, setConfirmedOrderData] = useState<ConfirmedOrderData | null>(null);

    // --- FIX: A smarter handleNext function that knows which step we are on ---
    const handleNext = (dataFromStep: any) => {
        if (activeStep === 0) {
            // Data from CheckoutShipping is just the address object
            setOrderData(prev => ({ ...prev, shipping: dataFromStep }));
        }
        if (activeStep === 1) {
            // Data from CheckoutPayment is { payment: { method: '...' } }
            setOrderData(prev => ({ ...prev, ...dataFromStep }));
        }
        if (activeStep === 2) {
            // Data from CheckoutReview is { orderId: '...', paymentDetails: '...' }
            // We combine it with the existing orderData to create the final object
            setConfirmedOrderData({ ...orderData, ...dataFromStep });
        }
        setActiveStep(prev => prev + 1);
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const handleReset = () => {
        setConfirmedOrderData(null);
        setActiveStep(0);
        // Reset orderData to its initial state
        setOrderData({
            shipping: {
                firstName: '', lastName: '', phoneNumber: '', address: '',
                city: 'Amman', country: 'Jordan',
            },
            payment: { method: 'card' }
        });
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <CheckoutShipping
                        initialData={orderData.shipping}
                        onNext={handleNext} // Pass the raw data to our new handleNext
                    />
                );
            case 1:
                return (
                    <CheckoutPayment
                        initialData={orderData.payment}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                );
            case 2:
                return (
                    <CheckoutReview
                        orderData={orderData}
                        onConfirm={handleNext} // onConfirm now passes final data to handleNext
                        onBack={handleBack}
                    />
                );
            case 3:
                return (
                    <CheckoutComplete
                        confirmedOrderData={confirmedOrderData}
                        onReset={handleReset}
                    />
                );
            default:
                return <div>Error: Unknown Step</div>;
        }
    };

    return (
        <div className="container my-5">
            {/* We don't show the visual stepper on the final 'Complete' page */}
            {activeStep < 3 && (
                <div className="d-flex justify-content-between mb-5">
                    {steps.slice(0, 3).map((step, index) => (
                        <div
                            key={step}
                            className={`text-center ${index === activeStep ? 'fw-bold text-primary' : ''} ${index < activeStep ? 'text-success' : 'text-muted'}`}
                            style={{ flex: 1 }}
                        >
                            {index < activeStep ? `✔ ${step}` : step}
                        </div>
                    ))}
                </div>
            )}
            <div className="step-content">{renderStepContent()}</div>
        </div>
    );
}