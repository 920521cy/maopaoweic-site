const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    ...(init.headers || {})
  }
});

const toTrimmedString = (value, maxLength) => String(value ?? "").trim().slice(0, maxLength);

export async function onRequest({ request }) {
  if (request.method !== "POST") {
    return json({
      ok: false,
      error: "Method not allowed"
    }, { status: 405 });
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({
      ok: false,
      error: "Invalid JSON body"
    }, { status: 400 });
  }

  const name = toTrimmedString(body.name, 40);
  const email = toTrimmedString(body.email, 120);
  const content = toTrimmedString(body.content, 1000);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name) {
    return json({
      ok: false,
      error: "Name is required"
    }, { status: 400 });
  }

  if (!content) {
    return json({
      ok: false,
      error: "Content is required"
    }, { status: 400 });
  }

  if (email && !emailPattern.test(email)) {
    return json({
      ok: false,
      error: "Invalid email"
    }, { status: 400 });
  }

  return json({
    ok: true,
    message: "留言接口已接收，当前为演示提交，尚未接入数据库",
    received: {
      name,
      email,
      contentPreview: content.slice(0, 120),
      contentLength: content.length
    }
  });
}
