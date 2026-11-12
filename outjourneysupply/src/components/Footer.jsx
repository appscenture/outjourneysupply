import React from 'react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-corporate">
      <div className="footer-grid">
        <div className="footer-col">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <img
              src="https://ik.imagekit.io/p9bj7nsf9/1.png"
              alt="Outjourney Logo"
              style={{ width: 36, height: 36, objectFit: 'contain' }}
            />
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              Outjourney
            </span>
          </div>
          <p>
            Mitra food supply dan solusi bisnis lintas sektor yang mengutamakan keandalan, layanan yang konsisten, dan solusi sederhana yang bekerja setiap hari.
          </p>
        </div>

        <div className="footer-col">
          <h4>Navigasi Halaman</h4>
          <ul className="footer-links">
            <li><a href="#home">Beranda Utama</a></li>
            <li><a href="#profile">Profil Perusahaan</a></li>
            <li><a href="#standards">Standar Mutu &amp; Lab</a></li>
            <li><a href="#products">Food Supply &amp; Katalog</a></li>
            <li><a href="#partnership">Kemitraan Food Supply</a></li>
            <li><a href="#contact">Kontak &amp; Alamat</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Food Supply</h4>
          <ul className="footer-links">
            <li><a href="#products">Buah &amp; Sayuran</a></li>
            <li><a href="#products">Ayam, Daging, Ikan &amp; Seafood</a></li>
            <li><a href="#products">Frozen &amp; Bahan Siap Masak</a></li>
            <li><a href="#products">Paket Menu Harian</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Kontak &amp; Kantor</h4>
          <p style={{ marginBottom: 10 }}>
            Jl. Chairil Anwar Blok C No.09 - 10, <br />
            RT.003/RW.012, Margahayu, <br />
            Kec. Bekasi Tim., Kabupaten Bekasi, <br />
            Jawa Barat 17113, Indonesia
          </p>
          <p style={{ marginBottom: 6 }}>
            <a href="tel:+6281388882473">+62 813-8888-2473</a>
          </p>
          <p>
            <a href="https://www.outjourney.id">www.outjourney.id</a>
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          Hak Cipta &copy; {currentYear} Outjourney. Seluruh Hak Dilindungi Undang-Undang.
        </span>
        <span>
          Food Supply &amp; Business Solutions
        </span>
      </div>
    </footer>
  );
};
