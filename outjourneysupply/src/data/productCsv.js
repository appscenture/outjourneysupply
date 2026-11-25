import { parseCsvRows } from "./csv";

const PRODUCT_COLUMNS = [
  'sku',
  'name',
  'category',
  'description',
  'unit',
  'image_path',
  'price_idr',
  'is_active',
  'is_featured',
];

export function parseProductCsv(text) {
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error('CSV must contain a header and at least one product.');

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const headerIndexes = new Map(headers.map((header, index) => [header, index]));
  const requiredColumns = ['sku', 'name', 'category', 'unit', 'price_idr'];
  const missingColumns = requiredColumns.filter((column) => !headerIndexes.has(column));
  if (missingColumns.length) {
    throw new Error(`CSV is missing required columns: ${missingColumns.join(', ')}.`);
  }

  const valueAt = (row, column) => {
    const index = headerIndexes.get(column);
    return index === undefined ? '' : (row[index] || '').trim();
  };

  return rows.slice(1).map((row, index) => {
    const rowNumber = index + 2;
    const price = Number(valueAt(row, 'price_idr'));
    if (!Number.isSafeInteger(price) || price < 0) {
      throw new Error(`CSV row ${rowNumber}: price_idr must be a whole number greater than or equal to zero.`);
    }

    const activeValue = valueAt(row, 'is_active').toLowerCase();
    const featuredValue = valueAt(row, 'is_featured').toLowerCase();
    if (activeValue && activeValue !== 'true' && activeValue !== 'false') {
      throw new Error(`CSV row ${rowNumber}: is_active must be true or false.`);
    }
    if (featuredValue && featuredValue !== 'true' && featuredValue !== 'false') {
      throw new Error(`CSV row ${rowNumber}: is_featured must be true or false.`);
    }

    return {
      sku: valueAt(row, 'sku'),
      name: valueAt(row, 'name'),
      category: valueAt(row, 'category'),
      description: valueAt(row, 'description') || null,
      unit: valueAt(row, 'unit'),
      image_path: valueAt(row, 'image_path') || null,
      price_idr: price,
      is_active: activeValue ? activeValue === 'true' : true,
      is_featured: featuredValue === 'true',
    };
  });
}

export function productsToCsv(products) {
  const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [
    PRODUCT_COLUMNS.map(quote).join(','),
    ...products.map((product) => PRODUCT_COLUMNS.map((column) => quote(product[column])).join(',')),
  ];
  return `${lines.join('\r\n')}\r\n`;
}
