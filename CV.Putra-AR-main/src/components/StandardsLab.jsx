import React from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Truck, Cpu } from 'lucide-react';

export const StandardsLab = () => {
  const standards = [
    {
      title: 'Sertifikasi Halal Resmi',
      desc: 'Bahan baku daging dan bumbu rempah tersertifikasi 100% Halal dan Thoyyib sesuai ketentuan MUI dan BPJPH.',
      icon: <Shield size={22} />,
      img: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Bebas Pengawet Kimia',
      desc: 'Teruji laboratorium bebas dari formalin, boraks, maupun pemutih sintetis untuk keselamatan konsumen.',
      icon: <CheckCircle size={22} />,
      img: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Rantai Dingin Terpadu',
      desc: 'Fasilitas cold storage modern dan armada berpendingin untuk menjaga kesegaran produk selama distribusi.',
      icon: <Truck size={22} />,
      img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Otomasi Mesin Modern',
      desc: 'Teknologi mesin mutakhir berstandar Jepang menjaga higienitas, presisi bentuk, dan kestabilan rasa.',
      icon: <Cpu size={22} />,
      img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <section className="section-standards" id="standards">
      <div className="standards-header">
        <span className="standards-eyebrow">Pengendalian Mutu &amp; Keamanan</span>
        <h2>
          Standar Keamanan Pangan &amp; <em className="italic">Sertifikasi Resmi</em>
        </h2>
        <p>
          Komitmen penuh Outjourney dalam menjamin kesehatan dan keselamatan konsumen melalui penerapan protokol sanitasi industri yang ketat.
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
              <div className="standard-card-icon">{std.icon}</div>
              <h3>{std.title}</h3>
              <p>{std.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
