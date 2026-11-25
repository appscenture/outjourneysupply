"use client";

import React from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { TopBar } from './components/TopBar';
import { Navbar } from './components/Navbar';
import { HeroFilm } from './components/HeroFilm';
import { CompanyProfile } from './components/CompanyProfile';
import { StandardsLab } from './components/StandardsLab';
import { ProductCatalog } from './components/ProductCatalog';
import { Partnership } from './components/Partnership';
import { ContactSection } from './components/ContactSection';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { WhatsAppWidget } from './components/WhatsAppWidget';

const AppContent = () => {
  const { toastVisible, toastMessage } = useCart();

  const handleSearchFocus = () => {
    const el = document.getElementById('products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        const input = el.querySelector('input');
        if (input) input.focus();
      }, 500);
    }
  };

  return (
    <div className="app-root">
      <TopBar />
      <Navbar onSearchClick={handleSearchFocus} />
      <main>
        <HeroFilm />
        <CompanyProfile />
        <StandardsLab />
        <ProductCatalog />
        <Partnership />
        <ContactSection />
      </main>
      <Footer />

      <WhatsAppWidget />
      <CartDrawer />
      {toastVisible && (
        <div className="site-toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}
