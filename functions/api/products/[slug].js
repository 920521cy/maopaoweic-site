const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    ...(init.headers || {})
  }
});

const parseJsonArray = (value) => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const mapProduct = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  longDescription: row.long_description || "",
  price: Number(row.price ?? 0),
  category: row.category,
  tags: parseJsonArray(row.tags_json),
  delivery: parseJsonArray(row.delivery),
  audience: parseJsonArray(row.audience),
  status: row.status,
  featured: Boolean(row.featured)
});

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method !== "GET") {
    return json({
      ok: false,
      error: "Method not allowed"
    }, { status: 405 });
  }

  if (!env?.DB) {
    return json({
      ok: false,
      message: "D1 binding DB is not configured"
    }, { status: 503 });
  }

  try {
    const product = await env.DB.prepare(`
      SELECT
        id,
        slug,
        title,
        description,
        long_description,
        price,
        category,
        tags_json,
        delivery,
        audience,
        status,
        featured
      FROM products
      WHERE slug = ? AND status = 'published'
      LIMIT 1
    `).bind(params?.slug || "").first();

    if (!product) {
      return json({
        ok: false,
        message: "Product not found"
      }, { status: 404 });
    }

    return json({
      ok: true,
      product: mapProduct(product)
    });
  } catch {
    return json({
      ok: false,
      message: "Unable to read product detail. Please check the database binding and product table."
    }, { status: 500 });
  }
}
