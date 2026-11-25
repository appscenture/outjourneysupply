"use client";

import { useState } from "react";
import {
  ArrowRight,
  FileText,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  User,
  Wallet,
} from "lucide-react";

const invoices = [
  { id: "INV-26011", due: "28 Nov", amount: "Rp 1.250.000", status: "Due" },
  { id: "INV-26008", due: "20 Nov", amount: "Rp 875.000", status: "Paid" },
];

export default function ClientPortalPage() {
  const [active, setActive] = useState("Home");

  return (
    <main className="client-shell">
      <header className="client-header">
        <img src="/img/outjourney-logo-wide.png" alt="Outjourney" />
        <button className="client-avatar" aria-label="Account"><User size={18} /></button>
      </header>

      <div className="client-content">
        {active === "Home" && (
          <>
            <section className="client-welcome">
              <div><span>Good morning</span><h1>Dapur Bumi</h1></div>
              <span className="client-status">Client</span>
            </section>

            <section className="client-grid">
              <article className="client-card client-highlight">
                <div className="client-card-label"><Truck size={16} /> In transit</div>
                <h2>PO-24017</h2>
                <p>Arriving 25 Nov · 08:00–12:00</p>
                <div className="client-progress"><span /></div>
                <button>Track delivery <ArrowRight size={15} /></button>
              </article>

              <article className="client-card">
                <div className="client-card-label"><Wallet size={16} /> Balance due</div>
                <strong className="client-big-value">Rp 1.250.000</strong>
                <p>Due 28 November</p>
                <button className="client-primary">Pay invoice</button>
              </article>

              <article className="client-card">
                <div className="client-card-label"><ShoppingCart size={16} /> Quick order</div>
                <h2>Reorder supplies</h2>
                <p>Repeat your recent order in a few taps.</p>
                <button>Browse catalog <ArrowRight size={15} /></button>
              </article>
            </section>

            <section className="client-section">
              <div className="client-section-head"><h2>Invoices</h2><button>View all</button></div>
              <div className="client-invoice-list">
                {invoices.map((invoice) => (
                  <button className="client-invoice" key={invoice.id}>
                    <span className="client-invoice-icon"><FileText size={18} /></span>
                    <span><strong>{invoice.id}</strong><small>Due {invoice.due}</small></span>
                    <span className="client-invoice-amount"><strong>{invoice.amount}</strong><small className={invoice.status === "Paid" ? "paid" : ""}>{invoice.status}</small></span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {active !== "Home" && (
          <section className="client-section client-placeholder">
            <div className="client-placeholder-icon">{active === "Orders" ? <Package size={24} /> : active === "Invoices" ? <FileText size={24} /> : <User size={24} />}</div>
            <h1>{active}</h1>
            <p>Card-based {active.toLowerCase()} tools will appear here.</p>
          </section>
        )}
      </div>

      <nav className="client-bottom-nav" aria-label="Client navigation">
        {[
          ["Home", LayoutDashboard],
          ["Catalog", ShoppingCart],
          ["Orders", Package],
          ["Invoices", FileText],
          ["Account", User],
        ].map(([label, Icon]) => (
          <button key={label} className={active === label ? "active" : ""} onClick={() => setActive(label)}>
            <Icon size={20} /><span>{label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
