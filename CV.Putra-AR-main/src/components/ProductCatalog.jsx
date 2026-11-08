import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Search, Plus } from 'lucide-react';
import { productsData, formatRupiah } from '../data/products';
import { foodSupplyCategories, foodSupplyWhatsApp, mealPackages } from '../data/foodSupply';
import { useCart } from '../context/CartContext';

export const ProductCatalog = ({ onSelectProduct }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSupplyCategory, setActiveSupplyCategory] = useState('Semua');
  const [supplySearchQuery, setSupplySearchQuery] = useState('');
  const { addItem } = useCart();

  const categories = [
    { key: 'all', label: 'Semua Produk' },
    { key: 'bakso', label: 'Bakso Sapi' },
    { key: 'otakotak', label: 'Otak-Otak' },
    { key: 'snack', label: 'Snack & Camilan' },
    { key: 'kwetiau', label: 'Kwetiau' },
  ];

  const filteredProducts = productsData.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredSupplyCategories = foodSupplyCategories
    .filter((category) => activeSupplyCategory === 'Semua' || category.name === activeSupplyCategory)
    .map((category) => ({
      ...category,
      items: category.items.filter((item) =>
        item.toLowerCase().includes(supplySearchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.items.length > 0);

  const getInquiryUrl = (item) => {
    const message = `Halo Outjourney, saya ingin menanyakan harga dan ketersediaan ${item}.`;
    return `https://wa.me/${foodSupplyWhatsApp}?text=${encodeURIComponent(message)}`;
  };
  const productCount = filteredProducts.length;
  const supplyItemCount = filteredSupplyCategories.reduce(
    (total, category) => total + category.items.length,
    0
  );

  return (
    <section className="section-products" id="products">
      <div className="catalog-intro">
        <span className="standards-eyebrow">Pengadaan lebih mudah bersama Outjourney</span>
        <h2>Food Supply <em>untuk bisnis</em></h2>
        <p>
          Satu mitra untuk kebutuhan bahan pangan, produk olahan, dan menu harian—siap mendukung operasional bisnis Anda.
        </p>
        <div className="catalog-trust-points">
          <span>Produk pilihan terkurasi</span>
          <span>Harga transparan</span>
          <span>Pesan langsung via WhatsApp</span>
        </div>
      </div>

      <div className="catalog-section-heading">
        <div>
          <span className="catalog-section-kicker">Produk siap dipesan</span>
          <h3>Produk olahan kemasan</h3>
        </div>
        <span className="catalog-result-count">{productCount} produk</span>
      </div>
      <div className="products-toolbar">
        <div className="category-tabs" aria-label="Kategori produk olahan">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`category-tab-btn ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <label className="search-input-wrapper">
          <Search />
          <input
            type="text"
            placeholder="Cari produk olahan..."
            aria-label="Cari produk olahan"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </div>

      <div className="catalog-grid">
        {filteredProducts.map((prod, idx) => (
          <motion.div
            key={prod.id}
            className="catalog-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: idx * 0.08 }}
          >
            <button
              type="button"
              className="catalog-img-box"
              onClick={() => onSelectProduct && onSelectProduct(prod)}
              aria-label={`Lihat detail ${prod.name}`}
            >
              <img src={prod.img} alt={prod.name} loading="lazy" />
              {prod.isBestSeller && (
                <span className="catalog-badge">Favorit pelanggan</span>
              )}
              <span className="catalog-image-action">
                Lihat detail <ArrowUpRight size={14} />
              </span>
            </button>

            <div className="catalog-content">
              <div className="catalog-product-category">{prod.categoryLabel}</div>
              <button
                type="button"
                className="catalog-title"
                onClick={() => onSelectProduct && onSelectProduct(prod)}
              >
                {prod.name}
              </button>
              <p className="catalog-description">{prod.desc}</p>

              <div className="catalog-unit">{prod.unit}</div>
              <div className="catalog-price-row">
                <div>
                  <span className="catalog-price-label">Harga produk</span>
                  <strong className="catalog-price">{formatRupiah(prod.price)}</strong>
                </div>
                <button
                  type="button"
                  className="btn-add-cart"
                  onClick={() => addItem(prod)}
                >
                  <Plus size={15} /> Tambah
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {!productCount && (
          <p className="food-supply-empty">Tidak ada produk olahan yang cocok dengan pencarian.</p>
        )}
      </div>

      <div className="food-supply-section">
        <div className="food-supply-heading">
          <div>
            <span className="catalog-section-kicker">Catering &amp; konsumsi</span>
            <h3>Paket Makan</h3>
          </div>
          <p>Paket menu terencana untuk tim, rapat, dan kebutuhan makan rutin. Tanya tim kami untuk penawaran.</p>
        </div>

        <div className="meal-package-grid">
          {mealPackages.map((meal) => {
            const menuDetails = meal.groups
              .map((group) => `${group.title}: ${group.items.join(', ')}`)
              .join('\n');
            const message = `Halo Outjourney, saya ingin memesan informasi untuk ${meal.title} (Rp${meal.price.toLocaleString('id-ID')}):\n${menuDetails}`;

            return (
              <article className="meal-package-card" key={meal.id}>
                <div className="meal-package-topline">
                  <span>Paket Menu</span>
                  <strong>{formatRupiah(meal.price)}</strong>
                </div>
                <h4>{meal.title}</h4>
                {meal.groups.map((group) => (
                  <div className="meal-package-group" key={group.title}>
                    <h5>{group.title}</h5>
                    <ul>
                      {group.items.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                <a
                  className="meal-package-cta"
                  href={`https://wa.me/${foodSupplyWhatsApp}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Tanya &amp; Pesan
                </a>
              </article>
            );
          })}
        </div>
      </div>

      <div className="food-supply-section">
        <div className="food-supply-heading">
          <div>
            <span className="catalog-section-kicker">Untuk dapur dan bisnis kuliner</span>
            <h3>Katalog Food Supply</h3>
          </div>
          <span className="catalog-result-count">{supplyItemCount} item tersedia</span>
        </div>

        <div className="products-toolbar supply-toolbar">
          <div className="category-tabs" aria-label="Kategori food supply">
            {['Semua', ...foodSupplyCategories.map((category) => category.name)].map((category) => (
              <button
                key={category}
                type="button"
                className={`category-tab-btn ${activeSupplyCategory === category ? 'active' : ''}`}
                onClick={() => setActiveSupplyCategory(category)}
              >
                <span>{category}</span>
                <span className="category-tab-count">
                  {category === 'Semua'
                    ? foodSupplyCategories.reduce((total, entry) => total + entry.items.length, 0)
                    : foodSupplyCategories.find((entry) => entry.name === category).items.length}
                </span>
              </button>
            ))}
          </div>
          <label className="search-input-wrapper">
            <Search />
            <input
              type="text"
              placeholder="Cari bahan pangan..."
              value={supplySearchQuery}
              onChange={(event) => setSupplySearchQuery(event.target.value)}
              aria-label="Cari bahan pangan"
            />
          </label>
        </div>

        <div className="food-supply-grid">
          {filteredSupplyCategories.map((category) => (
            <article className="food-supply-card" key={category.name}>
              <h4>{category.name}</h4>
              <ul>
                {category.items.map((item) => (
                  <li key={item}>
                    <span>{item}</span>
                    <a
                      href={getInquiryUrl(item)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Tanyakan harga dan ketersediaan ${item}`}
                    >
                      Tanya harga <ArrowUpRight size={13} />
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          ))}
          {!filteredSupplyCategories.length && (
            <p className="food-supply-empty">Tidak ada bahan pangan yang cocok dengan pencarian.</p>
          )}
        </div>
      </div>
    </section>
  );
};
