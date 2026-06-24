const PAY_PLATFORM_URL = "https://pay.ldxp.cn/shop/TYZ9LG9R";

const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    ...(init.headers || {})
  }
});

export async function onRequest(context) {
  const { request } = context;

  if (request.method !== "POST") {
    return json({
      ok: false,
      error: "Method not allowed"
    }, { status: 405 });
  }

  return json({
    ok: false,
    message: "当前已切换为自动发货平台下单，本站不再创建自建演示订单。",
    payUrl: PAY_PLATFORM_URL
  }, { status: 410 });
}
