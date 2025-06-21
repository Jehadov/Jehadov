// src/Users/pages/types.ts (or your chosen path for global types)
import { Timestamp, FieldValue } from 'firebase/firestore'; // Import Timestamp and FieldValue

// ==================================
// Product & Inventory Types
// ==================================

export interface VariantOption {
  price: number;
  quantity: number;
  imageUrl: string;
  value_en: string;         // English value (e.g., "Large", "Red", "500g")
  value_ar: string;         // Arabic value (e.g., "كبير", "أحمر", "500 جرام")
  unitLabel_en?: string;   // English unit label (e.g., "piece", "kg", "pack")
  unitLabel_ar?: string;   // Arabic unit label (e.g., "قطعة", "كغم", "علبة")
  originalPrice?: number;  // Optional: The price before an offer was applied
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
// Offer Management Types
// ==================================
export type OfferType = 'percentage_discount' | 'fixed_discount' | 'bogo' | 'coupon';

export interface Offer {
  id?: string; // Firestore document ID
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  type: OfferType;
  discountValue: number; 
  targetProductIds: string[]; 
  startDate: string; // ISO string date (YYYY-MM-DD)
  endDate: string;   // ISO string date (YYYY-MM-DD)
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
  // To specify if a coupon's discountValue is a percentage or a fixed amount
  discountNature?: 'percentage' | 'fixed'; 
}


// ==================================
// Cart & Order Types
// ==================================

export interface AppliedOfferInfo {
    offerId: string;
    offerTitle: string; // Store the displayed title of the offer
    type: OfferType;
    discountApplied: number; // The monetary value of the discount for this item
}

export interface CartItem {
  id: string;        
  name: string;      // Product name (already translated for display)
  price: number;     // Current price (could be offer price)
  originalPrice?: number; // Original price if item was added while on offer
  image: string;     
  quantity: number;
  variant: {
    name: string;    // Variant group name (already translated)
    value: string;   // Variant option value (already translated)
    unitLabel?: string; 
  };
  Type?: string[];   // Corresponds to product.category (array of category IDs/keys)
  addOns?: AddOn[];  // Should store full multilingual AddOn objects
  eligibleOptionalAddOnIds?: string[];
  appliedOfferInfo?: AppliedOfferInfo; // Details of the offer applied to this item
}

export interface AddressData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  city: string;
  country: string;
}

export type PaymentMethod = 'card' | 'efawateercom' | 'cash';
export interface PaymentData {
  method: PaymentMethod;
}

export type ServiceMethod = 'delivery' | 'pickup' | 'dineIn';
export interface OrderData {
  shipping: AddressData; 
  payment: PaymentData;
  serviceMethod?: ServiceMethod; 
  tableNumber?: string;       
  orderId?: string;           
  userId?: string;            
  cartItems?: CartItem[];     // Snapshot of cart items, including appliedOfferInfo
  totalAmount?: number;       
  orderStatus?: string;       
  createdAt?: Timestamp | FieldValue;            
  languageAtTimeOfOrder?: string; 
  paymentDetails?: {          
    billNumber?: string;
    transactionId?: string;   
  };
  // Summary of offers applied at the order level (e.g., for overall coupons or just for record)
  appliedOffers?: { offerId: string, offerTitle: string, discountApplied: number }[]; 
}

// ==================================
// Shared Constants & Defaults
// ==================================

export const defaultOption: VariantOption = {
  value_en: '', value_ar: '',
  price: 0,
  originalPrice: undefined, // Initialize as undefined since it's optional
  quantity: 0,
  imageUrl: '/placeholder-image.png', 
  unitLabel_en: 'piece', unitLabel_ar: 'قطعة',
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
  isOffer: false, // Default to not being on offer
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
  discountNature: 'fixed', // Default for coupon if not specified otherwise
};
