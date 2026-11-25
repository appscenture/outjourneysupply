import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Plus, Search, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { foodSupplyCategories, foodSupplyWhatsApp, mealPackages } from '../data/foodSupply';
import { formatRupiah } from '../data/products';
import { getSupabaseClient } from '../../lib/supabase/client';
import { getAlgoliaSearchConfig } from '../lib/algolia';

const foodSupplyItems = foodSupplyCategories.flatMap((category) =>
  category.items.map((item) => ({ category: category.name, item }))
);

const catalogTabs = [
  { id: 'products', label: 'Produk' },
  { id: 'meals', label: 'Paket makan' },
  { id: 'supply', label: 'Bahan pangan' },
];

const mapStoreProduct = (product) => ({
  ...product,
  price: Number(product.price_idr || 0),
  img: product.image_path
    ? /^https?:\/\//i.test(product.image_path)
      ? product.image_path
      : product.image_path.startsWith('/')
        ? product.image_path
        : `/${product.image_path}`
    : '',
  categoryLabel: product.category,
  isBestSeller: Boolean(product.is_featured),
});

export const ProductCatalog = ({ searchQuery, onSearchChange, showCartButton = true }) => {
  const { addItem, items, toggleCart } = useCart();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [productsErrorMessage, setProductsErrorMessage] = useState('');
  const [storefrontMigrationPending, setStorefrontMigrationPending] = useState(false);
  const [algoliaObjectIds, setAlgoliaObjectIds] = useState(null);
  const [algoliaError, setAlgoliaError] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [category, setCategory] = useState('Semua');
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError(false);
    setProductsErrorMessage('');
    setStorefrontMigrationPending(false);
    try {
      const { data, error } = await getSupabaseClient()
        .from('products')
        .select('id, sku, name, category, description, unit, image_path, price_idr, is_featured')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('name');

      if (error?.code === '42703' && /products\.price_idr does not exist/i.test(error.message || '')) {
        setStorefrontMigrationPending(true);
        console.warn('Storefront pricing migrations are pending; showing available products as quote-only until they are applied.');
        const fallback = await getSupabaseClient()
          .from('products')
          .select('id, sku, name, category, description, unit, image_path')
          .eq('is_active', true)
          .order('name');

        if (fallback.error) throw fallback.error;
        setProducts((fallback.data || []).map(mapStoreProduct));
      } else {
        if (error) throw error;
        setProducts((data || []).map(mapStoreProduct));
      }
    } catch (error) {
      console.error('Outjourney product catalog could not be loaded.', error);
      setProductsErrorMessage(
        error?.code === '42501'
          ? 'Supabase public product access is not enabled. Apply the storefront migrations and retry.'
          : 'Supabase catalog setup is incomplete. Apply the storefront migrations and retry.',
      );
      setProductsError(true);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  useEffect(() => {
    if (activeTab !== 'products' || !normalizedQuery) {
      setAlgoliaObjectIds(null);
      setAlgoliaError(false);
      return undefined;
    }

    const config = getAlgoliaSearchConfig();
    if (!config) {
      setAlgoliaObjectIds(null);
      setAlgoliaError(false);
      return undefined;
    }

    let active = true;
    setAlgoliaObjectIds(null);
    setAlgoliaError(false);
    const timeout = window.setTimeout(async () => {
      try {
        const result = await config.client.searchSingleIndex({
          indexName: config.indexName,
          searchParams: { query: searchQuery, hitsPerPage: 100 },
        });
        if (active) {
          setAlgoliaObjectIds(result.hits.map((hit) => String(hit.objectID)));
        }
      } catch (error) {
        console.error('Algolia product search failed.', error);
        if (active) setAlgoliaError(true);
      }
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [activeTab, normalizedQuery]);

  const categories = activeTab === 'products'
    ? [...new Set(products.map((product) => product.categoryLabel))]
    : activeTab === 'supply'
      ? foodSupplyCategories.map((foodCategory) => foodCategory.name)
      : [];

  const localFilteredProducts = products.filter((product) => {
    const matchesCategory = category === 'Semua' || product.categoryLabel === category;
    const matchesQuery = `${product.name} ${product.sku} ${product.categoryLabel} ${product.unit} ${product.description || ''}`
      .toLowerCase()
      .includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });
  const filteredProducts = algoliaObjectIds
    ? localFilteredProducts
      .filter((product) => algoliaObjectIds.includes(product.sku))
      .sort((left, right) => algoliaObjectIds.indexOf(left.sku) - algoliaObjectIds.indexOf(right.sku))
    : localFilteredProducts;

  const filteredSupplyItems = foodSupplyItems.filter(({ category: itemCategory, item }) => {
    const matchesCategory = category === 'Semua' || itemCategory === category;
    return matchesCategory && `${itemCategory} ${item}`.toLowerCase().includes(normalizedQuery);
  });

  const filteredMeals = mealPackages.filter((meal) =>
    meal.title.toLowerCase().includes(normalizedQuery)
  );

  const selectTab = (tab) => {
    setActiveTab(tab);
    setCategory('Semua');
    onSearchChange('');
  };

  const getInquiryUrl = (message) =>
    `https://wa.me/${foodSupplyWhatsApp}?text=${encodeURIComponent(message)}`;

  return (
    <section className="section-products" id="products">
      <div className="catalog-intro">
        <div>
          <span className="standards-eyebrow">Katalog Outjourney</span>
          <h2>Belanja kebutuhan bisnis</h2>
          <p>Produk pilihan, paket makan, dan bahan pangan.</p>
        </div>
        {showCartButton && (
          <button type="button" className="catalog-order-link" onClick={toggleCart}>
            <ShoppingCart size={17} /> Keranjang
          </button>
        )}
      </div>

      <div className="store-catalog">
        <div className="store-catalog-controls">
          <div className="store-catalog-tabs" role="tablist" aria-label="Jenis katalog">
            {catalogTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? 'active' : ''}
                onClick={() => selectTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="store-catalog-filters">
            <label className="store-catalog-search">
              <Search size={18} />
              <input
                id="store-catalog-search"
                type="search"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={activeTab === 'meals' ? 'Cari paket makan' : 'Cari di katalog'}
                aria-label="Cari katalog"
              />
            </label>
            {activeTab !== 'meals' && (
              <select
                className="store-category-select"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                aria-label="Filter kategori"
              >
                <option value="Semua">Semua kategori</option>
                {categories.map((option) => (
                  <option value={option} key={option}>{option}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {activeTab === 'products' && productsError && (
          <div className="store-catalog-error" role="alert">
            <span>{productsErrorMessage || 'Products are temporarily unavailable.'}</span>
            <button type="button" onClick={loadProducts}>Try again</button>
          </div>
        )}

        {activeTab === 'products' && storefrontMigrationPending && !productsError && (
          <p className="store-search-note" role="status">
            Supabase catalog migrations are pending. Apply them to enable public reads and load the full catalog.
          </p>
        )}

        {activeTab === 'products' && algoliaError && (
          <p className="store-search-note" role="status">
            Product search is temporarily unavailable; showing matching catalog items.
          </p>
        )}

        {activeTab === 'products' && productsLoading && (
          <p className="store-catalog-empty" role="status">Loading products...</p>
        )}

        {activeTab === 'products' && !productsLoading && !productsError && (
          <div className="store-product-grid">
            {filteredProducts.map((product) => {
              const quantity = items.find((item) => item.id === product.id)?.quantity || 0;
              return (
                <article className="store-product-card" key={product.id}>
                  <div className="store-product-image">
                    {product.img ? (
                      <img src={product.img} alt={product.name} loading="lazy" />
                    ) : (
                      <span className="store-product-no-image">No image</span>
                    )}
                    {product.isBestSeller && <span className="store-product-tag">Favorit</span>}
                  </div>
                  <div className="store-product-info">
                    <span className="store-product-category">{product.categoryLabel}</span>
                    <h3><Link href={`/products/${encodeURIComponent(product.sku)}`}>{product.name}</Link></h3>
                    <span className="store-product-unit">{product.unit}</span>
                    <div className="store-product-purchase">
                      <strong>{product.price > 0 ? formatRupiah(product.price) : 'Tanya harga'}</strong>
                      {product.price > 0 ? (
                        <button type="button" onClick={() => addItem(product)} aria-label={`Tambah ${product.name} ke keranjang`}>
                          {quantity > 0 ? <span>{quantity} in cart</span> : <><Plus size={16} /> Tambah</>}
                        </button>
                      ) : (
                        <a
                          className="store-product-inquiry"
                          href={`https://wa.me/${foodSupplyWhatsApp}?text=${encodeURIComponent(`Halo Outjourney, mohon informasi harga ${product.name} (${product.unit}).`)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Tanya <ArrowUpRight size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
            {!filteredProducts.length && (
              <p className="store-catalog-empty">Produk tidak ditemukan.</p>
            )}
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="store-meal-grid">
            {filteredMeals.map((meal) => {
              const menuDetails = meal.groups
                .map((group) => `${group.title}: ${group.items.join(', ')}`)
                .join('\n');
              const message = `Halo Outjourney, saya ingin menanyakan ${meal.title} (${formatRupiah(meal.price)}):\n${menuDetails}`;
              return (
                <article className="store-meal-card" key={meal.id}>
                  <span className="store-meal-icon"><ShoppingCart size={19} /></span>
                  <div>
                    <h3>{meal.title}</h3>
                    <strong>{formatRupiah(meal.price)} <small>/ porsi</small></strong>
                  </div>
                  <a href={getInquiryUrl(message)} target="_blank" rel="noreferrer" aria-label={`Tanya ${meal.title}`}>
                    Tanya paket <ArrowUpRight size={15} />
                  </a>
                </article>
              );
            })}
            {!filteredMeals.length && (
              <p className="store-catalog-empty">Paket tidak ditemukan.</p>
            )}
          </div>
        )}

        {activeTab === 'supply' && (
          <div className="store-supply-grid">
            {filteredSupplyItems.map(({ category: itemCategory, item }) => {
              const message = `Halo Outjourney, saya ingin menanyakan harga dan ketersediaan ${item}.`;
              return (
                <article className="store-supply-card" key={`${itemCategory}-${item}`}>
                  <span>{itemCategory}</span>
                  <strong>{item}</strong>
                  <a href={getInquiryUrl(message)} target="_blank" rel="noreferrer" aria-label={`Tanyakan harga ${item}`}>
                    Tanya harga <ArrowUpRight size={14} />
                  </a>
                </article>
              );
            })}
            {!filteredSupplyItems.length && (
              <p className="store-catalog-empty">Bahan pangan tidak ditemukan.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
