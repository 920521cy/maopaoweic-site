const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    ...(init.headers || {})
  }
});

export const validateAdminRequest = (context) => {
  const configuredKey = String(context?.env?.ADMIN_API_KEY || "").trim();

  if (!configuredKey) {
    return json({
      ok: false,
      message: "Admin API key is not configured"
    }, { status: 503 });
  }

  const requestKey = String(context?.request?.headers?.get("x-admin-key") || "").trim();

  if (!requestKey || requestKey !== configuredKey) {
    return json({
      ok: false,
      message: "Unauthorized"
    }, { status: 401 });
  }

  return null;
};
