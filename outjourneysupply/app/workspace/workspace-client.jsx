"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "../../lib/supabase/client";
import CrmPanel from "./crm-panel";
import {
  Activity,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  Download,
  FileText,
  Filter,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Minus,
  MoreHorizontal,
  Package,
  PackagePlus,
  Plus,
  QrCode,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Upload,
  Users,
  Wallet,
  X,
} from "lucide-react";

const products = [
  { id: 1, name: "Premium Fish Cake", localName: "Otak-Otak Ikan Premium", category: "Frozen", unit: "10 pcs / pack", price: 20000, image: "/img/products/1.webp", stock: 48, daily: 8, tag: "Best seller" },
  { id: 2, name: "Beef Meatballs", localName: "Bakso Sapi Super Raja Raoz", category: "Frozen", unit: "20 pcs / pack", price: 25000, image: "/img/products/2.webp", stock: 32, daily: 6, tag: "Popular" },
  { id: 3, name: "Spicy Crispy Basreng", localName: "Basreng Pedas Daun Jeruk", category: "Snacks", unit: "250 g / pack", price: 30000, image: "/img/products/3.webp", stock: 15, daily: 5, tag: "Low stock" },
  { id: 4, name: "Crispy Chicken Cimol", localName: "Cimol Ayam Gurih Krispi", category: "Snacks", unit: "300 g / pack", price: 15000, image: "/img/products/4.webp", stock: 26, daily: 4 },
  { id: 5, name: "Savory Onion Sticks", localName: "Stik Bawang Gurih Renyah", category: "Snacks", unit: "250 g / pack", price: 30000, image: "/img/products/5.webp", stock: 19, daily: 3 },
  { id: 6, name: "Original Chicken Basreng", localName: "Basreng Ayam Original", category: "Snacks", unit: "250 g / pack", price: 30000, image: "/img/products/6.webp", stock: 41, daily: 5 },
  { id: 7, name: "Fresh Kwetiau", localName: "Kwetiau Segar Raja Raoz", category: "Fresh", unit: "500 g / pack", price: 15000, image: "/img/menu/kwetiau.webp", stock: 12, daily: 6, tag: "Restock soon" },
  { id: 8, name: "Beef Tendon Meatballs", localName: "Bakso Urat Raja Raoz", category: "Frozen", unit: "15 pcs / pack", price: 28000, image: "/img/menu/baso.webp", stock: 24, daily: 4 },
];

const initialOrders = [
  { id: "PO-24018", date: "Today, 09:42", delivery: "Tomorrow · 08:00–12:00", amount: 1250000, status: "Processing", payment: "QRIS pending", items: 8 },
  { id: "PO-24017", date: "Nov 23, 14:18", delivery: "Nov 25 · 08:00–12:00", amount: 875000, status: "In transit", payment: "Paid", items: 5 },
  { id: "PO-24016", date: "Nov 21, 10:06", delivery: "Nov 22 · 08:00–12:00", amount: 1640000, status: "Delivered", payment: "Paid", items: 12 },
];

const navigation = [
  { section: "Workspace", items: [{ id: "overview", label: "Overview", icon: LayoutDashboard }, { id: "catalog", label: "Quick order", icon: ShoppingBag, badge: "⌘ K" }, { id: "products", label: "Product catalog", icon: PackagePlus }, { id: "orders", label: "Order history", icon: FileText }] },
  { section: "Customer CRM", items: [{ id: "customers", label: "Customers", icon: Users }, { id: "purchase-orders", label: "PO reminders", icon: FileText }, { id: "rfqs", label: "RFQs", icon: Search }, { id: "invoices", label: "Invoices", icon: Wallet }] },
  { section: "Operations", items: [{ id: "inventory", label: "Warehouse inventory", icon: Package }, { id: "suppliers", label: "Suppliers", icon: Users }, { id: "payments", label: "Payments", icon: Wallet }, { id: "email", label: "Email & notifications", icon: Mail }] },
  { section: "Point of sale", items: [{ id: "pos", label: "Counter POS", icon: CreditCard }] },
];

const suppliers = [
  { name: "Outjourney Foods", initials: "OF", category: "Frozen & prepared food", lead: "Next-day · Cold chain", status: "Active", color: "mint" },
  { name: "Pasar Segar Bekasi", initials: "PS", category: "Fresh produce", lead: "Same-day · Chilled", status: "Active", color: "yellow" },
  { name: "Sumber Pangan Jaya", initials: "SP", category: "Dry goods & pantry", lead: "2–3 days · Ambient", status: "Review", color: "lilac" },
];

const initialStock = Object.fromEntries(products.map((product) => [product.id, product.stock]));
const money = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const shortMoney = (value) => value >= 1000000 ? `Rp ${(value / 1000000).toFixed(1).replace(".", ",")} jt` : money(value);
const daysUntilDelivery = () => {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  return new Intl.DateTimeFormat("en-ID", { weekday: "short", day: "numeric", month: "short" }).format(date);
};

function Brand() {
  return (
    <div className="brand-lockup">
      <img className="brand-logo" src="/img/outjourney-logo-wide.png" alt="Outjourney" />
    </div>
  );
}

function SectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="section-title">
      <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action}
    </div>
  );
}

function StatusPill({ children }) {
  const tone = String(children).toLowerCase().includes("deliver") || String(children).toLowerCase().includes("paid") || String(children).toLowerCase().includes("active") ? "green" : String(children).toLowerCase().includes("transit") || String(children).toLowerCase().includes("review") ? "blue" : "amber";
  return <span className={`status-pill ${tone}`}><span className="status-dot" />{children}</span>;
}

