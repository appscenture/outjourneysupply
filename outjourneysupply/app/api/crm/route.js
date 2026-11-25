import { algoliasearch } from "algoliasearch";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getAdminClient } from "../../../lib/supabase/admin";
import { parseCsvRows, rowsToCsv } from "../../../src/data/csv";

const PRODUCT_SELECTION =
  "id, sku, name, category, description, unit, image_path, price_idr, is_active, is_featured, updated_at";
const RESOURCE_TYPES = {
  customers: "customers",
  inventory: "inventory",
  products: "products",
  "purchase-orders": "purchase_order",
  rfqs: "rfq",
  invoices: "invoice",
};
const DOCUMENT_STATUSES = new Set(["draft", "sent", "pending", "overdue", "paid", "closed", "cancelled"]);
const CUSTOMER_SELECTION =
  "id, name, slug, contact_name, email, whatsapp_phone, billing_address, notes, status, created_at, updated_at";
const HEADERS = {
  customers: ["name", "slug", "contact_name", "email", "whatsapp_phone", "billing_address", "notes", "status"],
  inventory: ["sku", "name", "category", "unit", "quantity_on_hand", "reorder_point"],
  products: ["sku", "name", "category", "description", "unit", "image_path", "price_idr", "is_active", "is_featured"],
  documents: ["document_type", "document_number", "customer_slug", "customer_name", "amount_idr", "issued_at", "due_at", "status", "notes"],
};

class InputError extends Error {}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function nullableText(value, maxLength, label) {
  const cleaned = text(value);
  if (cleaned.length > maxLength) throw new InputError(`${label} must be ${maxLength} characters or fewer.`);
  return cleaned || null;
}

function wholeNumber(value, label, { min = 0, optional = false } = {}) {
  if ((value === null || value === undefined || text(value) === "") && optional) return null;
  const normalized = typeof value === "number" ? value : Number(text(value).replace(/[,\s]/g, ""));
  if (!Number.isSafeInteger(normalized) || normalized < min) {
    throw new InputError(`${label} must be a whole number greater than or equal to ${min}.`);
  }
  return normalized;
}

function booleanValue(value, label, defaultValue) {
  if (value === null || value === undefined || text(value) === "") return defaultValue;
  if (value === true || ["true", "1", "yes"].includes(text(value).toLowerCase())) return true;
  if (value === false || ["false", "0", "no"].includes(text(value).toLowerCase())) return false;
  throw new InputError(`${label} must be true or false.`);
}

function slugify(value) {
  return text(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120)
    .replace(/-$/g, "");
}

