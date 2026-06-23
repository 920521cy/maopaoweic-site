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
  price: Number(row.price ?? 0),
  category: row.category,
  tags: parseJsonArray(row.tags_json),
  delivery: parseJsonArray(row.delivery),
  audience: parseJsonArray(row.audience),
  status: row.status,
  featured: Boolean(row.featured)
});

export async function onRequest(context) {
  const { request, env } = context;

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
    const result = await env.DB.prepare(`
      SELECT
        id,
        slug,
        title,
        description,
        price,
        category,
        tags_json,
        delivery,
        audience,
        status,
        featured
      FROM products
      WHERE status = 'published'
      ORDER BY featured DESC, created_at DESC
    `).all();
    const rows = Array.isArray(result?.results) ? result.results : [];

    return json({
      ok: true,
      products: rows.map(mapProduct)
    });
  } catch {
    return json({
      ok: false,
      message: "Unable to read products. Please check the database binding and product table."
    }, { status: 500 });
  }
}
