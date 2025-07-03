import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

type NewsItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
};

// 🔄 Convert YouTube URL to embeddable format
const convertToEmbedUrl = (url: string): string => {
  if (url.includes('youtube.com/watch')) {
    const videoId = new URL(url).searchParams.get('v');
    return `https://www.youtube.com/embed/${videoId}`;
  } else if (url.includes('youtu.be')) {
    const videoId = url.split('/').pop();
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
};

const VedioAndNews: React.FC = () => {
  useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // ✅ Fetch video from Firestore
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const videoDocRef = doc(db, 'news_and_video', 'hero_video');
        const videoSnap = await getDoc(videoDocRef);
        if (videoSnap.exists()) {
          const data = videoSnap.data();
          setVideoUrl(data.videoUrl || null);
        }
      } catch (error) {
        console.error("🔥 Error fetching video:", error);
      }
    };
    fetchVideo();
  }, []);

  // ✅ Fetch news from Firestore
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const newsCollection = collection(db, 'news_and_video');
        const newsQuery = query(newsCollection, orderBy('createdAt', 'desc'));
        const newsSnapshot = await getDocs(newsQuery);
        const newsItems = newsSnapshot.docs
          .filter(doc => doc.id !== 'hero_video')
          .map(doc => ({
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

  const extractVideoId = (url: string): string => {
    if (url.includes('youtube.com/watch')) {
      return new URL(url).searchParams.get('v') || '';
    } else if (url.includes('youtu.be')) {
      return url.split('/').pop() || '';
    }
    return '';
  };

  return (
    <section className="vedio-and-news-wrapper mb-5">
      {/* 🎥 YouTube Hero Video Section */}
      <div className="hero-video-section position-relative text-white text-center">
        {videoUrl ? (
          <div className="responsive-iframe-container">
            <iframe
              src={`${convertToEmbedUrl(videoUrl)}?autoplay=1&mute=1&loop=1&playlist=${extractVideoId(videoUrl)}&controls=0&showinfo=0&modestbranding=1&rel=0`}
              title="YouTube video"
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{
                border: 'none',
                filter: 'brightness(0.6)',
              }}
            />
          </div>
        ) : (
          <div></div>
        )}
      </div>

      {/* 📰 News Section */}
      <div className="container mt-3 position-relative">
        {/* Custom Arrows */}



        <div
          className="news-scroll-container d-flex overflow-auto gap-3 px-2"
          ref={scrollRef}
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {news.length > 0 ? (
            news.map(({ id, title, description, imageUrl }) => (
                <><><button className="category-scroll-arrow2 arrow-left" onClick={() => scroll('left')}>
                <FaChevronLeft />
              </button><div
                key={id}
                className="card flex-shrink-0 shadow-sm"
                style={{
                  minWidth: '230px',
                  maxWidth: '230px',
                  scrollSnapAlign: 'start',
                }}
              >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      className="card-img-top"
                      alt={title}
                      style={{ height: '120px', objectFit: 'cover' }} />
                  )}
                  <div className="card-body p-2">
                    <h5 className="card-title fs-6">{title}</h5>
                    <p className="card-text" style={{ fontSize: '0.85rem' }}>{description}</p>
                  </div>
                </div></><button className="category-scroll-arrow2 arrow-right" onClick={() => scroll('right')}>
                  <FaChevronRight />
                </button></>
            ))
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </section>
  );
};

export default VedioAndNews;
