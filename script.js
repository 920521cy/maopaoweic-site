const year = document.querySelector("#year");
const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelector(".nav-links");
const navItems = document.querySelectorAll(".nav-links a");
const sections = document.querySelectorAll("main section[id]");
const clothLabRoot = document.querySelector("[data-cloth-lab]");
const siteData = window.SITE_DATA || {};
const products = Array.isArray(siteData.products) ? siteData.products : [];
const demoOrders = Array.isArray(siteData.demoOrders) ? siteData.demoOrders : [];
const demoCards = Array.isArray(siteData.demoCards) ? siteData.demoCards : [];
const ADMIN_KEY_STORAGE_KEY = "maopaoweic.adminKey";
const ADMIN_AUTH_REQUIRED_MESSAGE = "需要管理员访问口令后才能读取真实后台数据。";
const ADMIN_PRODUCT_AUTH_REQUIRED_MESSAGE = "需要管理员访问口令后才能读取后台商品管理数据。";
const ADMIN_AUTH_INVALID_MESSAGE = "管理员访问口令不正确，请重新输入。";
const ADMIN_CONFIG_REQUIRED_MESSAGE = "Cloudflare 尚未配置 ADMIN_API_KEY。";
const ADMIN_AUTH_SAVED_MESSAGE = "管理员口令已保存到当前会话，关闭浏览器后失效。";
const ADMIN_AUTH_CLEARED_MESSAGE = "管理员口令已清除。";
let adminProductDrafts = [];
let editingAdminProductId = "";
const ADMIN_ACCESS_STATES = {
  unauthorized: {
    label: "未授权",
    message: ADMIN_AUTH_REQUIRED_MESSAGE
  },
  authorized: {
    label: "已授权，仅当前浏览器会话有效",
    message: ADMIN_AUTH_SAVED_MESSAGE
  },
  invalid: {
    label: "口令错误",
    message: ADMIN_AUTH_INVALID_MESSAGE
  },
  unconfigured: {
    label: "后台密钥未配置",
    message: ADMIN_CONFIG_REQUIRED_MESSAGE
  }
};

const getStoredAdminKey = () => {
  try {
    return String(window.sessionStorage?.getItem(ADMIN_KEY_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
};

const saveStoredAdminKey = (value) => {
  try {
    window.sessionStorage?.setItem(ADMIN_KEY_STORAGE_KEY, String(value || "").trim());
  } catch {
    // Ignore storage failures so the static admin page remains usable.
  }
};

const clearStoredAdminKey = () => {
  try {
    window.sessionStorage?.removeItem(ADMIN_KEY_STORAGE_KEY);
  } catch {
    // Ignore storage failures so the static admin page remains usable.
  }
};

const hasStoredAdminKey = () => Boolean(getStoredAdminKey());

const setAdminAccessState = (state = "unauthorized", message) => {
  const status = document.querySelector("[data-admin-access-status]");
  const statusMessage = document.querySelector("[data-admin-access-message]");
  const config = ADMIN_ACCESS_STATES[state] || ADMIN_ACCESS_STATES.unauthorized;

  if (status) {
    status.textContent = config.label;
    status.dataset.state = state;
    status.className = `admin-access-status admin-access-status-${state}`;
  }

  if (statusMessage) {
    statusMessage.textContent = message || config.message;
  }
};

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
})[char]);

const renderTagList = (tags = []) => tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

const renderListItems = (items = []) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

const parseArrayValue = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string" || !value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatProductPrice = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `¥${value}`;
  }

  const text = String(value ?? "").trim();

  if (!text) {
    return "¥0";
  }

  return text.startsWith("¥") ? text : `¥${text}`;
};

const normalizeProductFromApi = (product = {}) => ({
  id: product.id || "",
  slug: product.slug || "",
  title: product.title || "",
  description: product.description || "",
  longDescription: product.longDescription || product.long_description || "",
  price: formatProductPrice(product.price),
  tags: parseArrayValue(product.tags),
  category: product.category || "",
  delivery: parseArrayValue(product.delivery),
  audience: parseArrayValue(product.audience),
  status: product.status || "published",
  featured: Boolean(product.featured)
});

const loadProductsFromApi = async () => {
  if (!window.fetch) {
    return null;
  }

  try {
    const response = await fetch("/api/products", {
      headers: {
        Accept: "application/json"
      }
    });
    const data = await response.json();

    if (!response.ok || data?.ok !== true || !Array.isArray(data.products)) {
      return null;
    }

    return data.products.map(normalizeProductFromApi);
  } catch {
    return null;
  }
};

const loadProductDetailFromApi = async (slug) => {
  if (!slug || !window.fetch) {
    return null;
  }

  try {
    const response = await fetch(`/api/products/${encodeURIComponent(slug)}`, {
      headers: {
        Accept: "application/json"
      }
    });
    const data = await response.json();

    if (!response.ok || data?.ok !== true || !data.product) {
      return null;
    }

    return normalizeProductFromApi(data.product);
  } catch {
    return null;
  }
};

const normalizeOrderFromApi = (order = {}) => ({
  id: order.id || "",
  productTitle: order.productTitle || "未知商品",
  amount: formatProductPrice(order.amount),
  status: order.status || "demo",
  paymentProvider: order.paymentProvider || "demo",
  paymentMethod: order.paymentMethod || "",
  createdAt: order.createdAt || "",
  paidAt: order.paidAt || null,
  cardStatus: order.cardStatus || null,
  reservedCardKeyId: order.reservedCardKeyId || null
});

const createDemoOrder = async (productSlug) => {
  if (!productSlug || !window.fetch) {
    return null;
  }

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ productSlug })
    });
    const data = await response.json();

    if (!response.ok || data?.ok !== true || !data.order) {
      return null;
    }

    return {
      message: data.message || "演示订单已创建，当前未接入真实支付",
      order: normalizeOrderFromApi(data.order)
    };
  } catch {
    return null;
  }
};

const createManualCheckoutOrder = async (productSlug, paymentMethod = "manual") => {
  if (!productSlug || !window.fetch) {
    return null;
  }

  try {
    const response = await fetch("/api/manual-checkout", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ productSlug, paymentMethod })
    });
    const data = await response.json();

    if (!response.ok || data?.ok !== true || !data.order) {
      return null;
    }

    return {
      message: data.message || "人工收款订单已创建，请按页面提示完成付款并备注订单号",
      order: normalizeOrderFromApi(data.order),
      paymentUrl: data.paymentUrl || `/payment.html?id=${encodeURIComponent(data.order.id)}`
    };
  } catch {
    return null;
  }
};

const fetchAdminJson = async (url, options = {}) => {
  const adminKey = getStoredAdminKey();

  if (!adminKey) {
    setAdminAccessState("unauthorized");
    return {
      ok: false,
      status: 0,
      authRequired: true,
      data: null
    };
  }

  if (!window.fetch) {
    return null;
  }

  try {
    const headers = new Headers(options.headers || {});
    headers.set("Accept", headers.get("Accept") || "application/json");
    headers.set("x-admin-key", adminKey);

    const response = await fetch(url, {
      ...options,
      headers
    });
    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (response.status === 401) {
      showToast("管理员访问口令不正确");
      setAdminAccessState("invalid");
    }

    if (response.status === 503) {
      showToast("后台管理密钥尚未配置");
      setAdminAccessState("unconfigured");
    }

    if (response.ok && data?.ok === true) {
      setAdminAccessState("authorized");
    }

    return {
      ok: response.ok && data?.ok === true,
      status: response.status,
      data
    };
  } catch {
    return null;
  }
};

const normalizeAdminProductFromApi = (product = {}) => ({
  id: product.id || "",
  slug: product.slug || "",
  title: product.title || "",
  description: product.description || "",
  longDescription: product.longDescription || product.long_description || "",
  price: Number(product.price ?? 0),
  tags: parseArrayValue(product.tags),
  category: product.category || "",
  delivery: parseArrayValue(product.delivery),
  audience: parseArrayValue(product.audience),
  status: product.status || "draft",
  featured: Boolean(product.featured),
  createdAt: product.createdAt || product.created_at || "",
  updatedAt: product.updatedAt || product.updated_at || ""
});

