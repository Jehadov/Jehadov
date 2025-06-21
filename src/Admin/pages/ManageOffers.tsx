import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../firebase'; // Adjust this path to your firebase config
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import {
  FaPercent,
  FaTag,
  FaExclamationCircle,
  FaSpinner,
  FaArrowDown,
  FaSave,
} from 'react-icons/fa';
import CouponManager from './CouponManager'; // Assuming this component exists

// --- Type Definitions ---
type VariantOfferType = 'none' | 'percentage' | 'fixed';

interface VariantOption {
  value: string;
  value_en?: string;
  price: number;
  originalPrice?: number;
  offerType?: VariantOfferType;
  offerValue?: number;
  offerStartDate?: Timestamp | null;
  offerEndDate?: Timestamp | null;
}

interface VariantGroup {
  name_en: string;
  name_ar?: string;
  options: VariantOption[];
}

interface Product {
  id: string;
  name: string;
  name_en?: string;
  variants: VariantGroup[];
}

// --- High-Performance Sub-component for individual variant option rows ---
const VariantOptionRow = ({ product, variantGroup, optionIndex, onSave }: { product: Product, variantGroup: VariantGroup, optionIndex: number, onSave: Function }) => {
    const option = variantGroup.options[optionIndex];

    const toInputDateString = (ts: Timestamp | null | undefined) => ts ? ts.toDate().toISOString().split('T')[0] : '';
    const toInputTimeString = (ts: Timestamp | null | undefined) => ts ? ts.toDate().toTimeString().slice(0, 5) : '00:00';

    const [offerDetails, setOfferDetails] = useState({
        originalPrice: option.originalPrice || option.price || 0,
        offerType: option.offerType || 'none',
        offerValue: option.offerValue || 0,
        offerStartDate: toInputDateString(option.offerStartDate),
        offerEndDate: toInputDateString(option.offerEndDate),
        offerStartTime: toInputTimeString(option.offerStartDate),
        offerEndTime: toInputTimeString(option.offerEndDate),
    });
    const [isSaving, setIsSaving] = useState(false);

    const offerStatus = useMemo(() => {
        const { offerType, offerStartDate, offerStartTime, offerEndDate, offerEndTime } = offerDetails;
        if (offerType === 'none') return 'none';
        const now = new Date();
        const startDate = offerStartDate ? new Date(`${offerStartDate}T${offerStartTime || '00:00:00'}`) : null;
        const endDate = offerEndDate ? new Date(`${offerEndDate}T${offerEndTime || '23:59:59'}`) : null;

        if (endDate && now > endDate) return 'expired';
        if (startDate && now < startDate) return 'scheduled';
        return 'active';
    }, [offerDetails]);

    const finalPrice = useCallback(() => {
        const { originalPrice, offerType, offerValue } = offerDetails;
        if (offerStatus === 'active') {
            if (offerType === 'percentage') return Math.max(0, originalPrice - (originalPrice * (offerValue / 100)));
            if (offerType === 'fixed') return Math.max(0, originalPrice - offerValue);
        }
        return originalPrice;
    }, [offerDetails, offerStatus]);
    
    // --- FIX: This hook now automatically resets the offer type in the UI if it expires. ---
    useEffect(() => {
        const initialOfferType = option.offerType || 'none';
        const endDate = option.offerEndDate ? option.offerEndDate.toDate() : null;
        
        // Check if the offer from the database is already expired
        if (endDate && new Date() > endDate) {
            setOfferDetails(prev => ({
                ...prev,
                offerType: 'none', // Reset dropdown to "No Offer"
            }));
        } else {
            setOfferDetails(prev => ({ ...prev, offerType: initialOfferType }));
        }

        // Set the rest of the details
        setOfferDetails(prev => ({
            ...prev,
            originalPrice: option.originalPrice || option.price || 0,
            offerValue: option.offerValue || 0,
            offerStartDate: toInputDateString(option.offerStartDate),
            offerEndDate: toInputDateString(option.offerEndDate),
            offerStartTime: toInputTimeString(option.offerStartDate),
            offerEndTime: toInputTimeString(option.offerEndDate),
        }));
    }, [option]);

    const handleOfferChange = (field: keyof typeof offerDetails, value: string) => {
        setOfferDetails(prev => ({ ...prev, [field]: (field === 'originalPrice' || field === 'offerValue') ? parseFloat(value) || 0 : value }));
    };
    
    const handleSaveClick = async () => { 
        setIsSaving(true);
        await onSave(product.id, { ...offerDetails, price: finalPrice() }, variantGroup.name_en, optionIndex);
        setIsSaving(false);
    };

    return (
        <tr className={`align-middle ${offerStatus === 'expired' ? 'opacity-50' : ''}`}>
            <td className="ps-3"><span className="badge bg-info-subtle text-info-emphasis me-2">{variantGroup.name_en}</span><span className="text-dark">{option.value_en || option.value}</span></td>
            <td><input type="number" step="0.01" className="form-control form-control-sm" style={{width: '100px'}} title="Original Price" value={offerDetails.originalPrice} onChange={(e) => handleOfferChange('originalPrice', e.target.value)} /></td>
            <td>
                <div className="input-group input-group-sm" style={{width: '220px'}}>
                    <select className="form-select" value={offerDetails.offerType} onChange={(e) => handleOfferChange('offerType', e.target.value)}><option value="none">No Offer</option><option value="percentage">%</option><option value="fixed">Fixed</option></select>
                    {offerDetails.offerType !== 'none' && (<input type="number" step="0.01" className="form-control" value={offerDetails.offerValue} onChange={(e) => handleOfferChange('offerValue', e.target.value)} />)}
                </div>
            </td>
            <td>
                <span className="fw-bold font-monospace">{finalPrice().toFixed(2)} JD</span>
                {offerStatus === 'expired' && <span className="badge bg-secondary ms-2">Expired</span>}
                {offerStatus === 'scheduled' && <span className="badge bg-warning text-dark ms-2">Scheduled</span>}
            </td>
            {offerDetails.offerType !== 'none' ? (<><td><div className="d-flex flex-column gap-1"><input type="date" className="form-control form-control-sm" value={offerDetails.offerStartDate} onChange={e => handleOfferChange('offerStartDate', e.target.value)} /><input type="time" className="form-control form-control-sm" value={offerDetails.offerStartTime} onChange={e => handleOfferChange('offerStartTime', e.target.value)} /></div></td><td><div className="d-flex flex-column gap-1"><input type="date" className="form-control form-control-sm" value={offerDetails.offerEndDate} onChange={e => handleOfferChange('offerEndDate', e.target.value)} /><input type="time" className="form-control form-control-sm" value={offerDetails.offerEndTime} onChange={e => handleOfferChange('offerEndTime', e.target.value)} /></div></td></>) : (<td colSpan={2}></td>) }
            <td className="text-center">
                <button className="btn btn-sm btn-outline-primary" onClick={handleSaveClick} title="Save this offer" disabled={isSaving}>
                    {isSaving ? <FaSpinner className="fa-spin" /> : <FaSave />}
                </button>
            </td>
        </tr>
    );
};

