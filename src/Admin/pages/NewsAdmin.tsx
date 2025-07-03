import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: any;
}

const NewsAdmin: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'news_and_video'),
      (snapshot) => {
        const items: NewsItem[] = snapshot.docs
          .filter((doc) => !doc.id.startsWith('hero_video'))
          .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<NewsItem, 'id'>) }));
        setNewsItems(items);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching news:', error);
        setMessage('Failed to load news.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageUrl('');
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setMessage('Title and description are required.');
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      if (editingId) {
        const docRef = doc(db, 'news_and_video', editingId);
        await updateDoc(docRef, {
          title: title.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim() || '',
          updatedAt: serverTimestamp(),
        });
        setMessage('News updated successfully!');
      } else {
        await addDoc(collection(db, 'news_and_video'), {
          title: title.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim() || '',
          createdAt: serverTimestamp(),
        });
        setMessage('News added successfully!');
      }
      resetForm();
    } catch (err: any) {
      console.error('Failed to save news:', err);
      setMessage('Failed to save news: ' + (err.message || err));
    }

    setSaving(false);
  };

  const handleEdit = (item: NewsItem) => {
    setTitle(item.title);
    setDescription(item.description);
    setImageUrl(item.imageUrl || '');
    setEditingId(item.id);
    setMessage(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this news item?')) return;

    setSaving(true);
    setMessage(null);

    try {
      await deleteDoc(doc(db, 'news_and_video', id));
      setMessage('News deleted successfully!');
      if (editingId === id) resetForm();
    } catch (err: any) {
      console.error('Failed to delete news:', err);
      setMessage('Failed to delete news: ' + (err.message || err));
    }

    setSaving(false);
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">Manage News</h2>

      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'}`}>
          {message}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="mb-5 p-4 shadow rounded bg-light"
      >
        <div className="mb-3">
          <label className="form-label">News Title *</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter news title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={saving}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">News Description *</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Enter news description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={saving}
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="form-label">Image URL (optional)</label>
          <input
            type="url"
            className="form-control"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={saving}
          />
        </div>

        <button type="submit" className="btn btn-primary me-2" disabled={saving}>
          {saving ? 'Saving...' : editingId ? 'Update News' : 'Add News'}
        </button>
        {editingId && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => resetForm()}
            disabled={saving}
          >
            Cancel Edit
          </button>
        )}
      </form>

      <hr />

      <h3 className="mb-3">Existing News</h3>
      {loading ? (
        <p>Loading news...</p>
      ) : newsItems.length === 0 ? (
        <p>No news found.</p>
      ) : (
        <ul className="list-group">
          {newsItems.map((item) => (
            <li
              key={item.id}
              className="list-group-item d-flex justify-content-between align-items-start"
            >
              <div>
                <h5>{item.title}</h5>
                <p>{item.description}</p>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    style={{ maxWidth: 150, maxHeight: 100 }}
                  />
                )}
              </div>
              <div>
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => handleEdit(item)}
                  disabled={saving}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(item.id)}
                  disabled={saving}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NewsAdmin;
