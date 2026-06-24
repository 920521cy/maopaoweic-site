import { validateAdminRequest } from "../../shared/admin-auth.js";

const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    ...(init.headers || {})
  }
});

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const parseJsonArray = (value) => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const stringifyArray = (value) => JSON.stringify(Array.isArray(value)
  ? value.map((item) => String(item || "").trim()).filter(Boolean)
  : []);

const normalizeArrayInput = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,，]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeFeaturedInput = (value) => value === true || value === 1 || value === "1" || value === "true";

const normalizeProductInput = (body = {}) => {
  const title = String(body.title || "").trim();
  const slug = String(body.slug || "").trim();
  const price = Number(body.price);
  const category = String(body.category || "").trim();

  return {
    id: String(body.id || "").trim(),
    title,
    slug,
    description: String(body.description || "").trim(),
    longDescription: String(body.longDescription || body.long_description || "").trim(),
    price,
    category,
    tags: normalizeArrayInput(body.tags),
    delivery: normalizeArrayInput(body.delivery),
    audience: normalizeArrayInput(body.audience),
    featured: normalizeFeaturedInput(body.featured)
  };
};

const validateProductInput = (product, { requireId = false } = {}) => {
  if (requireId && !product.id) {
    return "id is required";
  }

  if (!product.title) {
    return "title is required";
  }

  if (!product.slug) {
    return "slug is required";
  }

  if (!slugPattern.test(product.slug)) {
    return "slug can only contain lowercase letters, numbers, and hyphens";
  }

  if (!Number.isInteger(product.price) || product.price < 0) {
    return "price must be a non-negative integer";
  }

  if (!product.category) {
    return "category is required";
  }

  return "";
};

const createDraftProductId = (date = new Date()) => {
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
    .slice(0, 6);

  return `prod-draft-${day}-${randomPart}`;
};

const mapProduct = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description || "",
  longDescription: row.long_description || "",
  price: Number(row.price ?? 0),
  category: row.category || "",
  tags: parseJsonArray(row.tags_json),
  delivery: parseJsonArray(row.delivery),
  audience: parseJsonArray(row.audience),
  status: row.status || "draft",
  featured: Boolean(row.featured),
  createdAt: row.created_at || "",
  updatedAt: row.updated_at || ""
});

const readRequestBody = async (request) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const ensureSlugAvailable = async (db, slug, currentId = "") => {
  const row = await db.prepare(`
    SELECT id
    FROM products
    WHERE slug = ? AND id != ?
    LIMIT 1
  `).bind(slug, currentId).first();

  return !row;
};

export async function onRequest(context) {
  const { request, env } = context;

  if (!["GET", "POST", "PUT"].includes(request.method)) {
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

  if (request.method === "GET") {
    try {
      const result = await env.DB.prepare(`
        SELECT
          id,
          slug,
          title,
          description,
          long_description,
          price,
          category,
          tags_json,
          delivery,
          audience,
          status,
          featured,
          created_at,
          updated_at
        FROM products
        ORDER BY COALESCE(updated_at, created_at) DESC
      `).all();
      const rows = Array.isArray(result?.results) ? result.results : [];

      return json({
        ok: true,
        products: rows.map(mapProduct)
      });
    } catch {
      return json({
        ok: false,
        message: "Unable to read admin products. Please check the database binding and product table."
      }, { status: 500 });
    }
  }

  const body = await readRequestBody(request);

  if (!body) {
    return json({
      ok: false,
      message: "Invalid JSON request body"
    }, { status: 400 });
  }

  const requestedStatus = String(body.status || "").trim();

  if (requestedStatus && requestedStatus !== "draft") {
    return json({
      ok: false,
      message: "Product status changes are not allowed in this stage"
    }, { status: 400 });
  }

  const product = normalizeProductInput(body);
  const validationMessage = validateProductInput(product, { requireId: request.method === "PUT" });

  if (validationMessage) {
    return json({
      ok: false,
      message: validationMessage
    }, { status: 400 });
  }

  try {
    if (!(await ensureSlugAvailable(env.DB, product.slug, product.id))) {
      return json({
        ok: false,
        message: "slug already exists"
      }, { status: 409 });
    }

    const now = new Date().toISOString();
    const payload = {
      ...product,
      tagsJson: stringifyArray(product.tags),
      deliveryJson: stringifyArray(product.delivery),
      audienceJson: stringifyArray(product.audience),
      featuredValue: product.featured ? 1 : 0
    };

    if (request.method === "POST") {
      const id = createDraftProductId(new Date(now));

      await env.DB.prepare(`
        INSERT INTO products (
          id,
          slug,
          title,
          description,
          long_description,
          price,
          category,
          tags_json,
          delivery,
          audience,
          status,
          featured,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        payload.slug,
        payload.title,
        payload.description,
        payload.longDescription,
        payload.price,
        payload.category,
        payload.tagsJson,
        payload.deliveryJson,
        payload.audienceJson,
        "draft",
        payload.featuredValue,
        now,
        now
      ).run();

      const created = await env.DB.prepare(`
        SELECT
          id,
          slug,
          title,
          description,
          long_description,
          price,
          category,
          tags_json,
          delivery,
          audience,
          status,
          featured,
          created_at,
          updated_at
        FROM products
        WHERE id = ?
        LIMIT 1
      `).bind(id).first();

      return json({
        ok: true,
        message: "Product draft saved",
        product: mapProduct(created)
      });
    }

    const existing = await env.DB.prepare(`
      SELECT id, status
      FROM products
      WHERE id = ?
      LIMIT 1
    `).bind(payload.id).first();

    if (!existing) {
      return json({
        ok: false,
        message: "Product not found"
      }, { status: 404 });
    }

    if (existing.status !== "draft") {
      return json({
        ok: false,
        message: "Only draft products can be edited in this stage"
      }, { status: 400 });
    }

    await env.DB.prepare(`
      UPDATE products
      SET slug = ?,
          title = ?,
          description = ?,
          long_description = ?,
          price = ?,
          category = ?,
          tags_json = ?,
          delivery = ?,
          audience = ?,
          featured = ?,
          updated_at = ?
      WHERE id = ? AND status = 'draft'
    `).bind(
      payload.slug,
      payload.title,
      payload.description,
      payload.longDescription,
      payload.price,
      payload.category,
      payload.tagsJson,
      payload.deliveryJson,
      payload.audienceJson,
      payload.featuredValue,
      now,
      payload.id
    ).run();

    const updated = await env.DB.prepare(`
      SELECT
        id,
        slug,
        title,
        description,
        long_description,
        price,
        category,
        tags_json,
        delivery,
        audience,
        status,
        featured,
        created_at,
        updated_at
      FROM products
      WHERE id = ?
      LIMIT 1
    `).bind(payload.id).first();

    return json({
      ok: true,
      message: "Product draft saved",
      product: mapProduct(updated)
    });
  } catch {
    return json({
      ok: false,
      message: "Unable to save product draft. Please check the database binding and product table."
    }, { status: 500 });
  }
}