// --- Sub-component for the bulk edit row ---
const ProductBulkEditRow = ({ onApplyToAll }: { onApplyToAll: Function }) => {
    const [bulkOffer, setBulkOffer] = useState({ offerType: 'none' as VariantOfferType, offerValue: 0, offerStartDate: '', offerStartTime: '', offerEndDate: '', offerEndTime: '' });
    const handleBulkChange = (field: keyof typeof bulkOffer, value: string) => { setBulkOffer(prev => ({ ...prev, [field]: field === 'offerValue' ? parseFloat(value) || 0 : value })); };

    return (
        <tr className="table-light">
            <td className="fw-bold text-end pe-3 align-middle">Bulk Edit <FaArrowDown size={12} /></td><td></td>
            <td>
                <div className="input-group input-group-sm" style={{width: '220px'}}>
                    <select className="form-select" value={bulkOffer.offerType} onChange={(e) => handleBulkChange('offerType', e.target.value)}><option value="none">Set Offer Type</option><option value="percentage">%</option><option value="fixed">Fixed</option></select>
                    {bulkOffer.offerType !== 'none' && (<input type="number" step="0.01" className="form-control" value={bulkOffer.offerValue} onChange={(e) => handleBulkChange('offerValue', e.target.value)} />)}
                </div>
            </td><td></td>
            {bulkOffer.offerType !== 'none' ? (<><td><div className="d-flex flex-column gap-1"><input type="date" className="form-control form-control-sm" value={bulkOffer.offerStartDate} onChange={e => handleBulkChange('offerStartDate', e.target.value)} /><input type="time" className="form-control form-control-sm" value={bulkOffer.offerStartTime} onChange={e => handleBulkChange('offerStartTime', e.target.value)} /></div></td><td><div className="d-flex flex-column gap-1"><input type="date" className="form-control form-control-sm" value={bulkOffer.offerEndDate} onChange={e => handleBulkChange('offerEndDate', e.target.value)} /><input type="time" className="form-control form-control-sm" value={bulkOffer.offerEndTime} onChange={e => handleBulkChange('offerEndTime', e.target.value)} /></div></td></>) : (<td colSpan={2}></td>)}
            <td className="text-center"><button className="btn btn-sm btn-secondary" onClick={() => onApplyToAll(bulkOffer)}>Apply</button></td>
        </tr>
    );
};


