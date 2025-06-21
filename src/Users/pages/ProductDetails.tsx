import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useCart } from './CartContext';
import { FaShoppingCart, FaCheck, FaSave, FaSpinner, FaClock } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import type { AddOn, CartItem } from './types';

interface VariantData { 
  value_en: string;
  value_ar: string;
  price: number;
  quantity: number;
  imageUrl: string;
  unitLabel_en?: string;
  unitLabel_ar?: string;
  originalPrice?: number;
  offerType?: 'none' | 'percentage' | 'fixed';
  offerValue?: number;
  offerStartDate?: any;
  offerEndDate?: any;
}

interface ProductData { 
  id: string;
  name_en: string; 
  name_ar: string;
  shortDescription_en?: string; 
  shortDescription_ar?: string;
  longDescription_en?: string; 
  longDescription_ar?: string;
  image?: string; 
  category: string[]; 
  manufacturedAt?: string; 
  expiration?: string;
  types: { [key: string]: VariantData }; 
  addOnId?: string[]; 
  isOffer?: boolean;
  name_lowercase?: string; 
  name_ar_lowercase?: string;
  price?: number;
  quantity?: number;
  variants?: any[];
}

const transformFirestoreProductToProductData = (docId: string, dataFromFirebase: any): ProductData => {
  const rawData = dataFromFirebase || {};
  const transformedTypes: { [key: string]: VariantData } = {};
  
  const defaultOptionFromTypes: VariantData = {
    value_en: 'Standard',
    value_ar: 'قياسي',
    price: 0,
    quantity: 0,
    imageUrl: '/placeholder-product.png',
    unitLabel_en: 'piece',
    unitLabel_ar: 'قطعة',
  };

  // Process all variant groups and their options
  if (rawData.variants && Array.isArray(rawData.variants)) {
    rawData.variants.forEach((variantGroup: any) => {
      if (variantGroup.options && Array.isArray(variantGroup.options)) {
        variantGroup.options.forEach((option: any) => {
          // Create a unique key combining group name and option value
          const groupName = variantGroup.name_en || variantGroup.name || 'variant';
          const optionValue = option.value_en || option.value || `option_${Date.now()}`;
          const key = `${groupName}_${optionValue}`.replace(/\s+/g, '_').toLowerCase();
          
          transformedTypes[key] = {
            value_en: String(option.value_en || option.value || optionValue),
            value_ar: String(option.value_ar || option.value_en || option.value || optionValue),
            price: Number(option.price) || 0,
            quantity: typeof option.quantity === 'number' ? option.quantity : 0,
            imageUrl: String(option.imageUrl || rawData.image || defaultOptionFromTypes.imageUrl),
            unitLabel_en: String(option.unitLabel_en || option.unitLabel || variantGroup.unitLabel_en || defaultOptionFromTypes.unitLabel_en || ''),
            unitLabel_ar: String(option.unitLabel_ar || option.unitLabel_en || option.unitLabel || variantGroup.unitLabel_ar || defaultOptionFromTypes.unitLabel_ar || ''),
            originalPrice: Number(option.originalPrice) || undefined,
            offerType: option.offerType || undefined,
            offerValue: Number(option.offerValue) || undefined,
            offerStartDate: option.offerStartDate || undefined,
            offerEndDate: option.offerEndDate || undefined,
            // Add variant group information
          };
        });
      }
    });
  }

  // Fallback to old 'types' object structure if 'variants' array is empty
  if (Object.keys(transformedTypes).length === 0 && rawData.types) {
    for (const key in rawData.types) {
      const typeVal = rawData.types[key] || {};
      transformedTypes[key] = {
        value_en: String(typeVal.value_en || typeVal.value || key),
        value_ar: String(typeVal.value_ar || typeVal.value_en || typeVal.value || key),
        price: Number(typeVal.price) || 0,
        quantity: typeof typeVal.quantity === 'number' ? typeVal.quantity : 0,
        imageUrl: String(typeVal.imageUrl || rawData.image || defaultOptionFromTypes.imageUrl),
        unitLabel_en: String(typeVal.unitLabel_en || typeVal.unitLabel || defaultOptionFromTypes.unitLabel_en || ''),
        unitLabel_ar: String(typeVal.unitLabel_ar || typeVal.unitLabel_en || typeVal.unitLabel || defaultOptionFromTypes.unitLabel_ar || '')
      };
    }
  }

  // Create default variant if none exist
  if (Object.keys(transformedTypes).length === 0) {
    transformedTypes['default'] = { 
      ...defaultOptionFromTypes,
      price: Number(rawData.price) || defaultOptionFromTypes.price,
      quantity: typeof rawData.quantity === 'number' ? rawData.quantity : defaultOptionFromTypes.quantity,
      imageUrl: String(rawData.image || defaultOptionFromTypes.imageUrl)
    };
  }

  return {
    id: docId,
    name_en: String(rawData.name_en || rawData.name || 'Unnamed Product'),
    name_ar: String(rawData.name_ar || rawData.name_en || rawData.name || 'Unnamed Product'),
    name_lowercase: String(rawData.name_en || rawData.name || '').toLowerCase(),
    name_ar_lowercase: String(rawData.name_ar || rawData.name_en || rawData.name || '').toLowerCase(),
    shortDescription_en: String(rawData.shortDescription_en || rawData.shortDescription || ''),
    shortDescription_ar: String(rawData.shortDescription_ar || rawData.shortDescription_en || rawData.shortDescription || ''),
    longDescription_en: String(rawData.longDescription_en || rawData.longDescription || ''),
    longDescription_ar: String(rawData.longDescription_ar || rawData.longDescription_en || rawData.longDescription || ''),
    image: String(rawData.image || '/placeholder-product.png'),
    category: Array.isArray(rawData.category) ? rawData.category : [],
    manufacturedAt: rawData.manufacturedAt || '',
    expiration: rawData.expiration || '',
    types: transformedTypes,
    addOnId: Array.isArray(rawData.addOnId) ? rawData.addOnId : 
             Array.isArray(rawData.optionalAddOnIds) ? rawData.optionalAddOnIds : [],
    isOffer: !!rawData.isOffer,
    price: typeof rawData.price === 'number' ? rawData.price : undefined,
    quantity: typeof rawData.quantity === 'number' ? rawData.quantity : undefined,
    variants: rawData.variants || undefined
  };
};