function validDate(value, label, optional = true) {
  const cleaned = text(value);
  if (!cleaned && optional) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    throw new InputError(`${label} must use YYYY-MM-DD format.`);
  }
  const date = new Date(`${cleaned}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== cleaned) {
    throw new InputError(`${label} is not a valid date.`);
  }
  return cleaned;
}

function csvObjects(textContent) {
  const rows = parseCsvRows(textContent);
  if (rows.length < 2) throw new InputError("The import file must contain column headers and at least one record.");
  if (rows.length > 1001) throw new InputError("Import between 1 and 1,000 records at a time.");
  const headers = rows[0].map((header) => header.trim().toLowerCase());
  if (headers.some((header) => !header)) throw new InputError("The import file contains an empty column header.");
  return rows.slice(1).map((row, rowIndex) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    if (!Object.values(record).some((value) => text(value))) {
      throw new InputError(`Import row ${rowIndex + 2} is empty.`);
    }
    return record;
  });
}

function cellValue(cell) {
  const value = cell.value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (value && typeof value === "object") return cell.text || "";
  return value ?? "";
}

async function spreadsheetObjects(file) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    throw new InputError("Choose a non-empty CSV or Excel file.");
  }
  if (file.size > 5 * 1024 * 1024) throw new InputError("Imports must be 5 MB or smaller.");

  const fileName = text(file.name).toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  if (fileName.endsWith(".csv")) {
    return csvObjects(buffer.toString("utf8"));
  }
  if (!fileName.endsWith(".xlsx")) {
    throw new InputError("Choose a .csv or .xlsx file.");
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new InputError("The Excel workbook could not be opened.");
  }
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) {
    throw new InputError("The Excel workbook must contain headers and at least one record on its first sheet.");
  }
  const headers = sheet.getRow(1).values.slice(1).map((value) => text(value).toLowerCase());
  if (!headers.length || headers.some((header) => !header)) {
    throw new InputError("The Excel workbook contains an empty column header.");
  }
  const records = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record = {};
    headers.forEach((header, index) => {
      record[header] = cellValue(row.getCell(index + 1));
    });
    if (!Object.values(record).some((value) => text(value))) {
      throw new InputError(`Import row ${rowNumber} is empty.`);
    }
    records.push(record);
    if (records.length > 1000) throw new InputError("Import between 1 and 1,000 records at a time.");
  });
  return records;
}

function resourceError(resource) {
  return !Object.prototype.hasOwnProperty.call(RESOURCE_TYPES, resource);
}

async function loadResource(client, resource) {
  if (resource === "products") {
    const { data, error } = await client.from("products").select(PRODUCT_SELECTION).order("name");
    if (error) throw error;
    return data;
  }
  if (resource === "customers") {
    const { data, error } = await client.from("organizations").select(CUSTOMER_SELECTION).order("name");
    if (error) throw error;
    return data;
  }
  if (resource === "inventory") {
    const [productsResult, inventoryResult] = await Promise.all([
      client.from("products").select("id, sku, name, category, unit").order("name"),
      client.from("supplier_inventory").select("product_id, quantity_on_hand, reorder_point"),
    ]);
    if (productsResult.error) throw productsResult.error;
    if (inventoryResult.error) throw inventoryResult.error;
    const byProductId = new Map(inventoryResult.data.map((item) => [item.product_id, item]));
    return productsResult.data.map((product) => {
      const stock = byProductId.get(product.id);
      return {
        product_id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        unit: product.unit,
        quantity_on_hand: stock?.quantity_on_hand ?? 0,
        reorder_point: stock?.reorder_point ?? 0,
      };
    });
  }

  const type = RESOURCE_TYPES[resource];
  const [documentsResult, customersResult] = await Promise.all([
    client.from("crm_documents")
      .select("id, organization_id, document_type, document_number, amount_idr, issued_at, due_at, status, notes, created_at, updated_at")
      .eq("document_type", type)
      .order("issued_at", { ascending: false }),
    client.from("organizations").select("id, name, slug, contact_name, whatsapp_phone"),
  ]);
  if (documentsResult.error) throw documentsResult.error;
  if (customersResult.error) throw customersResult.error;
  const customers = new Map(customersResult.data.map((customer) => [customer.id, customer]));
  return documentsResult.data.map((document) => {
    const customer = customers.get(document.organization_id);
    return {
      ...document,
      customer_name: customer?.name ?? "",
      customer_slug: customer?.slug ?? "",
      contact_name: customer?.contact_name ?? "",
      whatsapp_phone: customer?.whatsapp_phone ?? "",
    };
  });
}

function exportHeaders(resource) {
  if (resource === "customers" || resource === "inventory" || resource === "products") return HEADERS[resource];
  return HEADERS.documents;
}

async function exportResource(records, resource, format) {
  const headers = exportHeaders(resource);
  const baseName = `outjourney-${resource}`;
  if (format === "csv") {
    return new NextResponse(rowsToCsv(headers, records), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(resource);
  sheet.columns = headers.map((header) => ({ header, key: header, width: Math.min(Math.max(header.length + 4, 16), 32) }));
  sheet.addRows(records.map((record) => Object.fromEntries(headers.map((header) => [header, record[header] ?? null]))));
  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

function cleanProductRows(records) {
  const seen = new Set();
  return records.map((record, index) => {
    if (!isRecord(record)) throw new InputError(`Product row ${index + 2} is invalid.`);
    const sku = text(record.sku);
    const name = text(record.name);
    const category = text(record.category);
    const unit = text(record.unit);
    if (!sku || sku.length > 64 || !name || name.length > 160 || !category || category.length > 80 || !unit || unit.length > 80) {
      throw new InputError(`Product row ${index + 2} needs a valid SKU, name, category, and unit.`);
    }
    const key = sku.toUpperCase();
    if (seen.has(key)) throw new InputError(`The import contains duplicate SKU ${sku}.`);
    seen.add(key);
    return {
      sku,
      name,
      category,
      description: nullableText(record.description, 4000, "Description"),
      unit,
      image_path: nullableText(record.image_path, 1000, "Image path"),
      price_idr: wholeNumber(record.price_idr, "price_idr"),
      is_active: booleanValue(record.is_active, "is_active", true),
      is_featured: booleanValue(record.is_featured, "is_featured", false),
    };
  });
}

function cleanCustomerRows(records) {
  const seen = new Set();
  return records.map((record, index) => {
    if (!isRecord(record)) throw new InputError(`Customer row ${index + 2} is invalid.`);
    const name = text(record.name);
    if (!name || name.length > 120) throw new InputError(`Customer row ${index + 2} needs a name of 120 characters or fewer.`);
    const slug = (text(record.slug) || slugify(name)).toLowerCase();
    if (!slug || slug.length > 120 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      throw new InputError(`Customer row ${index + 2} needs a valid slug or a name that can be converted to one.`);
    }
    if (seen.has(slug)) throw new InputError(`The import contains duplicate customer slug ${slug}.`);
    seen.add(slug);
    const status = text(record.status).toLowerCase() || (booleanValue(record.is_active, "is_active", true) ? "active" : "inactive");
    if (status !== "active" && status !== "inactive") throw new InputError(`Customer row ${index + 2} status must be active or inactive.`);
    const email = nullableText(record.email, 254, "Email");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError(`Customer row ${index + 2} has an invalid email address.`);
    return {
      name,
      slug,
      contact_name: nullableText(record.contact_name, 160, "Contact name"),
      email,
      whatsapp_phone: nullableText(record.whatsapp_phone, 80, "WhatsApp number"),
      billing_address: nullableText(record.billing_address ?? record.address, 1000, "Billing address"),
      notes: nullableText(record.notes, 4000, "Customer notes"),
      status,
    };
  });
}

function cleanInventoryRows(records, products) {
  const bySku = new Map(products.map((product) => [product.sku.toUpperCase(), product.id]));
  const seen = new Set();
  return records.map((record, index) => {
    const sku = text(record?.sku).toUpperCase();
    const productId = bySku.get(sku);
    if (!productId) throw new InputError(`Inventory row ${index + 2} refers to an unknown SKU: ${sku || "(empty)"}.`);
    if (seen.has(productId)) throw new InputError(`The import contains duplicate inventory SKU ${sku}.`);
    seen.add(productId);
    return {
      product_id: productId,
      quantity_on_hand: wholeNumber(record.quantity_on_hand, `Inventory row ${index + 2} quantity_on_hand`),
      reorder_point: wholeNumber(record.reorder_point, `Inventory row ${index + 2} reorder_point`),
    };
  });
}

async function cleanDocumentRows(client, resource, records) {
  const type = RESOURCE_TYPES[resource];
  const { data: customers, error } = await client.from("organizations").select("id, slug, name");
  if (error) throw error;
  const bySlug = new Map(customers.map((customer) => [customer.slug.toLowerCase(), customer]));
  const byId = new Map(customers.map((customer) => [customer.id, customer]));
  const seen = new Set();

  return records.map((record, index) => {
    if (!isRecord(record)) throw new InputError(`Document row ${index + 2} is invalid.`);
    const documentNumber = text(record.document_number ?? record.po_number ?? record.rfq_number ?? record.invoice_number);
    if (!documentNumber || documentNumber.length > 80) {
      throw new InputError(`Document row ${index + 2} needs a document number of 80 characters or fewer.`);
    }
    const customer = byId.get(text(record.organization_id ?? record.customer_id))
      || bySlug.get(text(record.customer_slug ?? record.slug).toLowerCase())
      || [...customers].find((item) => item.name.toLowerCase() === text(record.customer_name).toLowerCase());
    if (!customer) {
      throw new InputError(`Document row ${index + 2} refers to an unknown customer. Import or create the customer first.`);
    }
    const key = documentNumber.toLowerCase();
    if (seen.has(key)) throw new InputError(`The import contains duplicate document number ${documentNumber}.`);
    seen.add(key);
    const status = text(record.status).toLowerCase() || "pending";
    if (!DOCUMENT_STATUSES.has(status)) {
      throw new InputError(`Document row ${index + 2} status must be draft, sent, pending, overdue, paid, closed, or cancelled.`);
    }
    const amount = wholeNumber(record.amount_idr, `Document row ${index + 2} amount_idr`, { optional: true });
    const issuedAt = validDate(record.issued_at ?? record.issue_date, `Document row ${index + 2} issued_at`) || new Date().toISOString().slice(0, 10);
    const dueAt = validDate(record.due_at ?? record.due_date, `Document row ${index + 2} due_at`);
    return {
      organization_id: customer.id,
      document_type: type,
      document_number: documentNumber,
      amount_idr: amount,
      issued_at: issuedAt,
      due_at: dueAt,
      status,
      notes: nullableText(record.notes, 4000, "Document notes"),
    };
  });
}

function algoliaConfig() {
  const appId = process.env.ALGOLIA_APP_ID || process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const adminKey = process.env.ALGOLIA_ADMIN_API_KEY;
  const indexName = process.env.ALGOLIA_PRODUCTS_INDEX || process.env.NEXT_PUBLIC_ALGOLIA_PRODUCTS_INDEX;
  return appId && adminKey && indexName ? { appId, adminKey, indexName } : null;
}

async function importRecords(client, resource, records) {
  if (!Array.isArray(records) || records.length === 0 || records.length > 1000) {
    throw new InputError("Import between 1 and 1,000 records at a time.");
  }

  let table;
  let rows;
  let conflict;
  if (resource === "products") {
    table = "products";
    conflict = "sku";
    rows = cleanProductRows(records);
  } else if (resource === "customers") {
    table = "organizations";
    conflict = "slug";
    rows = cleanCustomerRows(records);
  } else if (resource === "inventory") {
    const { data: products, error } = await client.from("products").select("id, sku");
    if (error) throw error;
    table = "supplier_inventory";
    conflict = "product_id";
    rows = cleanInventoryRows(records, products);
  } else {
    table = "crm_documents";
    conflict = "document_type,document_number";
    rows = await cleanDocumentRows(client, resource, records);
  }

  const { data, error } = await client.from(table).upsert(rows, { onConflict: conflict }).select("*");
  if (error) throw error;

  let searchIndexed = null;
  if (resource === "products") {
    searchIndexed = false;
    const config = algoliaConfig();
    if (config) {
      try {
        const algolia = algoliasearch(config.appId, config.adminKey);
        await algolia.saveObjects({
          indexName: config.indexName,
          objects: data.map((product) => ({
            objectID: product.sku,
            sku: product.sku,
            name: product.name,
            category: product.category,
            description: product.description,
            unit: product.unit,
            price_idr: product.price_idr,
            is_active: product.is_active,
          })),
        });
        searchIndexed = true;
      } catch (error) {
        console.error("Products were saved but could not be synced to Algolia.", error);
        throw new Error("Products were imported, but Algolia could not be updated. Retry after checking Algolia configuration.");
      }
    }
  }

  return { imported: data.length, searchIndexed };
}

export async function GET(request) {
  const access = await getAdminClient();
  if (access.response) return access.response;

  const parameters = new URL(request.url).searchParams;
  const resource = parameters.get("resource") || "";
  if (resourceError(resource)) return NextResponse.json({ error: "Choose a valid CRM data type." }, { status: 400 });

  try {
    const records = await loadResource(access.client, resource);
    const format = parameters.get("format");
    if (format) {
      if (format !== "csv" && format !== "xlsx") {
        return NextResponse.json({ error: "Choose CSV or XLSX export." }, { status: 400 });
      }
      return exportResource(records, resource === "purchase-orders" || resource === "rfqs" || resource === "invoices" ? "documents" : resource, format);
    }
    return NextResponse.json({ records });
  } catch (error) {
    console.error(`Could not load CRM ${resource}.`, error);
    return NextResponse.json({ error: `Could not load ${resource.replace("-", " ")}.` }, { status: 500 });
  }
}

export async function POST(request) {
  const access = await getAdminClient();
  if (access.response) return access.response;

  try {
    const contentType = request.headers.get("content-type") || "";
    let resource;
    let records;
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      resource = text(formData.get("resource"));
      records = await spreadsheetObjects(formData.get("file"));
    } else {
      let body;
      try {
        body = await request.json();
      } catch (error) {
        if (error instanceof SyntaxError) throw new InputError("Request body must be valid JSON.");
        throw error;
      }
      resource = text(body?.resource);
      records = Array.isArray(body?.records) ? body.records : isRecord(body?.record) ? [body.record] : [];
    }

    if (resourceError(resource)) throw new InputError("Choose a valid CRM data type.");
    const result = await importRecords(access.client, resource, records);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof InputError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Could not import CRM data.", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not import CRM data." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const access = await getAdminClient();
  if (access.response) return access.response;

  let body;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    throw error;
  }

  const resource = text(body?.resource);
  const id = text(body?.id);
  const record = body?.record;
  if (resourceError(resource) || !id || !isRecord(record)) {
    return NextResponse.json({ error: "Provide a valid CRM data type, record ID, and record." }, { status: 400 });
  }

  try {
    let table;
    let matchColumn = "id";
    let updates;
    if (resource === "inventory") {
      table = "supplier_inventory";
      matchColumn = "product_id";
      updates = {
        quantity_on_hand: wholeNumber(record.quantity_on_hand, "quantity_on_hand"),
        reorder_point: wholeNumber(record.reorder_point, "reorder_point"),
      };
    } else if (resource === "customers") {
      table = "organizations";
      updates = {};
      if ("name" in record) {
        const name = text(record.name);
        if (!name || name.length > 120) throw new InputError("Customer name is required and must be 120 characters or fewer.");
        updates.name = name;
      }
      if ("slug" in record) {
        const slug = text(record.slug).toLowerCase();
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 120) throw new InputError("Customer slug is invalid.");
        updates.slug = slug;
      }
      for (const [field, maxLength] of Object.entries({
        contact_name: 160,
        email: 254,
        whatsapp_phone: 80,
        billing_address: 1000,
        notes: 4000,
      })) {
        if (field in record) updates[field] = nullableText(record[field], maxLength, field.replace("_", " "));
      }
      if ("status" in record) {
        const status = text(record.status).toLowerCase();
        if (!["active", "inactive"].includes(status)) throw new InputError("Customer status must be active or inactive.");
        updates.status = status;
      }
    } else if (resource === "products") {
      throw new InputError("Product records are updated through the product import workflow.");
    } else {
      table = "crm_documents";
      updates = {};
      if ("status" in record) {
        const status = text(record.status).toLowerCase();
        if (!DOCUMENT_STATUSES.has(status)) throw new InputError("Document status is invalid.");
        updates.status = status;
      }
      if ("amount_idr" in record) updates.amount_idr = wholeNumber(record.amount_idr, "amount_idr", { optional: true });
      if ("issued_at" in record) updates.issued_at = validDate(record.issued_at, "issued_at", false);
      if ("due_at" in record) updates.due_at = validDate(record.due_at, "due_at");
      if ("notes" in record) updates.notes = nullableText(record.notes, 4000, "Notes");
    }

    if (!Object.keys(updates).length) throw new InputError("Provide at least one field to update.");
    const query = resource === "inventory"
      ? access.client.from(table).upsert({ product_id: id, ...updates }, { onConflict: "product_id" }).select("*").single()
      : access.client.from(table).update(updates).eq(matchColumn, id).select("*").maybeSingle();
    const { data, error } = await query;
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "The requested record was not found." }, { status: 404 });
    return NextResponse.json({ record: data });
  } catch (error) {
    if (error instanceof InputError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Could not update CRM record.", error);
    return NextResponse.json({ error: "Could not update the CRM record." }, { status: 500 });
  }
}
