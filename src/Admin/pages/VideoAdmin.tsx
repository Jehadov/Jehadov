import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const VIDEO_DOC_ID = 'hero_video';

const VideoAdmin: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadVideo = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'news_and_video', VIDEO_DOC_ID);
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
      await setDoc(doc(db, 'news_and_video', VIDEO_DOC_ID), {
        videoUrl: videoUrl.trim()
      });
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
      await deleteDoc(doc(db, 'news_and_video', VIDEO_DOC_ID));
      setVideoUrl('');
      setMessage('Video URL deleted successfully!');
    } catch (err) {
      console.error('Failed to delete video URL:', err);
      setMessage('Failed to delete video URL.');
    }
    setSaving(false);
  };

  // Helper: Convert normal YouTube URL to embed format
  const convertToEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">🎬 Manage Hero Video</h2>

      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-center">Loading current video URL...</p>
      ) : (
        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10 col-12">
            <label className="form-label fw-semibold">YouTube Video URL</label>
            <input
              type="url"
              className="form-control mb-3"
              placeholder="https://www.youtube.com/watch?v=abc123"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />

            <div className="d-flex flex-wrap gap-2 mb-4">
              <button
                className="btn btn-primary flex-grow-1"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Video URL'}
              </button>
              <button
                className="btn btn-danger flex-grow-1"
                onClick={handleDelete}
                disabled={saving || !videoUrl}
              >
                Delete Video URL
              </button>
            </div>

            {/* 🔍 Preview */}
            {videoUrl && convertToEmbedUrl(videoUrl) && (
              <div className="ratio ratio-16x9 rounded shadow-sm mb-3">
                <iframe
                  src={convertToEmbedUrl(videoUrl) || ''}
                  title="YouTube Video Preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoAdmin;
