import ProductDetail from "../../../src/components/ProductDetail";

export default async function ProductDetailPage({ params }) {
  const { sku } = await params;
  return <ProductDetail sku={decodeURIComponent(sku)} />;
}
