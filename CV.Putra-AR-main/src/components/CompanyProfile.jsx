import React from 'react';
import { motion } from 'framer-motion';

const brandPrinciples = [
  {
    title: 'Brand Mission',
    text: 'Transforming ideas into solutions that move industries forward.',
  },
  {
    title: 'Brand Value',
    text: 'Constantly exploring better ideas, technologies, and ways of working.',
  },
  {
    title: 'Brand Vision',
    text: 'Building what’s next, across every industry.',
  },
  {
    title: 'Brand Promise',
    text: 'Creating value that moves businesses and people forward.',
  },
];

export const CompanyProfile = () => {
  return (
    <section className="section-profile" id="profile">
      <div className="profile-container">
        <motion.div
          className="profile-content"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8 }}
        >
          <span className="profile-eyebrow">Tentang Outjourney</span>
          <h2 className="profile-heading">
            Solusi yang menggerakkan <em className="italic">bisnis setiap hari</em>
          </h2>

          <div className="profile-statement">
            <h3>Mission Statement</h3>
            <p className="profile-body-text">
              Our mission is to provide essential goods and services that help businesses operate smoothly and efficiently, delivering value, reliability, and excellent service across every solution we offer.
            </p>
          </div>

          <div className="profile-statement">
            <h3>Vision Statement</h3>
            <p className="profile-body-text">
              We envision a world where creativity and fun drive business success and personal fulfillment.
            </p>
          </div>

          <div className="profile-statement">
            <h3>Value Proposition</h3>
            <p className="profile-body-text">
              PT Outjourney Jelajah Nusantara delivers reliable, high-quality products and services across multiple sectors—food, essential goods, office supplies, and support services—ensuring our clients save time, reduce costs, and operate efficiently with a trusted local partner.
            </p>
          </div>

          <div className="profile-statement">
            <h3>Market and Target Audience</h3>
            <p className="profile-body-text">
              <strong>Market:</strong> Small to medium-sized enterprises, creative professionals, and individuals looking for unique solutions.
              <br />
              <strong>Target audience:</strong> Businesses and individuals seeking innovative and joyful experiences that set them apart.
            </p>
          </div>
        </motion.div>

        <motion.div
          className="profile-visual profile-dna"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8 }}
        >
          <div className="profile-dna-intro">
            <span className="profile-eyebrow">This Is Our DNA</span>
            <h3>Prinsip yang kami pegang</h3>
            <p>
              Konsistensi, keandalan layanan, komunikasi yang berpusat pada manusia, inovasi dalam sistem sederhana, dan integritas di atas keuntungan.
            </p>
            <p>
              Kami tidak mencari kerumitan, hanya solusi yang berfungsi setiap hari.
            </p>
          </div>

          <div className="brand-principles-grid">
            {brandPrinciples.map((principle) => (
              <article className="brand-principle-card" key={principle.title}>
                <h4>{principle.title}</h4>
                <p>{principle.text}</p>
              </article>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