export default function ProductDetails() {
  const { t, i18n } = useTranslation();
  const { id: productId } = useParams<{ id: string }>();
  const { addToCart, updateCartItem } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [allAvailableAddOns, setAllAvailableAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypeKey, setSelectedTypeKey] = useState<string>('');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1); 
  const [actionButtonState, setActionButtonState] = useState<'idle' | 'added' | 'updated'>('idle');
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'reviews'>('description');
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  const editingState = location.state as {
    editingCartItemKey?: string; 
    initialQuantity?: number;
    initialSelectedAddOns?: string[]; 
    initialVariantValue?: string; 
    initialVariantGroupName?: string;
  } || null;
  
  const isEditingCartItem = !!editingState?.editingCartItemKey;
  const currentLang = i18n.language.startsWith('ar') ? 'ar' : 'en';

  const getLocalizedText = (item: any, fieldPrefix: string, ultimateFallback: string = ''): string => {
    if (!item) return ultimateFallback;
    const langField = item[`${fieldPrefix}_${currentLang}`];
    if (typeof langField === 'string' && langField.trim() !== '') return langField;
    const englishField = item[`${fieldPrefix}_en`];
    if (typeof englishField === 'string' && englishField.trim() !== '') return englishField;
    const baseField = item[fieldPrefix];
    if (typeof baseField === 'string' && baseField.trim() !== '') return baseField;
    return ultimateFallback;
  };

  // Fetch product and add-ons data
  useEffect(() => {
    const fetchPageData = async () => {
      if (!productId) { 
        setLoading(false); 
        navigate("/404"); 
        return; 
      }

      setLoading(true); 
      setProduct(null); 
      setSelectedTypeKey('');

      try {
        const [productDocSnap, addOnsSnapshot] = await Promise.all([
          getDoc(doc(db, 'products', productId)),
          getDocs(collection(db, 'addOns'))
        ]);

        // Load all available add-ons
        setAllAvailableAddOns(addOnsSnapshot.docs.map(docData => {
          const data = docData.data();
          return { 
            id: docData.id, 
            name_en: data.name_en || data.name || '', 
            name_ar: data.name_ar || '', 
            extraPrice: Number(data.extraPrice) || 0 
          } as AddOn;
        }));

        if (productDocSnap.exists()) {
          const fetchedProduct = transformFirestoreProductToProductData(productDocSnap.id, productDocSnap.data());
          setProduct(fetchedProduct);

          // Set initial variant selection
          const typeKeys = Object.keys(fetchedProduct.types);
          let initialKeyToSet = typeKeys[0] || '';

          if (isEditingCartItem && editingState) {
            const keyFromCart = editingState.initialVariantGroupName;
            if (keyFromCart && fetchedProduct.types[keyFromCart]) {
              initialKeyToSet = keyFromCart;
            } else if (editingState.initialVariantValue) {
              const foundKey = typeKeys.find(key => 
                getLocalizedText(fetchedProduct.types[key], 'value') === editingState.initialVariantValue
              );
              if (foundKey) initialKeyToSet = foundKey;
            }
          }

          setSelectedTypeKey(initialKeyToSet);
          
          // Set initial quantity and add-ons for edit mode
          if (isEditingCartItem && editingState) {
            setQuantity(editingState.initialQuantity || 1);
            setSelectedAddOnIds(new Set(editingState.initialSelectedAddOns || []));
          } else {
            const initialVariant = fetchedProduct.types[initialKeyToSet];
            setQuantity(initialVariant?.quantity > 0 ? 1 : 0);
          }
        } else { 
          navigate("/404"); 
        }
      } catch (error) { 
        console.error('Error fetching page data:', error);
      } finally { 
        setLoading(false);
      }
    };

    fetchPageData();
  }, [productId, navigate, isEditingCartItem, JSON.stringify(editingState)]);

  // Handle offer countdown timer
  useEffect(() => {
    if (!product || !selectedTypeKey || !product.types[selectedTypeKey]?.offerEndDate) {
      setTimeLeft('');
      return;
    }

    const option = product.types[selectedTypeKey];
    const intervalId = setInterval(() => {
      const now = new Date().getTime();
      const endDate = option.offerEndDate.toDate().getTime();
      const distance = endDate - now;

      if (distance < 0) {
        clearInterval(intervalId);
        setTimeLeft(t('productCard.offerEnded'));
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      let countdownString = `${t('productCard.endsIn')} `;
      if (days > 0) countdownString += `${days}d `;
      if (hours > 0 || days > 0) countdownString += `${hours}h `;
      countdownString += `${minutes}m ${seconds}s`;
      
      setTimeLeft(countdownString);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [product, selectedTypeKey, t]);

  const currentVariant = useMemo(() => {
    if (!product || !selectedTypeKey) return null;
    return product.types[selectedTypeKey] || null;
  }, [product, selectedTypeKey]);

  const compatibleProductAddOns = useMemo(() => {
    if (!product || !product.addOnId) return [];
    return allAvailableAddOns.filter(addon => product.addOnId?.includes(addon.id));
  }, [product, allAvailableAddOns]);

  const currentSelectedAddOnObjects = useMemo(() => {
    return compatibleProductAddOns.filter(addon => selectedAddOnIds.has(addon.id));
  }, [selectedAddOnIds, compatibleProductAddOns]);

  const totalPrice = useMemo(() => {
    if (!currentVariant) return 0;
    const addOnsPrice = currentSelectedAddOnObjects.reduce((sum, addon) => sum + addon.extraPrice, 0);
    return (currentVariant.price + addOnsPrice) * quantity;
  }, [currentVariant, currentSelectedAddOnObjects, quantity]);

  const isOfferActive = useMemo(() => {
    if (!currentVariant || !currentVariant.offerType || currentVariant.offerType === 'none') {
      return false;
    }
    const now = new Date();
    const startDate = currentVariant.offerStartDate?.toDate();
    const endDate = currentVariant.offerEndDate?.toDate();
    if (startDate && now < startDate) return false;
    if (endDate && now > endDate) return false;
    return true;
  }, [currentVariant]);

  const showOfferPrice = isOfferActive && 
    currentVariant?.originalPrice && 
    currentVariant.originalPrice > currentVariant.price;

  const getOfferDescription = (): string => {
    if (!currentVariant) return '';
    if (currentVariant.offerType === 'percentage' && currentVariant.offerValue) {
      return `${currentVariant.offerValue}% ${t('productCard.off')}`;
    }
    if (currentVariant.offerType === 'fixed' && currentVariant.offerValue) {
      return `${t('currency.jd')} ${currentVariant.offerValue.toFixed(2)} ${t('productCard.off')}`;
    }
    if (currentVariant.originalPrice && currentVariant.price < currentVariant.originalPrice) {
      const percentageOff = Math.round(((currentVariant.originalPrice - currentVariant.price) / currentVariant.originalPrice) * 100);
      return `${percentageOff}% ${t('productCard.off')}`;
    }
    return t('productCard.specialOffer');
  };

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOnIds(prev => {
      const newSet = new Set(prev);
      newSet.has(addOnId) ? newSet.delete(addOnId) : newSet.add(addOnId);
      return newSet;
    });
  };

  const handleQuantityButtons = (amount: number) => {
    if (!currentVariant) return;
    setQuantity(prev => Math.max(1, Math.min(currentVariant.quantity, prev + amount)));
  };

  const handleDirectQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentVariant) return;
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > currentVariant.quantity) val = currentVariant.quantity;
    setQuantity(val);
  };

  const handleOptionSelection = (typeKey: string) => {
    setSelectedTypeKey(typeKey);
    if (!isEditingCartItem) {
      const opt = product?.types[typeKey];
      setQuantity(opt && opt.quantity > 0 ? 1 : 0);
    }
  };

  const handleAddToCartOrUpdate = () => {
    if (!product || !currentVariant || !productId) { 
      alert(t('productDetails.alerts.selectOption')); 
      return; 
    }
    if (currentVariant.quantity === 0 && quantity > 0 && !isEditingCartItem) { 
      alert(t('productDetails.alerts.outOfStock')); 
      return; 
    }
    if (quantity > currentVariant.quantity) { 
      alert(t('productDetails.alerts.notEnoughStock', { count: currentVariant.quantity })); 
      return; 
    }
    
    const pricePerItem = currentVariant.price + currentSelectedAddOnObjects.reduce((sum, addon) => sum + addon.extraPrice, 0);
    
    const cartItemData: CartItem = {
      id: productId,
      name: getLocalizedText(product, 'name'),
      price: pricePerItem,
      image: currentVariant.imageUrl || product.image || '',
      quantity: quantity,
      variant: { 
        name: selectedTypeKey, 
        value: getLocalizedText(currentVariant, 'value'), 
        unitLabel: getLocalizedText(currentVariant, 'unitLabel') || undefined 
      },
      Type: product.category,
      addOns: currentSelectedAddOnObjects.length > 0 ? currentSelectedAddOnObjects : undefined,
      eligibleOptionalAddOnIds: product.addOnId || []
    };

    if (isEditingCartItem && editingState?.editingCartItemKey) {
      updateCartItem(editingState.editingCartItemKey, cartItemData);
      setActionButtonState('updated');
      setTimeout(() => navigate('/cart'), 1500);
    } else {
      addToCart(cartItemData);
      setActionButtonState('added');
      setTimeout(() => setActionButtonState('idle'), 2000);
    }
  };

  if (loading) return (
    <div className={`lang-${i18n.language}`}>
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <FaSpinner className="fa-spin fa-3x text-primary" />
        <p className="ms-2 fs-5">{t('loadingText')}</p>
      </div>
    </div>
  );

  if (!product) return (
    <div className={`lang-${i18n.language}`}>
      <div className="container my-5 text-center alert alert-danger fs-5">
        {t('productDetails.notFound')}
      </div>
    </div>
  );

  if (!currentVariant) return (
    <div className={`lang-${i18n.language}`}>
      <div className="container my-5 text-center alert alert-warning fs-5">
        {t('productDetails.variantIssueCritical')}
      </div>
    </div>
  );

  const displayName = getLocalizedText(product, 'name');
  const displayShortDescription = getLocalizedText(product, 'shortDescription');
  const displayLongDescription = getLocalizedText(product, 'longDescription') || displayShortDescription;
  const currentVariantValueForDisplay = getLocalizedText(currentVariant, 'value');
  const currentUnitLabelForDisplay = getLocalizedText(currentVariant, 'unitLabel');

