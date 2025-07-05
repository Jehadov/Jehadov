import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type Product, type Variant as VariantGroup, type VariantOption } from '../../Users/pages/types'; // Adjust this path if necessary

// This component highlights the search query within the product name.
const HighlightedText: React.FC<{text: string; highlight: string}> = ({ text = '', highlight = '' }) => {
    if (!highlight.trim() || !text) {
        return <>{text}</>;
    }
    const lowerText = text.toLowerCase();
    const lowerHighlight = highlight.toLowerCase();
    if (!lowerText.includes(lowerHighlight)) {
        return <>{text}</>;
    }
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
    return (
        <>
            {parts.map((part, index) =>
                part.toLowerCase() === lowerHighlight ? (
                    <mark key={index} style={{backgroundColor: "#fffb87", padding: 0, color: 'inherit'}}>{part}</mark>
                ) : ( part )
            )}
        </>
    );
};
  


export default function ProductCard({ product, searchQuery = "" }: { product: Product, searchQuery?: string }) {
  const { t, i18n } = useTranslation();
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
  const [, setTimeLeft] = useState<string>('');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  
  const currentLanguage = i18n.language.startsWith('ar') ? 'ar' : 'en';

  const getLocalizedText = (item: any, fieldPrefix: string, fallback: string = '') => {
    if (!item) return fallback;
    return item[`${fieldPrefix}_${currentLanguage}`] || item[`${fieldPrefix}_en`] || item[fieldPrefix] || fallback;
  };
  const handleSwapOption = (direction: 'prev' | 'next') => {
      const totalOptions = optionsInGroup.length;
      if (totalOptions <= 1) return;
      
      setCurrentOptionIndex(prevIndex => {
          if (direction === 'prev') {
              return (prevIndex - 1 + totalOptions) % totalOptions;
          } else {
              return (prevIndex + 1) % totalOptions;
          }
      });
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    // Get the initial touch position
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const firstVariantGroup: VariantGroup | null = useMemo(() => product.variants?.[0] || null, [product.variants]);
  const optionsInGroup: VariantOption[] = useMemo(() => firstVariantGroup?.options || [], [firstVariantGroup]);

  // Reset to the first option when the product changes
  useEffect(() => { setCurrentOptionIndex(0); }, [optionsInGroup]);

  // Cycle through the product's variant images


  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) {
      return;
    }

    const currentX = e.targetTouches[0].clientX;
    const diffX = touchStartX - currentX;

    // A swipe is detected if the horizontal distance is significant
    if (Math.abs(diffX) > 40) { // 40px swipe threshold
      if (diffX > 0) {
        // Swiped left
        handleSwapOption('next');
      } else {
        // Swiped right
        handleSwapOption('prev');
      }
      // Reset the start position to prevent multiple swaps in one swipe
      setTouchStartX(null);
    }
  };

  const displayedOption: VariantOption | null = useMemo(() => optionsInGroup[currentOptionIndex] || null, [optionsInGroup, currentOptionIndex]);
  const handleTouchEnd = () => {
    // Reset the start position when the touch ends
    setTouchStartX(null);
  };
  const isOfferActive = useMemo(() => {
      if (!displayedOption?.offerType || displayedOption.offerType === 'none') return false;
      const now = new Date();
      const startDate = displayedOption.offerStartDate?.toDate();
      const endDate = displayedOption.offerEndDate?.toDate();
      if (startDate && now < startDate) return false;
      if (endDate && now > endDate) return false;
      return true;
  }, [displayedOption]);

  // Countdown timer logic
  useEffect(() => {
    if (!isOfferActive || !displayedOption?.offerEndDate) {
      setTimeLeft('');
      return;
    }
    const intervalId = setInterval(() => {
      const now = new Date().getTime();
      const endDate = displayedOption.offerEndDate!.toDate().getTime();
      const distance = endDate - now;

      if (distance < 0) {
        clearInterval(intervalId);
        setTimeLeft(t('productCard.offerEnded', 'Offer Ended'));
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      let countdownString = `${t('productCard.endsIn', 'Ends in:')} `;
      if (days > 0) countdownString += `${days}d `;
      if (hours > 0 || days > 0) countdownString += `${hours}h `;
      countdownString += `${minutes}m ${seconds}s`;
      
      setTimeLeft(countdownString);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isOfferActive, displayedOption, t]);


  if (!product.id || !displayedOption) return null;

  const showOffer = isOfferActive && typeof displayedOption.originalPrice === 'number' && displayedOption.originalPrice > displayedOption.price;
  const finalPrice = isOfferActive ? displayedOption.price : (displayedOption.originalPrice || displayedOption.price);
  
  const getOfferDescription = (option: VariantOption): string => {
    if (option.originalPrice && option.price < option.originalPrice) {
        const percentageOff = Math.round(((option.originalPrice - option.price) / option.originalPrice) * 100);
        return `${t('productCard.save', 'Save')} ${percentageOff}%`;
    }
    return '';
  };

  const productNameDisplay = getLocalizedText(product, 'name');
  const optionValueDisplay = getLocalizedText(displayedOption, 'value');

  return (
    <div>
      <div 
        className="modern-card-image-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Link to={`/product/${product.id}`} className="text-decoration-none text-dark d-block">
            <div className="modern-card-image-container  modern-product-card">
              
                {showOffer && (
                    <div className="modern-card-offer-badge">
                        {getOfferDescription(displayedOption)}
                    </div>
                )}
                <img 
                    src={displayedOption.imageUrl || product.image || "/placeholder-product.png"} 
                    className="modern-card-img object-fit-cover" 
                    alt={productNameDisplay} 
                />
            </div>
        </Link>
        <div className="modern-card-content">     
             <div className="modern-card-variant-name mb-1">
              <HighlightedText text={productNameDisplay} highlight={searchQuery} /> {optionValueDisplay}
            </div>
            <div className="modern-card-price-container ms-2">
                 <div className="d-flex align-items-baseline">
                    <span className="modern-card-price">
                        {t('currency.jd')} {finalPrice.toFixed(2)}
                    </span>
                    {showOffer && (
                        <span className="modern-card-original-price">
                            {displayedOption.originalPrice?.toFixed(2)}
                        </span>
                    )}
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
}
