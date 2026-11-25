import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, PackageCheck, Sparkles, UsersRound } from 'lucide-react';

const profileHighlights = [
  {
    title: 'Produk pilihan',
    text: 'Bahan dan produk siap masak.',
    icon: PackageCheck,
    tone: 'blue',
  },
  {
    title: 'Paket makan',
    text: 'Menu harian untuk tim.',
    icon: Sparkles,
    tone: 'violet',
  },
  {
    title: 'Pesan mudah',
    text: 'Belanja, lalu cek pesanan.',
    icon: Lightbulb,
    tone: 'amber',
  },
  {
    title: 'Untuk bisnis',
    text: 'Pasokan rutin lebih praktis.',
    icon: UsersRound,
    tone: 'green',
  },
];

export const CompanyProfile = () => (
  <section className="section-profile" id="profile">
    <div className="profile-modern-layout">
      <motion.div
        className="profile-modern-intro"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
      >
        <span className="profile-eyebrow">Tentang Outjourney</span>
        <h2 className="profile-heading">
          Solusi pasokan <em className="italic">untuk bisnis.</em>
        </h2>
        <p>
          Produk, paket makan, dan layanan pasokan dalam satu tempat.
        </p>
      </motion.div>

      <motion.div
        className="profile-highlight-grid"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {profileHighlights.map(({ title, text, icon: Icon, tone }) => (
          <article className={`profile-highlight profile-highlight-${tone}`} key={title}>
            <div className="profile-highlight-art" aria-hidden="true">
              <span className="profile-highlight-orbit" />
              <Icon />
            </div>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </motion.div>
    </div>
  </section>
);