// --- Main OfferManager Component ---
export default function OfferManager() {
  const [activeTab, setActiveTab] = useState<'sales' | 'coupons'>('sales');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setError(null);
    try {
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch products. Check Firestore rules.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'sales') {
        setLoading(true);
        fetchProducts();
    }
  }, [activeTab, fetchProducts]);

  const createTimestampFromDateTime = (dateStr: string, timeStr: string, defaultTime: string) => {
    if (!dateStr) return null;
    return Timestamp.fromDate(new Date(`${dateStr}T${timeStr || defaultTime}`));
  };
  
  const handleApplyOfferToAllVariants = (productId: string, bulkOffer: any) => {
      if (bulkOffer.offerType === 'none') return;
      const startTimestamp = createTimestampFromDateTime(bulkOffer.offerStartDate, bulkOffer.offerStartTime, '00:00:00');
      const endTimestamp = createTimestampFromDateTime(bulkOffer.offerEndDate, bulkOffer.offerEndTime, '23:59:59');

      setProducts(prevProducts =>
        prevProducts.map(p => {
            if (p.id === productId && p.variants) {
                const newVariants = p.variants.map(group => ({
                    ...group,
                    options: group.options.map(option => {
                        const originalPrice = option.originalPrice || option.price || 0;
                        let newPrice = originalPrice;
                        if (bulkOffer.offerType === 'percentage') newPrice = originalPrice - (originalPrice * (bulkOffer.offerValue / 100));
                        else if (bulkOffer.offerType === 'fixed') newPrice = originalPrice - bulkOffer.offerValue;
                        
                        return { ...option, originalPrice, offerType: bulkOffer.offerType, offerValue: bulkOffer.offerValue, price: Math.max(0, newPrice), offerStartDate: startTimestamp, offerEndDate: endTimestamp };
                    })
                }));
                return { ...p, variants: newVariants };
            }
            return p;
        })
      );
  };
  
  const handleSaveAllForProduct = async (product: Product) => {
    if (!window.confirm(`Save all offers for ${product.name_en || product.name}?`)) return;
    const batch = writeBatch(db);
    const productRef = doc(db, 'products', product.id);
    batch.update(productRef, { variants: product.variants });
    try {
        await batch.commit();
        alert(`All offers for ${product.name_en || product.name} saved!`);
    } catch (err) { setError('Could not save all offers.'); console.error(err); }
  };

  const handleSaveVariantOffer = async (productId: string, offerData: any, variantGroupName: string, optionIndex: number) => {
    const productToUpdate = products.find(p => p.id === productId);
    if (!productToUpdate) return;
    
    const updatedVariants = JSON.parse(JSON.stringify(productToUpdate.variants));
    const variantGroup = updatedVariants.find((v: VariantGroup) => v.name_en === variantGroupName);
    if (!variantGroup) return;
    const optionToUpdate = variantGroup.options[optionIndex];

    optionToUpdate.originalPrice = offerData.originalPrice;
    
    // Determine the final price based on the current time and offer details
    const now = new Date();
    const startDate = offerData.offerStartDate ? new Date(`${offerData.offerStartDate}T${offerData.offerStartTime || '00:00:00'}`) : null;
    const endDate = offerData.offerEndDate ? new Date(`${offerData.offerEndDate}T${offerData.offerEndTime || '23:59:59'}`) : null;
    
    let isOfferActive = offerData.offerType !== 'none';
    if (startDate && now < startDate) isOfferActive = false;
    if (endDate && now > endDate) isOfferActive = false;
    
    if (isOfferActive) {
        if (offerData.offerType === 'percentage') optionToUpdate.price = Math.max(0, offerData.originalPrice - (offerData.originalPrice * (offerData.offerValue / 100)));
        else if (offerData.offerType === 'fixed') optionToUpdate.price = Math.max(0, offerData.originalPrice - offerData.offerValue);
    } else {
        optionToUpdate.price = offerData.originalPrice;
    }

    optionToUpdate.offerStartDate = createTimestampFromDateTime(offerData.offerStartDate, offerData.offerStartTime, '00:00:00');
    optionToUpdate.offerEndDate = createTimestampFromDateTime(offerData.offerEndDate, offerData.offerEndTime, '23:59:59');

    if (offerData.offerType === 'none' || !offerData.offerType) {
        delete optionToUpdate.offerType;
        delete optionToUpdate.offerValue;
        delete optionToUpdate.offerStartDate;
        delete optionToUpdate.offerEndDate;
    } else {
        optionToUpdate.offerType = offerData.offerType;
        optionToUpdate.offerValue = offerData.offerValue;
    }

    const productRef = doc(db, 'products', productId);
    try {
      await updateDoc(productRef, { variants: updatedVariants });
      alert(`Offer for ${optionToUpdate.value_en} saved!`);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, variants: updatedVariants } : p));
    } catch (err) { setError('Could not save the offer.'); console.error(err); }
  };

  if (error) { return <div className="container my-5 alert alert-danger"><FaExclamationCircle className="me-2" /> {error}</div>; }

  return (
    <div className="container-fluid bg-light min-vh-100 p-3 p-md-4">
      <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="h2 mb-0">Offer Manager</h1></div>
      <ul className="nav nav-pills mb-4">
        <li className="nav-item"><button className={`nav-link ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}><FaTag className="me-2" /> Product Sales</button></li>
        <li className="nav-item"><button className={`nav-link ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => setActiveTab('coupons')}><FaPercent className="me-2" /> Coupon Codes</button></li>
      </ul>

      {activeTab === 'sales' && (
        loading ? 
        <div className="d-flex justify-content-center p-5"><FaSpinner className="fa-spin fa-2x text-primary" /><span className="ms-3 fs-5">Loading Products...</span></div> :
        <div className="vstack gap-4">
            {products.map(product => (
              <div key={product.id} className="card shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                    <h5 className="mb-0 text-dark">{product.name_en || product.name}</h5>
                    <button className="btn btn-success btn-sm" onClick={() => handleSaveAllForProduct(product)}><FaSave className="me-2"/>Save All For This Product</button>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light"><tr><th className="ps-3" style={{width: '15%'}}>Variant</th><th style={{width: '10%'}}>Original Price</th><th style={{width: '20%'}}>Offer</th><th style={{width: '10%'}}>Final Price</th><th style={{width: '15%'}}>Offer Starts</th><th style={{width: '15%'}}>Offer Ends</th><th className="text-center" style={{width: '10%'}}>Save</th></tr></thead>
                    <tbody>
                      <ProductBulkEditRow onApplyToAll={(bulkOffer: any) => handleApplyOfferToAllVariants(product.id, bulkOffer)} />
                      {(product.variants && product.variants.length > 0) ? (
                        product.variants.flatMap((group) => group.options.map((option) => (<VariantOptionRow key={`${product.id}-${group.name_en}-${option.value_en}`} product={product} variantGroup={group} optionIndex={group.options.indexOf(option)} onSave={handleSaveVariantOffer} />)))
                      ) : (<tr><td colSpan={7} className="text-center text-muted p-3">This product has no variants defined.</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      )}

      {activeTab === 'coupons' && ( <CouponManager /> )}
    </div>
  );
}
