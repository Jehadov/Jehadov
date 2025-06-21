// src/pages/SearchResultsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
    type Product, 
    type Variant, 
    type VariantOption,
    defaultProduct,
    defaultOption as defaultVariantOption
} from '../../Users/pages/types'; // Adjust path
import ProductCard from '../pages/ProductCard'; 
import { useTranslation } from 'react-i18next';

// Assume transformRawProductData is defined here or imported
const transformRawProductData = (docId: string, dataFromFirebase: any): Product => {
    const rawData = dataFromFirebase || {};
    let productVariants: Variant[] = [];

    if (rawData.variants && Array.isArray(rawData.variants) && rawData.variants.length > 0) {
        productVariants = rawData.variants.map((variantGroup: any) => ({
            name_en: String(variantGroup.name_en || variantGroup.name || 'Default Type'),
            name_ar: String(variantGroup.name_ar || ''),
            options: Array.isArray(variantGroup.options) && variantGroup.options.length > 0
                     ? variantGroup.options.map((option: any) => ({
                        value_en: String(option.value_en || option.value || 'N/A'),
                        value_ar: String(option.value_ar || ''),
                        price: Number(option.price) || 0,
                        quantity: Number(option.quantity) || 0,
                        imageUrl: String(option.imageUrl || defaultVariantOption.imageUrl || ''),
                        unitLabel_en: String(option.unitLabel_en || option.unitLabel || defaultVariantOption.unitLabel_en || ''),
                        unitLabel_ar: String(option.unitLabel_ar || defaultVariantOption.unitLabel_ar || ''),
                     } as VariantOption))
                     : [{ ...defaultVariantOption, value_en: 'Standard Option', value_ar: 'خيار قياسي' }],
        }));
    } else if (rawData.types && typeof rawData.types === 'object' && Object.keys(rawData.types).length > 0) {
        console.warn(`Product ID ${docId}: Old 'types' structure found. Converting to 'variants' array.`);
        const options: VariantOption[] = Object.entries(rawData.types)
            .map(([key, typeValue]: [string, any]) => ({
                value_en: String(typeValue.value || key),
                value_ar: String(typeValue.value_ar || ''),
                price: Number(typeValue.price) || 0,
                quantity: Number(typeValue.quantity) || 0,
                imageUrl: String(typeValue.imageUrl || defaultVariantOption.imageUrl || ''),
                unitLabel_en: String(typeValue.unitLabel_en || typeValue.unitLabel || defaultVariantOption.unitLabel_en || ''),
                unitLabel_ar: String(typeValue.unitLabel_ar || defaultVariantOption.unitLabel_ar || ''),
            }));
        if (options.length > 0) {
            productVariants = [{ name_en: "Available Options", name_ar: "الخيارات المتاحة", options }];
        }
    }

    if (productVariants.length === 0 || productVariants.every(vg => !vg.options || vg.options.length === 0)) {
        const fallbackImage = rawData.image || defaultVariantOption.imageUrl || '';
        const fallbackPrice = rawData.price !== undefined ? Number(rawData.price) : defaultVariantOption.price;
        const fallbackQuantity = rawData.quantity !== undefined ? Number(rawData.quantity) : defaultVariantOption.quantity;
        productVariants = [{ 
            name_en: "Standard", name_ar: "قياسي",
            options: [{ 
                ...defaultVariantOption, value_en: 'Standard', value_ar: 'قياسي',
                price: fallbackPrice, quantity: fallbackQuantity, imageUrl: fallbackImage,
            }]
        }];
    }
    
    return {
        ...defaultProduct, ...rawData, id: docId,
        name_en: String(rawData.name_en || rawData.name || 'Unnamed Product'),
        name_ar: String(rawData.name_ar || ''),
        name_lowercase: String(rawData.name_en || rawData.name || '').toLowerCase(),
        name_ar_lowercase: String(rawData.name_ar || '').toLowerCase(),
        category: Array.isArray(rawData.category) ? rawData.category.map(String) : defaultProduct.category,
        shortDescription_en: String(rawData.shortDescription_en || rawData.shortDescription || ''),
        shortDescription_ar: String(rawData.shortDescription_ar || ''),
        longDescription_en: String(rawData.longDescription_en || rawData.longDescription || ''),
        longDescription_ar: String(rawData.longDescription_ar || ''),
        variants: productVariants,
        optionalAddOnIds: Array.isArray(rawData.optionalAddOnIds) ? rawData.optionalAddOnIds.map(String) : defaultProduct.optionalAddOnIds,
        isOffer: rawData.isOffer === undefined ? defaultProduct.isOffer : !!rawData.isOffer,
        image: String(rawData.image || defaultProduct.image || ''),
        manufacturedAt: rawData.manufacturedAt || defaultProduct.manufacturedAt,
        expiration: rawData.expiration || defaultProduct.expiration,
    } as Product;
};

const SearchResultsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const currentLang = i18n.language.startsWith('ar') ? 'ar' : 'en';

  const performSearch = useCallback(async () => {
    const trimmedQuery = searchQuery?.trim();
    if (!trimmedQuery) {
      setResults([]);
      setMessage(t('searchResults.enterSearchTerm', "Please enter a search term to find products."));
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage(null);
    setResults([]);

    try {
      const searchTermLowercased = trimmedQuery.toLowerCase();
      const searchField = currentLang === 'ar' ? 'name_ar_lowercase' : 'name_lowercase';
      
      console.log(`[SearchResultsPage] Lang: ${currentLang}, Searching field '${searchField}' for: ${searchTermLowercased}`);
      const productsRef = collection(db, 'products');
      
      const q = query(
        productsRef, 
        where(searchField, '>=', searchTermLowercased),
        where(searchField, '<=', searchTermLowercased + '\uf8ff'),
        orderBy(searchField), 
        limit(24) 
      );

      const querySnapshot = await getDocs(q);
      const foundProducts: Product[] = querySnapshot.docs.map(doc =>
        transformRawProductData(doc.id, doc.data())
      );
      
      setResults(foundProducts);

      if (foundProducts.length === 0) {
        // --- THIS IS THE CORRECTED LINE ---
        setMessage(t(
            'searchResults.noProductsFound', // Key
            `No products found matching "${searchQuery}". Try different keywords.`, // Default value
            { query: searchQuery } // Options for interpolation
        ));
        // --- END OF CORRECTION ---
      }

    } catch (err) {
      console.error("Error fetching search results:", err);
      setMessage(t('searchResults.fetchError', "Failed to fetch search results. Please try again later."));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentLang, t]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">
        {t('searchResults.title', 'Search Results')}
        {searchQuery && <span className="d-block fs-5 text-muted">{t('searchResults.for', 'for "{{query}}"', { query: searchQuery })}</span>}
      </h2>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">{t('loadingText', 'Loading...')}</span>
          </div>
        </div>
      )}

      {!loading && message && (
        // Using a simple key for the raw "No products found" message part for startsWith check
        <div className={`alert ${results.length > 0 && message.startsWith(t('searchResults.noProductsFound_raw', 'No products found')) ? 'alert-info' : 'alert-warning'} text-center`}>{message}</div>
      )}

      {!loading && results.length > 0 && (
        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3">
          {results.map(product => (
             (product.variants && product.variants.length > 0 && product.variants[0].options.length > 0) ? (
                <div className="col" key={product.id}>
                    <ProductCard product={product} searchQuery={searchQuery || undefined} />
                </div>
            ) : null
          ))}
        </div>
      )}
       {!loading && !message && results.length === 0 && searchQuery && (
         <div className="text-center py-5">
          <p className="lead">
            {t(
              'searchResults.noMatchesForQuery', // Key
              `No products matched your search for "${searchQuery}".`, // Default value (string)
              { query: searchQuery } // Options object for interpolation
            )}
          </p>            
          <Link to="/products/all" className="btn btn-outline-primary mt-2">{t('searchResults.viewAllProducts', 'View All Products')}</Link>
         </div>
       )}
       {!loading && !searchQuery && !message && (
         <div className="text-center py-5">
            <p className="lead">{t('searchResults.promptSearch', 'Please enter a search term in the bar above to find products.')}</p>
         </div>
       )}
    </div>
  );
};

export default SearchResultsPage;