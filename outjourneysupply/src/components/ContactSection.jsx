import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Send } from 'lucide-react';
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
        <span className="standards-eyebrow">Pesanan dan pertanyaan</span>
        <h2>
          Kirim kebutuhan <em className="italic">bisnis Anda.</em>
        </h2>
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
              <p>
                Jl. Chairil Anwar Blok C No.09 - 10, <br />
                RT.003/RW.012, Margahayu, <br />
                Kec. Bekasi Tim., Kabupaten Bekasi, <br />
                Jawa Barat 17113, Indonesia
              </p>
            </div>
          </div>

          <div className="contact-item-row">
            <div className="contact-icon-box">
              <Phone />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: 4 }}>WhatsApp</h4>
              <p>
                <a href="tel:+6281388882473">+62 813-8888-2473</a>
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
              <label htmlFor="c-name">Nama atau bisnis</label>
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
              <label htmlFor="c-phone">Nomor WhatsApp</label>
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
              <label htmlFor="c-subject">Topik</label>
              <input
                type="text"
                id="c-subject"
                required
                placeholder="Contoh: bahan pangan atau paket makan"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="c-msg">Detail pesanan</label>
              <textarea
                id="c-msg"
                rows="3"
                required
                placeholder="Tuliskan kebutuhan Anda"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              ></textarea>
            </div>

            <button type="submit" className="btn-form-submit">
              <Send size={16} /> Kirim permintaan
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};
