import React, { useState, useEffect } from "react";
// Ensure these types are imported from your single source of truth: types.ts
import { type CartItem, type AddOn } from '../../Users/pages/types'; // Adjust path if necessary
import { useCart } from "./CartContext"; 
import { getDocs, collection } from "firebase/firestore"; // Only if fetching allAvailableAddOns for display name lookup
import { db } from "../../firebase"; 
import { FaPlus, FaMinus, FaTrash, FaEdit } from "react-icons/fa"; // Removed FaSave, FaTimes
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { useTranslation } from 'react-i18next';

const Cart: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { cart, removeFromCart, updateQuantity, generateCartItemKey } = useCart(); // updateCartItem is called by ProductDetails
  const navigate = useNavigate(); 
  
  // This state MIGHT still be useful if item.addOns in CartItem only stores IDs
  // and you need to look up the multilingual names from a master list for display.
  // However, if CartItem.addOns stores full multilingual AddOn objects, this can be simplified.
  const [, setAllAvailableAddOns] = useState<AddOn[]>([]);

  const currentLang = i18n.language.startsWith('ar') ? 'ar' : 'en';

  useEffect(() => {
    const fetchAddOns = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'addOns'));
        const addOnsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id,
            name_en: data.name_en || data.name || "", 
            name_ar: data.name_ar || "", 
            extraPrice: Number(data.extraPrice) || 0 
          } as AddOn; 
        });
        setAllAvailableAddOns(addOnsData); // Useful for looking up add-on details if needed
      } catch (error) {
        console.error("Error fetching all available add-ons: ", error);
      }
    };
    fetchAddOns(); // Fetching add-ons to resolve names if CartItem.addOns only has IDs
  }, []);

  const getLocalizedText = (item: any, fieldPrefix: string, fallbackToEnglishFieldKey: string = `${fieldPrefix}_en`) => {
    if (!item) return '';
    const langField = item[`${fieldPrefix}_${currentLang}`];
    const englishField = item[fallbackToEnglishFieldKey];
    const baseField = item[fieldPrefix];
    return langField || englishField || baseField || '';
  };

  // Navigate to ProductDetails for editing
  const handleEditCartItem = (item: CartItem) => {
    const itemKey = generateCartItemKey(item);
    console.log("Navigating to edit Cart Item:", itemKey, item);
    navigate(`/product/${item.id}`, {
      state: {
        editingCartItemKey: itemKey,
        initialQuantity: item.quantity,
        initialSelectedAddOns: item.addOns?.map(a => a.id) || [],
        initialVariantValue: item.variant.value, 
        initialVariantGroupName: item.variant.name, // For flat 'types' this is the key, for grouped it's the group name
      }
    });
  };

  const getQuantityStepAndMin = (item: CartItem | undefined): { step: number, min: number } => {
    const isUnitOrDozen = item?.Type?.some(t => ["unit", "dozen"].includes(t.toLowerCase()));
    return { step: isUnitOrDozen ? 1 : 1, min: isUnitOrDozen ? 1 : 1 };
  };

  const handleQuantityButtons = (itemKey: string, currentQuantity: number, direction: 'increase' | 'decrease') => {
    const item = cart.find(i => generateCartItemKey(i) === itemKey);
    if (!item) return;
    const { step, min } = getQuantityStepAndMin(item);
    let newQuantity = direction === 'increase' ? currentQuantity + step : currentQuantity - step;
    newQuantity = Math.max(min, newQuantity);
    updateQuantity(itemKey, newQuantity);
  };

  
  const handleQuantityDirectInput = (itemKey: string, inputValue: string) => {
    const item = cart.find(i => generateCartItemKey(i) === itemKey);
    if (!item) return;
    const { min } = getQuantityStepAndMin(item);
    const isUnitOrDozen = min === 1;
    let sanitizedValue = inputValue;
    if (!isUnitOrDozen) {
        sanitizedValue = sanitizedValue.replace(/[^0-9.]/g, '');
        const parts = sanitizedValue.split('.');
        if (parts.length > 2) sanitizedValue = parts[0] + '.' + parts.slice(1).join('');
    } else {
        sanitizedValue = sanitizedValue.replace(/[^0-9]/g, '');
    }
    let parsedValue = isUnitOrDozen ? parseInt(sanitizedValue, 10) : parseFloat(sanitizedValue);
    if (isNaN(parsedValue) || parsedValue < min) {
      updateQuantity(itemKey, min); 
      return;
    }
    updateQuantity(itemKey, parsedValue);
  };

  const calculateItemSubtotal = (item: CartItem) => item.price * item.quantity;
  const cartTotal = cart.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);

