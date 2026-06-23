const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    ...(init.headers || {})
  }
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
      service: "maopaoweic-site-db",
      version: "v0.3.1",
      message: "D1 binding DB is not configured"
    }, { status: 503 });
  }

  try {
    const result = await env.DB.prepare("SELECT 1 AS alive").first();

    return json({
      ok: true,
      service: "maopaoweic-site-db",
      version: "v0.3.1",
      message: "D1 is connected",
      result,
      timestamp: new Date().toISOString()
    });
  } catch {
    return json({
      ok: false,
      service: "maopaoweic-site-db",
      version: "v0.3.1",
      message: "D1 health check failed"
    }, { status: 500 });
  }
}
