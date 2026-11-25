import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { House, LogIn, MessageCircle, ShoppingBag, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getSupabaseClient } from '../../lib/supabase/client';

export const Navbar = ({ searchValue, onSearchChange, onSearchSubmit }) => {
  const { totalQuantity, toggleCart } = useCart();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const normalizedSearch = searchValue.trim().toLocaleLowerCase('id-ID');
  const suggestions = useMemo(() => {
    if (!normalizedSearch) return [];
    return products
      .filter((product) => product.name.toLocaleLowerCase('id-ID').includes(normalizedSearch))
      .slice(0, 8);
  }, [normalizedSearch, products]);

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      try {
        const { data, error } = await getSupabaseClient()
          .from('products')
          .select('sku, name')
          .eq('is_active', true)
          .order('name')
          .limit(1000);

        if (error) throw error;
        if (active) setProducts(data || []);
      } catch (error) {
        console.error('Outjourney search suggestions could not be loaded.', error);
      }
    };

    void loadProducts();
    return () => { active = false; };
  }, []);

  const selectSuggestion = (product) => {
    setSearchFocused(false);
    setActiveSuggestionIndex(-1);
    onSearchChange(product.name);
    router.push(`/products/${encodeURIComponent(product.sku)}`);
  };

  const handleSearchKeyDown = (event) => {
    if (!suggestions.length) {
      if (event.key === 'Escape') setSearchFocused(false);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestionIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestionIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeSuggestionIndex]);
    } else if (event.key === 'Escape') {
      setSearchFocused(false);
      setActiveSuggestionIndex(-1);
    }
  };

  return (
    <header className="navbar">
      <a href="#home" className="navbar-brand">
        <img
          src="/img/outjourney-logo-wide.png"
          alt="Outjourney Logo"
          className="brand-logo"
        />
      </a>

      <form className="top-product-search" role="search" onSubmit={(event) => {
        event.preventDefault();
        setSearchFocused(false);
        onSearchSubmit(searchValue.trim());
      }}>
        <input
          type="search"
          value={searchValue}
          onChange={(event) => {
            onSearchChange(event.target.value);
            setActiveSuggestionIndex(-1);
          }}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Cari produk"
          aria-label="Cari produk"
          aria-autocomplete="list"
          aria-expanded={searchFocused && normalizedSearch.length > 0 && suggestions.length > 0}
          aria-controls="top-search-suggestions"
          aria-activedescendant={activeSuggestionIndex >= 0 ? `top-search-option-${activeSuggestionIndex}` : undefined}
        />
        {searchFocused && normalizedSearch.length > 0 && suggestions.length > 0 && (
          <div className="top-search-suggestions" id="top-search-suggestions" role="listbox">
            {suggestions.map((product, index) => (
              <button
                key={product.sku}
                id={`top-search-option-${index}`}
                type="button"
                role="option"
                aria-selected={activeSuggestionIndex === index}
                className="top-search-suggestion"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(product)}
              >
                <span>{product.name}</span>
                <small>{product.sku}</small>
              </button>
            ))}
          </div>
        )}
      </form>

      <div className="navbar-actions">
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
      </div>
    </header>
  );
};

export const StoreBottomNav = () => {
  const { totalQuantity, toggleCart } = useCart();

  return (
    <nav className="store-bottom-nav" aria-label="Main navigation">
      <Link href="/" className="store-bottom-nav-item" aria-label="Home">
        <House size={20} />
        <span>Home</span>
      </Link>
      <Link href="/products" className="store-bottom-nav-item">
        <ShoppingBag size={20} />
        <span>Catalog</span>
      </Link>
      <a
        href="https://wa.me/6281388882473"
        className="store-bottom-nav-item"
        target="_blank"
        rel="noreferrer"
      >
        <MessageCircle size={20} />
        <span>WhatsApp</span>
      </a>
      <button type="button" className="store-bottom-nav-item" onClick={toggleCart}>
        <span className="store-bottom-cart-icon">
          <ShoppingCart size={20} />
          {totalQuantity > 0 && <span className="quantity-badge">{totalQuantity}</span>}
        </span>
        <span>Cart</span>
      </button>
      <Link href="/client/login" className="store-bottom-nav-item">
        <LogIn size={20} />
        <span>Login</span>
      </Link>
    </nav>
  );
};
