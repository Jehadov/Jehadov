import React, { useEffect, useState, useMemo, useCallback } from 'react';
import '../../assets/HomePage.css';
import { collection, getDocs, onSnapshot, query, where, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from 'react-i18next';
import { type Category, type Product } from '../../Users/pages/types';
import ProductCard from './ProductCard';
import { FaSpinner, FaSearch } from 'react-icons/fa';
import CategoryLine from './CategoryLine';
import VedioAndNews from './VideoAndNews';

const HomePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [liveSearchQuery, setLiveSearchQuery] = useState('');

  const currentLang = i18n.language.startsWith('ar') ? 'ar' : 'en';

  const getLocalizedText = useCallback((item: any, fieldPrefix: string): string => {
    if (!item) return '';
    return item[`${fieldPrefix}_${currentLang}`] || item[`${fieldPrefix}_en`] || item[fieldPrefix] || '';
  }, [currentLang]);

  // Fetch categories on load
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const fetchedCategories: Category[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Real-time listener for products
  useEffect(() => {
    setLoadingProducts(true);

    const productsRef = collection(db, "products");
    let productQuery;

    if (selectedCategoryId === "offers") {
      productQuery = query(productsRef, where("isOffer", "==", true), limit(50));
    } else if (selectedCategoryId === "all") {
      productQuery = query(productsRef, limit(100));
    } else {
      productQuery = query(productsRef, where("category", "array-contains", selectedCategoryId), limit(50));
    }

    const unsubscribe = onSnapshot(productQuery, (querySnapshot) => {
      const fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(fetchedProducts);
      setLoadingProducts(false);
    }, (error) => {
      console.error("[HomePage] Error listening to products:", error);
      setLoadingProducts(false);
    });

    return () => unsubscribe();
  }, [selectedCategoryId]);

  const filteredProducts = useMemo(() => {
    const trimmedQuery = liveSearchQuery.trim().toLowerCase();
    if (!trimmedQuery) return products;

    return products.filter(product => {
      const nameEn = product.name_en?.toLowerCase() || '';
      const nameAr = product.name_ar?.toLowerCase() || '';
      return nameEn.includes(trimmedQuery) || nameAr.includes(trimmedQuery);
    });
  }, [products, liveSearchQuery]);

  return (
    <main>
      <VedioAndNews />
      {/* Category + Products */}
      <div className="container my-5">
        <h2 className="mb-4 text-center">{t('home.selectCategoryTitle', 'Select a Category')}</h2>

        <CategoryLine
          categories={categories}
          selectedId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          getLocalizedText={getLocalizedText}
        />

        <hr className="my-4" />

        {/* Search */}
        <div id="search" className="mb-4 row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="input-group shadow-sm">
              <span className="input-group-text bg-light border-end-0"><FaSearch /></span>
              <input
                type="search"
                className="form-control border-start-0"
                placeholder={t('productList.searchPlaceholder', 'Search products in this category...')}
                value={liveSearchQuery}
                onChange={(e) => setLiveSearchQuery(e.target.value)}
                onClick={() => { window.location.hash = '#search'; }}
              />
            </div>
          </div>
        </div>

        {/* Products */}
        {loadingProducts ? (
          <div className="text-center p-5">
            <FaSpinner className="fa-spin fa-2x text-primary" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="row g-3">
            {filteredProducts.map(product => (
              <div className="col-6 col-md-4 col-lg-2" key={product.id}>
                <ProductCard product={product} searchQuery={liveSearchQuery} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-5">
            <p className="text-muted">
              {liveSearchQuery
                ? t('productList.noResultsFound', 'No products found matching your search.')
                : t('productList.noProductsInCategory', 'No products found in this category.')}
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default HomePage;