const loadAdminProductsFromApi = async () => {
  const result = await fetchAdminJson("/api/admin/products");

  if (!result?.ok || !Array.isArray(result.data?.products)) {
    return result;
  }

  return {
    ok: true,
    products: result.data.products.map(normalizeAdminProductFromApi)
  };
};

const saveAdminProductDraft = async (payload, productId = "") => {
  const result = await fetchAdminJson("/api/admin/products", {
    method: productId ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(productId ? { ...payload, id: productId } : payload)
  });

  if (!result?.ok || !result.data?.product) {
    return {
      ok: false,
      status: result?.status,
      message: result?.data?.message || "Unable to save product draft"
    };
  }

  return {
    ok: true,
    product: normalizeAdminProductFromApi(result.data.product),
    message: result.data.message || "Product draft saved"
  };
};

const loadAdminOrdersFromApi = async () => {
  const result = await fetchAdminJson("/api/admin/orders");

  if (!result?.ok || !Array.isArray(result.data?.orders)) {
    return result;
  }

  return {
    ok: true,
    orders: result.data.orders.map(normalizeOrderFromApi)
  };
};

const normalizeCardKeyFromApi = (card = {}) => ({
  id: card.id || "",
  productTitle: card.productTitle || "未知商品",
  productId: card.productId || "",
  keyMask: card.keyMask || "****-****-DEMO",
  status: card.status || "available",
  orderId: card.orderId || null,
  createdAt: card.createdAt || "",
  soldAt: card.soldAt || null
});

const normalizeDemoCard = (card = {}) => ({
  id: card.id || "",
  productTitle: card.productTitle || "演示商品",
  productId: "",
  keyMask: card.maskedCode || "****-****-DEMO",
  status: card.status || "演示库存",
  orderId: null,
  createdAt: card.note || "本地演示数据",
  soldAt: null
});

const loadAdminCardKeysFromApi = async () => {
  const result = await fetchAdminJson("/api/admin/card-keys");

  if (!result?.ok || !Array.isArray(result.data?.cardKeys)) {
    return result;
  }

  return {
    ok: true,
    cardKeys: result.data.cardKeys.map(normalizeCardKeyFromApi)
  };
};

const reserveDemoCardForOrder = async (orderId) => {
  const normalizedOrderId = String(orderId || "").trim();

  if (!normalizedOrderId || !window.fetch) {
    return null;
  }

  const result = await fetchAdminJson("/api/admin/reserve-card", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ orderId: normalizedOrderId })
  });

  if (result?.ok && result.data?.reservation) {
    return {
      ok: true,
      message: result.data.message || "演示卡密库存已为该订单预留，当前不会发放真实卡密",
      reservation: result.data.reservation
    };
  }

  return {
    ok: false,
    status: result?.status,
    message: result?.data?.message || "Unable to reserve demo card key"
  };
};

const shipDemoOrder = async (orderId) => {
  const normalizedOrderId = String(orderId || "").trim();

  if (!normalizedOrderId || !window.fetch) {
    return null;
  }

  const result = await fetchAdminJson("/api/admin/ship-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ orderId: normalizedOrderId })
  });

  if (result?.ok && result.data?.shipment) {
    return {
      ok: true,
      message: result.data.message || "演示发货已完成，当前不会显示或发送真实卡密",
      shipment: result.data.shipment
    };
  }

  return {
    ok: false,
    status: result?.status,
    message: result?.data?.message || "Unable to complete demo shipment"
  };
};

const markOrderAsPaid = async (orderId) => {
  const normalizedOrderId = String(orderId || "").trim();

  if (!normalizedOrderId || !window.fetch) {
    return null;
  }

  const result = await fetchAdminJson("/api/admin/mark-paid", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ orderId: normalizedOrderId })
  });

  if (result?.ok && result.data?.order) {
    return {
      ok: true,
      message: result.data.message || "订单已标记为人工已支付",
      order: result.data.order
    };
  }

  return {
    ok: false,
    status: result?.status,
    message: result?.data?.message || "Unable to mark order as paid"
  };
};

const fetchOrderDetail = async (orderId) => {
  const normalizedOrderId = String(orderId || "").trim();

  if (!normalizedOrderId || !window.fetch) {
    return null;
  }

  try {
    const response = await fetch(`/api/orders/${encodeURIComponent(normalizedOrderId)}`, {
      headers: {
        Accept: "application/json"
      }
    });
    const data = await response.json();

    if (response.status === 404) {
      return { notFound: true };
    }

    if (!response.ok || data?.ok !== true || !data.order) {
      return null;
    }

    return {
      order: {
        ...normalizeOrderFromApi(data.order),
        deliveryStatus: data.order.deliveryStatus || "订单状态待确认"
      }
    };
  } catch {
    return null;
  }
};

const renderProductCard = (product) => `
  <article class="product-card${product.featured ? " featured" : ""}">
    <div class="card-topline">
      <span>${escapeHtml(product.category)}</span>
      <strong>${escapeHtml(product.price)}</strong>
    </div>
    <h3>${escapeHtml(product.title)}</h3>
    <p>${escapeHtml(product.description)}</p>
    <div class="tag-list">
      ${renderTagList(product.tags)}
    </div>
    <a class="button secondary compact-button" href="/product.html?slug=${encodeURIComponent(product.slug)}">查看详情</a>
  </article>
`;

const renderDemoOrderCard = (order) => `
  <article class="demo-order-card">
    <span class="status-pill order-status-pill">${escapeHtml(order.status || "demo")}</span>
    <h2>演示订单已创建</h2>
    <p>订单号：<strong>${escapeHtml(order.id)}</strong></p>
    <p>商品名：${escapeHtml(order.productTitle)}</p>
    <p>金额：${escapeHtml(order.amount || "¥0")}</p>
    <p>当前未接入真实支付，不会发放卡密。</p>
    <div class="demo-order-actions">
      <button class="button secondary compact-button" type="button" data-copy-order-id="${escapeHtml(order.id)}">复制订单号</button>
      <a class="button secondary compact-button" href="/order.html?id=${encodeURIComponent(order.id)}">查看订单</a>
    </div>
  </article>
`;

const renderDemoButton = (label, message) => `
  <button class="button secondary compact-button" type="button" data-demo-action="${escapeHtml(message)}">${escapeHtml(label)}</button>
`;

const statusClassName = (value) => String(value || "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const renderAdminStatus = (value) => {
  const statusClass = statusClassName(value);
  return `<span class="status-pill${statusClass ? ` admin-status-${statusClass}` : ""}">${escapeHtml(value || "演示数据")}</span>`;
};

const renderAdminProductRows = (items = products, sourceLabel = "本地演示数据") => {
  if (!items.length) {
    return `<tr><td colspan="8">暂无商品数据。</td></tr>`;
  }

  return items.map((product) => {
    const status = String(product.status || "").toLowerCase();
    const isDraft = status === "draft";
    const statusNote = isDraft ? "草稿，不在前台显示" : "已发布，前台可见";

    return `
      <tr>
        <td>
          <strong>${escapeHtml(product.title)}</strong>
          <small>${escapeHtml(product.slug)}</small>
        </td>
        <td>${escapeHtml(formatProductPrice(product.price))}</td>
        <td>${escapeHtml(product.category)}</td>
        <td>
          ${renderAdminStatus(product.status)}
          <small>${escapeHtml(statusNote)}</small>
        </td>
        <td>
          <span class="status-pill admin-featured-pill${product.featured ? " is-featured" : ""}">
            ${product.featured ? "推荐" : "普通"}
          </span>
        </td>
        <td><div class="tag-list admin-tags">${renderTagList(product.tags)}</div></td>
        <td><span class="status-pill admin-source-pill">${escapeHtml(sourceLabel)}</span></td>
        <td>
          <div class="admin-actions">
            ${isDraft ? `<button class="button secondary compact-button" type="button" data-edit-product-draft="${escapeHtml(product.id)}">编辑草稿</button>` : `<span class="status-pill admin-source-pill">只读</span>`}
          </div>
        </td>
      </tr>
    `;
  }).join("");
};

