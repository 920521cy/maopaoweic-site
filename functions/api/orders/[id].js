const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    ...(init.headers || {})
  }
});

const deliveryStatusByOrderStatus = {
  demo: "演示订单，未接入真实支付和发货",
  paid: "已支付，等待发货",
  shipped: "演示发货已完成，当前不会显示或发送真实卡密",
  canceled: "已取消"
};

const mapOrder = (row) => ({
  id: row.id,
  productTitle: row.product_title || "Unknown product",
  amount: Number(row.amount ?? 0),
  status: row.status,
  paymentProvider: row.payment_provider || "",
  createdAt: row.created_at,
  paidAt: row.paid_at || null,
  deliveryStatus: deliveryStatusByOrderStatus[row.status] || "订单状态待确认"
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

  const orderId = String(params?.id || "").trim();

  if (!orderId) {
    return json({
      ok: false,
      message: "Order not found"
    }, { status: 404 });
  }

  try {
    const order = await env.DB.prepare(`
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
      WHERE orders.id = ?
      LIMIT 1
    `).bind(orderId).first();

    if (!order) {
      return json({
        ok: false,
        message: "Order not found"
      }, { status: 404 });
    }

    return json({
      ok: true,
      order: mapOrder(order)
    });
  } catch {
    return json({
      ok: false,
      message: "Unable to read order detail. Please try again later."
    }, { status: 500 });
  }
}
