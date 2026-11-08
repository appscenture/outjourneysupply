import React from 'react';
import { Download, ArrowUpRight } from 'lucide-react';
import { filmSlides } from '../data/slides';

export const HeroFilm = () => {
  const heroImage = filmSlides[0];

  return (
    <header className="hero-section" id="home">
      <div className="hero-layout">
        <div className="hero-copy">
          <span className="hero-eyebrow">Food Supply &amp; Business Solutions</span>
          <h1>
            Food supply untuk bisnis yang <em>terus bergerak.</em>
          </h1>
          <p>
            Pasokan bahan pangan, paket menu harian, dan kebutuhan bisnis dalam
            satu solusi yang praktis dan dapat diandalkan.
          </p>
          <div className="hero-actions">
            <a
              href="https://ik.imagekit.io/p9bj7nsf9/Company%20Profile%20Outjourney%202026%20Industry%20(1).pdf?ik-attachment=true"
              className="hero-primary-cta"
              download="Company-Profile-Outjourney-2026.pdf"
            >
              <Download size={18} /> Company Profile
            </a>
            <a href="#products" className="hero-secondary-cta">
              Lihat Food Supply <ArrowUpRight size={18} />
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
