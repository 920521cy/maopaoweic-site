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

const renderDemoButton = (label, message) => `
  <button class="button secondary compact-button" type="button" data-demo-action="${escapeHtml(message)}">${escapeHtml(label)}</button>
`;

const renderAdminStatus = (value) => `<span class="status-pill">${escapeHtml(value || "演示数据")}</span>`;

const renderAdminProductRows = () => {
  if (!products.length) {
    return `<tr><td colspan="6">暂无商品演示数据。</td></tr>`;
  }

  return products.map((product) => `
    <tr>
      <td>
        <strong>${escapeHtml(product.title)}</strong>
        <small>${escapeHtml(product.slug)}</small>
      </td>
      <td>${escapeHtml(product.price)}</td>
      <td>${escapeHtml(product.category)}</td>
      <td>${renderAdminStatus(product.status)}</td>
      <td><div class="tag-list admin-tags">${renderTagList(product.tags)}</div></td>
      <td>
        <div class="admin-actions">
          ${renderDemoButton("编辑", "商品编辑功能将在数据库接入后开放")}
          ${renderDemoButton("下架", "商品上下架功能将在数据库接入后开放")}
        </div>
      </td>
    </tr>
  `).join("");
};

const renderAdminOrderRows = () => {
  if (!demoOrders.length) {
    return `<tr><td colspan="6">暂无订单演示数据。</td></tr>`;
  }

  return demoOrders.map((order) => `
    <tr>
      <td><strong>${escapeHtml(order.id)}</strong></td>
      <td>${escapeHtml(order.productTitle)}</td>
      <td>${escapeHtml(order.amount || "¥0")}</td>
      <td>${renderAdminStatus(order.status)}</td>
      <td>${escapeHtml(order.createdAt || "待接入订单系统")}</td>
      <td>
        <div class="admin-actions">
          ${renderDemoButton("查看订单", "订单详情功能将在数据库接入后开放")}
          ${renderDemoButton("标记发货", "发货状态将在订单系统接入后开放")}
        </div>
      </td>
    </tr>
  `).join("");
};

const renderAdminCardRows = () => {
  if (!demoCards.length) {
    return `<tr><td colspan="6">暂无卡密演示数据。</td></tr>`;
  }

  return demoCards.map((card) => {
    const stock = Number(card.stock ?? card.count ?? 0);

    return `
      <tr>
        <td>${escapeHtml(card.productTitle)}</td>
        <td>${renderAdminStatus(card.status)}</td>
        <td>${Number.isFinite(stock) ? stock : 0}</td>
        <td><code>${escapeHtml(card.maskedCode || "****-****-DEMO")}</code></td>
        <td>${escapeHtml(card.note || "仅显示安全占位符。")}</td>
        <td>
          <div class="admin-actions">
            ${renderDemoButton("导入卡密", "卡密导入功能将在数据库接入后开放")}
            ${renderDemoButton("查看库存", "库存查看功能将在数据库接入后开放")}
          </div>
        </td>
      </tr>
    `;
  }).join("");
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

  const renderUnavailable = () => {
    container.innerHTML = `
      <div class="admin-panel-header">
        <div>
          <p class="eyebrow">Real D1 Stats</p>
          <h2>真实 D1 统计数据</h2>
          <p>演示阶段，尚未接入管理员登录。</p>
        </div>
        <span class="api-status-pill" data-state="offline">当前环境无法读取数据库统计，可能是本地预览或 D1 未绑定</span>
      </div>
      <div class="admin-db-state">
        <p>静态演示区域仍可正常查看；真实数据库统计需要部署到 Cloudflare Pages 并绑定 D1 后验证。</p>
      </div>
    `;
  };

  if (!window.fetch) {
    renderUnavailable();
    return;
  }

  try {
    const response = await fetch("/api/admin/stats", {
      headers: {
        Accept: "application/json"
      }
    });
    const data = await response.json();

    if (!response.ok || data?.ok !== true) {
      renderUnavailable();
      return;
    }

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
  } catch {
    renderUnavailable();
  }
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
        <p>当前仅展示前端购买入口，不接支付、不创建订单。</p>
        <button class="button primary" type="button" data-demo-action="支付系统正在开发中">购买按钮</button>
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
        <p>当前页面为静态演示，不会产生真实订单。未来接入支付和卡密系统后，会在此补充交付与售后规则。</p>
      </article>
    </section>
  `;
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
          <p>商品数据已支持 D1 只读 API，后台编辑功能尚未开放。</p>
        </div>
        <span class="status-pill">静态数据</span>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>商品</th>
              <th>价格</th>
              <th>分类</th>
              <th>状态</th>
              <th>标签</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>${renderAdminProductRows()}</tbody>
        </table>
      </div>
    </article>

    <article class="admin-panel">
      <div class="admin-panel-header">
        <div>
          <p class="eyebrow">Orders</p>
          <h2>订单管理</h2>
        </div>
        <span class="status-pill">演示订单</span>
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
              <th>操作</th>
            </tr>
          </thead>
          <tbody>${renderAdminOrderRows()}</tbody>
        </table>
      </div>
    </article>

    <article class="admin-panel">
      <div class="admin-panel-header">
        <div>
          <p class="eyebrow">Cards</p>
          <h2>卡密管理</h2>
        </div>
        <span class="status-pill">不显示真实卡密</span>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>商品名</th>
              <th>状态</th>
              <th>库存数量</th>
              <th>安全占位符</th>
              <th>说明</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>${renderAdminCardRows()}</tbody>
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
renderDashboardDemo();
renderAdminDemo();
renderAdminDbStats();
checkApiHealth();
checkDbHealth();

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