const renderAdminProductDraftForm = () => `
  <div class="admin-product-draft-header">
    <div>
      <p class="eyebrow">Draft Product</p>
      <h3 data-admin-product-form-title>新增商品草稿</h3>
      <p>草稿不会出现在前台商品列表或详情页，本阶段不提供发布、删除或下架。</p>
    </div>
    <span class="api-status-pill" data-state="offline">保存为 draft</span>
  </div>
  <form class="admin-product-form" data-admin-product-form>
    <input type="hidden" name="id" data-admin-product-id>
    <label>
      <span>商品标题</span>
      <input type="text" name="title" autocomplete="off" required>
    </label>
    <label>
      <span>slug</span>
      <input type="text" name="slug" autocomplete="off" placeholder="demo-product-slug" required>
    </label>
    <label>
      <span>价格</span>
      <input type="number" name="price" min="0" step="1" inputmode="numeric" required>
    </label>
    <label>
      <span>分类</span>
      <input type="text" name="category" autocomplete="off" required>
    </label>
    <label class="admin-product-form-wide">
      <span>简介</span>
      <textarea name="description" rows="3"></textarea>
    </label>
    <label class="admin-product-form-wide">
      <span>详细介绍</span>
      <textarea name="longDescription" rows="4"></textarea>
    </label>
    <label class="admin-product-form-wide">
      <span>标签，逗号分隔</span>
      <input type="text" name="tags" placeholder="AI, 自动化, 模板">
    </label>
    <label class="admin-product-form-wide">
      <span>交付方式</span>
      <textarea name="delivery" rows="3" placeholder="逗号或换行分隔"></textarea>
    </label>
    <label class="admin-product-form-wide">
      <span>适合人群</span>
      <textarea name="audience" rows="3" placeholder="逗号或换行分隔"></textarea>
    </label>
    <label class="admin-product-featured">
      <input type="checkbox" name="featured">
      <span>推荐商品</span>
    </label>
    <div class="admin-product-form-actions">
      <button class="button primary compact-button" type="submit" data-admin-product-submit>保存商品草稿</button>
      <button class="button secondary compact-button" type="button" data-admin-product-reset>取消编辑</button>
    </div>
    <p class="admin-empty-state" data-admin-product-form-message>填写后保存为草稿，不会发布到前台。</p>
  </form>
`;

const renderAdminProductDraftLocked = () => `
  <div class="admin-db-state">
    <p>${escapeHtml(ADMIN_PRODUCT_AUTH_REQUIRED_MESSAGE)}</p>
  </div>
`;

const splitAdminProductList = (value) => String(value || "")
  .split(/[\n,，]/)
  .map((item) => item.trim())
  .filter(Boolean);

const joinAdminProductList = (items = []) => (Array.isArray(items) ? items : []).join(", ");

const resetAdminProductDraftForm = () => {
  const form = document.querySelector("[data-admin-product-form]");
  const title = document.querySelector("[data-admin-product-form-title]");
  const message = document.querySelector("[data-admin-product-form-message]");

  editingAdminProductId = "";

  if (form) {
    form.reset();
    const idInput = form.querySelector("[data-admin-product-id]");

    if (idInput) {
      idInput.value = "";
    }
  }

  if (title) {
    title.textContent = "新增商品草稿";
  }

  if (message) {
    message.textContent = "填写后保存为草稿，不会发布到前台。";
  }
};

const fillAdminProductDraftForm = (product) => {
  const form = document.querySelector("[data-admin-product-form]");
  const title = document.querySelector("[data-admin-product-form-title]");
  const message = document.querySelector("[data-admin-product-form-message]");

  if (!form || !product) {
    return;
  }

  editingAdminProductId = product.id || "";
  form.elements.id.value = product.id || "";
  form.elements.title.value = product.title || "";
  form.elements.slug.value = product.slug || "";
  form.elements.price.value = Number(product.price ?? 0);
  form.elements.category.value = product.category || "";
  form.elements.description.value = product.description || "";
  form.elements.longDescription.value = product.longDescription || "";
  form.elements.tags.value = joinAdminProductList(product.tags);
  form.elements.delivery.value = joinAdminProductList(product.delivery);
  form.elements.audience.value = joinAdminProductList(product.audience);
  form.elements.featured.checked = Boolean(product.featured);

  if (title) {
    title.textContent = "编辑商品草稿";
  }

  if (message) {
    message.textContent = "正在编辑草稿，保存后仍不会发布到前台。";
  }

  form.scrollIntoView({ behavior: "smooth", block: "start" });
};

const collectAdminProductDraftPayload = (form) => ({
  title: String(form.elements.title?.value || "").trim(),
  slug: String(form.elements.slug?.value || "").trim(),
  price: Number(form.elements.price?.value),
  category: String(form.elements.category?.value || "").trim(),
  description: String(form.elements.description?.value || "").trim(),
  longDescription: String(form.elements.longDescription?.value || "").trim(),
  tags: splitAdminProductList(form.elements.tags?.value),
  delivery: splitAdminProductList(form.elements.delivery?.value),
  audience: splitAdminProductList(form.elements.audience?.value),
  featured: Boolean(form.elements.featured?.checked)
});

const setAdminProductFormShell = (content) => {
  const shell = document.querySelector("[data-admin-product-form-shell]");

  if (shell) {
    shell.innerHTML = content;
  }
};

const renderAdminProductManagement = async () => {
  const tableBody = document.querySelector("[data-admin-product-rows]");
  const sourceStatus = document.querySelector("[data-admin-product-source]");

  if (!tableBody) {
    return;
  }

  if (!hasStoredAdminKey()) {
    adminProductDrafts = [];
    editingAdminProductId = "";
    setAdminProductFormShell(renderAdminProductDraftLocked());
    tableBody.innerHTML = `<tr><td colspan="8">${ADMIN_PRODUCT_AUTH_REQUIRED_MESSAGE}</td></tr>`;

    if (sourceStatus) {
      sourceStatus.textContent = "未授权：需要管理员访问口令";
      sourceStatus.dataset.state = "offline";
    }

    return;
  }

  setAdminProductFormShell(renderAdminProductDraftForm());

  const result = await loadAdminProductsFromApi();

  if (!result?.ok) {
    const message = getAdminUnavailableMessage(result);
    tableBody.innerHTML = `<tr><td colspan="8">${escapeHtml(message)}</td></tr>`;

    if (sourceStatus) {
      sourceStatus.textContent = message;
      sourceStatus.dataset.state = result?.status === 503 ? "unbound" : "offline";
    }

    return;
  }

  adminProductDrafts = result.products.filter((product) => product.status === "draft");
  tableBody.innerHTML = renderAdminProductRows(result.products, "D1 商品数据");

  if (sourceStatus) {
    sourceStatus.textContent = "当前显示：D1 商品数据";
    sourceStatus.dataset.state = "connected";
  }
};

const getAdminUnavailableMessage = (result) => {
  if (result?.authRequired) {
    return ADMIN_AUTH_REQUIRED_MESSAGE;
  }

  if (result?.status === 503) {
    return ADMIN_CONFIG_REQUIRED_MESSAGE;
  }

  if (result?.status === 401) {
    return ADMIN_AUTH_INVALID_MESSAGE;
  }

  return "后台数据暂时不可用，请稍后再试";
};

