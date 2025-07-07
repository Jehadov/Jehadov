// src/Users/pages/types.ts (or your chosen path for global types)
import { Timestamp, FieldValue } from 'firebase/firestore'; // Import Timestamp and FieldValue

// ==================================
// Product & Inventory Types
// ==================================

export interface VariantOption {
  price: number;
  quantity: number;
  imageUrl: string;
  value_en: string;
  value_ar: string;
  unitLabel_en?: string;
  unitLabel_ar?: string;
  originalPrice?: number;
  offerType?: VariantOfferType;
  offerValue?: number;
  offerStartDate?: Timestamp | null;
  offerEndDate?: Timestamp | null;
}

export interface Variant { // Represents a variant group like "Size" or "Color"
  name_en: string;        // English group name (e.g., "Size")
  name_ar: string;        // Arabic group name (e.g., "الحجم")
  options: VariantOption[];
}

export interface AddOn {
  id: string; 
  name_en: string;
  name_ar: string;
  extraPrice: number;
  createdAt?: Timestamp | FieldValue; 
  updatedAt?: Timestamp | FieldValue; 
}

export interface Category {
  id: string; 
  name_en: string;
  name_ar: string;
  image?: string;
  createdAt?: Timestamp | FieldValue; 
  updatedAt?: Timestamp | FieldValue;
}

export interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  name_lowercase?: string;       
  name_ar_lowercase?: string;    
  category: string[];           
  shortDescription_en?: string;
  shortDescription_ar?: string;
  longDescription_en?: string;
  longDescription_ar?: string;
  variants: Variant[];          
  optionalAddOnIds?: string[];   
  isOffer?: boolean; // This flags individual products if an offer is currently applied to them
  manufacturedAt?: string;       
  expiration?: string;         
  image?: string;                
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
  [key: string]: any;           
}

// ==================================
// Offer Management Types (NEW)
// ==================================
export type OfferType = 'percentage_discount' | 'fixed_discount' | 'bogo' | 'coupon';

export interface Offer {
  id?: string;
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  type: OfferType;
  discountValue: number; 
  targetProductIds: string[]; 
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt?: Timestamp | FieldValue; 
  updatedAt?: Timestamp | FieldValue;
  // BOGO specific fields
  bogoBuyProductId?: string;
  bogoBuyQuantity?: number;
  bogoGetProductId?: string;
  bogoGetQuantity?: number;
  bogoGetType?: 'free' | 'percentage_discount' | 'fixed_discount'; 
  // Coupon specific fields
  couponCode?: string; 
  discountNature?: 'percentage' | 'fixed'; 
}

// ==================================
// Cart & Order Types
// ==================================

export interface AppliedOfferInfo {
    offerId: string;
    offerTitle: string; 
    type: OfferType;
    discountApplied: number; 
}

export interface CartItem {
  id: string;        
  name: string;      
  price: number;     
  originalPrice?: number; 
  image: string;     
  quantity: number;
  variant: {
    name: string;    
    value: string;   
    unitLabel?: string; 
  };
  Type?: string[];   
  addOns?: AddOn[];
  eligibleOptionalAddOnIds?: string[];
  appliedOfferInfo?: AppliedOfferInfo;
}

export interface AddressData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  city: string;
  country: string;
}
export type PaymentMethod = 'cash' | 'cliq';
export interface PaymentData {
  method: 'cliq' | 'cash';
}
// In your types.ts or wherever ServiceMethod is defined:
export type ServiceMethod = 'delivery' | 'pickup' | 'inRestaurant'; // Added 'inRestaurant'
export interface ConfirmedOrderData {
  orderId: string;
  totalAmount?: number;
  payment: PaymentData;
  shipping: AddressData;
  serviceMethod?: ServiceMethod;
  tableNumber?: string;
  paymentDetails?: any;
}

export interface DeliveryMeta {
  name: string;
  phoneNumber: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface OrderData {
  shipping: AddressData; 
  payment: PaymentData;
  serviceMethod?: ServiceMethod; 
  tableNumber?: string;       
  orderId?: string;           
  userId?: string;            
  cartItems?: CartItem[];     
  totalAmount?: number;       
  orderStatus?: string;       
  createdAt?: Timestamp | FieldValue;            
  languageAtTimeOfOrder?: string; 
  deliveryMeta?: DeliveryMeta;
  paymentDetails?: {          
    billNumber?: string;
    transactionId?: string;   
  };
  appliedOffers?: { offerId: string, offerTitle: string, discountApplied: number }[]; 
}

// ==================================
// Shared Constants & Defaults
// ==================================

export const defaultOption: VariantOption = {
  value_en: '',
  value_ar: '',
  price: 0,
  originalPrice: undefined,
  quantity: 0,
  imageUrl: '/placeholder-image.png', 
  unitLabel_en: 'piece',
  unitLabel_ar: 'قطعة',
  // Default offer fields
  offerType: 'none',
  offerValue: 0,
  offerStartDate: null,
  offerEndDate: null,
};



export const defaultVariant: Variant = { 
  name_en: 'Type', name_ar: 'النوع', 
  options: [{ ...defaultOption }],
};

export const defaultProduct: Product = {
  id: '', 
  name_en: '', name_ar: '',
  name_lowercase: '', name_ar_lowercase: '',
  category: [],
  shortDescription_en: '', shortDescription_ar: '',
  longDescription_en: '', longDescription_ar: '',
  variants: [{ ...defaultVariant }],
  optionalAddOnIds: [],
  isOffer: false, 
  manufacturedAt: '',
  expiration: '',
  image: '/placeholder-product.png',
};

export const defaultAddOnData: Omit<AddOn, 'id' | 'createdAt' | 'updatedAt'> = {
    name_en: '',
    name_ar: '',
    extraPrice: 0,
};

export const defaultCategoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> = {
    name_en: '',
    name_ar: '',
    image: '',
};

export const defaultOffer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'> = {
  title_en: '',
  title_ar: '',
  description_en: '',
  description_ar: '',
  type: 'percentage_discount',
  discountValue: 0,
  targetProductIds: [],
  startDate: new Date().toISOString().split('T')[0], 
  endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0], 
  isActive: true,
  bogoBuyProductId: '',
  bogoBuyQuantity: 1,
  bogoGetProductId: '',
  bogoGetQuantity: 1,
  bogoGetType: 'free',
  couponCode: '',
  discountNature: 'fixed',
};
export interface ConfirmedOrderData extends OrderData {}




export type VariantOfferType = 'none' | 'percentage' | 'fixed';

export interface VariantOption {
  price: number;              // This is the FINAL, calculated price after any active offer.
  quantity: number;
  imageUrl: string;
  value_en: string;
  value_ar: string;
  unitLabel_en?: string;
  unitLabel_ar?: string;
  
  // --- Fields for Inline Offers ---
  originalPrice?: number;         // The price before any offer is applied.
  offerType?: VariantOfferType;   // 'none', 'percentage', or 'fixed'.
  offerValue?: number;            // The value of the discount (e.g., 20 for 20% or 5 for 5 JD).
  offerStartDate?: Timestamp | null; // The exact start date and time of the offer.
  offerEndDate?: Timestamp | null;   // The exact end date and time of the offer.
}