return (
  <div className={`product-details-page-wrapper lang-${i18n.language}`}>
    <div className="container py-4 px-2 px-md-4">
      <div className="card border-0 shadow-sm p-3 p-md-4">
        <div className="row g-3 g-lg-4">
          {/* Product Image & Thumbnails */}
          <div className="col-lg-6">
            <img
              src={currentVariant.imageUrl || product.image || "/placeholder-product.png"}
              alt={`${displayName} - ${currentVariantValueForDisplay}`}
              className="img-fluid rounded border"
              style={{
                maxHeight: '250px',
                width: '100%',
                objectFit: 'contain',
              }}
            />

            {Object.keys(product.types).length > 1 && (
              <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
                {Object.entries(product.types).map(([key, variantData]) => {
                  const thumbVariantValueDisplay = getLocalizedText(variantData, 'value');
                  return (
                    <img
                      key={key}
                      src={variantData.imageUrl}
                      alt={thumbVariantValueDisplay}
                      className={`img-thumbnail cursor-pointer ${selectedTypeKey === key ? 'border-primary border-3' : 'border-light'}`}
                      style={{
                        height: '60px',
                        width: '60px',
                        objectFit: 'cover',
                      }}
                      onClick={() => handleOptionSelection(key)}
                      title={thumbVariantValueDisplay}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="col-lg-6">
            <h2 className="fw-bold mb-2 fs-5">{displayName}</h2>
            {displayShortDescription && (
              <p className="text-muted small mb-3">{displayShortDescription}</p>
            )}

            {/* Price Display */}
            <div className="d-flex flex-wrap align-items-center mb-3">
              {showOfferPrice ? (
                <>
                  <span className="text-muted text-decoration-line-through me-2 small">
                    {currentVariant.originalPrice?.toFixed(2)} {t('currency.jd')}
                  </span>
                  <span className="text-danger fw-bold me-2 fs-5">
                    {currentVariant.price.toFixed(2)} {t('currency.jd')}
                  </span>
                  <span className="badge bg-danger">{getOfferDescription()}</span>
                </>
              ) : (
                <span className="text-primary fw-bold fs-5">
                  {currentVariant.price.toFixed(2)} {t('currency.jd')}
                </span>
              )}
              {currentUnitLabelForDisplay && (
                <span className="text-muted small ms-2">/ {currentUnitLabelForDisplay}</span>
              )}
            </div>

            {/* Offer Countdown */}
            {timeLeft && (
              <div className="alert alert-warning py-2 d-flex align-items-center">
                <FaClock className="me-2" />
                <small>{timeLeft}</small>
              </div>
            )}

            {/* Variant Selection */}
            {Object.keys(product.types).length > 0 && (
              <div className="mb-3">
                <label className="form-label fw-semibold small">{t('productDetails.selectOption')}</label>
                <div className="d-flex flex-wrap gap-1">
                  {Object.entries(product.types).map(([key, typeData]) => {
                    const typeDataValueDisplay = getLocalizedText(typeData, 'value');
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`btn btn-sm ${selectedTypeKey === key ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => handleOptionSelection(key)}
                        disabled={typeData.quantity === 0}
                      >
                        {typeDataValueDisplay}
                        {typeData.quantity === 0 && (
                          <span className="small"> {t('productDetails.optionOutOfStock')}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add-ons */}
            {compatibleProductAddOns.length > 0 && (
              <div className="mb-3">
                <label className="form-label fw-semibold small">{t('productDetails.optionalExtras')}</label>
                <div className="row g-2">
                  {compatibleProductAddOns.map(addOn => {
                    const addOnNameDisplay = getLocalizedText(addOn, 'name');
                    return (
                      <div key={addOn.id} className="col-12">
                        <div className="form-check small">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`addon-${addOn.id}`}
                            checked={selectedAddOnIds.has(addOn.id)}
                            onChange={() => handleAddOnToggle(addOn.id)}
                          />
                          <label className="form-check-label" htmlFor={`addon-${addOn.id}`}>
                            {addOnNameDisplay} (+{addOn.extraPrice.toFixed(2)} {t('currency.jd')})
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="d-flex align-items-center gap-2 my-3 flex-wrap">
              <div className="input-group" style={{ width: '120px' }}>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => handleQuantityButtons(-1)}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="text"
                  className="form-control text-center form-control-sm"
                  value={quantity}
                  onChange={handleDirectQuantityInput}
                />
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => handleQuantityButtons(1)}
                  disabled={quantity >= currentVariant.quantity && !isEditingCartItem}
                >
                  +
                </button>
              </div>

              <button
                className={`btn btn-sm px-3 ${actionButtonState !== 'idle'
                  ? 'btn-success'
                  : currentVariant.quantity === 0 && !isEditingCartItem
                    ? 'btn-secondary'
                    : 'btn-primary'
                  }`}
                onClick={handleAddToCartOrUpdate}
                disabled={actionButtonState !== 'idle' || (currentVariant.quantity === 0 && !isEditingCartItem)}
              >
                {currentVariant.quantity === 0 && !isEditingCartItem ? (
                  t('productDetails.outOfStock')
                ) : isEditingCartItem ? (
                  actionButtonState === 'updated' ? (
                    <><FaCheck className="me-1" />{t('productDetails.buttons.itemUpdated')}</>
                  ) : (
                    <><FaSave className="me-1" />{t('productDetails.buttons.updateItemInCart')}</>
                  )
                ) : actionButtonState === 'added' ? (
                  <><FaCheck className="me-1" />{t('productDetails.buttons.addedToCart')}</>
                ) : (
                  <><FaShoppingCart className="me-1" />{t('productDetails.buttons.addToCart')}</>
                )}
              </button>
            </div>

            {/* Total Price */}
            <div className="d-flex justify-content-between align-items-center bg-light rounded p-2">
              <span className="fw-bold small">{t('productDetails.total')}:</span>
              <span className="fw-bold text-success">{totalPrice.toFixed(2)} {t('currency.jd')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4">
        {/** Fix TS error by using const assertion */}
        {(['description', 'details', 'reviews'] as const).map((tabKey) => (
          <button
            key={tabKey}
            className={`btn btn-sm me-2 ${activeTab === tabKey ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab(tabKey)}
          >
            {t(`productDetails.tabs.${tabKey}`)}
          </button>
        ))}

        <div className="border rounded p-3 mt-3 bg-white">
          {activeTab === 'description' && (
            <div dangerouslySetInnerHTML={{ __html: displayLongDescription || `<p>${t('productDetails.noDescription')}</p>` }} />
          )}
          {activeTab === 'details' && (
            <div>
              {product.manufacturedAt && (
                <p>
                  <strong>{t('productDetails.details.manufacturedAt')}: </strong>
                  {new Date(product.manufacturedAt).toLocaleDateString()}
                </p>
              )}
              {product.expiration && (
                <p>
                  <strong>{t('productDetails.details.expiresOn')}: </strong>
                  {new Date(product.expiration).toLocaleDateString()}
                </p>
              )}
              {currentVariant && (
                <p>
                  <strong>{selectedTypeKey}</strong>: {currentVariantValueForDisplay}
                  {currentUnitLabelForDisplay && ` (${currentUnitLabelForDisplay})`}
                </p>
              )}
            </div>
          )}
          {activeTab === 'reviews' && (
            <p>{t('productDetails.noReviews')}</p>
          )}
        </div>
      </div>
    </div>
  </div>
);
}