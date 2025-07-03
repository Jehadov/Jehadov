// src/components/CategoryLine.tsx
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { type Category } from '../../Users/pages/types';

interface Props {
  categories: Category[];
  selectedId: string;
  onSelectCategory: (id: string) => void;
  getLocalizedText: (item: any, field: string) => string;
}

const CategoryLine: React.FC<Props> = ({ categories, selectedId, onSelectCategory, getLocalizedText }) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="category-scroller-wrapper mb-4">
      <button className="category-scroll-arrow arrow-left" onClick={() => scroll('left')}>
        <FaChevronLeft />
      </button>

      <div className="category-scroller-container" ref={scrollRef}>
        <div
          className={`category-select-item ${selectedId === 'all' ? 'active' : ''}`}
          onClick={() => onSelectCategory('all')}
        >
          <div className="category-select-img-wrapper">
            <img
              src="https://cdn-icons-png.flaticon.com/512/5632/5632430.png"
              alt="All Products"
              className="category-select-img"
            />
          </div>
          <span className="category-select-name">
            {t('home.categories.all', 'All')}
          </span>
        </div>

        {categories.map(cat => (
          <div
            key={cat.id}
            className={`category-select-item ms-4 ${selectedId === cat.id ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.id)}
          >
            <div className="category-select-img-wrapper">
              <img
                src={cat.image || 'https://via.placeholder.com/80'}
                alt={getLocalizedText(cat, 'name')}
                className="category-select-img"
              />
            </div>
            <span className="category-select-name">{getLocalizedText(cat, 'name')}</span>
          </div>
        ))}
      </div>

      <button className="category-scroll-arrow arrow-right" onClick={() => scroll('right')}>
        <FaChevronRight />
      </button>
    </div>
  );
};

export default CategoryLine;
