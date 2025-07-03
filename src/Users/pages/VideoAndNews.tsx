import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase'; // adjust the path if needed

type NewsItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
};

const VedioAndNews: React.FC = () => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);

  // Fetch video URL from Firestore (assuming only one video doc)
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const videoCollection = collection(db, 'video');
        const videoQuery = query(videoCollection, orderBy('createdAt', 'desc')); // optional ordering
        const videoSnapshot = await getDocs(videoQuery);
        if (!videoSnapshot.empty) {
          const videoDoc = videoSnapshot.docs[0];
          const data = videoDoc.data();
          setVideoUrl(data.url || null);
        }
      } catch (error) {
        console.error('Error fetching video:', error);
      }
    };

    fetchVideo();
  }, []);

  // Fetch news items from Firestore
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const newsCollection = collection(db, 'news');
        const newsQuery = query(newsCollection, orderBy('createdAt', 'desc'));
        const newsSnapshot = await getDocs(newsQuery);
        const newsItems = newsSnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || '',
          description: doc.data().description || '',
          imageUrl: doc.data().imageUrl || '',
        }));
        setNews(newsItems);
      } catch (error) {
        console.error('Error fetching news:', error);
      }
    };

    fetchNews();
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: dir === 'left' ? -300 : 300,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="vedio-and-news-wrapper mb-5">
      {/* Hero Video */}
      <div className="hero-video-section position-relative text-white text-center">
        {videoUrl ? (
          <video
            className="w-100 hero-video"
            autoPlay
            muted
            loop
            playsInline
            style={{ maxHeight: '400px', objectFit: 'cover', filter: 'brightness(0.6)' }}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div
            style={{
              height: '400px',
              backgroundColor: '#000',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#fff',
            }}
          >
            {t('home.hero.noVideo', 'No video available')}
          </div>
        )}

        <div className="hero-overlay-content position-absolute top-50 start-50 translate-middle">
          <h1 className="fw-bold">{t('home.hero.title', 'Do You Like Our Products?')}</h1>
          <p className="lead">{t('home.hero.subtitle', 'Tell us what you need!')}</p>
          <Link to="/request-item" className="btn btn-outline-light mt-3">
            {t('home.hero.button', 'Request Your Item')}
          </Link>
        </div>
      </div>

      {/* Scrollable News Section */}
      <div className="container mt-5 position-relative">
        <h2 className="text-center mb-4">{t('home.news.title', 'Latest News')}</h2>

        <button className="news-scroll-btn left" onClick={() => scroll('left')}>
          <FaChevronLeft />
        </button>
        <button className="news-scroll-btn right" onClick={() => scroll('right')}>
          <FaChevronRight />
        </button>

        <div className="news-scroll-container d-flex overflow-auto gap-3 px-2" ref={scrollRef}>
          {news.length > 0 ? (
            news.map(({ id, title, description, imageUrl }) => (
              <div key={id} className="card flex-shrink-0 shadow-sm" style={{ minWidth: '280px', maxWidth: '280px' }}>
                {imageUrl && (
                  <img src={imageUrl} className="card-img-top" alt={title} />
                )}
                <div className="card-body">
                  <h5 className="card-title">{title}</h5>
                  <p className="card-text">{description}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center">{t('home.news.noNews', 'No news available at the moment.')}</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default VedioAndNews;
