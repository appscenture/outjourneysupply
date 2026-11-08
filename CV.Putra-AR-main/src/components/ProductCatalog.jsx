import React, { useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { foodSupplyCategories, foodSupplyWhatsApp, mealPackages } from '../data/foodSupply';

const foodSupplyItems = foodSupplyCategories.flatMap((category) =>
  category.items.map((item) => ({ category: category.name, item }))
);

const mealPackageImages = {
  'meal-23k': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=85',
  'meal-25k': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=85',
  'meal-28k': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=85',
  'meal-30k': 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=85',
};

export const ProductCatalog = () => {
  const [activeSupplyCategory, setActiveSupplyCategory] = useState('Semua');
  const [supplySearchQuery, setSupplySearchQuery] = useState('');

  const filteredSupplyItems = foodSupplyItems.filter(({ category, item }) => {
    const matchesCategory = activeSupplyCategory === 'Semua' || category === activeSupplyCategory;
    const searchText = `${category} ${item}`.toLowerCase();
    return matchesCategory && searchText.includes(supplySearchQuery.trim().toLowerCase());
  });

  const getInquiryUrl = (item) => {
    const message = `Halo Outjourney, saya ingin menanyakan harga dan ketersediaan ${item}.`;
    return `https://wa.me/${foodSupplyWhatsApp}?text=${encodeURIComponent(message)}`;
  };

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
            <article
              className="meal-package-card meal-package-card-with-image"
              style={{
                '--meal-package-image': `url("${mealPackageImages[meal.id]}")`,
              }}
              key={meal.id}
            >
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
          <span className="catalog-result-count">
            {filteredSupplyItems.length} dari {foodSupplyItems.length} item
          </span>
        </div>

        <div className="supply-table-toolbar">
          <label className="supply-search">
            <Search />
            <input
              type="text"
              placeholder="Cari item atau kategori..."
              value={supplySearchQuery}
              onChange={(event) => setSupplySearchQuery(event.target.value)}
              aria-label="Cari item atau kategori food supply"
            />
          </label>
          <label className="supply-category-filter">
            <span>Filter kategori</span>
            <select
              value={activeSupplyCategory}
              onChange={(event) => setActiveSupplyCategory(event.target.value)}
              aria-label="Filter kategori food supply"
            >
              <option value="Semua">Semua kategori</option>
              {foodSupplyCategories.map((category) => (
                <option key={category.name} value={category.name}>{category.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="food-supply-table-wrap">
          <table className="food-supply-table">
            <thead>
              <tr>
                <th scope="col" className="supply-row-number-heading">#</th>
                <th scope="col">Item</th>
                <th scope="col">Kategori</th>
                <th scope="col" className="supply-action-heading">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredSupplyItems.map(({ category, item }, index) => (
                <tr key={`${category}-${item}`}>
                  <td className="supply-row-number">{index + 1}</td>
                  <td className="supply-item-name">{item}</td>
                  <td><span className="supply-category-tag">{category}</span></td>
                  <td className="supply-action-cell">
                    <a
                      href={getInquiryUrl(item)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Tanyakan harga dan ketersediaan ${item}`}
                    >
                      Tanya harga <ArrowUpRight size={14} />
                    </a>
                  </td>
                </tr>
              ))}
              {!filteredSupplyItems.length && (
                <tr>
                  <td className="food-supply-empty" colSpan="4">
                    Tidak ada item yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
