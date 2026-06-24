import { validateAdminRequest } from "../../shared/admin-auth.js";

const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    ...(init.headers || {})
  }
});

const mapReservation = (row, orderId, productTitle) => ({
  orderId,
  productTitle: productTitle || "Unknown product",
  cardKeyId: row.id,
  keyMask: row.key_mask || "****-****-DEMO",
  status: row.status || "reserved"
});

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
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
        orders.product_id,
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

    if (!["demo", "paid"].includes(order.status)) {
      return json({
        ok: false,
        message: "Only demo or paid orders can reserve demo card keys"
      }, { status: 400 });
    }

    const existingReservation = await env.DB.prepare(`
      SELECT id, key_mask, status
      FROM card_keys
      WHERE order_id = ? AND status = 'reserved'
      LIMIT 1
    `).bind(orderId).first();

    if (existingReservation) {
      return json({
        ok: true,
        message: "演示卡密库存已为该订单预留，当前不会发放真实卡密",
        reservation: mapReservation(existingReservation, orderId, order.product_title)
      });
    }

    const availableCardKey = await env.DB.prepare(`
      SELECT id, key_mask, status
      FROM card_keys
      WHERE product_id = ? AND status = 'available' AND order_id IS NULL
      ORDER BY created_at ASC
      LIMIT 1
    `).bind(order.product_id).first();

    if (!availableCardKey) {
      return json({
        ok: false,
        message: "No available demo card key for this product"
      }, { status: 409 });
    }

    const updateResult = await env.DB.prepare(`
      UPDATE card_keys
      SET status = 'reserved',
          order_id = ?
      WHERE id = ? AND status = 'available' AND order_id IS NULL
    `).bind(orderId, availableCardKey.id).run();

    if (Number(updateResult?.meta?.changes ?? 0) < 1) {
      return json({
        ok: false,
        message: "No available demo card key for this product"
      }, { status: 409 });
    }

    return json({
      ok: true,
      message: "演示卡密库存已为该订单预留，当前不会发放真实卡密",
      reservation: mapReservation({
        ...availableCardKey,
        status: "reserved"
      }, orderId, order.product_title)
    });
  } catch {
    return json({
      ok: false,
      message: "Unable to reserve demo card key. Please check the database binding and inventory table."
    }, { status: 500 });
  }
}
