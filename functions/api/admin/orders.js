const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    ...(init.headers || {})
  }
});

const mapOrder = (row) => ({
  id: row.id,
  productTitle: row.product_title || "Unknown product",
  amount: Number(row.amount ?? 0),
  status: row.status,
  paymentProvider: row.payment_provider || "",
  createdAt: row.created_at,
  paidAt: row.paid_at || null
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
        orders.id,
        COALESCE(products.title, orders.product_id) AS product_title,
        orders.amount,
        orders.status,
        orders.payment_provider,
        orders.created_at,
        orders.paid_at
      FROM orders
      LEFT JOIN products ON products.id = orders.product_id
      ORDER BY orders.created_at DESC
      LIMIT 20
    `).all();
    const rows = Array.isArray(result?.results) ? result.results : [];

    return json({
      ok: true,
      orders: rows.map(mapOrder)
    });
  } catch {
    return json({
      ok: false,
      message: "Unable to read orders. Please check the database binding and order table."
    }, { status: 500 });
  }
}
