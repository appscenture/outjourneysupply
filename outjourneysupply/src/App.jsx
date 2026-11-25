"use client";

import React, { useState } from 'react';
import { useCart } from './context/CartContext';
import { Navbar, StoreBottomNav } from './components/Navbar';
import { HeroFilm } from './components/HeroFilm';
import { CompanyProfile } from './components/CompanyProfile';
import { StandardsLab } from './components/StandardsLab';
import { ProductCatalog } from './components/ProductCatalog';
import { Partnership } from './components/Partnership';
import { ContactSection } from './components/ContactSection';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';

const AppContent = () => {
  const { toastVisible, toastMessage } = useCart();
  const [productQuery, setProductQuery] = useState('');

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

  const handleSearchSubmit = (query) => {
    setProductQuery(query);
    handleSearchFocus();
  };

  return (
    <div className="app-root">
      <Navbar
        searchValue={productQuery}
        onSearchChange={setProductQuery}
        onSearchSubmit={handleSearchSubmit}
      />
      <main>
        <HeroFilm />
        <CompanyProfile />
        <StandardsLab />
        <ProductCatalog searchQuery={productQuery} onSearchChange={setProductQuery} showCartButton={false} />
        <Partnership />
        <ContactSection />
      </main>
      <Footer />
      <StoreBottomNav />

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
  return <AppContent />;
}
