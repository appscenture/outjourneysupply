"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Plus, Search, Send, Upload, X } from "lucide-react";

const PANELS = {
  customers: {
    title: "Customers",
    description: "Manage business contacts and their document reminders.",
    label: "CUSTOMER DIRECTORY",
    action: "Add customer",
  },
  inventory: {
    title: "Warehouse inventory",
    description: "Track Outjourney sellable stock by product and SKU.",
    label: "OUTJOURNEY STOCK",
  },
  "purchase-orders": {
    title: "Purchase order reminders",
    description: "Keep customer POs visible and follow up from one place.",
    label: "CUSTOMER PURCHASE ORDERS",
    action: "Add purchase order",
  },
  rfqs: {
    title: "RFQ reminders",
    description: "Track customer requests for quotation and follow up.",
    label: "REQUESTS FOR QUOTATION",
    action: "Add RFQ",
  },
  invoices: {
    title: "Invoice reminders",
    description: "Review invoice status and open a WhatsApp reminder draft.",
    label: "CUSTOMER INVOICES",
    action: "Add invoice",
  },
};

const emptyCustomer = {
  name: "",
  slug: "",
  contact_name: "",
  email: "",
  whatsapp_phone: "",
  billing_address: "",
  notes: "",
  status: "active",
};

const emptyDocument = {
  organization_id: "",
  document_number: "",
  amount_idr: "",
  issued_at: new Date().toISOString().slice(0, 10),
  due_at: "",
  status: "pending",
  notes: "",
};

const formatMoney = (value) => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
}).format(value ?? 0);

function documentTypeLabel(type) {
  return type === "purchase_order" ? "Purchase order" : type === "rfq" ? "RFQ" : "Invoice";
}

