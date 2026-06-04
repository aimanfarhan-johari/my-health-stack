const FIELDS = 'product_name,brands,nutriments,serving_size';

function parseProduct(product) {
  if (!product) return null;
  const n = product.nutriments || {};
  return {
    id: product.id || product._id || null,
    name: product.product_name || 'Unknown',
    brand: product.brands || '',
    calories_per_100g: n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0,
    protein_per_100g: n.proteins_100g ?? n.proteins ?? 0,
    carbs_per_100g: n.carbohydrates_100g ?? n.carbohydrates ?? 0,
    fat_per_100g: n.fat_100g ?? n.fat ?? 0,
    serving_size: product.serving_size || null,
  };
}

export async function searchFood(query) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=20&fields=${FIELDS}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();
  return (data.products || []).map(parseProduct).filter(Boolean);
}

export async function getProductByBarcode(barcode) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${FIELDS}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return parseProduct({ ...data.product, id: barcode });
}
