import React from 'react';
import { motion } from 'framer-motion';

export const StandardsLab = () => {
  const standards = [
    {
      title: 'Sertifikasi Halal Resmi',
      desc: 'Pilihan produk dengan sertifikasi yang jelas.',
      img: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Bebas Pengawet Kimia',
      desc: 'Informasi produk disampaikan secara transparan.',
      img: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Rantai Dingin Terpadu',
      desc: 'Penanganan sesuai kebutuhan produk.',
      img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Otomasi Mesin Modern',
      desc: 'Proses produksi dan distribusi terjaga.',
      img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <section className="section-standards" id="standards">
      <div className="standards-header">
        <span className="standards-eyebrow">Kualitas dan layanan</span>
        <h2>
          Pasokan yang <em className="italic">bisa diandalkan.</em>
        </h2>
        <p>
          Pilih kebutuhan, tentukan jumlah, dan hubungi tim kami untuk detail produk.
        </p>
      </div>

      <div className="standards-framed-grid">
        {standards.map((std, idx) => (
          <motion.div
            key={std.title}
            className="standard-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: idx * 0.12 }}
          >
            <div className="standard-card-img">
              <img src={std.img} alt={std.title} loading="lazy" />
            </div>
            <div className="standard-card-body">
              <h3>{std.title}</h3>
              <p>{std.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
