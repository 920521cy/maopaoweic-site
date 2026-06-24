import { validateAdminRequest } from "../../shared/admin-auth.js";

const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    ...(init.headers || {})
  }
});

const mapCardKey = (row) => ({
  id: row.id,
  productTitle: row.product_title || "Unknown product",
  productId: row.product_id || "",
  keyMask: row.key_mask || "****-****-DEMO",
  status: row.status || "available",
  orderId: row.order_id || null,
  createdAt: row.created_at || "",
  soldAt: row.sold_at || null
});

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "GET") {
    return json({
      ok: false,
      error: "Method not allowed"
    }, { status: 405 });
  }

  const authResponse = validateAdminRequest(context);

  if (authResponse) {
    return authResponse;
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
        card_keys.id,
        card_keys.product_id,
        COALESCE(products.title, card_keys.product_id) AS product_title,
        card_keys.key_mask,
        card_keys.status,
        card_keys.order_id,
        card_keys.created_at,
        card_keys.sold_at
      FROM card_keys
      LEFT JOIN products ON products.id = card_keys.product_id
      ORDER BY card_keys.created_at DESC
      LIMIT 100
    `).all();
    const rows = Array.isArray(result?.results) ? result.results : [];

    return json({
      ok: true,
      cardKeys: rows.map(mapCardKey)
    });
  } catch {
    return json({
      ok: false,
      message: "Unable to read card key inventory. Please check the database binding and card_keys table."
    }, { status: 500 });
  }
}
