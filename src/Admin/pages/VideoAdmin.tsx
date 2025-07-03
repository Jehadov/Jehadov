import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const VIDEO_DOC_ID = 'hero_video'; // fixed doc ID to store single video URL

const VideoAdmin: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Load current video URL from Firestore
  useEffect(() => {
    const loadVideo = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'hero_video', VIDEO_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setVideoUrl(docSnap.data().videoUrl || '');
        }
      } catch (err) {
        console.error('Failed to load video:', err);
        setMessage('Failed to load current video.');
      }
      setLoading(false);
    };
    loadVideo();
  }, []);

  const handleSave = async () => {
    if (!videoUrl.trim()) {
      setMessage('Video URL cannot be empty.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, 'hero_video', VIDEO_DOC_ID), { videoUrl: videoUrl.trim() });
      setMessage('Video URL saved successfully!');
    } catch (err) {
      console.error('Failed to save video URL:', err);
      setMessage('Failed to save video URL.');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the current video?')) return;
    setSaving(true);
    setMessage(null);
    try {
      await deleteDoc(doc(db, 'hero_video', VIDEO_DOC_ID));
      setVideoUrl('');
      setMessage('Video URL deleted successfully!');
    } catch (err) {
      console.error('Failed to delete video URL:', err);
      setMessage('Failed to delete video URL.');
    }
    setSaving(false);
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">Manage Hero Video</h2>

      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <p>Loading current video URL...</p>
      ) : (
        <div className="mb-3">
          <label className="form-label">YouTube Video URL</label>
          <input
            type="url"
            className="form-control mb-3"
            placeholder="https://www.youtube.com/watch?v=abc123"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />

          <button
            className="btn btn-primary me-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Video URL'}
          </button>
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={saving || !videoUrl}
          >
            Delete Video URL
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoAdmin;
