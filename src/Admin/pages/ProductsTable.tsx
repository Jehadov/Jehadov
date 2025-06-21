// src/Admin/Components/ProductsTable.tsx
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import type { Product, Variant, VariantOption, Category } from '../../Users/pages/types'; // Import Category
import { FaChevronLeft, FaChevronRight, FaEdit, FaTrash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface ProductsTableProps {
  products: Product[];
  allCategories: Category[]; // <-- NEW PROP: All available categories
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const formatPrice = (price: number | undefined, currencySymbol: string) =>
  price !== undefined ? `${currencySymbol}${price.toFixed(2)}` : '-';

const formatQuantity = (quantity: number | undefined) =>
  quantity !== undefined ? String(quantity) : '-';

const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  allCategories, // <-- RECEIVE PROP
  onEdit,
  onDelete,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language.startsWith('ar') ? 'ar' : 'en';

  const [currentOptionIndexMap, setCurrentOptionIndexMap] = useState<{ [productId: string]: number; }>({});

  useEffect(() => {
    const initialMap: { [productId: string]: number } = {};
    products.forEach(product => { if (product.id) initialMap[product.id] = 0; });
    setCurrentOptionIndexMap(initialMap);
  }, [products]);

  const handleSwapOption = (productId: string, direction: 'prev' | 'next') => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.variants || product.variants.length === 0 ) return;
    const firstVariantGroup = product.variants[0];
    if (!firstVariantGroup || !firstVariantGroup.options) return;
    const totalOptions = firstVariantGroup.options.length;
    if (totalOptions <= 1) return;
    setCurrentOptionIndexMap(prevMap => {
      const currentIndex = prevMap[productId] ?? 0;
      const newIndex = direction === 'prev' ? (currentIndex - 1 + totalOptions) % totalOptions : (currentIndex + 1) % totalOptions;
      return { ...prevMap, [productId]: newIndex };
    });
  };
  
  const getLocalizedText = (item: any, fieldPrefix: string, fallbackField?: string) => {
    if (!item) return fallbackField && typeof item === 'object' && item !== null && fallbackField in item ? item[fallbackField] || '' : '';
    return item[`${fieldPrefix}_${currentLang}`] || item[`${fieldPrefix}_en`] || item[fallbackField || fieldPrefix] || '';
  };

  return (
    <div className="p-md-3 bg-white container-fluid py-3"> {/* Changed to container-fluid for table responsiveness */}
      {products.length === 0 ? (
        <div className="text-center text-muted py-4">{t('productsTable.noProducts', 'No products available.')}</div>
      ) : (
        // Removed outer row g-3, using Bootstrap table classes now for structure
        <table className="table table-hover table-sm align-middle">
          <thead className="table-light">
            <tr>
              <th style={{width: '120px'}}>{t('productsTable.tableHeaders.image', 'Image')}</th>
              <th>{t('productsTable.tableHeaders.name', 'Product Name')}</th>
              <th>{t('productsTable.tableHeaders.category', 'Category')}</th>
              <th>{t('productsTable.tableHeaders.variant', 'Displayed Variant')}</th>
              <th className="text-end">{t('productsTable.tableHeaders.price', 'Price')}</th>
              <th className="text-center">{t('productsTable.tableHeaders.qty', 'Qty')}</th>
              <th className="text-center" style={{ width: '120px' }}>{t('productsTable.tableHeaders.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              if (!product.id) return null; 

              const firstVariantGroup: Variant | undefined = product.variants?.[0];
              const optionsInFirstGroup: VariantOption[] = firstVariantGroup?.options || [];
              const currentOptionIdx = currentOptionIndexMap[product.id] ?? 0;
              const safeCurrentOptionIdx = Math.min(Math.max(0, currentOptionIdx), Math.max(0, optionsInFirstGroup.length - 1));
              const currentDisplayedOption: VariantOption | undefined = optionsInFirstGroup[safeCurrentOptionIdx];
              
              const productNameDisplay = getLocalizedText(product, 'name', 'name_en');
              
              // --- UPDATED CATEGORY DISPLAY ---
              const productCategoryNames = useMemo(() => {
                if (!product.category || product.category.length === 0 || !allCategories || allCategories.length === 0) return t('productsTable.noCategory', 'N/A');
                return product.category
                  .map(catId => {
                    const categoryObj = allCategories.find(c => c.id === catId);
                    return categoryObj ? getLocalizedText(categoryObj, 'name', 'name_en') : catId;
                  })
                  .join(', ');
              }, [product.category, allCategories, currentLang]);
              // --- END UPDATED CATEGORY DISPLAY ---

              const variantGroupNameDisplay = firstVariantGroup ? getLocalizedText(firstVariantGroup, 'name', 'name_en') : '';
              const optionValueDisplay = currentDisplayedOption ? getLocalizedText(currentDisplayedOption, 'value', 'value_en') : '';
              const optionUnitLabelDisplay = currentDisplayedOption ? getLocalizedText(currentDisplayedOption, 'unitLabel', 'unitLabel_en') : '';

              return (
                <tr key={product.id}>
                  <td>
                    {currentDisplayedOption?.imageUrl ? (
                      <img src={currentDisplayedOption.imageUrl} alt={optionValueDisplay} style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '4px' }}/>
                    ) : product.image ? (
                       <img src={product.image} alt={productNameDisplay} style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '4px' }}/>
                    ) : (
                      <div className="text-muted small" style={{ width: '60px', height: '60px', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#f8f9fa', borderRadius:'4px'}}>
                        {t('productsTable.noImage', 'No Image')}
                      </div>
                    )}
                  </td>
                  <td className="fw-medium">{productNameDisplay}</td>
                  <td className="small text-muted">{productCategoryNames}</td>
                  <td>
                    {optionsInFirstGroup.length > 1 && (
                      <button className="btn btn-sm btn-link p-0 me-1" onClick={() => handleSwapOption(product.id, 'prev')} title={t('productsTable.previousOption', 'Previous Option')}><FaChevronLeft size={10}/></button>
                    )}
                    <span className="small" title={variantGroupNameDisplay ? `${variantGroupNameDisplay}: ${optionValueDisplay}` : optionValueDisplay}>
                        {optionValueDisplay} {optionUnitLabelDisplay ? `(${optionUnitLabelDisplay})` : ''}
                    </span>
                    {optionsInFirstGroup.length > 1 && (
                      <button className="btn btn-sm btn-link p-0 ms-1" onClick={() => handleSwapOption(product.id, 'next')} title={t('productsTable.nextOption', 'Next Option')}><FaChevronRight size={10}/></button>
                    )}
                  </td>
                  <td className="text-end">{formatPrice(currentDisplayedOption?.price, t('currency.jd', 'JD'))}</td>
                  <td className="text-center">{formatQuantity(currentDisplayedOption?.quantity)}</td>
                  <td className="text-center">
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => onEdit(product)} title={t('buttons.edit', 'Edit')}><FaEdit /></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(product.id)} title={t('buttons.delete', 'Delete')}><FaTrash /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProductsTable;