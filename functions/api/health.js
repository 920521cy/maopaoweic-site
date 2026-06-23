const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    ...(init.headers || {})
  }
});

export async function onRequest({ request }) {
  if (request.method !== "GET") {
    return json({
      ok: false,
      error: "Method not allowed"
    }, { status: 405 });
  }

  return json({
    ok: true,
    service: "maopaoweic-site-api",
    version: "v0.3.0",
    message: "API is running",
    timestamp: new Date().toISOString()
  });
}