const renderAdminOrderRows = (items = demoOrders, sourceLabel = "本地演示订单") => {
  if (!items.length) {
    return `<tr><td colspan="7">暂无订单数据。</td></tr>`;
  }

  const statusNotes = {
    pending: "等待人工付款确认",
    paid: "已确认付款，等待后台处理",
    shipped: "已处理完成",
    demo: "演示订单"
  };

  return items.map((order) => {
    const normalizedStatus = String(order.status || "").trim().toLowerCase();
    const normalizedCardStatus = String(order.cardStatus || "").trim().toLowerCase();
    const isD1Order = sourceLabel === "D1 订单数据";
    const canMarkPaid = isD1Order && normalizedStatus === "pending";
    const canReserveCard = isD1Order
      && ["demo", "paid"].includes(normalizedStatus)
      && !["reserved", "sold"].includes(normalizedCardStatus);
    const canShipOrder = isD1Order
      && ["demo", "paid"].includes(normalizedStatus)
      && normalizedCardStatus === "reserved";
    const isShipped = normalizedStatus === "shipped";

    return `
      <tr>
        <td><strong>${escapeHtml(order.id)}</strong></td>
        <td>${escapeHtml(order.productTitle)}</td>
        <td>${escapeHtml(order.amount || "¥0")}</td>
        <td>
          ${renderAdminStatus(order.status)}
          <small>${escapeHtml(statusNotes[normalizedStatus] || "订单状态待确认")}</small>
        </td>
        <td>${escapeHtml(order.createdAt || "待接入订单系统")}</td>
        <td><span class="status-pill admin-source-pill">${escapeHtml(sourceLabel)}</span></td>
        <td>
          <div class="admin-actions">
            <a class="button secondary compact-button" href="/order.html?id=${encodeURIComponent(order.id)}">查看订单</a>
            ${canMarkPaid ? `<button class="button secondary compact-button" type="button" data-mark-paid-order="${escapeHtml(order.id)}" data-order-id="${escapeHtml(order.id)}">标记已支付</button>` : ""}
            ${canReserveCard ? `<button class="button secondary compact-button" type="button" data-reserve-card-order="${escapeHtml(order.id)}" data-order-id="${escapeHtml(order.id)}">预留卡密</button>` : ""}
            ${canShipOrder ? `<button class="button secondary compact-button" type="button" data-ship-order="${escapeHtml(order.id)}" data-order-id="${escapeHtml(order.id)}">演示发货</button>` : ""}
            ${isShipped ? `<span class="status-pill admin-status-shipped">已演示发货</span>` : ""}
          </div>
        </td>
      </tr>
    `;
  }).join("");
};

const renderAdminOrderManagement = async () => {
  const tableBody = document.querySelector("[data-admin-order-rows]");
  const sourceStatus = document.querySelector("[data-admin-order-source]");

  if (!tableBody) {
    return;
  }

  if (!hasStoredAdminKey()) {
    setAdminAccessState("unauthorized");
    tableBody.innerHTML = `<tr><td colspan="7">${ADMIN_AUTH_REQUIRED_MESSAGE}</td></tr>`;

    if (sourceStatus) {
      sourceStatus.textContent = ADMIN_AUTH_REQUIRED_MESSAGE;
      sourceStatus.dataset.state = "offline";
    }

    return;
  }

  const result = await loadAdminOrdersFromApi();

  if (!result?.ok) {
    const message = getAdminUnavailableMessage(result);
    tableBody.innerHTML = `<tr><td colspan="7">${escapeHtml(message)}</td></tr>`;

    if (sourceStatus) {
      sourceStatus.textContent = message;
      sourceStatus.dataset.state = result?.status === 503 ? "unbound" : "offline";
    }

    return;
  }

  tableBody.innerHTML = renderAdminOrderRows(result.orders, "D1 订单数据");

  if (sourceStatus) {
    sourceStatus.textContent = "当前显示：D1 订单数据";
    sourceStatus.dataset.state = "connected";
  }
};

const renderAdminCardRows = (items = demoCards.map(normalizeDemoCard), sourceLabel = "本地演示卡密") => {
  if (!items.length) {
    return `<tr><td colspan="8">暂无卡密库存数据。</td></tr>`;
  }

  return items.map((card) => `
    <tr>
      <td>
        <strong>${escapeHtml(card.productTitle)}</strong>
        ${card.productId ? `<small>${escapeHtml(card.productId)}</small>` : ""}
      </td>
      <td>${renderAdminStatus(card.status)}</td>
      <td><code class="admin-card-mask">${escapeHtml(card.keyMask || "****-****-DEMO")}</code></td>
      <td>${escapeHtml(card.orderId || "未关联")}</td>
      <td>${escapeHtml(card.createdAt || "未知")}</td>
      <td>${escapeHtml(card.soldAt || "未售出")}</td>
      <td><span class="status-pill admin-source-pill">${escapeHtml(sourceLabel)}</span></td>
      <td>
        <div class="admin-actions">
          ${renderDemoButton("导入卡密", "卡密导入功能将在后台写入接口完成后开放")}
          ${renderDemoButton("查看库存", "当前卡密库存仅做只读展示")}
        </div>
      </td>
    </tr>
  `).join("");
};

const renderAdminCardManagement = async () => {
  const tableBody = document.querySelector("[data-admin-card-rows]");
  const sourceStatus = document.querySelector("[data-admin-card-source]");

  if (!tableBody) {
    return;
  }

  if (!hasStoredAdminKey()) {
    setAdminAccessState("unauthorized");
    tableBody.innerHTML = `<tr><td colspan="8">${ADMIN_AUTH_REQUIRED_MESSAGE}</td></tr>`;

    if (sourceStatus) {
      sourceStatus.textContent = ADMIN_AUTH_REQUIRED_MESSAGE;
      sourceStatus.dataset.state = "offline";
    }

    return;
  }

  const result = await loadAdminCardKeysFromApi();

  if (!result?.ok) {
    const message = getAdminUnavailableMessage(result);
    tableBody.innerHTML = `<tr><td colspan="8">${escapeHtml(message)}</td></tr>`;

    if (sourceStatus) {
      sourceStatus.textContent = message;
      sourceStatus.dataset.state = result?.status === 503 ? "unbound" : "offline";
    }

    return;
  }

  tableBody.innerHTML = renderAdminCardRows(result.cardKeys, "D1 卡密库存");

  if (sourceStatus) {
    sourceStatus.textContent = "当前显示：D1 卡密库存";
    sourceStatus.dataset.state = "connected";
  }
};

const updateHealthStatus = (selector, message, state = "pending") => {
  const status = document.querySelector(selector);

  if (!status) {
    return;
  }

  status.textContent = message;
  status.dataset.state = state;
};

const updateApiHealthStatus = (message, state = "pending") => {
  updateHealthStatus("[data-api-health-status]", message, state);
};

const updateDbHealthStatus = (message, state = "pending") => {
  updateHealthStatus("[data-db-health-status]", message, state);
};

const renderStatusDistribution = (items = {}) => {
  const entries = Array.isArray(items)
    ? items.map((item) => [item?.status || "unknown", item?.count ?? 0])
    : Object.entries(items);

  if (!entries.length) {
    return `<p class="admin-empty-state">暂无状态统计数据。</p>`;
  }

  return `
    <div class="admin-status-list">
      ${entries.map(([status, count]) => `
        <div class="admin-status-row">
          <span>${escapeHtml(status)}</span>
          <strong>${escapeHtml(Number(count) || 0)}</strong>
        </div>
      `).join("")}
    </div>
  `;
};