return (
  <div className={`cart-page-wrapper lang-${i18n.language}`}>
    <div className="container py-4 px-2 px-md-4">
      <div className="row">
        {/* Cart Items */}
        <div className="col-lg-8 mb-4 mb-lg-0">
          <h3 className="mb-4 fs-5 text-center text-lg-start">{t('cartPage.title', 'Your Shopping Cart')}</h3>

          {cart.length === 0 ? (
            <div className="card shadow-sm">
              <div className="card-body text-center p-4">
                <p className="lead mb-3">{t('cartPage.emptyCart', 'Your cart is currently empty.')}</p>
                <Link to="/" className="btn btn-primary">
                  {t('cartPage.continueShopping', 'Start Shopping')}
                </Link>
              </div>
            </div>
          ) : (
            cart.map((item) => {
              const itemKey = generateCartItemKey(item);
              const { min } = getQuantityStepAndMin(item);
              const isUnitOrDozen = min === 1;

              return (
                <div key={itemKey} className="card shadow-sm mb-3">
                  <div className="card-body">
                    <div className="row g-3 align-items-center">
                      {/* Image */}
                      <div className="col-4 col-sm-3 text-center">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="img-fluid rounded"
                          style={{ maxHeight: '80px', objectFit: 'contain' }}
                        />
                      </div>

                      {/* Details */}
                      <div className="col-8 col-sm-5">
                        <h6 className="mb-1 small fw-bold">{item.name}</h6>
                        {item.variant && (
                          <p className="text-muted mb-1 small">
                            {item.variant.name}: {item.variant.value}
                            {item.variant.unitLabel ? ` (${t('cartPage.perUnitPrefix', 'per')} ${item.variant.unitLabel})` : ''}
                          </p>
                        )}
                        <p className="small text-muted mb-1">
                          {t('cartPage.unitPriceLabel', 'Unit Price:')} {item.price.toFixed(2)} {t('currency.jd', 'JD')}
                        </p>
                        {item.addOns && item.addOns.length > 0 && (
                          <ul className="list-inline small mb-0">
                            {item.addOns.map((addOn: AddOn) => (
                              <li key={addOn.id} className="list-inline-item">
                                <span className="badge bg-light text-dark border">
                                  {getLocalizedText(addOn, 'name', addOn.name_en)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="col-6 col-sm-4">
                        <label htmlFor={`quantity-${itemKey}`} className="form-label small">
                          {t('cartPage.quantityLabel', 'Quantity:')}
                        </label>
                        <div className="input-group input-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => handleQuantityButtons(itemKey, item.quantity, 'decrease')}
                          >
                            <FaMinus />
                          </button>
                          <input
                            type="text"
                            id={`quantity-${itemKey}`}
                            className="form-control text-center"
                            value={isUnitOrDozen ? Math.floor(item.quantity) : item.quantity.toFixed(2)}
                            onChange={(e) => handleQuantityDirectInput(itemKey, e.target.value)}
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => handleQuantityButtons(itemKey, item.quantity, 'increase')}
                          >
                            <FaPlus />
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-6 text-end">
                        <div className="fw-bold small">
                          {t('cartPage.itemTotalLabel', 'Item Total:')} {calculateItemSubtotal(item).toFixed(2)} {t('currency.jd', 'JD')}
                        </div>
                        <div className="d-flex gap-2 justify-content-end mt-2">
                          <button onClick={() => removeFromCart(itemKey)} className="btn btn-sm btn-outline-danger">
                            <FaTrash />
                          </button>
                          <button
                            onClick={() => handleEditCartItem(item)}
                            className="btn btn-sm btn-outline-primary"
                            title={t('cartPage.buttons.editItemTooltip', 'Edit item details, quantity, or extras')}
                          >
                            <FaEdit />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="col-lg-4">
            <div className="card shadow-sm sticky-top" style={{ top: '7rem' }}>
              <div className="card-body">
                <h5 className="card-title mb-3">{t('cartPage.summary.title', 'Order Summary')}</h5>
                <div className="d-flex justify-content-between small mb-2">
                  <span className="text-muted">{t('cartPage.summary.subtotal', 'Subtotal')}</span>
                  <span>{cartTotal.toFixed(2)} {t('currency.jd', 'JD')}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold fs-6 pt-2 border-top">
                  <span>{t('cartPage.summary.total', 'Total')}</span>
                  <span>{cartTotal.toFixed(2)} {t('currency.jd', 'JD')}</span>
                </div>
                <Link to="/checkout" className="btn btn-primary w-100 mt-3">
                  {t('cartPage.buttons.proceedToCheckout', 'Proceed to Checkout')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default Cart;
