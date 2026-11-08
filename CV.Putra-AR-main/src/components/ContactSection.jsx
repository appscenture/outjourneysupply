import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Globe, Send } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const ContactSection = () => {
  const { showToast } = useCart();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast(`Terima kasih, Bapak/Ibu ${formData.name}. Pesan Anda telah kami terima.`);
    setFormData({ name: '', phone: '', subject: '', message: '' });
  };

  return (
    <section className="section-contact" id="contact">
      <div className="standards-header">
        <span className="standards-eyebrow">Hubungi Perusahaan</span>
        <h2>
          Hubungi Outjourney &amp; <em className="italic">Kantor Kami</em>
        </h2>
        <p>
          Hubungi tim Outjourney untuk kebutuhan food supply, paket menu, dan kerja sama bisnis.
        </p>
      </div>

      <div className="contact-layout">
        <motion.div
          className="contact-info-card"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="contact-item-row">
            <div className="contact-icon-box">
              <MapPin />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: 4 }}>Kantor</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                Tower 3 Pondok Indah Mall<br />
                Jl. Sultan Iskandar Muda, Kav. V-TA<br />
                Pondok Indah, Jakarta 12310
              </p>
            </div>
          </div>

          <div className="contact-item-row">
            <div className="contact-icon-box">
              <Phone />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: 4 }}>Telepon &amp; WhatsApp</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                <a href="tel:+6281388882473">+62 813-8888-2473</a>
              </p>
            </div>
          </div>

          <div className="contact-item-row">
            <div className="contact-icon-box">
              <Globe />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: 4 }}>Website</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                <a href="https://www.outjourney.id" target="_blank" rel="noreferrer">
                  www.outjourney.id
                </a>
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="contact-form-card"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="c-name">Nama Lengkap / Instansi Usaha</label>
              <input
                type="text"
                id="c-name"
                required
                placeholder="Nama Anda atau Usaha"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="c-phone">Nomor Telepon / WhatsApp Aktif</label>
              <input
                type="tel"
                id="c-phone"
                required
                placeholder="Contoh: 08123456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="c-subject">Perihal Pertanyaan</label>
              <input
                type="text"
                id="c-subject"
                required
                placeholder="Pemesanan grosir, keagenan, katering..."
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="c-msg">Isi Pesan</label>
              <textarea
                id="c-msg"
                rows="3"
                required
                placeholder="Tuliskan detail kebutuhan pasokan atau pesan Anda"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              ></textarea>
            </div>

            <button type="submit" className="btn-form-submit">
              <Send size={16} /> Kirim Pesan Resmi
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};