const renderAdminDbStats = async () => {
  const container = document.querySelector("[data-admin-db-stats]");

  if (!container) {
    return;
  }

  const renderUnavailable = (message = "静态演示区域仍可正常查看；真实数据库统计需要部署到 Cloudflare Pages 并绑定 D1 后验证。", state = "offline") => {
    container.innerHTML = `
      <div class="admin-panel-header">
        <div>
          <p class="eyebrow">Real D1 Stats</p>
          <h2>真实 D1 统计数据</h2>
          <p>演示阶段，尚未接入管理员登录。</p>
        </div>
        <span class="api-status-pill" data-state="${escapeHtml(state)}">${escapeHtml(message)}</span>
      </div>
      <div class="admin-db-state">
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  };

  if (!hasStoredAdminKey()) {
    setAdminAccessState("unauthorized");
    renderUnavailable(ADMIN_AUTH_REQUIRED_MESSAGE);
    return;
  }

  const result = await fetchAdminJson("/api/admin/stats");

  if (!result?.ok) {
    const message = getAdminUnavailableMessage(result);
    renderUnavailable(message, result?.status === 503 ? "unbound" : "offline");
    return;
  }

  const data = result.data;
  const totals = data.stats?.totals || {};

  container.innerHTML = `
    <div class="admin-panel-header">
      <div>
        <p class="eyebrow">Real D1 Stats</p>
        <h2>真实 D1 统计数据</h2>
        <p>演示阶段，尚未接入管理员登录。</p>
      </div>
      <span class="api-status-pill" data-state="connected">已连接真实 D1 统计</span>
    </div>

    <div class="admin-db-grid">
      <article class="admin-stat-card">
        <span>商品表记录数</span>
        <strong>${escapeHtml(totals.products ?? 0)}</strong>
        <p>products</p>
      </article>
      <article class="admin-stat-card">
        <span>订单表记录数</span>
        <strong>${escapeHtml(totals.orders ?? 0)}</strong>
        <p>orders</p>
      </article>
      <article class="admin-stat-card">
        <span>卡密表记录数</span>
        <strong>${escapeHtml(totals.cardKeys ?? 0)}</strong>
        <p>card_keys</p>
      </article>
      <article class="admin-stat-card">
        <span>管理日志记录数</span>
        <strong>${escapeHtml(totals.adminLogs ?? 0)}</strong>
        <p>admin_logs</p>
      </article>
    </div>

    <div class="admin-distribution-grid">
      <section>
        <h3>卡密状态分布</h3>
        ${renderStatusDistribution(data.stats?.cardKeyStatus)}
      </section>
      <section>
        <h3>订单状态分布</h3>
        ${renderStatusDistribution(data.stats?.orderStatus)}
      </section>
    </div>

    <p class="admin-db-timestamp">更新时间：${escapeHtml(data.timestamp || "未知")}</p>
  `;
};

const checkApiHealth = async () => {
  const status = document.querySelector("[data-api-health-status]");

  if (!status || !window.fetch) {
    return;
  }

  try {
    const response = await fetch("/api/health", {
      headers: {
        Accept: "application/json"
      }
    });
    const data = await response.json();

    if (!response.ok || data?.ok !== true) {
      throw new Error("API health check failed");
    }

    updateApiHealthStatus("API 已连接", "connected");
  } catch {
    updateApiHealthStatus("本地静态预览下 API 可能不可用，部署到 Cloudflare Pages 后测试", "offline");
  }
};

const checkDbHealth = async () => {
  const status = document.querySelector("[data-db-health-status]");

  if (!status || !window.fetch) {
    return;
  }

  try {
    const response = await fetch("/api/db-health", {
      headers: {
        Accept: "application/json"
      }
    });
    const data = await response.json();

    if (response.status === 503) {
      updateDbHealthStatus("D1 尚未绑定", "unbound");
      return;
    }

    if (!response.ok || data?.ok !== true) {
      throw new Error("D1 health check failed");
    }

    updateDbHealthStatus("D1 已连接", "connected");
  } catch {
    updateDbHealthStatus("本地预览或未部署环境下 D1 可能不可用", "offline");
  }
};

const renderFeaturedProducts = async () => {
  const container = document.querySelector("[data-featured-products]");

  if (!container) {
    return;
  }

  const apiProducts = await loadProductsFromApi();
  const sourceProducts = apiProducts?.length ? apiProducts : products;
  const featuredProducts = sourceProducts.filter((product) => product.featured).slice(0, 3);
  container.innerHTML = featuredProducts.map(renderProductCard).join("");
};

const renderProductList = async () => {
  const container = document.querySelector("[data-product-list]");

  if (!container) {
    return;
  }

  const apiProducts = await loadProductsFromApi();
  const sourceProducts = apiProducts?.length ? apiProducts : products;
  container.innerHTML = sourceProducts.map(renderProductCard).join("");
};

const renderProductDetail = async () => {
  const container = document.querySelector("[data-product-detail]");

  if (!container) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  let product = null;

  if (slug) {
    product = await loadProductDetailFromApi(slug) || products.find((item) => item.slug === slug);
  } else {
    const apiProducts = await loadProductsFromApi();
    const apiDefaultProduct = apiProducts?.find((item) => item.featured) || apiProducts?.[0];
    product = apiDefaultProduct
      ? await loadProductDetailFromApi(apiDefaultProduct.slug) || apiDefaultProduct
      : products.find((item) => item.featured) || products[0];
  }

  if (!product) {
    container.innerHTML = `
      <section class="section page-hero">
        <p class="eyebrow">Product Offline</p>
        <h1>商品不存在或已下架</h1>
        <p>当前商品暂时不可查看。你可以返回商品列表，继续浏览其他演示资源。</p>
        <div class="section-actions">
          <a class="button primary" href="/products.html">返回商品列表</a>
        </div>
      </section>
    `;
    document.title = "商品不存在 · 冒泡维C AI Lab";
    return;
  }

  document.title = `${product.title} · 冒泡维C AI Lab`;
  container.innerHTML = `
    <section class="section product-detail">
      <div class="detail-copy">
        <p class="eyebrow">Product Detail</p>
        <h1>${escapeHtml(product.title)}</h1>
        <p>${escapeHtml(product.description)}</p>
        <div class="tag-list">
          ${renderTagList([...(product.tags || []), product.status])}
        </div>
      </div>
      <aside class="purchase-panel">
        <span>${escapeHtml(product.category)}</span>
        <strong>${escapeHtml(product.price)}</strong>
        <p>当前为人工收款流程，尚未接入自动支付和自动发卡。创建订单后请按付款页提示备注订单号，后台人工确认前不会发货。</p>
        <button class="button primary" type="button" data-manual-checkout="${escapeHtml(product.slug)}">创建人工付款订单</button>
        <div class="demo-order-result" data-manual-checkout-result></div>
      </aside>
    </section>

    <section class="section detail-grid">
      <article class="info-card">
        <h2>商品介绍</h2>
        <p>${escapeHtml(product.longDescription)}</p>
      </article>
      <article class="info-card">
        <h2>适合人群</h2>
        <ul>${renderListItems(product.audience)}</ul>
      </article>
      <article class="info-card">
        <h2>交付内容</h2>
        <ul>${renderListItems(product.delivery)}</ul>
      </article>
      <article class="info-card">
        <h2>购买须知</h2>
        <p>当前为人工收款订单流程，不接 Stripe、支付宝官方接口或微信支付官方接口；不会自动发卡，也不会在页面显示真实卡密。</p>
      </article>
    </section>
  `;
};

const renderOrderResult = (order) => {
  const normalizedStatus = String(order.status || "").toLowerCase();
  const noteByStatus = {
    pending: "等待人工付款确认。付款时必须备注订单号，未确认前不会处理发货。",
    paid: "已确认付款，等待后台处理。当前不会显示或发送真实卡密。",
    demo: "当前为演示订单，尚未接入真实支付和自动发货。不会显示或发放真实卡密。",
    shipped: "已处理完成。当前仍不会显示或发送真实卡密。"
  };
  const note = noteByStatus[normalizedStatus] || "当前为订单查询结果，不显示真实卡密或完整用户邮箱。";

  return `
    <article class="order-result-card">
      <div class="order-result-header">
        <div>
          <p class="eyebrow">Order Detail</p>
          <h2>${escapeHtml(order.id)}</h2>
        </div>
        <span class="status-pill order-status-pill">${escapeHtml(order.status || "demo")}</span>
      </div>
      <div class="order-result-grid">
        <p><span>商品名称</span><strong>${escapeHtml(order.productTitle)}</strong></p>
        <p><span>金额</span><strong>${escapeHtml(order.amount || "¥0")}</strong></p>
        <p><span>订单状态</span><strong>${escapeHtml(order.status || "demo")}</strong></p>
        <p><span>支付方式</span><strong>${escapeHtml(order.paymentProvider || "demo")}</strong></p>
        <p><span>创建时间</span><strong>${escapeHtml(order.createdAt || "未知")}</strong></p>
        <p><span>发货状态</span><strong>${escapeHtml(order.deliveryStatus || "订单状态待确认")}</strong></p>
      </div>
      <p class="order-result-note">${escapeHtml(note)}</p>
    </article>
  `;
};

const paymentMethodLabels = {
  alipay: "支付宝人工转账",
  wechat: "微信人工转账",
  manual: "人工确认"
};

const renderPaymentQrCard = ({ label, src, missingText }) => `
  <div class="payment-qr-card" data-payment-qr-card>
    <img class="payment-qr-image" src="${escapeHtml(src)}" alt="${escapeHtml(label)}收款码" loading="lazy" data-payment-qr-image>
    <div class="payment-qr-fallback">
      <span>${escapeHtml(label)}</span>
      <p>${escapeHtml(missingText)}</p>
    </div>
  </div>
`;

const initPaymentQrCards = (root = document) => {
  root.querySelectorAll("[data-payment-qr-card]").forEach((card) => {
    const image = card.querySelector("[data-payment-qr-image]");

    if (!image) {
      card.classList.add("is-missing");
      return;
    }

    const markMissing = () => {
      card.classList.add("is-missing");
    };
    const markLoaded = () => {
      card.classList.remove("is-missing");
    };

    image.addEventListener("error", markMissing, { once: true });
    image.addEventListener("load", markLoaded, { once: true });

    if (image.complete && image.naturalWidth === 0) {
      markMissing();
    }
  });
};

const renderManualPaymentDetail = () => {
  const container = document.querySelector("[data-payment-detail]");

  if (!container) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const orderId = String(params.get("id") || params.get("orderId") || "").trim();

  const setState = (message, state = "pending") => {
    container.dataset.state = state;
    container.innerHTML = `<article class="payment-status-card"><p>${escapeHtml(message)}</p></article>`;
  };

  if (!orderId) {
    setState("缺少订单号，请从商品详情页重新创建人工付款订单。", "offline");
    return;
  }

  setState("正在读取订单信息...");

  fetchOrderDetail(orderId).then((detail) => {
    if (!detail?.order) {
      setState(detail?.notFound ? "未找到该订单，请检查订单号。" : "订单系统暂时不可用，请稍后再试。", "offline");
      return;
    }

    const order = detail.order;
    const normalizedStatus = String(order.status || "").toLowerCase();
    const method = String(order.paymentMethod || "manual").toLowerCase();
    const methodLabel = paymentMethodLabels[method] || paymentMethodLabels.manual;
    const paymentNote = `订单号：${order.id}`;

    container.dataset.state = "connected";
    container.innerHTML = `
      <section class="section payment-detail-grid">
        <article class="payment-status-card">
          <p class="eyebrow">Manual Payment</p>
          <h1>人工付款</h1>
          <p>当前为人工收款流程，尚未接入自动支付接口。付款时必须备注订单号，付款后由管理员人工确认；未确认前不会处理发货，也不会在页面显示真实卡密。</p>
          <div class="order-result-grid payment-order-summary">
            <p><span>订单号</span><strong>${escapeHtml(order.id)}</strong></p>
            <p><span>商品名称</span><strong>${escapeHtml(order.productTitle)}</strong></p>
            <p><span>金额</span><strong>${escapeHtml(order.amount || "¥0")}</strong></p>
            <p><span>当前状态</span><strong>${escapeHtml(order.status || "pending")}</strong></p>
            <p><span>付款方式</span><strong>${escapeHtml(methodLabel)}</strong></p>
            <p><span>发货状态</span><strong>${escapeHtml(order.deliveryStatus || "等待人工确认")}</strong></p>
          </div>
          <div class="payment-actions">
            <button class="button secondary compact-button" type="button" data-copy-order-id="${escapeHtml(order.id)}">复制订单号</button>
            <button class="button secondary compact-button" type="button" data-copy-payment-note="${escapeHtml(paymentNote)}">复制付款备注</button>
            <a class="button primary compact-button" href="/order.html?id=${encodeURIComponent(order.id)}">我已付款，查看订单状态</a>
          </div>
        </article>

        <article class="payment-instructions-card">
          <p class="eyebrow">Payment Note</p>
          <h2>付款备注要求</h2>
          <p>请在转账备注中填写：<strong>${escapeHtml(paymentNote)}</strong></p>
          <p>${normalizedStatus === "pending" ? "该订单正在等待人工付款确认。管理员确认到账前不会处理发货。" : escapeHtml(order.deliveryStatus || "订单状态待确认。")}</p>
          <div class="payment-qr-grid">
            ${renderPaymentQrCard({
              label: "微信",
              src: "/assets/payment/wechat-qr.jpg",
              missingText: "微信收款码暂未配置"
            })}
            ${renderPaymentQrCard({
              label: "支付宝",
              src: "/assets/payment/alipay-qr.jpg",
              missingText: "支付宝收款码暂未配置"
            })}
          </div>
        </article>
      </section>
    `;
    initPaymentQrCards(container);
  });
};

const renderOrderLookup = () => {
  const container = document.querySelector("[data-order-lookup]");

  if (!container) {
    return;
  }

  const form = container.querySelector("[data-order-lookup-form]");
  const input = form?.querySelector('input[name="orderId"]');
  const result = container.querySelector("[data-order-lookup-result]");

  if (!form || !input || !result) {
    return;
  }

  const setResultMessage = (message, state = "pending") => {
    result.dataset.state = state;
    result.innerHTML = `<p>${escapeHtml(message)}</p>`;
  };

  const lookup = async (orderId) => {
    const normalizedOrderId = String(orderId || "").trim();

    if (!normalizedOrderId) {
      showToast("请输入订单号");
      setResultMessage("请输入订单号。", "offline");
      return;
    }

    setResultMessage("正在查询订单...");

    const detail = await fetchOrderDetail(normalizedOrderId);

    if (detail?.order) {
      result.dataset.state = "connected";
      result.innerHTML = renderOrderResult(detail.order);
      return;
    }

    if (detail?.notFound) {
      setResultMessage("未找到该订单，请检查订单号", "offline");
      return;
    }

    setResultMessage("订单查询失败，请稍后再试", "offline");
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    lookup(input.value);
  });

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("id") || params.get("orderId");

  if (orderId) {
    input.value = orderId;
    lookup(orderId);
  }
};

const renderDashboardDemo = () => {
  const container = document.querySelector("[data-dashboard-demo]");

  if (!container) {
    return;
  }

  const order = demoOrders[0];
  const card = demoCards[0];

  container.innerHTML = `
    <article class="info-card">
      <span class="status-pill">${escapeHtml(order?.label || "演示数据")}</span>
      <h2>我的订单</h2>
      <p>订单号：${escapeHtml(order?.id || "暂无演示订单")}</p>
      <p>商品：${escapeHtml(order?.productTitle || "暂无商品")}</p>
      <p>状态：${escapeHtml(order?.status || "待接入订单系统")}</p>
    </article>
    <article class="info-card">
      <span class="status-pill">演示数据</span>
      <h2>我的卡密</h2>
      <p>商品：${escapeHtml(card?.productTitle || "暂无商品")}</p>
      <p>状态：${escapeHtml(card?.status || "待接入发货系统")}</p>
      <p>${escapeHtml(card?.note || "当前不展示真实卡密。")}</p>
    </article>
  `;
};

const renderAdminDemo = () => {
  const container = document.querySelector("[data-admin-demo]");

  if (!container) {
    return;
  }

  const cardStock = demoCards.reduce((total, card) => {
    const value = Number(card.stock ?? card.count ?? 0);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
  const pendingOrders = demoOrders.filter((order) => /待|未/.test(order.status || "")).length;
  const stats = [
    { label: "商品数量", value: products.length, note: "来自 site-data.js" },
    { label: "演示订单数", value: demoOrders.length, note: "静态订单样本" },
    { label: "卡密库存", value: cardStock, note: "安全占位统计" },
    { label: "待处理事项", value: pendingOrders, note: "演示订单待处理" }
  ];
  const roadmap = [
    "Cloudflare D1 数据库",
    "Pages Functions API",
    "管理员登录",
    "商品真实增删改查",
    "订单和卡密自动发货"
  ];

  container.innerHTML = `
    <div class="admin-stats-grid">
      ${stats.map((item) => `
        <article class="admin-stat-card">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          <p>${escapeHtml(item.note)}</p>
        </article>
      `).join("")}
    </div>

    <article class="admin-panel api-status-card">
      <div>
        <p class="eyebrow">API Status</p>
        <h2>API 状态</h2>
        <p>用于验证 Cloudflare Pages Functions 后端入口是否可用。</p>
      </div>
      <span class="api-status-pill" data-api-health-status data-state="pending">检测中</span>
    </article>

    <article class="admin-panel api-status-card">
      <div>
        <p class="eyebrow">D1 Status</p>
        <h2>D1 状态</h2>
        <p>用于验证 Cloudflare D1 binding 是否已经绑定并可查询。</p>
      </div>
      <span class="api-status-pill" data-db-health-status data-state="pending">检测中</span>
    </article>

    <article class="admin-panel admin-db-stats-panel" data-admin-db-stats>
      <div class="admin-panel-header">
        <div>
          <p class="eyebrow">Real D1 Stats</p>
          <h2>真实 D1 统计数据</h2>
          <p>演示阶段，尚未接入管理员登录。</p>
        </div>
        <span class="api-status-pill" data-state="pending">检测中</span>
      </div>
      <div class="admin-db-state">
        <p>正在读取数据库统计。</p>
      </div>
    </article>

    <article class="admin-panel">
      <div class="admin-panel-header">
        <div>
          <p class="eyebrow">Products</p>
          <h2>商品管理</h2>
          <p>已授权后可新增或编辑 draft 草稿；published 商品只读，本阶段不提供发布、删除或下架。</p>
        </div>
        <span class="api-status-pill" data-admin-product-source data-state="pending">读取中</span>
      </div>
      <div class="admin-product-draft-panel" data-admin-product-form-shell>
        ${renderAdminProductDraftLocked()}
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>商品</th>
              <th>价格</th>
              <th>分类</th>
              <th>状态</th>
              <th>推荐</th>
              <th>标签</th>
              <th>数据来源</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody data-admin-product-rows>
            <tr><td colspan="8">正在读取商品数据。</td></tr>
          </tbody>
        </table>
      </div>
    </article>

    <article class="admin-panel">
      <div class="admin-panel-header">
        <div>
          <p class="eyebrow">Orders</p>
          <h2>订单管理</h2>
          <p>预留卡密和演示发货按钮只用于验证后台流程，不会发放真实卡密。</p>
        </div>
        <span class="api-status-pill" data-admin-order-source data-state="pending">读取中</span>
      </div>
      <div class="admin-manual-payment-flow">
        <div>
          <p class="eyebrow">Manual Payment</p>
          <h3>人工收款处理流程</h3>
        </div>
        <div class="admin-manual-payment-steps">
          <p><strong>pending</strong><span>用户下单后等待人工付款确认。</span></p>
          <p><strong>备注订单号</strong><span>用户扫码付款时必须备注订单号。</span></p>
          <p><strong>标记已支付</strong><span>确认到账后再点击“标记已支付”，未到账不要标记 paid。</span></p>
          <p><strong>后续处理</strong><span>paid 后再预留卡密和演示发货，不自动发卡。</span></p>
        </div>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>商品名</th>
              <th>金额</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>数据来源</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody data-admin-order-rows>
            <tr><td colspan="7">正在读取订单数据。</td></tr>
          </tbody>
        </table>
      </div>
    </article>

    <article class="admin-panel">
      <div class="admin-panel-header">
        <div>
          <p class="eyebrow">Cards</p>
          <h2>卡密管理</h2>
          <p>这里只展示脱敏卡密字段，真实卡密不会在后台页面显示。</p>
        </div>
        <span class="api-status-pill" data-admin-card-source data-state="pending">正在读取卡密库存</span>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>商品名</th>
              <th>状态</th>
              <th>脱敏卡密</th>
              <th>关联订单</th>
              <th>创建时间</th>
              <th>售出时间</th>
              <th>数据来源</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody data-admin-card-rows>
            <tr><td colspan="8">正在读取卡密库存。</td></tr>
          </tbody>
        </table>
      </div>
    </article>

    <article class="admin-panel">
      <div class="admin-panel-header">
        <div>
          <p class="eyebrow">Next</p>
          <h2>后续接入说明</h2>
        </div>
        <span class="status-pill">规划中</span>
      </div>
      <div class="admin-roadmap-grid">
        ${roadmap.map((item) => `
          <div class="admin-roadmap-item">
            <span></span>
            <p>${escapeHtml(item)}</p>
          </div>
        `).join("")}
      </div>
    </article>
  `;
};

const showToast = (message) => {
  if (!message) {
    return;
  }

  let toastRoot = document.querySelector("[data-toast-root]");

  if (!toastRoot) {
    toastRoot = document.createElement("div");
    toastRoot.className = "toast-root";
    toastRoot.setAttribute("data-toast-root", "");
    toastRoot.setAttribute("aria-live", "polite");
    toastRoot.setAttribute("aria-atomic", "false");
    document.body.appendChild(toastRoot);
  }

  const toast = document.createElement("div");
  toast.className = "site-toast";
  toast.textContent = message;
  toastRoot.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("is-hiding");
  }, 2400);

  window.setTimeout(() => {
    toast.remove();

    if (!toastRoot.children.length) {
      toastRoot.remove();
    }
  }, 2850);
};

const refreshAdminProtectedData = async () => {
  await Promise.all([
    renderAdminProductManagement(),
    renderAdminOrderManagement(),
    renderAdminCardManagement(),
    renderAdminDbStats()
  ]);
};

const initAdminAccessControls = () => {
  const form = document.querySelector("[data-admin-access-form]");
  const input = document.querySelector("[data-admin-key-input]");
  const clearButton = document.querySelector("[data-clear-admin-key]");

  if (!form || !input) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const adminKey = String(input.value || "").trim();

    if (!adminKey) {
      showToast("请输入管理员访问口令");
      setAdminAccessState("unauthorized");
      return;
    }

    saveStoredAdminKey(adminKey);
    input.value = "";
    setAdminAccessState("unauthorized", ADMIN_AUTH_SAVED_MESSAGE);
    showToast(ADMIN_AUTH_SAVED_MESSAGE);
    await refreshAdminProtectedData();
  });

  clearButton?.addEventListener("click", async () => {
    clearStoredAdminKey();
    input.value = "";
    showToast(ADMIN_AUTH_CLEARED_MESSAGE);
    await Promise.all([
      renderAdminProductManagement(),
      renderAdminOrderManagement(),
      renderAdminCardManagement(),
      renderAdminDbStats()
    ]);
    setAdminAccessState("unauthorized", ADMIN_AUTH_CLEARED_MESSAGE);
  });
};

if (year) {
  year.textContent = new Date().getFullYear();
}

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    const target = targetId ? document.querySelector(targetId) : null;

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    navLinks?.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

renderFeaturedProducts();
renderProductList();
renderProductDetail();
renderOrderLookup();
renderManualPaymentDetail();
renderDashboardDemo();
initAdminAccessControls();
renderAdminDemo();
refreshAdminProtectedData();
checkApiHealth();
checkDbHealth();

document.addEventListener("click", async (event) => {
  const copyButton = event.target.closest("[data-copy-order-id]");

  if (!copyButton) {
    return;
  }

  const orderId = copyButton.getAttribute("data-copy-order-id") || "";

  if (!navigator.clipboard?.writeText) {
    showToast("当前浏览器不支持自动复制，请手动复制订单号");
    return;
  }

  try {
    await navigator.clipboard.writeText(orderId);
    showToast("订单号已复制");
  } catch {
    showToast("复制失败，请手动复制订单号");
  }
});

document.addEventListener("click", async (event) => {
  const copyButton = event.target.closest("[data-copy-payment-note]");

  if (!copyButton) {
    return;
  }

  const paymentNote = copyButton.getAttribute("data-copy-payment-note") || "";

  if (!navigator.clipboard?.writeText) {
    showToast("当前浏览器不支持自动复制，请手动复制付款备注");
    return;
  }

  try {
    await navigator.clipboard.writeText(paymentNote);
    showToast("付款备注已复制");
  } catch {
    showToast("复制失败，请手动复制付款备注");
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-manual-checkout]");

  if (!button) {
    return;
  }

  const productSlug = button.getAttribute("data-manual-checkout") || "";
  const resultContainer = button.closest(".purchase-panel")?.querySelector("[data-manual-checkout-result]");
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "正在创建人工付款订单";

  const result = await createManualCheckoutOrder(productSlug);

  button.disabled = false;
  button.textContent = originalText;

  if (!result?.order) {
    showToast("订单系统暂时不可用，请稍后再试");
    return;
  }

  if (resultContainer) {
    resultContainer.innerHTML = `<p>${escapeHtml(result.message)}</p>`;
  }

  showToast(result.message);

  if (result.paymentUrl) {
    window.location.href = result.paymentUrl;
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-admin-product-form]");

  if (!form) {
    return;
  }

  event.preventDefault();

  if (!hasStoredAdminKey()) {
    showToast("请先保存管理员访问口令");
    await renderAdminProductManagement();
    return;
  }

  const submitButton = form.querySelector("[data-admin-product-submit]");
  const originalText = submitButton?.textContent || "";
  const payload = collectAdminProductDraftPayload(form);
  const productId = editingAdminProductId || form.elements.id?.value || "";

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "正在保存";
  }

  const result = await saveAdminProductDraft(payload, productId);

  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }

  if (!result?.ok) {
    if (result?.status === 401) {
      showToast("管理员访问口令不正确");
      return;
    }

    if (result?.status === 503) {
      showToast("后台管理密钥尚未配置");
      return;
    }

    if (result?.status === 409) {
      showToast("slug 已存在，请换一个");
      return;
    }

    showToast(result?.message || "商品草稿保存失败");
    return;
  }

  showToast("商品草稿已保存");
  resetAdminProductDraftForm();
  await Promise.all([
    renderAdminProductManagement(),
    renderAdminDbStats()
  ]);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-edit-product-draft]");

  if (!button) {
    return;
  }

  const productId = button.getAttribute("data-edit-product-draft") || "";
  const product = adminProductDrafts.find((item) => item.id === productId);

  if (!product) {
    showToast("未找到可编辑的商品草稿");
    return;
  }

  fillAdminProductDraftForm(product);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-admin-product-reset]");

  if (!button) {
    return;
  }

  resetAdminProductDraftForm();
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-mark-paid-order]");

  if (!button) {
    return;
  }

  const orderId = button.getAttribute("data-order-id") || button.getAttribute("data-mark-paid-order") || "";
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "正在标记";

  const result = await markOrderAsPaid(orderId);

  button.disabled = false;
  button.textContent = originalText;

  if (result?.ok) {
    showToast("订单已标记为人工已支付");
    await Promise.all([
      renderAdminOrderManagement(),
      renderAdminDbStats()
    ]);
    return;
  }

  if (result?.status === 0) {
    showToast("请先保存管理员访问口令");
    await Promise.all([
      renderAdminOrderManagement(),
      renderAdminDbStats()
    ]);
    return;
  }

  if (result?.status === 401 || result?.status === 503) {
    return;
  }

  if (result?.status === 404) {
    showToast("订单不存在");
    return;
  }

  if (result?.status === 400) {
    showToast("只有 pending 订单可以标记为已支付");
    return;
  }

  showToast("标记已支付失败，请稍后再试");
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-reserve-card-order]");

  if (!button) {
    return;
  }

  const orderId = button.getAttribute("data-order-id") || button.getAttribute("data-reserve-card-order") || "";
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "正在预留";

  const result = await reserveDemoCardForOrder(orderId);

  button.disabled = false;
  button.textContent = originalText;

  if (result?.ok) {
    showToast("演示卡密库存已预留");
    await Promise.all([
      renderAdminOrderManagement(),
      renderAdminCardManagement(),
      renderAdminDbStats()
    ]);
    return;
  }

  if (result?.status === 0) {
    showToast("请先保存管理员访问口令");
    await Promise.all([
      renderAdminOrderManagement(),
      renderAdminCardManagement(),
      renderAdminDbStats()
    ]);
    return;
  }

  if (result?.status === 401 || result?.status === 503) {
    return;
  }

  if (result?.status === 409) {
    showToast("该商品暂无可用演示卡密库存");
    return;
  }

  if (result?.status === 404) {
    showToast("订单不存在");
    return;
  }

  showToast("预留卡密失败，请稍后再试");
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-ship-order]");

  if (!button) {
    return;
  }

  const orderId = button.getAttribute("data-order-id") || button.getAttribute("data-ship-order") || "";
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "正在发货";

  const result = await shipDemoOrder(orderId);

  button.disabled = false;
  button.textContent = originalText;

  if (result?.ok) {
    showToast("演示发货已完成");
    await Promise.all([
      renderAdminOrderManagement(),
      renderAdminCardManagement(),
      renderAdminDbStats()
    ]);
    return;
  }

  if (result?.status === 0) {
    showToast("请先保存管理员访问口令");
    await Promise.all([
      renderAdminOrderManagement(),
      renderAdminCardManagement(),
      renderAdminDbStats()
    ]);
    return;
  }

  if (result?.status === 401 || result?.status === 503) {
    return;
  }

  if (result?.status === 409) {
    showToast("该订单尚未预留演示卡密");
    return;
  }

  if (result?.status === 404) {
    showToast("订单不存在");
    return;
  }

  showToast("演示发货失败，请稍后再试");
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-demo-action]");

  if (!button) {
    return;
  }

  const message = button.getAttribute("data-demo-action") || "功能正在开发中";
  showToast(message);
});

document.querySelectorAll("[data-demo-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const message = form.getAttribute("data-demo-message") || "功能正在开发中，当前为演示提交";
    const notice = form.querySelector(".demo-notice");

    if (notice) {
      notice.textContent = message;
    }

    showToast(message);
  });
});

document.querySelectorAll(".faq-list details").forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) {
      return;
    }

    document.querySelectorAll(".faq-list details").forEach((otherItem) => {
      if (otherItem !== item) {
        otherItem.open = false;
      }
    });
  });
});

const updateActiveNav = () => {
  let currentId = "";
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();

    if (rect.top <= 120 && rect.bottom >= 120) {
      currentId = section.id;
    }
  });

  navItems.forEach((item) => {
    const href = item.getAttribute("href") || "";
    const linkUrl = new URL(href, window.location.origin);
    const linkPath = linkUrl.pathname.replace(/\/$/, "") || "/";
    const hashMatches = currentPath === "/" && linkUrl.hash === `#${currentId}`;
    const pathMatches = linkPath === currentPath && !linkUrl.hash;

    item.classList.toggle("is-active", hashMatches || pathMatches);
  });
};

window.addEventListener("scroll", updateActiveNav, { passive: true });
updateActiveNav();

// Start the Hero cloth canvas after the normal page controls are wired.
// A failed canvas initialization should not break navigation or page content.
if (clothLabRoot && window.ClothLabEffect) {
  try {
    new window.ClothLabEffect(clothLabRoot);
  } catch (error) {
    console.error("Hero cloth lab failed to initialize:", error);
  }
}
