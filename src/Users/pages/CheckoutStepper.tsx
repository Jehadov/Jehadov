import { useState } from 'react';
import CheckoutMethodSelector from './CheckoutMethodSelector';
import DeliveryInfoStep from './DeliveryInfoStep';
import PickupInfoStep from './PickupInfoStep';
import InRestaurantInfoStep from './InRestaurantInfoStep';
import CheckoutPayment from './CheckoutPayment';
import CheckoutReview from './CheckoutReview';
import CheckoutComplete from './CheckoutComplete';
import type {
  PaymentData,
  ServiceMethod,
  ConfirmedOrderData,
  DeliveryMeta
} from './types';

type Step = 0 | 1 | 2 | 3 | 4;

export default function CheckoutStepper() {
  const [step, setStep] = useState<Step>(0);
  const [serviceMethod, setServiceMethod] = useState<ServiceMethod | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [deliveryMeta, setDeliveryMeta] = useState<DeliveryMeta | undefined>();
  const [pickupName, setPickupName] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [confirmedOrderData, setConfirmedOrderData] = useState<ConfirmedOrderData | null>(null);

  const goToNext = () => setStep(prev => (prev < 4 ? (prev + 1) as Step : prev));
  const goToStep = (step: Step) => setStep(step);

  const handleMethodSelect = (method: ServiceMethod) => {
    setServiceMethod(method);
    goToNext(); // Move to the appropriate info step
  };

  const handleDeliveryInfo = (data: DeliveryMeta) => {
    setDeliveryMeta(data);
    goToNext(); // Go to payment step
  };

  const handlePickupInfo = (data: { name: string; phoneNumber: string }) => {
    setPickupName(data.name);
    setPickupPhone(data.phoneNumber);
    goToNext(); // Go to payment step
  };

  const handleInRestaurantInfo = (data: { tableNumber: string }) => {
    setTableNumber(data.tableNumber);
    goToNext(); // Go to payment step
  };

  const handlePaymentSubmit = ({ payment }: { payment: PaymentData }) => {
    setPaymentData(payment);
    goToNext(); // Go to review step
  };

  const handleOrderConfirm = (finalOrderData: { orderId: string; paymentDetails?: any }) => {
    if (!paymentData) return;

    const shippingAddress = serviceMethod === 'delivery' ? {
      firstName: deliveryMeta?.name || '',
      lastName: '',
      phoneNumber: deliveryMeta?.phoneNumber || '',
      address: deliveryMeta?.location || '',
      city: 'Amman',
      country: 'Jordan',
    } : serviceMethod === 'pickup' ? {
      firstName: pickupName,
      lastName: '',
      phoneNumber: pickupPhone,
      address: 'Store Pickup',
      city: 'Amman',
      country: 'Jordan',
    } : {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      address: '',
      city: '',
      country: '',
    };

    const confirmed: ConfirmedOrderData = {
      orderId: finalOrderData.orderId,
      payment: paymentData,
      shipping: shippingAddress,
      serviceMethod: serviceMethod || undefined,
      tableNumber: serviceMethod === 'inRestaurant' ? tableNumber : undefined,
      paymentDetails: finalOrderData.paymentDetails,
    };

    setConfirmedOrderData(confirmed);
    goToNext(); // Go to complete step
  };

  const handleReset = () => {
    setStep(0);
    setServiceMethod(null);
    setPaymentData(null);
    setDeliveryMeta(undefined);
    setPickupName('');
    setPickupPhone('');
    setTableNumber('');
    setConfirmedOrderData(null);
  };

  return (
    <>
      {step === 0 && <CheckoutMethodSelector onSelect={handleMethodSelect} />}

      {step === 1 && serviceMethod === 'delivery' && (
        <DeliveryInfoStep onNext={handleDeliveryInfo} onBack={() => goToStep(0)} />
      )}

      {step === 1 && serviceMethod === 'pickup' && (
        <PickupInfoStep onNext={handlePickupInfo} onBack={() => goToStep(0)} />
      )}

      {step === 1 && serviceMethod === 'inRestaurant' && (
        <InRestaurantInfoStep onNext={handleInRestaurantInfo} onBack={() => goToStep(0)} />
      )}

      {step === 2 && (
        <CheckoutPayment
          initialData={paymentData || { method: 'cash' }}
          onNext={handlePaymentSubmit}
          onBack={() => goToStep(1)}
        />
      )}

      {step === 3 && paymentData && (
        <CheckoutReview
          orderData={{
            shipping: serviceMethod === 'delivery' ? {
              firstName: deliveryMeta?.name || '',
              lastName: '',
              phoneNumber: deliveryMeta?.phoneNumber || '',
              address: deliveryMeta?.location || '',
              city: 'Amman',
              country: 'Jordan',
            } : serviceMethod === 'pickup' ? {
              firstName: pickupName,
              lastName: '',
              phoneNumber: pickupPhone,
              address: 'Store Pickup',
              city: 'Amman',
              country: 'Jordan',
            } : {
              firstName: '',
              lastName: '',
              phoneNumber: '',
              address: '',
              city: '',
              country: '',
            },
            payment: paymentData,
            serviceMethod: serviceMethod || undefined,
            tableNumber: serviceMethod === 'inRestaurant' ? tableNumber : undefined,
          }}
          onConfirm={handleOrderConfirm}
          onBack={() => goToStep(2)}
        />
      )}

      {step === 4 && confirmedOrderData && (
        <CheckoutComplete 
          confirmedOrderData={confirmedOrderData} 
          onReset={handleReset} 
        />
      )}
    </>
  );
}