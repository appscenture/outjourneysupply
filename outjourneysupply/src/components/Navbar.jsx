import React, { useState, useEffect } from 'react';
import { ShoppingCart, Briefcase, Menu, X, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Navbar = ({ onSearchClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { totalQuantity, toggleCart } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <a href="#home" className="navbar-brand">
        <img
          src="/img/outjourney-logo-wide.png"
          alt="Outjourney Logo"
          className="brand-logo"
        />
      </a>

      <div className={`navbar-nav ${isMobileOpen ? 'open' : ''}`}>
        <a href="#home" onClick={closeMobile}>Beranda</a>
        <a href="#profile" onClick={closeMobile}>Profil</a>
        <a href="#standards" onClick={closeMobile}>Standar</a>
        <a href="#products" onClick={closeMobile}>Katalog</a>
        <a href="#partnership" onClick={closeMobile}>Mitra</a>
        <a href="#contact" onClick={closeMobile}>Kontak</a>
      </div>

      <div className="navbar-actions">
        <button
          type="button"
          className="action-btn"
          title="Cari Produk"
          aria-label="Cari Produk"
          onClick={onSearchClick}
        >
          <Search />
        </button>

        <button
          type="button"
          className="action-btn"
          title="Keranjang Pesanan"
          aria-label="Keranjang Pesanan"
          onClick={toggleCart}
        >
          <ShoppingCart />
          {totalQuantity > 0 && (
            <span className="quantity-badge">{totalQuantity}</span>
          )}
        </button>

        <a href="/workspace" className="btn-nav-cta">
          <Briefcase /> B2B Workspace
        </a>

        <button
          type="button"
          className="action-btn hamburger-btn"
          title="Menu"
          aria-label="Menu"
          onClick={() => setIsMobileOpen((prev) => !prev)}
        >
          {isMobileOpen ? <X /> : <Menu />}
        </button>
      </div>
    </nav>
  );
};
