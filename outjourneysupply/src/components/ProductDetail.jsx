"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatRupiah } from "../data/products";
import { getSupabaseClient } from "../../lib/supabase/client";
import { Navbar, StoreBottomNav } from "./Navbar";
import { CartDrawer } from "./CartDrawer";
import { Footer } from "./Footer";

const whatsappNumber = "6281388882473";

export default function ProductDetail({ sku }) {
  const router = useRouter();
  const { addItem, items, toastMessage, toastVisible } = useCart();
  const [product, setProduct] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const loadProduct = async () => {
      setLoading(true);
      setError(false);
      try {
        let { data, error: queryError } = await getSupabaseClient()
          .from("products")
          .select("id, sku, name, category, description, unit, image_path, price_idr, is_featured")
          .eq("sku", sku)
          .eq("is_active", true)
          .maybeSingle();

        if (queryError?.code === "42703" && /products\.price_idr does not exist/i.test(queryError.message || "")) {
          console.warn("Storefront pricing migrations are pending; product detail is shown as quote-only.");
          const fallback = await getSupabaseClient()
            .from("products")
            .select("id, sku, name, category, description, unit, image_path")
            .eq("sku", sku)
            .eq("is_active", true)
            .maybeSingle();
          data = fallback.data;
          queryError = fallback.error;
        }

        if (queryError) throw queryError;
        if (active) {
          setProduct(data ? {
            ...data,
            price: Number(data.price_idr),
            img: data.image_path
              ? /^https?:\/\//i.test(data.image_path)
                ? data.image_path
                : data.image_path.startsWith("/")
                  ? data.image_path
                  : `/${data.image_path}`
              : "",
          } : null);
        }
      } catch (loadError) {
        console.error("Outjourney product detail could not be loaded.", loadError);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProduct();
    return () => { active = false; };
  }, [sku]);

  const handleSearchSubmit = (query) => {
    const target = query ? `/products?q=${encodeURIComponent(query)}` : "/products";
    router.push(target);
  };
  const quantity = product ? items.find((item) => item.id === product.id)?.quantity || 0 : 0;
  const inquiryUrl = product
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Halo Outjourney, mohon informasi harga ${product.name} (${product.unit}).`)}`
    : "";

  return (
    <div className="app-root">
      <Navbar searchValue={searchValue} onSearchChange={setSearchValue} onSearchSubmit={handleSearchSubmit} />
      <main className="product-detail-page">
        <Link className="product-detail-back" href="/products"><ArrowLeft size={16} /> Kembali ke katalog</Link>
        {loading ? (
          <p className="store-catalog-empty" role="status">Memuat produk...</p>
        ) : error ? (
          <p className="store-catalog-error" role="alert">Produk tidak dapat dimuat saat ini.</p>
        ) : product ? (
          <article className="product-detail-card">
            <div className="product-detail-image">
              {product.img ? <img src={product.img} alt={product.name} /> : <span>Produk Outjourney</span>}
            </div>
            <div className="product-detail-info">
              <span className="store-product-category">{product.category}</span>
              <h1>{product.name}</h1>
              <p className="product-detail-unit">{product.unit}</p>
              {product.description && <p className="product-detail-description">{product.description}</p>}
              <div className="product-detail-price">
                <strong>{product.price > 0 ? formatRupiah(product.price) : "Tanya harga"}</strong>
                <span>SKU {product.sku}</span>
              </div>
              {product.price > 0 ? (
                <button className="product-detail-action" type="button" onClick={() => addItem(product)}>
                  <Plus size={17} /> {quantity ? `${quantity} di keranjang · tambah` : "Tambah ke keranjang"}
                </button>
              ) : (
                <a className="product-detail-action" href={inquiryUrl} target="_blank" rel="noreferrer">
                  Tanya ketersediaan <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          </article>
        ) : (
          <div className="product-detail-not-found">
            <h1>Produk tidak ditemukan</h1>
            <p>Produk ini mungkin sudah tidak tersedia.</p>
            <Link href="/products">Lihat katalog</Link>
          </div>
        )}
      </main>
      <Footer />
      <StoreBottomNav />
      <CartDrawer />
      {toastVisible && <div className="site-toast">{toastMessage}</div>}
    </div>
  );
}