function dateLabel(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function whatsappUrl(record) {
  const rawPhone = String(record.whatsapp_phone || "").replace(/\D/g, "");
  const phone = rawPhone.startsWith("0") ? `62${rawPhone.slice(1)}` : rawPhone.startsWith("8") ? `62${rawPhone}` : rawPhone;
  if (!phone) return "";
  const due = record.due_at ? ` dengan jatuh tempo ${dateLabel(record.due_at)}` : "";
  const amount = record.amount_idr === null || record.amount_idr === undefined
    ? ""
    : ` senilai ${formatMoney(record.amount_idr)}`;
  const contact = record.contact_name || record.customer_name || "Bapak/Ibu";
  const message = `Halo ${contact}, kami dari PT Outjourney ingin mengingatkan ${documentTypeLabel(record.document_type)} ${record.document_number}${amount}${due}. Mohon konfirmasi jika sudah ditindaklanjuti. Terima kasih.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function Status({ children }) {
  return <span className="status-pill"><span className="status-dot" />{children || "—"}</span>;
}

export default function CrmPanel({ resource, onToast }) {
  const config = PANELS[resource];
  const importRef = useRef(null);
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [draft, setDraft] = useState(resource === "customers" ? emptyCustomer : emptyDocument);
  const [saving, setSaving] = useState(false);
  const [inventoryEdits, setInventoryEdits] = useState({});
  const documentPanel = ["purchase-orders", "rfqs", "invoices"].includes(resource);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const requests = [fetch(`/api/crm?resource=${resource}`, { cache: "no-store" })];
      if (documentPanel) requests.push(fetch("/api/crm?resource=customers", { cache: "no-store" }));
      const responses = await Promise.all(requests);
      const results = await Promise.all(responses.map(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load CRM data.");
        return result.records;
      }));
      setRecords(results[0]);
      if (documentPanel) setCustomers(results[1]);
    } catch (loadError) {
      console.error("Could not load CRM records.", loadError);
      setError(loadError instanceof Error ? loadError.message : "Could not load CRM data.");
    } finally {
      setLoading(false);
    }
  }, [documentPanel, resource]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const filteredRecords = useMemo(() => records.filter((record) =>
    Object.values(record).join(" ").toLowerCase().includes(query.toLowerCase()),
  ), [records, query]);

  const download = async (format) => {
    setError("");
    try {
      const response = await fetch(`/api/crm?resource=${resource}&format=${format}`, { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Could not export CRM data.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `outjourney-${resource}.${format}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (exportError) {
      console.error("Could not export CRM data.", exportError);
      setError(exportError instanceof Error ? exportError.message : "Could not export CRM data.");
    }
  };

  const downloadPdf = async (record) => {
    setError("");
    try {
      const response = await fetch(`/api/crm/pdf?resource=${resource}&id=${encodeURIComponent(record.id)}`, { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Could not generate the PDF.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `outjourney-${resource}-${record.id}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (pdfError) {
      console.error("Could not download the CRM PDF.", pdfError);
      setError(pdfError instanceof Error ? pdfError.message : "Could not generate the PDF.");
    }
  };

  const handleImport = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setError("");
    try {
      const formData = new FormData();
      formData.set("resource", resource);
      formData.set("file", file);
      const response = await fetch("/api/crm", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not import CRM data.");
      await loadRecords();
      onToast?.(`${result.imported} ${resource.replace("-", " ")} records imported`);
    } catch (importError) {
      console.error("Could not import CRM data.", importError);
      setError(importError instanceof Error ? importError.message : "Could not import CRM data.");
    } finally {
      input.value = "";
    }
  };

  const openNewRecord = () => {
    setEditingCustomer(null);
    setDraft(resource === "customers" ? emptyCustomer : {
      ...emptyDocument,
      document_number: "",
      issued_at: new Date().toISOString().slice(0, 10),
      status: resource === "invoices" ? "sent" : "pending",
    });
    setModalOpen(true);
  };

  const openCustomerEdit = (customer) => {
    setEditingCustomer(customer);
    setDraft({
      name: customer.name || "",
      slug: customer.slug || "",
      contact_name: customer.contact_name || "",
      email: customer.email || "",
      whatsapp_phone: customer.whatsapp_phone || "",
      billing_address: customer.billing_address || "",
      notes: customer.notes || "",
      status: customer.status || "active",
    });
    setModalOpen(true);
  };

  const saveRecord = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      let response;
      if (resource === "customers" && editingCustomer) {
        response = await fetch("/api/crm", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resource, id: editingCustomer.id, record: draft }),
        });
      } else {
        response = await fetch("/api/crm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resource, record: draft }),
        });
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save this record.");
      setModalOpen(false);
      await loadRecords();
      onToast?.(editingCustomer ? "Customer updated" : "Record saved");
    } catch (saveError) {
      console.error("Could not save CRM record.", saveError);
      setError(saveError instanceof Error ? saveError.message : "Could not save this record.");
    } finally {
      setSaving(false);
    }
  };

  const saveInventory = async (record) => {
    const edited = inventoryEdits[record.product_id] || record;
    setError("");
    try {
      const response = await fetch("/api/crm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: "inventory",
          id: record.product_id,
          record: {
          quantity_on_hand: edited.quantity_on_hand,
          reorder_point: edited.reorder_point,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update stock.");
      setInventoryEdits((current) => {
        const next = { ...current };
        delete next[record.product_id];
        return next;
      });
      await loadRecords();
      onToast?.(`Stock saved for ${record.sku}`);
    } catch (saveError) {
      console.error("Could not update warehouse stock.", saveError);
      setError(saveError instanceof Error ? saveError.message : "Could not update stock.");
    }
  };

  if (!config) return null;

  return (
    <>
      <div className="section-title">
        <div><div className="eyebrow">{config.label}</div><h1>{config.title}</h1><p>{config.description}</p></div>
        <div className="crm-actions">
          <input ref={importRef} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleImport} hidden />
          {config.action && <button className="button button-dark" onClick={openNewRecord}><Plus size={16} /> {config.action}</button>}
          <button className="button button-outline" onClick={() => importRef.current?.click()}><Upload size={15} /> Import</button>
          <button className="button button-outline" onClick={() => void download("xlsx")}><Download size={15} /> Export</button>
        </div>
      </div>

      {error && <div className="product-admin-error" role="alert">{error}</div>}
      <section className="content-card page-table-card crm-card">
        <div className="card-heading">
          <div><div className="eyebrow">{config.label}</div><h2>{filteredRecords.length} records</h2></div>
          <label className="crm-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" /></label>
        </div>
        {loading ? <div className="empty-sales">Loading CRM records...</div> : !filteredRecords.length ? (
          <div className="empty-sales">No records yet. Add a record or import an Excel/CSV file.</div>
        ) : resource === "customers" ? (
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Business</th><th>Contact</th><th>Email</th><th>WhatsApp</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {filteredRecords.map((customer) => <tr key={customer.id}>
              <td><strong>{customer.name}</strong><span className="table-sub">{customer.slug}</span></td>
              <td>{customer.contact_name || "—"}</td><td>{customer.email || "—"}</td><td>{customer.whatsapp_phone || "—"}</td>
              <td><Status>{customer.status}</Status></td>
              <td><div className="crm-row-actions">
                <button className="button button-outline button-small" onClick={() => openCustomerEdit(customer)}>Edit</button>
                <button className="button button-outline button-small" onClick={() => void downloadPdf(customer)}><Download size={13} /> PDF</button>
              </div></td>
            </tr>)}
          </tbody></table></div>
        ) : resource === "inventory" ? (
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Product / SKU</th><th>Category</th><th>Unit</th><th>On hand</th><th>Reorder point</th><th /></tr></thead><tbody>
            {filteredRecords.map((record) => {
              const edit = inventoryEdits[record.product_id] || record;
              return <tr key={record.product_id}>
                <td><strong>{record.name}</strong><span className="table-sub">{record.sku}</span></td><td>{record.category}</td><td>{record.unit}</td>
                <td><input className="crm-number-input" type="number" min="0" step="1" value={edit.quantity_on_hand} onChange={(event) => setInventoryEdits((current) => ({ ...current, [record.product_id]: { ...edit, quantity_on_hand: event.target.value } }))} aria-label={`${record.name} stock on hand`} /></td>
                <td><input className="crm-number-input" type="number" min="0" step="1" value={edit.reorder_point} onChange={(event) => setInventoryEdits((current) => ({ ...current, [record.product_id]: { ...edit, reorder_point: event.target.value } }))} aria-label={`${record.name} reorder point`} /></td>
                <td><button className="button button-outline button-small" disabled={!inventoryEdits[record.product_id]} onClick={() => void saveInventory(record)}>Save</button></td>
              </tr>;
            })}
          </tbody></table></div>
        ) : (
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Document</th><th>Customer</th><th>Issued</th><th>Due</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {filteredRecords.map((record) => {
              const reminder = whatsappUrl(record);
              return <tr key={record.id}>
                <td><strong>{record.document_number}</strong><span className="table-sub">{documentTypeLabel(record.document_type)}</span></td>
                <td>{record.customer_name || "—"}<span className="table-sub">{record.contact_name || record.customer_slug}</span></td>
                <td>{dateLabel(record.issued_at)}</td><td>{dateLabel(record.due_at)}</td>
                <td className="amount-cell">{record.amount_idr === null ? "—" : formatMoney(record.amount_idr)}</td>
                <td><Status>{record.status}</Status></td>
                <td><div className="crm-row-actions">
                  <button className="button button-outline button-small" onClick={() => void downloadPdf(record)}><Download size={13} /> PDF</button>
                  {reminder ? <a className="button button-outline button-small crm-reminder-link" href={reminder} target="_blank" rel="noopener noreferrer"><Send size={13} /> WhatsApp</a> : <span className="table-sub">Add phone</span>}
                </div></td>
              </tr>;
            })}
          </tbody></table></div>
        )}
      </section>

      {documentPanel && <div className="info-banner crm-whatsapp-note"><Send size={16} /><span>WhatsApp opens a prefilled draft. Review it and tap Send in WhatsApp; nothing is sent automatically.</span></div>}

      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
        <section className="tracking-modal crm-modal" role="dialog" aria-modal="true" aria-labelledby="crm-modal-title">
          <div className="tracking-modal-head"><div><div className="eyebrow">{resource === "customers" ? "CUSTOMER RECORD" : config.label}</div><h2 id="crm-modal-title">{editingCustomer ? "Edit customer" : config.action}</h2></div><button className="icon-button" onClick={() => setModalOpen(false)} aria-label="Close form"><X size={19} /></button></div>
          <form onSubmit={saveRecord}>
            {resource === "customers" ? <div className="crm-form-grid">
              <label>Business name<input required maxLength={120} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></label>
              <label>Customer slug<input maxLength={120} value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} placeholder="Generated from business name if blank" /></label>
              <label>Contact person<input maxLength={160} value={draft.contact_name} onChange={(event) => setDraft((current) => ({ ...current, contact_name: event.target.value }))} /></label>
              <label>Email<input type="email" maxLength={254} value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} /></label>
              <label>WhatsApp number<input type="tel" maxLength={80} value={draft.whatsapp_phone} onChange={(event) => setDraft((current) => ({ ...current, whatsapp_phone: event.target.value }))} placeholder="+62..." /></label>
              <label>Status<select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
              <label className="crm-form-wide">Billing address<textarea rows="2" maxLength={1000} value={draft.billing_address} onChange={(event) => setDraft((current) => ({ ...current, billing_address: event.target.value }))} /></label>
              <label className="crm-form-wide">Notes<textarea rows="2" maxLength={4000} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} /></label>
            </div> : <div className="crm-form-grid">
              <label>Customer<select required value={draft.organization_id} onChange={(event) => setDraft((current) => ({ ...current, organization_id: event.target.value }))}><option value="">Select a customer</option>{customers.filter((customer) => customer.status === "active").map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
              <label>Document number<input required maxLength={80} value={draft.document_number} onChange={(event) => setDraft((current) => ({ ...current, document_number: event.target.value }))} /></label>
              <label>Amount (IDR)<input type="number" min="0" step="1" value={draft.amount_idr} onChange={(event) => setDraft((current) => ({ ...current, amount_idr: event.target.value }))} /></label>
              <label>Status<select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>{["draft", "sent", "pending", "overdue", "paid", "closed", "cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
              <label>Issued date<input type="date" value={draft.issued_at} onChange={(event) => setDraft((current) => ({ ...current, issued_at: event.target.value }))} /></label>
              <label>Due date<input type="date" value={draft.due_at} onChange={(event) => setDraft((current) => ({ ...current, due_at: event.target.value }))} /></label>
              <label className="crm-form-wide">Notes<textarea rows="3" maxLength={4000} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} /></label>
            </div>}
            <div className="crm-form-footer"><button type="button" className="button button-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="button button-dark" disabled={saving}>{saving ? "Saving..." : "Save record"}</button></div>
          </form>
        </section>
      </div>}
    </>
  );
}
