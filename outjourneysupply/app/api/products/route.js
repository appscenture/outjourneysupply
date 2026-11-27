import { algoliasearch } from "algoliasearch";
import { NextResponse } from "next/server";
import { getAdminClient } from "../../../lib/supabase/admin";

const productSelection =
  "id, sku, name, category, description, unit, image_path, price_idr, is_active, is_featured, updated_at";

function getAlgoliaAdminConfig() {
  const appId = process.env.ALGOLIA_APP_ID || process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const adminKey = process.env.ALGOLIA_ADMIN_API_KEY;
  const indexName = process.env.ALGOLIA_PRODUCTS_INDEX || process.env.NEXT_PUBLIC_ALGOLIA_PRODUCTS_INDEX;
  return appId && adminKey && indexName ? { appId, adminKey, indexName } : null;
}

function toAlgoliaProduct(product) {
  return {
    objectID: product.sku,
    sku: product.sku,
    name: product.name,
    category: product.category,
    description: product.description,
    unit: product.unit,
    price_idr: product.price_idr,
    is_active: product.is_active,
  };
}

export async function GET() {
  const access = await getAdminClient();
  if (access.response) return access.response;

  const { data, error } = await access.client
    .from("products")
    .select(productSelection)
    .order("name");

  if (error) {
    console.error("Could not load products for the dashboard.", error);
    return NextResponse.json({ error: "Could not load the product catalog." }, { status: 500 });
  }
  return NextResponse.json({ products: data });
}

export async function PUT() {
  const access = await getAdminClient();
  if (access.response) return access.response;

  const config = getAlgoliaAdminConfig();
  if (!config) {
    return NextResponse.json({ error: "Server-side Algolia indexing is not configured." }, { status: 503 });
  }

  const { data, error } = await access.client
    .from("products")
    .select(productSelection)
    .eq("is_active", true)
    .order("sku")
    .limit(1000);

  if (error) {
    console.error("Could not load products for Algolia indexing.", error);
    return NextResponse.json({ error: "Could not load products to sync search." }, { status: 500 });
  }

  try {
    const algolia = algoliasearch(config.appId, config.adminKey);
    await algolia.saveObjects({
      indexName: config.indexName,
      objects: data.map(toAlgoliaProduct),
    });
    return NextResponse.json({ indexed: data.length });
  } catch (syncError) {
    console.error("Could not sync products to Algolia.", syncError);
    return NextResponse.json({ error: "Could not sync products to Algolia." }, { status: 502 });
  }
}

export async function POST(request) {
  const access = await getAdminClient();
  if (access.response) return access.response;

  let body;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "The import file is not valid JSON." }, { status: 400 });
    }
    throw error;
  }

  const isSingleProduct = Object.prototype.hasOwnProperty.call(body ?? {}, "product");
  const incomingProducts = isSingleProduct ? [body.product] : body?.products;
  if (!Array.isArray(incomingProducts) || incomingProducts.length === 0 || incomingProducts.length > 1000) {
    return NextResponse.json({ error: "Import between 1 and 1,000 products at a time." }, { status: 400 });
  }

  const products = [];
  const seenSkus = new Set();
  for (const [index, product] of incomingProducts.entries()) {
    const rowNumber = index + 1;
    if (!product || typeof product !== "object" || Array.isArray(product)) {
      return NextResponse.json({ error: `Product row ${rowNumber} is invalid.` }, { status: 400 });
    }

    const sku = typeof product.sku === "string" ? product.sku.trim() : "";
    const name = typeof product.name === "string" ? product.name.trim() : "";
    const category = typeof product.category === "string" ? product.category.trim() : "";
    const unit = typeof product.unit === "string" ? product.unit.trim() : "";
    const price = product.price_idr;

    if (!sku || sku.length > 64 || !name || name.length > 160 || !category || category.length > 80 || !unit || unit.length > 80) {
      return NextResponse.json({ error: `Product row ${rowNumber} has a missing or overlong SKU, name, category, or unit.` }, { status: 400 });
    }
    if (!Number.isSafeInteger(price) || price < 0) {
      return NextResponse.json({ error: `Product row ${rowNumber} has an invalid price_idr.` }, { status: 400 });
    }
    if (typeof product.is_active !== "boolean" || typeof product.is_featured !== "boolean") {
      return NextResponse.json({ error: `Product row ${rowNumber} must include true/false is_active and is_featured values.` }, { status: 400 });
    }

    const normalizedSku = sku.toUpperCase();
    if (seenSkus.has(normalizedSku)) {
      return NextResponse.json({ error: `The import contains duplicate SKU ${sku}.` }, { status: 400 });
    }
    seenSkus.add(normalizedSku);

    products.push({
      sku,
      name,
      category,
      description: typeof product.description === "string" && product.description.trim()
        ? product.description.trim()
        : null,
      unit,
      image_path: typeof product.image_path === "string" && product.image_path.trim()
        ? product.image_path.trim()
        : null,
      price_idr: price,
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
  }

  const query = isSingleProduct
    ? access.client.from("products").insert(products)
    : access.client.from("products").upsert(products, { onConflict: "sku" });
  const { data, error } = await query.select(productSelection);

  if (error) {
    console.error("Could not import the product catalog.", error);
    if (isSingleProduct && error.code === "23505") {
      return NextResponse.json({ error: "A product with this SKU already exists." }, { status: 409 });
    }
    return NextResponse.json({
      error: isSingleProduct
        ? "Could not add product. Check the product details and try again."
        : "Could not import products. Check the CSV values and try again.",
    }, { status: 500 });
  }

  const config = getAlgoliaAdminConfig();
  let searchIndexed = false;

  if (config) {
    try {
      const algolia = algoliasearch(config.appId, config.adminKey);
      await algolia.saveObjects({
        indexName: config.indexName,
        objects: data.map(toAlgoliaProduct),
      });
      searchIndexed = true;
    } catch (error) {
      console.error("Products were saved but could not be synced to Algolia.", error);
      return NextResponse.json({
        error: "Products were saved to Supabase, but Algolia could not be updated. Retry the import after checking Algolia configuration.",
        imported: data.length,
      }, { status: 502 });
    }
  }

  return NextResponse.json({ imported: data.length, products: data, searchIndexed });
}
