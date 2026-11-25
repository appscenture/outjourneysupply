"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CartDrawer } from "./CartDrawer";
import { Footer } from "./Footer";
import { StoreBottomNav } from "./Navbar";

export default function LegalPage({ title, children }) {
  return (
    <div className="app-root">
      <header className="legal-page-header">
        <Link href="/">
          <ArrowLeft size={16} /> Beranda
        </Link>
        <strong>PT Outjourney</strong>
      </header>
      <main className="legal-page">
        <h1>{title}</h1>
        <p className="legal-page-updated">Terakhir diperbarui: 25 November 2026</p>
        <div className="legal-document-content">{children}</div>
      </main>
      <Footer />
      <StoreBottomNav />
      <CartDrawer />
    </div>
  );
}
