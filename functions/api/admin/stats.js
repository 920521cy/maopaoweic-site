const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    ...(init.headers || {})
  }
});

const firstCount = async (db, sql) => {
  const row = await db.prepare(sql).first();
  return Number(row?.count ?? 0);
};

const statusCounts = async (db, sql) => {
  const result = await db.prepare(sql).all();
  const rows = Array.isArray(result?.results) ? result.results : [];

  return rows.reduce((counts, row) => {
    const status = String(row?.status || "unknown");
    counts[status] = Number(row?.count ?? 0);
    return counts;
  }, {});
};

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
      message: "D1 binding DB is not configured"
    }, { status: 503 });
  }

  try {
    const [
      productCount,
      orderCount,
      cardKeyCount,
      adminLogCount,
      cardKeyStatus,
      orderStatus
    ] = await Promise.all([
      firstCount(env.DB, "SELECT COUNT(*) AS count FROM products"),
      firstCount(env.DB, "SELECT COUNT(*) AS count FROM orders"),
      firstCount(env.DB, "SELECT COUNT(*) AS count FROM card_keys"),
      firstCount(env.DB, "SELECT COUNT(*) AS count FROM admin_logs"),
      statusCounts(env.DB, "SELECT status, COUNT(*) AS count FROM card_keys GROUP BY status ORDER BY status"),
      statusCounts(env.DB, "SELECT status, COUNT(*) AS count FROM orders GROUP BY status ORDER BY status")
    ]);

    return json({
      ok: true,
      service: "maopaoweic-site-admin",
      version: "v0.3.2",
      stats: {
        totals: {
          products: productCount,
          orders: orderCount,
          cardKeys: cardKeyCount,
          adminLogs: adminLogCount
        },
        cardKeyStatus,
        orderStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch {
    return json({
      ok: false,
      service: "maopaoweic-site-admin",
      version: "v0.3.2",
      message: "Unable to read D1 database statistics. Please check the database binding and table schema."
    }, { status: 500 });
  }
}
