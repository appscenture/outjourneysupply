import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Leaf, MessageCircle, Utensils } from 'lucide-react';

export const Partnership = () => {
  const tiers = [
    {
      title: 'Food supply',
      description: 'Bahan segar dan frozen',
      icon: Leaf,
    },
    {
      title: 'Business supply',
      description: 'Pasokan rutin bisnis',
      icon: Building2,
    },
    {
      title: 'Paket makan',
      description: 'Menu harian mulai Rp23.000',
      icon: Utensils,
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
          <span className="standards-eyebrow">Untuk bisnis</span>
          <h2>Pasokan bisnis, lebih mudah.</h2>
        </div>

        <div className="partnership-tiers-grid">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.title}
              className="tier-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
            >
              <span className="tier-icon"><tier.icon size={20} /></span>
              <h3 className="tier-title">{tier.title}</h3>
              <p className="tier-min">{tier.description}</p>

              <button
                type="button"
                className="btn-tier-cta"
                onClick={() => handleConsultation(tier.title)}
              >
                <MessageCircle size={16} /> Chat
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
