import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../firebase';

interface TypeItem {
  id: string;
  name: string;
}

const ManageType: React.FC = () => {
  const [types, setTypes] = useState<TypeItem[]>([]);
  const [typeName, setTypeName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch all types
  const fetchTypes = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'types'));
      const data: TypeItem[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<TypeItem, 'id'>),
      }));
      setTypes(data);
    } catch (error) {
      console.error('Error fetching types:', error);
      alert('Failed to load types.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  // Add or update type
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) {
      alert('Type name is required.');
      return;
    }

    try {
      if (editId) {
        await updateDoc(doc(db, 'types', editId), { name: typeName });
        alert('Type updated!');
      } else {
        await addDoc(collection(db, 'types'), { name: typeName });
        alert('Type added!');
      }
      setTypeName('');
      setEditId(null);
      fetchTypes();
    } catch (error) {
      console.error('Error saving type:', error);
      alert('Failed to save type.');
    }
  };

  const startEdit = (typeItem: TypeItem) => {
    setTypeName(typeItem.name);
    setEditId(typeItem.id);
  };

  const cancelEdit = () => {
    setTypeName('');
    setEditId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this type?')) return;
    try {
      await deleteDoc(doc(db, 'types', id));
      alert('Type deleted.');
      fetchTypes();
    } catch (error) {
      console.error('Error deleting type:', error);
      alert('Failed to delete type.');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Manage Types</h2>

      <form onSubmit={handleSubmit} className="mb-4 row g-2 align-items-center">
        <div className="col-auto">
          <input
            type="text"
            className="form-control"
            placeholder="Type Name"
            value={typeName}
            onChange={e => setTypeName(e.target.value)}
            required
          />
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-primary">
            {editId ? 'Update Type' : 'Add Type'}
          </button>
        </div>
        {editId && (
          <div className="col-auto">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          </div>
        )}
      </form>

      {/* List of Types */}
      {loading ? (
        <p>Loading types...</p>
      ) : types.length === 0 ? (
        <p>No types found.</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Name</th>
              <th style={{ width: '140px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {types.map(type => (
              <tr key={type.id}>
                <td>{type.name}</td>
                <td>
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => startEdit(type)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(type.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageType;
