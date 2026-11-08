import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Search } from 'lucide-react';
import { formatRupiah } from '../data/products';
import { foodSupplyCategories, foodSupplyWhatsApp, mealPackages } from '../data/foodSupply';

export const ProductCatalog = () => {
  const [activeSupplyCategory, setActiveSupplyCategory] = useState('Semua');
  const [supplySearchQuery, setSupplySearchQuery] = useState('');

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
