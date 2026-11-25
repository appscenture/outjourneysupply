import { useState } from "react";
import {
  Apple,
  Beef,
  Candy,
  Carrot,
  Coffee,
  CookingPot,
  Croissant,
  CupSoda,
  Droplets,
  Egg,
  Fish,
  Milk,
  Package,
  Soup,
  Wheat,
} from "lucide-react";

const imageMatchers = [
  { type: "coffee", icon: Coffee, pattern: /\b(kopi|coffee|teh|tea)\b/i },
  { type: "dairy", icon: Milk, pattern: /\b(susu|milk|dairy|keju|cheese|yogurt|yoghurt)\b/i },
  { type: "drink", icon: CupSoda, pattern: /\b(minuman|drink|beverage|juice|jus|soda|sirup|syrup|water|air mineral)\b/i },
  { type: "vegetable", icon: Carrot, pattern: /\b(sayur|vegetable|vegetables|wortel|carrot|tomat|tomato|bayam|spinach|brokoli|broccoli|cabai|chili|bawang|onion|kentang|potato)\b/i },
  { type: "fruit", icon: Apple, pattern: /\b(buah|fruit|fruits|apple|apel|jeruk|orange|pisang|banana|mangga|mango|anggur|grape|pepaya|papaya)\b/i },
  { type: "seafood", icon: Fish, pattern: /\b(ikan|fish|seafood|udang|shrimp|cumi|squid|kepiting|crab|salmon|tuna)\b/i },
  { type: "meat", icon: Beef, pattern: /\b(daging|meat|beef|sapi|ayam|chicken|kambing|lamb|bebek|duck|pork)\b/i },
  { type: "egg", icon: Egg, pattern: /\b(telur|egg|eggs)\b/i },
  { type: "oil", icon: Droplets, pattern: /\b(minyak|oil|margarine)\b/i },
  { type: "sweet", icon: Candy, pattern: /\b(gula|sugar|cokelat|chocolate|permen|candy)\b/i },
  { type: "bakery", icon: Croissant, pattern: /\b(roti|bread|bakery|pastry|croissant)\b/i },
  { type: "noodles", icon: Soup, pattern: /\b(mie|mi|noodle|noodles|soup|sup)\b/i },
  { type: "grain", icon: Wheat, pattern: /\b(tepung|flour|gandum|wheat|jagung|corn|oat|oats)\b/i },
  { type: "food", icon: CookingPot, pattern: /\b(beras|rice|nasi|food|makanan|meal|masakan)\b/i },
];

function getProductImageMatcher(product) {
  const description = [
    product?.name,
    product?.category,
    product?.categoryLabel,
    product?.description,
    product?.desc,
  ].filter(Boolean).join(" ");

  return imageMatchers.find(({ pattern }) => pattern.test(description)) || {
    type: "product",
    icon: Package,
  };
}

export function ProductImage({ product, src, alt, loading = "lazy" }) {
  const [failedSrc, setFailedSrc] = useState("");
  const imageSrc = typeof src === "string" ? src.trim() : "";

  if (imageSrc && imageSrc !== failedSrc) {
    return (
      <img
        src={imageSrc}
        alt={alt || product?.name || "Product"}
        loading={loading}
        onError={() => setFailedSrc(imageSrc)}
      />
    );
  }

  const { type, icon: Icon } = getProductImageMatcher(product);

  return (
    <div
      className={`product-image-placeholder product-image-placeholder--${type}`}
      role="img"
      aria-label={`Illustration of ${product?.name || "product"}`}
    >
      <Icon aria-hidden="true" size={42} strokeWidth={1.6} />
    </div>
  );
}
