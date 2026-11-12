import React from 'react';
import { motion } from 'framer-motion';
import { Check, MessageCircle } from 'lucide-react';

export const Partnership = () => {
  const tiers = [
    {
      badge: 'Food Supply',
      title: 'Pasokan Harian',
      minOrder: 'Untuk kebutuhan rumah tangga dan usaha',
      benefits: [
        'Buah dan sayuran',
        'Ayam, daging, ikan, dan seafood',
        'Konfirmasi ketersediaan produk',
      ],
      isFeatured: false,
    },
    {
      badge: 'Business Supply',
      title: 'Pengadaan Bisnis',
      minOrder: 'Untuk kantor, usaha, dan kebutuhan rutin',
      benefits: [
        'Pilihan produk frozen dan siap masak',
        'Pembahasan kebutuhan dan jadwal pasokan',
        'Penawaran berdasarkan daftar kebutuhan',
      ],
      isFeatured: true,
    },
    {
      badge: 'Meal Supply',
      title: 'Paket Menu',
      minOrder: 'Pilihan paket mulai Rp23.000',
      benefits: [
        'Pilihan menu breakfast, lunch, dan dinner',
        'Pilihan paket Rp23.000, Rp25.000, Rp28.000, dan Rp30.000',
        'Hubungi kami untuk pemesanan',
      ],
      isFeatured: false,
    },
  ];

  const handleConsultation = (tierTitle) => {
    const text = encodeURIComponent(
      `Halo Outjourney, saya berminat membahas kerja sama Food Supply untuk [${tierTitle}]. Mohon informasi katalog dan penawaran.`
    );
    window.open(`https://wa.me/6281388882473?text=${text}`, '_blank');
  };

  return (
    <section className="section-partnership" id="partnership">
      <div className="partnership-container">
        <div className="partnership-header">
          <span className="standards-eyebrow">Peluang Kerja Sama</span>
          <h2>
            Program Kemitraan &amp; <em className="italic">Food Supply</em>
          </h2>
          <p>
            Hubungi tim kami untuk membahas kebutuhan pasokan pangan, pengadaan rutin, dan peluang kerja sama bisnis.
          </p>
        </div>

        <div className="partnership-tiers-grid">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.title}
              className={`tier-card ${tier.isFeatured ? 'featured' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
            >
              <span className="tier-badge">{tier.badge}</span>
              <h3 className="tier-title">{tier.title}</h3>
              <p className="tier-min">{tier.minOrder}</p>

              <ul className="tier-benefits">
                {tier.benefits.map((benefit, i) => (
                  <li key={i}>
                    <Check />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="btn-tier-cta"
                onClick={() => handleConsultation(tier.title)}
              >
                <MessageCircle size={17} /> Ajukan Kemitraan
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
