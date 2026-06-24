import { validateAdminRequest } from "../../shared/admin-auth.js";

const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    ...(init.headers || {})
  }
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
      SELECT id, status
      FROM orders
      WHERE id = ?
      LIMIT 1
    `).bind(orderId).first();

    if (!order) {
      return json({
        ok: false,
        message: "Order not found"
      }, { status: 404 });
    }

    if (order.status !== "pending") {
      return json({
        ok: false,
        message: "Only pending orders can be marked as paid"
      }, { status: 400 });
    }

    const paidAt = new Date().toISOString();
    const updateResult = await env.DB.prepare(`
      UPDATE orders
      SET status = 'paid',
          paid_at = ?,
          payment_provider = 'manual'
      WHERE id = ? AND status = 'pending'
    `).bind(paidAt, orderId).run();

    if (Number(updateResult?.meta?.changes ?? 0) < 1) {
      return json({
        ok: false,
        message: "Only pending orders can be marked as paid"
      }, { status: 400 });
    }

    return json({
      ok: true,
      message: "订单已标记为人工已支付",
      order: {
        id: orderId,
        status: "paid",
        paidAt
      }
    });
  } catch {
    return json({
      ok: false,
      message: "Unable to mark order as paid. Please check the database binding and order table."
    }, { status: 500 });
  }
}
