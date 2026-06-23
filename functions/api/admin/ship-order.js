const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    ...(init.headers || {})
  }
});

const mapShipment = (cardKey, order, shippedAt) => ({
  orderId: order.id,
  productTitle: order.product_title || "Unknown product",
  cardKeyId: cardKey.id,
  keyMask: cardKey.key_mask || "****-****-DEMO",
  orderStatus: "shipped",
  cardStatus: "sold",
  shippedAt
});

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
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

  let body;

  try {
    body = await request.json();
  } catch {
    return json({
      ok: false,
      message: "Invalid JSON request body"
    }, { status: 400 });
  }

  const orderId = String(body?.orderId || "").trim();

  if (!orderId) {
    return json({
      ok: false,
      message: "orderId is required"
    }, { status: 400 });
  }

  try {
    const order = await env.DB.prepare(`
      SELECT
        orders.id,
        orders.status,
        COALESCE(products.title, orders.product_id) AS product_title
      FROM orders
      LEFT JOIN products ON products.id = orders.product_id
      WHERE orders.id = ?
      LIMIT 1
    `).bind(orderId).first();

    if (!order) {
      return json({
        ok: false,
        message: "Order not found"
      }, { status: 404 });
    }

    const reservedCardKey = await env.DB.prepare(`
      SELECT id, key_mask, status
      FROM card_keys
      WHERE order_id = ? AND status = 'reserved'
      ORDER BY created_at ASC
      LIMIT 1
    `).bind(orderId).first();

    if (!reservedCardKey) {
      return json({
        ok: false,
        message: "No reserved demo card key for this order"
      }, { status: 409 });
    }

    const shippedAt = new Date().toISOString();
    const cardUpdate = await env.DB.prepare(`
      UPDATE card_keys
      SET status = 'sold',
          sold_at = ?
      WHERE id = ? AND status = 'reserved' AND order_id = ?
    `).bind(shippedAt, reservedCardKey.id, orderId).run();

    if (Number(cardUpdate?.meta?.changes ?? 0) < 1) {
      return json({
        ok: false,
        message: "No reserved demo card key for this order"
      }, { status: 409 });
    }

    await env.DB.prepare(`
      UPDATE orders
      SET status = 'shipped'
      WHERE id = ?
    `).bind(orderId).run();

    return json({
      ok: true,
      message: "演示发货已完成，当前不会显示或发送真实卡密",
      shipment: mapShipment(reservedCardKey, order, shippedAt)
    });
  } catch {
    return json({
      ok: false,
      message: "Unable to complete demo shipment. Please check the database binding and inventory table."
    }, { status: 500 });
  }
}
