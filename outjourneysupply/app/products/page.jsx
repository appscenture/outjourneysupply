"use client";

import { useEffect, useState } from "react";
import { CartDrawer } from "../../src/components/CartDrawer";
import { Footer } from "../../src/components/Footer";
import { Navbar, StoreBottomNav } from "../../src/components/Navbar";
import { ProductCatalog } from "../../src/components/ProductCatalog";

export default function ProductsPage() {
  const [productQuery, setProductQuery] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("q");
    if (query) setProductQuery(query);
  }, []);

  const handleSearchSubmit = (query) => {
    setProductQuery(query);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="app-root">
      <Navbar
        searchValue={productQuery}
        onSearchChange={setProductQuery}
        onSearchSubmit={handleSearchSubmit}
      />
      <main>
        <ProductCatalog searchQuery={productQuery} onSearchChange={setProductQuery} />
      </main>
      <Footer />
      <StoreBottomNav />
      <CartDrawer />
    </div>
  );
}
