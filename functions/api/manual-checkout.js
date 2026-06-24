const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    ...(init.headers || {})
  }
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedPaymentMethods = new Set(["alipay", "wechat", "manual"]);

const createOrderId = (date = new Date()) => {
  const day = date.toISOString().slice(0, 10).replace(/-/g, "");
  const bytes = new Uint8Array(4);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  const randomPart = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 6)
    .toUpperCase();

  return `LAB-${day}-${randomPart}`;
};

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

  const productSlug = String(body?.productSlug || "").trim();
  const customerEmail = String(body?.customerEmail || "").trim();
  const paymentMethod = String(body?.paymentMethod || "manual").trim() || "manual";

  if (!productSlug) {
    return json({
      ok: false,
      message: "productSlug is required"
    }, { status: 400 });
  }

  if (customerEmail && !emailPattern.test(customerEmail)) {
    return json({
      ok: false,
      message: "Invalid customerEmail"
    }, { status: 400 });
  }

  if (!allowedPaymentMethods.has(paymentMethod)) {
    return json({
      ok: false,
      message: "Invalid paymentMethod"
    }, { status: 400 });
  }

  try {
    const product = await env.DB.prepare(`
      SELECT id, title, price
      FROM products
      WHERE slug = ? AND status = 'published'
      LIMIT 1
    `).bind(productSlug).first();

    if (!product) {
      return json({
        ok: false,
        message: "Product not found"
      }, { status: 404 });
    }

    const createdAt = new Date().toISOString();
    const orderId = createOrderId(new Date(createdAt));
    const amount = Number(product.price ?? 0);

    await env.DB.prepare(`
      INSERT INTO orders (
        id,
        product_id,
        customer_email,
        amount,
        status,
        payment_provider,
        payment_id,
        created_at,
        paid_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId,
      product.id,
      customerEmail,
      amount,
      "pending",
      "manual",
      paymentMethod,
      createdAt,
      null
    ).run();

    return json({
      ok: true,
      message: "人工收款订单已创建，请按页面提示完成付款并备注订单号",
      order: {
        id: orderId,
        productTitle: product.title,
        amount,
        status: "pending",
        paymentProvider: "manual",
        paymentMethod,
        createdAt
      },
      paymentUrl: `/payment.html?id=${encodeURIComponent(orderId)}`
    });
  } catch {
    return json({
      ok: false,
      message: "Unable to create manual payment order. Please try again later."
    }, { status: 500 });
  }
}
