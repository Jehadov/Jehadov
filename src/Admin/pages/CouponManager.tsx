import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase'; // Adjust this path to your firebase config
import {
  collection,
  getDocs,
  doc,
  query,
  where,
  setDoc,
  deleteDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import {
  FaTrash,
  FaPlus,
  FaExclamationCircle,
  FaSpinner,
  FaToggleOn,
  FaToggleOff,
} from 'react-icons/fa';

// --- Type Definition ---
interface Coupon {
  id: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  value: number;
  active: boolean;
  startDate?: Timestamp | null;
  endDate?: Timestamp | null;
}

// --- Main CouponManager Component ---
export default function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [newCoupon, setNewCoupon] = useState({
    id: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: 10,
    startDate: '',
    endDate: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const couponsCollectionRef = collection(db, 'coupons');
      let couponsQuery = showOnlyActive ? query(couponsCollectionRef, where("active", "==", true)) : query(couponsCollectionRef);
      
      const couponsSnapshot = await getDocs(couponsQuery);
      let couponsData = couponsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Coupon);

      if (showOnlyActive) {
          const now = Timestamp.now();
          couponsData = couponsData.filter(c => !c.endDate || c.endDate >= now);
      }
      setCoupons(couponsData);
    } catch (err: any) {
      console.error(err);
      setError(err.code === 'failed-precondition' ? 'Query requires an index. Check browser console for a link.' : 'Failed to fetch coupons.');
    } finally {
      setLoading(false);
    }
  }, [showOnlyActive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNewCouponChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCoupon(prev => ({ ...prev, [name]: name === 'value' ? Number(value) : value.toUpperCase() }));
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.id) return setError("Coupon code cannot be empty.");
    const couponRef = doc(db, 'coupons', newCoupon.id);
    try {
      await setDoc(couponRef, {
        discountType: newCoupon.discountType,
        value: newCoupon.value,
        active: true,
        startDate: newCoupon.startDate ? Timestamp.fromDate(new Date(newCoupon.startDate)) : null,
        endDate: newCoupon.endDate ? Timestamp.fromDate(new Date(newCoupon.endDate)) : null,
      });
      fetchData();
      setNewCoupon({ id: '', discountType: 'PERCENTAGE', value: 10, startDate: '', endDate: '' });
    } catch (err) {
      setError("Could not create coupon. It might already exist.");
    }
  };

  const handleToggleCouponStatus = async (coupon: Coupon) => {
    const couponRef = doc(db, 'coupons', coupon.id);
    try {
      await updateDoc(couponRef, { active: !coupon.active });
      fetchData();
    } catch (err) {
      setError("Could not update coupon status.");
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (window.confirm(`Are you sure you want to delete coupon "${couponId}"?`)) {
      try {
        await deleteDoc(doc(db, 'coupons', couponId));
        fetchData();
      } catch (err) {
        setError("Could not delete coupon.");
      }
    }
  };

  if (loading) return <div className="d-flex justify-content-center p-5"><FaSpinner className="fa-spin me-2" /> Loading Coupons...</div>;
  if (error) return <div className="alert alert-danger"><FaExclamationCircle className="me-2" /> {error}</div>;

  return (
    <div className="row">
      <div className="col-12">
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-white py-3"><h5 className="mb-0">Create New Coupon</h5></div>
          <div className="card-body">
            <form onSubmit={handleCreateCoupon} className="row g-3 align-items-end">
              <div className="col-md-3"><label htmlFor="id" className="form-label fw-bold">Coupon Code</label><input id="id" name="id" type="text" value={newCoupon.id} onChange={handleNewCouponChange} className="form-control" placeholder="e.g., SAVE20" required /></div>
              <div className="col-md-2"><label htmlFor="discountType" className="form-label fw-bold">Type</label><select id="discountType" name="discountType" className="form-select" value={newCoupon.discountType} onChange={handleNewCouponChange}><option value="PERCENTAGE">%</option><option value="FIXED">Fixed (JD)</option></select></div>
              <div className="col-md-2"><label htmlFor="value" className="form-label fw-bold">Value</label><input id="value" name="value" type="number" className="form-control" value={newCoupon.value} onChange={handleNewCouponChange} min={0} step="any" required /></div>
              <div className="col-md-2"><label htmlFor="startDate" className="form-label fw-bold">Start Date</label><input type="date" id="startDate" name="startDate" value={newCoupon.startDate} onChange={handleNewCouponChange} className="form-control"/></div>
              <div className="col-md-2"><label htmlFor="endDate" className="form-label fw-bold">End Date</label><input type="date" id="endDate" name="endDate" value={newCoupon.endDate} onChange={handleNewCouponChange} className="form-control"/></div>
              <div className="col-md-1 d-flex align-items-end"><button type="submit" className="btn btn-primary w-100" title="Create Coupon"><FaPlus /></button></div>
            </form>
          </div>
        </div>
      </div>
      <div className="col-12">
        <div className="card shadow-sm">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Existing Coupons</h5>
            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox" role="switch" id="activeFilter" checked={showOnlyActive} onChange={(e) => setShowOnlyActive(e.target.checked)} />
              <label className="form-check-label" htmlFor="activeFilter">Show only active</label>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light"><tr><th>Code</th><th>Type</th><th>Value</th><th>Valid From</th><th>Valid Until</th><th className="text-center">Status</th><th className="text-center">Actions</th></tr></thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td className="ps-3"><span className="fw-bold font-monospace">{coupon.id}</span></td>
                      <td>{coupon.discountType}</td>
                      <td>{coupon.value}{coupon.discountType === 'PERCENTAGE' ? '%' : ' JD'}</td>
                      <td>{coupon.startDate?.toDate().toLocaleDateString() || 'N/A'}</td>
                      <td>{coupon.endDate?.toDate().toLocaleDateString() || 'N/A'}</td>
                      <td className="text-center"><span className={`badge fs-6 ${coupon.active ? 'bg-success-subtle text-success-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'}`}>{coupon.active ? 'Active' : 'Inactive'}</span></td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-secondary me-2" onClick={() => handleToggleCouponStatus(coupon)} title={coupon.active ? 'Deactivate' : 'Activate'}>{coupon.active ? <FaToggleOn /> : <FaToggleOff />}</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteCoupon(coupon.id)} title="Delete Coupon"><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
