import React from 'react';
import { ArrowRight } from 'lucide-react';
import { filmSlides } from '../data/slides';

export const HeroFilm = () => {
  const heroImage = filmSlides[0];

  return (
    <header className="hero-section" id="home">
      <div className="hero-layout">
        <div className="hero-copy">
          <span className="hero-eyebrow">Outjourney food supply</span>
          <h1>
            Kebutuhan dapur bisnis, <em>lebih mudah.</em>
          </h1>
          <p>
            Belanja produk pilihan, pesan paket makan, dan kelola pesanan dalam satu tempat.
          </p>
          <div className="hero-actions">
            <a href="/products" className="hero-primary-cta">
              Belanja katalog <ArrowRight size={18} />
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <img src={heroImage.image} alt={heroImage.title} fetchPriority="high" />
          <div className="hero-image-note">
            <span>Solusi pasokan untuk bisnis</span>
            <strong>Praktis. Andal. Konsisten.</strong>
          </div>
        </div>
      </div>
    </header>
  );
};
