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

const renderFeaturedProducts = () => {
  const container = document.querySelector("[data-featured-products]");

  if (!container) {
    return;
  }

  const featuredProducts = products.filter((product) => product.featured).slice(0, 3);
  container.innerHTML = featuredProducts.map(renderProductCard).join("");
};

const renderProductList = () => {
  const container = document.querySelector("[data-product-list]");

  if (!container) {
    return;
  }

  container.innerHTML = products.map(renderProductCard).join("");
};

const renderProductDetail = () => {
  const container = document.querySelector("[data-product-detail]");

  if (!container) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const defaultProduct = products.find((product) => product.featured) || products[0];
  const product = slug ? products.find((item) => item.slug === slug) : defaultProduct;

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
    <article class="info-card">
      <span class="status-pill">演示数据</span>
      <h2>我的留言</h2>
      <p>留言记录未来会与账号绑定，当前仅展示静态占位内容。</p>
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