function ProductTile({ product, quantity, onAdd, onRemove, pos = false }) {
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img src={product.image} alt={product.localName} className="product-image" />
        {product.tag && <span className={`product-tag ${product.tag === "Low stock" ? "tag-warning" : ""}`}>{product.tag}</span>}
        {pos && <span className={`stock-label ${product.stock <= 16 ? "stock-low" : ""}`}>{product.stock} in stock</span>}
      </div>
      <div className="product-card-body">
        <span className="product-category">{product.category} <span>·</span> {product.unit}</span>
        <h3>{product.name}</h3>
        <p className="product-local-name">{product.localName}</p>
        <div className="product-card-bottom">
          <div><strong>{money(product.price)}</strong><span> / pack</span></div>
          {quantity > 0 ? (
            <div className="quantity-control">
              <button onClick={() => onRemove(product.id)} aria-label={`Remove one ${product.name}`}><Minus size={14} /></button>
              <span>{quantity}</span>
              <button onClick={() => onAdd(product)} aria-label={`Add one ${product.name}`}><Plus size={14} /></button>
            </div>
          ) : (
            <button className="add-button" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to order`}><Plus size={17} /></button>
          )}
        </div>
      </div>
    </article>
  );
}

function OrderTable({ orders, onTrack }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead><tr><th>Purchase order</th><th>Placed</th><th>Delivery window</th><th>Amount</th><th>Status</th><th /></tr></thead>
        <tbody>{orders.map((order) => (
          <tr key={order.id}>
            <td><button className="table-link" onClick={() => onTrack(order)}>{order.id}</button><span className="table-sub">{order.items} items</span></td>
            <td>{order.date}</td><td>{order.delivery}</td><td className="amount-cell">{money(order.amount)}</td>
            <td><StatusPill>{order.status}</StatusPill></td>
            <td><button className="icon-button table-more" onClick={() => onTrack(order)} aria-label={`Track ${order.id}`}><ChevronRight size={17} /></button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export default function WorkspaceClient({ userName = "Admin" }) {
  const router = useRouter();
  const displayName = userName || "Admin";
  const userInitials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "A";
  const [activePage, setActivePage] = useState("overview");
  const [cart, setCart] = useState({});
  const [orders, setOrders] = useState(initialOrders);
  const [stock, setStock] = useState(initialStock);
  const [transactions, setTransactions] = useState([]);
  const [managedProducts, setManagedProducts] = useState([]);
  const [productDashboardLoading, setProductDashboardLoading] = useState(false);
  const [productSearchSyncing, setProductSearchSyncing] = useState(false);
  const [productError, setProductError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All items");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [trackOrder, setTrackOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("QRIS");
  const [posMethod, setPosMethod] = useState("QRIS");
  const [toast, setToast] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const productFileInputRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState("");
  const [emailTestSending, setEmailTestSending] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState(null);
  const [emailTemplate, setEmailTemplate] = useState("Your Outjourney document {{document_number}} is ready.\n\nAmount: {{amount}}\nDue date: {{due_date}}\n\nView or download the document: {{document_url}}\n\nOutjourney");

  const handleSignOut = async () => {
    try {
      const { error } = await getSupabaseClient().auth.signOut();
      if (error) {
        console.error("Outjourney could not sign out the current user.", error);
        setToast("Sign out failed. Please try again.");
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Outjourney could not sign out the current user.", error);
      setToast("Sign out failed. Please try again.");
    }
  };

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("outjourney-workspace-v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.orders)) setOrders(parsed.orders);
        if (parsed.stock && typeof parsed.stock === "object") setStock({ ...initialStock, ...parsed.stock });
        if (Array.isArray(parsed.transactions)) setTransactions(parsed.transactions);
      }
    } catch (error) {
      console.error("Could not restore the saved Outjourney workspace.", error);
    }
    setReady(true);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch((error) => {
        console.error("Outjourney offline support could not be registered.", error);
      });
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem("outjourney-workspace-v1", JSON.stringify({ orders, stock, transactions }));
    } catch (error) {
      console.error("Could not save the Outjourney workspace.", error);
    }
  }, [orders, stock, transactions, ready]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("outjourney-email-settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.template) setEmailTemplate(parsed.template);
      }
    } catch (error) {
      console.error("Could not restore email settings.", error);
    }
  }, []);

  const cartItems = useMemo(() => products.filter((product) => cart[product.id]).map((product) => ({ ...product, quantity: cart[product.id] })), [cart]);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const categories = ["All items", "Frozen", "Fresh", "Snacks"];
  const filteredProducts = products.filter((product) => {
    const matchesCategory = category === "All items" || product.category === category;
    const matchesSearch = `${product.name} ${product.localName} ${product.category}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const loadManagedProducts = async () => {
    setProductDashboardLoading(true);
    setProductError("");
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load products.");
      setManagedProducts(result.products);
    } catch (error) {
      console.error("Could not load the product dashboard.", error);
      setProductError(error instanceof Error ? error.message : "Could not load products.");
    } finally {
      setProductDashboardLoading(false);
    }
  };
  const setPage = (page) => {
    setActivePage(page);
    setMobileNavOpen(false);
    if (page === "products") void loadManagedProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleProductImport = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setProductError("");
    try {
      const formData = new FormData();
      formData.set("resource", "products");
      formData.set("file", file);
      const response = await fetch("/api/crm", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not import products.");

      const productsResponse = await fetch("/api/products", { cache: "no-store" });
      const productsResult = await productsResponse.json();
      if (!productsResponse.ok) throw new Error(productsResult.error || "Products imported, but the catalog could not be refreshed.");
      setManagedProducts(productsResult.products);
      setToast(result.searchIndexed
        ? `${result.imported} products imported and search synced`
        : `${result.imported} products imported. Configure Algolia to sync hosted search.`);
    } catch (error) {
      console.error("Could not import the product catalog.", error);
      setProductError(error instanceof Error ? error.message : "Could not import products.");
    } finally {
      input.value = "";
    }
  };
  const handleProductExport = async (format) => {
    setProductError("");
    try {
      const response = await fetch(`/api/crm?resource=products&format=${format}`, { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Could not export products.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `outjourney-products.${format}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      console.error("Could not export the product catalog.", error);
      setProductError(error instanceof Error ? error.message : "Could not export products.");
    }
  };
  const handleProductSearchSync = async () => {
    setProductSearchSyncing(true);
    setProductError("");
    try {
      const response = await fetch("/api/products", { method: "PUT" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not sync product search.");
      setToast(`${result.indexed} products synced to search`);
    } catch (error) {
      console.error("Could not sync product search.", error);
      setProductError(error instanceof Error ? error.message : "Could not sync product search.");
    } finally {
      setProductSearchSyncing(false);
    }
  };
  const saveEmailTemplate = () => {
    try {
      window.localStorage.setItem("outjourney-email-settings", JSON.stringify({ template: emailTemplate }));
      setToast("Email template saved");
    } catch (error) {
      console.error("Could not save the email template.", error);
      setToast("Could not save the email template");
    }
  };
  const sendTestEmail = async () => {
    setEmailTestSending(true);
    setEmailTestResult(null);
    try {
      const response = await fetch("/api/crm/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmailTo }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send the test email.");
      setEmailTestResult({ message: `Test email sent to ${result.to}.`, error: false });
    } catch (error) {
      console.error("Could not send the Outjourney test email.", error);
      setEmailTestResult({
        message: error instanceof Error ? error.message : "Could not send the test email.",
        error: true,
      });
    } finally {
      setEmailTestSending(false);
    }
  };
  const addItem = (product) => setCart((current) => ({ ...current, [product.id]: (current[product.id] || 0) + 1 }));
  const removeItem = (id) => setCart((current) => {
    const next = { ...current };
    if (next[id] <= 1) delete next[id];
    else next[id] -= 1;
    return next;
  });
  const createPurchaseOrder = () => {
    if (!cartItems.length) return;
    const order = {
      id: `PO-${String(Date.now()).slice(-5)}`,
      date: "Just now",
      delivery: `${daysUntilDelivery()} · 08:00–12:00`,
      amount: cartTotal,
      status: "Processing",
      payment: paymentMethod === "QRIS" ? "QRIS pending" : "Invoice pending",
      items: cartCount,
    };
    setOrders((current) => [order, ...current]);
    setCart({});
    setCheckoutOpen(false);
    setPage("orders");
    setToast(`${order.id} created · delivery ${daysUntilDelivery()}`);
  };
  const recordSale = () => {
    if (!cartItems.length) return;
    const insufficient = cartItems.find((item) => (stock[item.id] ?? item.stock) < item.quantity);
    if (insufficient) {
      setToast(`Not enough ${insufficient.name} in stock`);
      return;
    }
    const transaction = { id: `SALE-${String(Date.now()).slice(-5)}`, amount: cartTotal, method: posMethod, time: new Intl.DateTimeFormat("en-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date()), items: cartCount };
    setStock((current) => {
      const next = { ...current };
      cartItems.forEach((item) => { next[item.id] = (next[item.id] ?? item.stock) - item.quantity; });
      return next;
    });
    setTransactions((current) => [transaction, ...current]);
    setCart({});
    setToast(`Sale recorded · ${transaction.id} · ${posMethod} demo`);
  };
  const estimatedInventoryValue = products.reduce((sum, item) => sum + (stock[item.id] ?? item.stock) * item.price, 0);
  const lowStockCount = products.filter((item) => (stock[item.id] ?? item.stock) / item.daily <= 3).length;

  return (
    <div className="app-shell">
      {mobileNavOpen && <button className="mobile-backdrop" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top"><Brand /><button className="icon-button close-mobile" onClick={() => setMobileNavOpen(false)} aria-label="Close menu"><X size={19} /></button></div>
        <button className="workspace-switcher">
          <div className="workspace-avatar">OJ</div><div className="workspace-copy"><strong>Outjourney</strong><span>Admin workspace</span></div><ChevronDown size={16} />
        </button>
        <div className="sidebar-navigation">
          {navigation.map((group) => <div className="nav-group" key={group.section}><div className="nav-heading">{group.section}</div>{group.items.map(({ id, label, icon: Icon, count, badge }) => (
            <button key={id} onClick={() => setPage(id)} className={`nav-item ${activePage === id ? "nav-active" : ""}`}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{count && <span className={`nav-count ${id === "inventory" ? "count-alert" : ""}`}>{id === "inventory" ? lowStockCount : count}</span>}{badge && <span className="nav-shortcut">{badge}</span>}</button>
          ))}</div>)}
        </div>
        <div className="sidebar-bottom">
          <div className="cold-chain-card"><div className="cold-chain-icon"><Truck size={17} /></div><div><strong>Cold chain ready</strong><span>Next route · {daysUntilDelivery()}</span></div><span className="online-dot" /></div>
          <button className="nav-item sidebar-settings" onClick={() => setToast("Workspace settings are coming soon")}><Settings size={18} /><span>Settings</span></button>
          <button className="profile-button" onClick={handleSignOut} title="Sign out"><div className="profile-avatar">{userInitials}</div><div className="profile-copy"><strong>{displayName}</strong><span>Sign out</span></div><LogOut size={17} /></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{navigation.flatMap((group) => group.items).find((item) => item.id === activePage)?.label || "Overview"}</strong></div>
          <div className="topbar-actions"><div className="demo-label"><span /> PT Outjourney · CRM</div><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setToast("You’re all caught up")}><Bell size={18} /><i /></button><div className="topbar-divider" /><div className="topbar-date"><Clock3 size={15} /> Bekasi · WIB</div></div>
        </header>

        <div className="page-content">
          {activePage === "overview" && (
            <>
              <div className="welcome-row"><div><div className="eyebrow">YOUR WORKSPACE · TODAY</div><h1>Good morning, {displayName} <span>✳</span></h1><p>Here’s what’s happening with your kitchen today.</p></div><button className="button button-dark" onClick={() => setPage("catalog")}><Plus size={17} /> Create an order</button></div>
              <section className="stats-grid">
                <article className="stat-card"><div className="stat-card-head"><span>Open purchase orders</span><span className="stat-icon sky"><FileText size={17} /></span></div><div className="stat-number">{orders.filter((item) => item.status !== "Delivered").length.toString().padStart(2, "0")}<span className="stat-change"><ArrowUpRight size={14} /> 2 this week</span></div><div className="stat-foot"><span>Across {new Set(orders.map((item) => item.status)).size} delivery stages</span><button onClick={() => setPage("orders")}>View orders <ArrowRight size={13} /></button></div></article>
                <article className="stat-card"><div className="stat-card-head"><span>Inventory value</span><span className="stat-icon green"><Package size={17} /></span></div><div className="stat-number">{shortMoney(estimatedInventoryValue)}<span className="stat-change positive"><ArrowUpRight size={14} /> 8.4%</span></div><div className="stat-foot"><span>Across {products.length} tracked SKUs</span><button onClick={() => setPage("inventory")}>View inventory <ArrowRight size={13} /></button></div></article>
                <article className="stat-card"><div className="stat-card-head"><span>To pay</span><span className="stat-icon yellow"><Wallet size={17} /></span></div><div className="stat-number">{money(orders.filter((item) => item.payment.includes("pending")).reduce((sum, item) => sum + item.amount, 0))}<span className="stat-change neutral">1 invoice</span></div><div className="stat-foot"><span>Next due · Today</span><button onClick={() => setPage("payments")}>Review payments <ArrowRight size={13} /></button></div></article>
              </section>
              <section className="overview-grid">
                <article className="delivery-card">
                  <div className="delivery-top"><div><span className="delivery-kicker"><span className="live-dot" /> NEXT DELIVERY</span><h2>Your kitchen’s<br />next restock is on its way.</h2><p>Route planned for <strong>{daysUntilDelivery()}</strong> · 08:00–12:00</p></div><div className="delivery-illustration"><div className="sun-disc" /><div className="road-line" /><div className="delivery-truck"><Truck size={35} strokeWidth={1.4} /></div><div className="delivery-pin"><span /></div></div></div>
                  <div className="delivery-tracker"><div className="track-step complete"><span><Check size={12} /></span><div><strong>Order confirmed</strong><small>Today · 09:42</small></div></div><div className="track-connector active" /><div className="track-step current"><span><Package size={13} /></span><div><strong>Preparing your order</strong><small>Cold-chain packing</small></div></div><div className="track-connector" /><div className="track-step"><span><Truck size={13} /></span><div><strong>Out for delivery</strong><small>{daysUntilDelivery()} morning</small></div></div></div>
                  <button className="delivery-link" onClick={() => setPage("orders")}>Track purchase order <ArrowRight size={15} /></button>
                </article>
                <article className="quick-actions-card">
                  <div className="card-heading"><div><div className="eyebrow">YOUR WORKSPACE</div><h2>Quick actions</h2></div><button className="icon-button" aria-label="More actions" onClick={() => setToast("More actions coming soon")}><MoreHorizontal size={19} /></button></div>
                  <div className="quick-action-list">
                    <button onClick={() => setPage("catalog")}><span className="action-icon mint"><ShoppingCart size={17} /></span><span><strong>Start a new order</strong><small>Browse 8 products</small></span><ArrowUpRight size={16} /></button>
                    <button onClick={() => setPage("inventory")}><span className="action-icon cream"><Activity size={17} /></span><span><strong>Count your stock</strong><small>{lowStockCount} items need a restock</small></span><ArrowUpRight size={16} /></button>
                    <button onClick={() => setPage("pos")}><span className="action-icon lavender"><CreditCard size={17} /></span><span><strong>Open counter POS</strong><small>Take a walk-in order</small></span><ArrowUpRight size={16} /></button>
                  </div>
                  <div className="quick-card-footer"><ShieldCheck size={15} /><span>Scheduled around your delivery zone</span></div>
                </article>
              </section>
              <section className="content-card recent-orders-card">
                <div className="card-heading"><div><div className="eyebrow">STAY IN THE LOOP</div><h2>Recent purchase orders</h2></div><button className="button button-outline button-small" onClick={() => setPage("orders")}>All orders <ArrowRight size={14} /></button></div>
                <OrderTable orders={orders.slice(0, 3)} onTrack={setTrackOrder} />
              </section>
              <section className="bottom-promo"><div className="promo-icon"><Package size={20} /></div><div><strong>Keep your kitchen running smoothly</strong><span>Build an order around your next delivery window and never miss a restock.</span></div><button onClick={() => setPage("catalog")}>Browse catalog <ArrowRight size={15} /></button></section>
            </>
          )}

          {activePage === "products" && <>
            <SectionTitle
              eyebrow="STOREFRONT"
              title="Product catalog"
              description="Import and export products for the customer catalog."
              action={<div className="product-admin-actions">
                <input
                  ref={productFileInputRef}
                  type="file"
                  accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleProductImport}
                  hidden
                />
                <button className="button button-outline" onClick={() => productFileInputRef.current?.click()}>
                  <Upload size={16} /> Import
                </button>
                <button className="button button-outline" onClick={handleProductSearchSync} disabled={productSearchSyncing}>
                  <Search size={16} /> {productSearchSyncing ? "Syncing..." : "Sync search"}
                </button>
                <button className="button button-dark" onClick={() => void handleProductExport("xlsx")}>
                  <Download size={16} /> Export
                </button>
              </div>}
            />
            {productError && <div className="product-admin-error" role="alert">{productError}</div>}
            <section className="content-card page-table-card product-admin-card">
              <div className="card-heading">
                <div><div className="eyebrow">PRODUCTS</div><h2>{managedProducts.length} items</h2></div>
                <span className="table-count">Excel/CSV fields: SKU, name, category, unit, price_idr</span>
              </div>
              {productDashboardLoading ? <div className="empty-sales">Loading products...</div> : managedProducts.length ? (
                <div className="table-scroll">
                  <table className="data-table">
                    <thead><tr><th>Product</th><th>Category</th><th>Unit</th><th>Price</th><th>Storefront</th></tr></thead>
                    <tbody>{managedProducts.map((product) => (
                      <tr key={product.id}>
                        <td><div className="inventory-product"><span><strong>{product.name}</strong><small>{product.sku}</small></span></div></td>
                        <td>{product.category}</td>
                        <td>{product.unit}</td>
                        <td>{product.price_idr > 0 ? money(product.price_idr) : "Set price"}</td>
                        <td><StatusPill>{product.is_active ? "Active" : "Hidden"}</StatusPill></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-sales">No products found. Import a CSV to add products to the storefront.</div>
              )}
            </section>
          </>}

          {activePage === "catalog" && (
            <>
              <SectionTitle eyebrow="ORDERING" title="What does your kitchen need?" description="One simple order, coordinated with your delivery schedule." action={<div className="delivery-cutoff"><Clock3 size={15} /><span>Order by <strong>2:00 PM</strong> for the next available route</span></div>} />
              <div className="catalog-layout">
                <div className="catalog-main">
                  <div className="catalog-toolbar"><label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products..." /><kbd>⌘ K</kbd></label><button className="filter-button"><Filter size={16} /> Filters <ChevronDown size={14} /></button></div>
                  <div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? "category-active" : ""} onClick={() => setCategory(item)}>{item}<span>{item === "All items" ? products.length : products.filter((product) => product.category === item).length}</span></button>)}</div>
                  <div className="product-grid">{filteredProducts.map((product) => <ProductTile key={product.id} product={product} quantity={cart[product.id] || 0} onAdd={addItem} onRemove={removeItem} />)}</div>
                  {!filteredProducts.length && <div className="empty-state"><Search size={25} /><strong>No products found</strong><span>Try a different product name or category.</span></div>}
                  <div className="catalog-note"><ShieldCheck size={16} /><span>Food-safe cold-chain delivery is available for frozen products.</span><button onClick={() => setToast("Delivery scheduling follows your zone and product temperature requirements.")}>How delivery works <ArrowRight size={13} /></button></div>
                </div>
                <aside className="cart-card">
                  <div className="cart-card-heading"><div><div className="eyebrow">YOUR PURCHASE ORDER</div><h2>Order summary <span>{cartCount}</span></h2></div><ShoppingBag size={18} /></div>
                  {cartItems.length ? <>
                    <div className="cart-items">{cartItems.map((item) => <div className="cart-line" key={item.id}><img src={item.image} alt="" /><div className="cart-line-copy"><strong>{item.name}</strong><span>{money(item.price)} / pack</span><div className="mini-quantity"><button onClick={() => removeItem(item.id)} aria-label="Remove item"><Minus size={12} /></button><span>{item.quantity}</span><button onClick={() => addItem(item)} aria-label="Add item"><Plus size={12} /></button></div></div><b>{money(item.price * item.quantity)}</b></div>)}</div>
                    <div className="cart-delivery"><span className="delivery-icon"><Truck size={16} /></span><span><strong>Estimated delivery</strong><small>{daysUntilDelivery()} · 08:00–12:00</small></span><CheckCircle2 size={16} /></div>
                    <div className="cart-totals"><div><span>Subtotal · {cartCount} items</span><strong>{money(cartTotal)}</strong></div><div><span>Delivery</span><strong className="free-delivery">Calculated by route</strong></div></div>
                    <div className="cart-total"><span>Estimated total</span><strong>{money(cartTotal)}</strong></div>
                    <button className="button button-dark checkout-button" onClick={() => setCheckoutOpen(true)}>Review & place order <ArrowRight size={16} /></button>
                    <p className="cart-footnote"><ShieldCheck size={13} /> Final delivery fee confirmed with your route</p>
                  </> : <div className="cart-empty"><div className="empty-cart-icon"><ShoppingCart size={22} /></div><strong>Your order is waiting</strong><p>Add products your kitchen needs. We’ll coordinate the delivery window for you.</p><span><ArrowLeft size={13} /> Select a product to get started</span></div>}
                </aside>
              </div>
            </>
          )}

          {activePage === "orders" && <>
            <SectionTitle eyebrow="PURCHASING" title="Purchase orders" description="Every order, from confirmation to your kitchen door." action={<button className="button button-dark" onClick={() => setPage("catalog")}><Plus size={17} /> New purchase order</button>} />
            <div className="order-summary-strip"><div><span className="summary-icon blue"><FileText size={17} /></span><span><strong>{orders.length}</strong><small>Total orders</small></span></div><div><span className="summary-icon amber"><Clock3 size={17} /></span><span><strong>{orders.filter((order) => order.status === "Processing").length}</strong><small>Being prepared</small></span></div><div><span className="summary-icon green"><CheckCircle2 size={17} /></span><span><strong>{orders.filter((order) => order.status === "Delivered").length}</strong><small>Delivered</small></span></div><div className="summary-strip-note"><Truck size={16} /> Delivery timing is based on your route and order cut-off.</div></div>
            <section className="content-card page-table-card"><div className="card-heading"><div><div className="eyebrow">ORDER HISTORY</div><h2>All purchase orders</h2></div><button className="button button-outline button-small"><Filter size={14} /> Filter orders</button></div><OrderTable orders={orders} onTrack={setTrackOrder} /></section>
            <div className="info-banner"><CircleHelp size={17} /><span>Need to update an order? Orders can be edited before they enter cold-chain preparation.</span><button onClick={() => setToast("Contact your Outjourney account manager to update a submitted order.")}>Get help</button></div>
          </>}

          {activePage === "inventory" && <CrmPanel resource="inventory" onToast={setToast} />}
          {activePage === "customers" && <CrmPanel resource="customers" onToast={setToast} />}
          {activePage === "purchase-orders" && <CrmPanel resource="purchase-orders" onToast={setToast} />}
          {activePage === "rfqs" && <CrmPanel resource="rfqs" onToast={setToast} />}
          {activePage === "invoices" && <CrmPanel resource="invoices" onToast={setToast} />}

          {activePage === "suppliers" && <>
            <SectionTitle eyebrow="SUPPLIER NETWORK" title="Suppliers, all in one place." description="Keep product sourcing, lead times, and delivery terms close to your purchasing workflow." action={<button className="button button-dark" onClick={() => setToast("Supplier onboarding is coming soon")}><Plus size={17} /> Add supplier</button>} />
            <div className="supplier-stats"><div><span>Active suppliers</span><strong>02 <small>/ 03</small></strong><div className="supplier-stat-foot"><span className="tiny-green-dot" /> 2 ready to fulfill orders</div></div><div><span>Typical lead time</span><strong>1.8 <small>days</small></strong><div className="supplier-stat-foot">Across your active suppliers</div></div><div><span>Delivery coverage</span><strong>Bekasi</strong><div className="supplier-stat-foot"><Truck size={13} /> Scheduled cold-chain routes</div></div></div>
            <div className="supplier-section-heading"><div><div className="eyebrow">YOUR PARTNERS</div><h2>Supplier directory</h2></div><button className="button button-outline button-small"><Filter size={14} /> Filter</button></div>
            <div className="supplier-grid">{suppliers.map((supplier, index) => <article className="supplier-card" key={supplier.name}><div className="supplier-card-top"><div className={`supplier-avatar ${supplier.color}`}>{supplier.initials}</div><button className="icon-button" onClick={() => setToast(`Supplier details for ${supplier.name} are in demo mode`)} aria-label={`More about ${supplier.name}`}><MoreHorizontal size={18} /></button></div><div className="supplier-card-title"><h3>{supplier.name}</h3><StatusPill>{supplier.status}</StatusPill></div><p>{supplier.category}</p><div className="supplier-lead"><Truck size={15} /><span>{supplier.lead}</span></div><div className="supplier-card-footer"><span>{index === 0 ? "4 products" : index === 1 ? "6 products" : "12 products"}</span><button onClick={() => setToast(`Supplier contact for ${supplier.name} is coming soon`)}>View supplier <ArrowRight size={14} /></button></div></article>)}</div>
            <div className="info-banner"><ShieldCheck size={17} /><span>Supplier and lead-time details shown here are sample workspace data.</span><button onClick={() => setToast("Supplier verification details are not yet connected")}>About verification</button></div>
          </>}

          {activePage === "payments" && <>
            <SectionTitle eyebrow="PAYMENT CENTER" title="Payments, without the paper chase." description="Review order balances and keep payment records tied to each purchase order." action={<button className="button button-outline" onClick={() => setToast("Payment export is coming soon")}><ArrowDownRight size={16} /> Export</button>} />
            <div className="payment-highlight"><div className="payment-highlight-copy"><span className="eyebrow">PAYMENT METHODS</span><h2>QRIS or invoice.<br /><span>Your choice, every time.</span></h2><p>Choose your preferred payment method when placing an order. QRIS gateway integration is not connected in this demo.</p><button className="button button-dark" onClick={() => setPage("catalog")}>Start an order <ArrowRight size={15} /></button></div><div className="qris-illustration"><div className="qris-card"><div className="qris-card-head"><span className="qris-mini-logo">outjourney</span><QrCode size={16} /></div><div className="qris-pattern"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><span className="qris-simulated">PAYMENT PREVIEW</span></div><div className="qris-orbit orbit-one" /><div className="qris-orbit orbit-two" /></div></div>
            <section className="content-card page-table-card"><div className="card-heading"><div><div className="eyebrow">PAYMENT RECORDS</div><h2>Recent transactions</h2></div><button className="button button-outline button-small"><Filter size={14} /> All payments</button></div>
              <div className="table-scroll"><table className="data-table"><thead><tr><th>Reference</th><th>Purchase order</th><th>Date</th><th>Payment method</th><th>Amount</th><th>Status</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><span className="payment-ref"><span className="payment-ref-icon"><QrCode size={15} /></span>{`PAY-${order.id.slice(-5)}`}</span></td><td><button className="table-link" onClick={() => setTrackOrder(order)}>{order.id}</button></td><td>{order.date}</td><td>{order.payment.includes("QRIS") ? <span className="method-label"><QrCode size={14} /> QRIS</span> : <span className="method-label"><FileText size={14} /> Invoice</span>}</td><td className="amount-cell">{money(order.amount)}</td><td><StatusPill>{order.payment.includes("pending") ? "Awaiting payment" : "Paid"}</StatusPill></td></tr>)}</tbody></table></div>
              {transactions.length > 0 && <div className="pos-transaction-list"><strong>Counter POS · Recent demo sales</strong>{transactions.slice(0, 3).map((transaction) => <div key={transaction.id}><span>{transaction.id} · {transaction.time}</span><strong>{money(transaction.amount)}</strong><span>{transaction.method} · demo</span></div>)}</div>}
            </section>
            <div className="info-banner"><QrCode size={17} /><span>QRIS payments are a preview only—connect a payment provider before accepting real payments.</span><button onClick={() => setToast("Payment provider integration is not configured")}>Integration details</button></div>
          </>}

          {activePage === "email" && <>
            <SectionTitle eyebrow="COMMUNICATIONS" title="Email & notifications" description="Test server-side email delivery and edit the client document template." action={<button className="button button-dark" onClick={saveEmailTemplate}><FileText size={16} /> Save template</button>} />
            <div className="email-settings-grid">
              <section className="email-settings-card">
                <div className="email-card-heading"><span className="email-card-icon"><Mail size={18} /></span><div><div className="eyebrow">SMTP</div><h2>Mail server</h2></div></div>
                <p className="email-server-note">SMTP credentials are read from server-only environment variables and are never stored in this browser.</p>
                <div className="email-test-row">
                  <label>Send a test email to<input type="email" autoComplete="email" value={testEmailTo} onChange={(event) => setTestEmailTo(event.target.value)} placeholder="name@example.com" /></label>
                  <button className="button button-outline" onClick={() => void sendTestEmail()} disabled={emailTestSending || !testEmailTo.trim()}>
                    <Send size={15} /> {emailTestSending ? "Sending..." : "Send test"}
                  </button>
                </div>
                {emailTestResult && <p className={`email-test-result${emailTestResult.error ? " error" : ""}`} role={emailTestResult.error ? "alert" : "status"}>{emailTestResult.message}</p>}
              </section>
              <section className="email-settings-card">
                <div className="email-card-heading"><span className="email-card-icon"><FileText size={18} /></span><div><div className="eyebrow">TEMPLATE</div><h2>Client document email</h2></div></div>
                <textarea className="email-template" value={emailTemplate} onChange={(event) => setEmailTemplate(event.target.value)} />
                <div className="email-template-vars"><span>{'{{document_number}}'}</span><span>{'{{amount}}'}</span><span>{'{{due_date}}'}</span><span>{'{{document_url}}'}</span></div>
              </section>
            </div>
            <div className="email-notification-card">
              <div><ShieldCheck size={18} /><span><strong>Client notifications</strong><small>Invoices, payment reminders, RFQs, contracts, and delivery updates</small></span></div>
              <StatusPill>Enabled</StatusPill>
            </div>
          </>}

          {activePage === "pos" && <>
            <SectionTitle eyebrow="COUNTER SALES" title="A faster checkout at the counter." description="Add products, check stock, and record a walk-in sale in a few taps." action={<span className="pos-mode-pill"><span /> POS demo mode</span>} />
            <div className="pos-layout"><div className="pos-products"><div className="catalog-toolbar"><label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a product..." /></label><button className="filter-button"><Filter size={16} /> All items</button></div><div className="pos-product-grid">{products.filter((product) => `${product.name} ${product.localName}`.toLowerCase().includes(query.toLowerCase())).map((product) => <ProductTile key={product.id} product={{ ...product, stock: stock[product.id] ?? product.stock }} quantity={cart[product.id] || 0} onAdd={addItem} onRemove={removeItem} pos />)}</div></div>
              <aside className="cart-card pos-cart"><div className="cart-card-heading"><div><div className="eyebrow">WALK-IN SALE</div><h2>Current sale <span>{cartCount}</span></h2></div><CreditCard size={18} /></div>{cartItems.length ? <><div className="cart-items">{cartItems.map((item) => <div className="cart-line" key={item.id}><img src={item.image} alt="" /><div className="cart-line-copy"><strong>{item.name}</strong><span>{money(item.price)} / pack</span><div className="mini-quantity"><button onClick={() => removeItem(item.id)} aria-label="Remove one"><Minus size={12} /></button><span>{item.quantity}</span><button onClick={() => addItem(item)} aria-label="Add one"><Plus size={12} /></button></div></div><b>{money(item.price * item.quantity)}</b></div>)}</div><div className="pos-payment-options"><span>Payment method</span><div><button className={posMethod === "QRIS" ? "method-active" : ""} onClick={() => setPosMethod("QRIS")}><QrCode size={15} /> QRIS</button><button className={posMethod === "Cash" ? "method-active" : ""} onClick={() => setPosMethod("Cash")}><Wallet size={15} /> Cash</button></div></div><div className="cart-total"><span>Total due</span><strong>{money(cartTotal)}</strong></div><button className="button button-dark checkout-button" onClick={recordSale}>Record sale <ArrowRight size={16} /></button><p className="cart-footnote"><ShieldCheck size={13} /> Demo only · no payment is processed</p></> : <div className="cart-empty"><div className="empty-cart-icon"><ShoppingBag size={22} /></div><strong>Start a counter sale</strong><p>Tap a product to add it. Stock is checked before recording a sale.</p></div>}</aside>
            </div>
            <section className="content-card recent-orders-card"><div className="card-heading"><div><div className="eyebrow">TODAY</div><h2>Recent counter sales</h2></div><span className="table-count">{transactions.length} transactions</span></div>{transactions.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Transaction</th><th>Time</th><th>Items</th><th>Payment</th><th>Amount</th><th>Status</th></tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction.id}><td><strong>{transaction.id}</strong></td><td>{transaction.time}</td><td>{transaction.items} items</td><td>{transaction.method} · demo</td><td className="amount-cell">{money(transaction.amount)}</td><td><StatusPill>Recorded</StatusPill></td></tr>)}</tbody></table></div> : <div className="empty-sales">No counter sales yet. Your recorded sales will appear here.</div>}</section>
          </>}
        </div>
        <footer className="app-footer"><span>© 2026 Outjourney · Food service, moving forward.</span><span><span className="online-dot" /> All systems operational <span className="footer-divider">·</span> Demo environment</span></footer>
      </main>

      {checkoutOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCheckoutOpen(false); }}><section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><div className="modal-top"><span className="modal-icon"><FileText size={18} /></span><button className="icon-button" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout"><X size={19} /></button></div><div className="eyebrow">PURCHASE ORDER · {cartCount} ITEMS</div><h2 id="checkout-title">Everything ready?</h2><p className="modal-subtitle">Review your delivery and payment preference before sending this order.</p><div className="checkout-detail-row"><span><Truck size={16} /> Delivery estimate</span><strong>{daysUntilDelivery()} · 08:00–12:00</strong></div><div className="checkout-delivery-note"><Clock3 size={15} /><span>Estimated for Bekasi cold-chain route. Final timing is confirmed by your supplier.</span></div><div className="checkout-method-label">Payment preference</div><div className="checkout-methods"><button className={paymentMethod === "QRIS" ? "checkout-method selected" : "checkout-method"} onClick={() => setPaymentMethod("QRIS")}><span className="method-radio" /><QrCode size={18} /><span><strong>QRIS</strong><small>Payment preview · not connected</small></span></button><button className={paymentMethod === "Invoice" ? "checkout-method selected" : "checkout-method"} onClick={() => setPaymentMethod("Invoice")}><span className="method-radio" /><FileText size={18} /><span><strong>Invoice</strong><small>Terms set by your supplier</small></span></button></div><div className="checkout-final-total"><span>Estimated order total</span><strong>{money(cartTotal)}</strong></div><button className="button button-dark checkout-submit" onClick={createPurchaseOrder}>Place purchase order <ArrowRight size={16} /></button><p className="checkout-legal"><ShieldCheck size={13} /> Demo order · no payment or supplier notification is sent</p></section></div>}

      {trackOrder && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTrackOrder(null); }}><section className="tracking-modal" role="dialog" aria-modal="true" aria-labelledby="tracking-title"><div className="tracking-modal-head"><div><div className="eyebrow">PURCHASE ORDER</div><h2 id="tracking-title">{trackOrder.id}</h2></div><button className="icon-button" onClick={() => setTrackOrder(null)} aria-label="Close tracking"><X size={19} /></button></div><div className="tracking-info"><div><span>Order total</span><strong>{money(trackOrder.amount)}</strong></div><div><span>Delivery window</span><strong>{trackOrder.delivery}</strong></div></div><div className="tracking-progress">{["Order received", "Preparing order", "In transit", "Delivered"].map((stage, index) => { const stages = ["Processing", "In transit", "Delivered"]; const currentIndex = stages.indexOf(trackOrder.status); const done = index < currentIndex + 1; return <div key={stage} className={`tracking-stage ${done ? "stage-done" : ""}`}><span>{done ? <Check size={13} /> : index + 1}</span><div><strong>{stage}</strong><small>{index === 0 ? trackOrder.date : index === 3 ? trackOrder.delivery.split(" · ")[0] : done ? "Updated by supplier" : "Pending update"}</small></div></div>; })}</div><div className="tracking-demo-note"><Activity size={15} /> Tracking updates in this demo are illustrative.</div><button className="button button-dark checkout-submit" onClick={() => setTrackOrder(null)}>Done <Check size={15} /></button></section></div>}

      {toast && <div className="toast-message" role="status"><CheckCircle2 size={17} />{toast}<button onClick={() => setToast("")} aria-label="Dismiss notification"><X size={15} /></button></div>}
    </div>
  );
}
