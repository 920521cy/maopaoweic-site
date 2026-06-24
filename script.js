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
const WECHAT_ID = "Lg101369";
const PAY_PLATFORM_URL = "https://pay.ldxp.cn/shop/TYZ9LG9R";
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

const initCosmicBackground = () => {
  const existingCanvas = document.querySelector("#cosmic-bg");
  const canvas = existingCanvas || document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: true });

  if (!context) {
    return;
  }

  if (!existingCanvas) {
    canvas.id = "cosmic-bg";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);
  }

  const reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const TAU = Math.PI * 2;
  const randomBetween = (min, max) => min + Math.random() * (max - min);

  let reducedMotion = Boolean(reducedMotionQuery?.matches);
  let width = 0;
  let height = 0;
  let dpr = 1;
  let stars = [];
  let dust = [];
  let nebulaClouds = [];
  let ringWisps = [];
  let meteors = [];
  let rafId = 0;
  let running = true;
  let pointerX = 0;
  let pointerY = 0;
  let frameSkip = 0;
  let lastTime = 0;
  let nextMeteorAt = 0;

  const isMobile = () => window.innerWidth <= 700;

  const getGalaxy = () => {
    const mobile = isMobile();
    const radius = Math.max(width, height) * (mobile ? 0.72 : 0.66);

    return {
      x: width * (mobile ? 0.58 : 0.66),
      y: height * (mobile ? 0.18 : 0.10),
      radius,
      scaleY: mobile ? 0.32 : 0.36,
      tilt: mobile ? -0.14 : -0.22
    };
  };

  const buildScene = () => {
    const mobile = isMobile();
    const area = Math.max(1, width * height);
    const farCount = reducedMotion ? 80 : Math.min(mobile ? 120 : 260, Math.floor(area / (mobile ? 3600 : 3200)));
    const midCount = reducedMotion ? 36 : Math.min(mobile ? 48 : 110, Math.floor(area / (mobile ? 9200 : 7600)));
    const nearCount = reducedMotion ? 10 : mobile ? 14 : 28;
    const dustCount = reducedMotion ? 70 : mobile ? 130 : 260;

    stars = [
      ...Array.from({ length: farCount }, () => ({
        layer: "far",
        x: Math.random() * width,
        y: Math.random() * height,
        r: randomBetween(0.28, mobile ? 0.82 : 0.9),
        drift: randomBetween(0.002, 0.009),
        twinkle: randomBetween(0.18, 0.55),
        phase: Math.random() * TAU,
        alpha: randomBetween(0.18, 0.48),
        hue: "219, 242, 255"
      })),
      ...Array.from({ length: midCount }, () => ({
        layer: "mid",
        x: Math.random() * width,
        y: Math.random() * height,
        r: randomBetween(0.55, mobile ? 1.1 : 1.35),
        drift: randomBetween(0.006, 0.018),
        twinkle: randomBetween(0.55, 1.18),
        phase: Math.random() * TAU,
        alpha: randomBetween(0.28, 0.68),
        hue: Math.random() > 0.25 ? "224, 242, 254" : "191, 219, 254"
      })),
      ...Array.from({ length: nearCount }, () => ({
        layer: "near",
        x: Math.random() * width,
        y: Math.random() * height,
        r: randomBetween(1.0, mobile ? 1.55 : 2.1),
        drift: randomBetween(0.01, 0.026),
        twinkle: randomBetween(0.5, 0.95),
        phase: Math.random() * TAU,
        alpha: randomBetween(0.5, 0.86),
        hue: Math.random() > 0.35 ? "224, 242, 254" : "253, 230, 138"
      }))
    ];

    dust = Array.from({ length: dustCount }, () => ({
      angle: randomBetween(-0.35, TAU + 0.65),
      orbit: randomBetween(-0.11, 0.12),
      spread: randomBetween(-18, 18),
      r: randomBetween(0.45, mobile ? 1.35 : 1.75),
      speed: randomBetween(0.000012, 0.00004),
      alpha: randomBetween(0.2, 0.72),
      phase: Math.random() * TAU,
      color: Math.random() > 0.45 ? "250, 204, 21" : Math.random() > 0.5 ? "251, 191, 36" : "253, 230, 138"
    }));

    nebulaClouds = Array.from({ length: mobile ? 4 : 7 }, (_, index) => ({
      x: randomBetween(width * 0.12, width * 0.88),
      y: randomBetween(height * 0.08, height * 0.72),
      radius: randomBetween(Math.max(width, height) * 0.14, Math.max(width, height) * 0.34),
      color: index % 2 === 0 ? "56, 189, 248" : index % 3 === 0 ? "224, 242, 254" : "124, 58, 237",
      alpha: randomBetween(0.035, mobile ? 0.08 : 0.115),
      phase: Math.random() * TAU,
      drift: randomBetween(10, mobile ? 24 : 46)
    }));

    ringWisps = Array.from({ length: mobile ? 7 : 13 }, (_, index) => ({
      radiusScale: randomBetween(0.72, 1.22),
      yScale: randomBetween(0.92, 1.08),
      start: Math.PI * randomBetween(0.04, 0.45),
      length: Math.PI * randomBetween(0.18, 0.72),
      alpha: randomBetween(0.035, 0.09),
      lineWidth: randomBetween(0.7, 1.8),
      speed: randomBetween(0.00003, 0.00008),
      gold: index % 3 === 0
    }));

    meteors = [];
    nextMeteorAt = reducedMotion ? Number.POSITIVE_INFINITY : performance.now() + randomBetween(4200, mobile ? 11000 : 8500);
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    pointerX = width * 0.5;
    pointerY = height * 0.5;
    buildScene();
  };

  const drawSpaceBase = (time) => {
    const base = context.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, "#020617");
    base.addColorStop(0.48, "#061225");
    base.addColorStop(1, "#120b2f");
    context.fillStyle = base;
    context.fillRect(0, 0, width, height);

    const slow = reducedMotion ? 0 : Math.sin(time * 0.00005) * width * 0.03;
    const halo = context.createRadialGradient(width * 0.58 + slow, height * 0.06, 0, width * 0.58 + slow, height * 0.06, Math.max(width, height) * 0.78);
    halo.addColorStop(0, "rgba(191, 219, 254, 0.18)");
    halo.addColorStop(0.24, "rgba(56, 189, 248, 0.10)");
    halo.addColorStop(0.55, "rgba(124, 58, 237, 0.075)");
    halo.addColorStop(1, "rgba(2, 6, 23, 0)");
    context.fillStyle = halo;
    context.fillRect(0, 0, width, height);

    const lower = context.createRadialGradient(width * 0.16, height * 0.86, 0, width * 0.16, height * 0.86, Math.max(width, height) * 0.58);
    lower.addColorStop(0, "rgba(34, 211, 238, 0.075)");
    lower.addColorStop(0.42, "rgba(14, 116, 144, 0.045)");
    lower.addColorStop(1, "rgba(2, 6, 23, 0)");
    context.fillStyle = lower;
    context.fillRect(0, 0, width, height);
  };

  const drawNebulaBands = (time) => {
    const mobile = isMobile();
    const shift = reducedMotion ? 0 : Math.sin(time * 0.00007) * (mobile ? 12 : 32);

    nebulaClouds.forEach((cloud) => {
      const x = cloud.x + Math.sin(time * 0.00006 + cloud.phase) * cloud.drift;
      const y = cloud.y + Math.cos(time * 0.00005 + cloud.phase) * cloud.drift * 0.45;
      const gradient = context.createRadialGradient(x, y, 0, x, y, cloud.radius);
      gradient.addColorStop(0, `rgba(${cloud.color}, ${cloud.alpha})`);
      gradient.addColorStop(0.38, `rgba(${cloud.color}, ${cloud.alpha * 0.44})`);
      gradient.addColorStop(1, `rgba(${cloud.color}, 0)`);
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    });

    context.save();
    context.globalCompositeOperation = "screen";
    context.lineCap = "round";
    const bandGradient = context.createLinearGradient(width * 0.08, height * 0.58, width * 0.92, height * 0.18);
    bandGradient.addColorStop(0, "rgba(56, 189, 248, 0)");
    bandGradient.addColorStop(0.22, "rgba(56, 189, 248, 0.05)");
    bandGradient.addColorStop(0.52, "rgba(224, 242, 254, 0.11)");
    bandGradient.addColorStop(0.78, "rgba(34, 211, 238, 0.06)");
    bandGradient.addColorStop(1, "rgba(56, 189, 248, 0)");

    for (let index = 0; index < (mobile ? 3 : 5); index += 1) {
      context.beginPath();
      context.strokeStyle = bandGradient;
      context.lineWidth = (mobile ? 18 : 28) + index * 9;
      context.globalAlpha = 0.18 - index * 0.022;
      context.moveTo(-width * 0.08, height * (0.62 + index * 0.014) + shift);
      context.bezierCurveTo(width * 0.24, height * 0.44 + shift * 0.6, width * 0.58, height * 0.34 - shift * 0.45, width * 1.08, height * (0.22 + index * 0.016));
      context.stroke();
    }
    context.restore();
  };

  const drawGalaxyRing = (time) => {
    const galaxy = getGalaxy();
    const phase = reducedMotion ? 0 : time * 0.000045;
    const parallaxX = isMobile() ? 0 : (pointerX / Math.max(width, 1) - 0.5) * 12;
    const parallaxY = isMobile() ? 0 : (pointerY / Math.max(height, 1) - 0.5) * 8;

    context.save();
    context.translate(galaxy.x + parallaxX, galaxy.y + parallaxY);
    context.rotate(galaxy.tilt + Math.sin(phase) * 0.025);
    context.globalCompositeOperation = "screen";
    context.lineCap = "round";

    const layers = [
      { scale: 1.0, alpha: 0.18, width: 1.25, color: "rgba(191, 219, 254, 0.48)", start: 0.03, end: 1.86 },
      { scale: 0.94, alpha: 0.12, width: 2.1, color: "rgba(56, 189, 248, 0.34)", start: 0.16, end: 1.72 },
      { scale: 1.06, alpha: 0.10, width: 1.5, color: "rgba(250, 204, 21, 0.28)", start: 0.28, end: 1.54 },
      { scale: 1.14, alpha: 0.07, width: 3.2, color: "rgba(224, 242, 254, 0.24)", start: -0.02, end: 1.92 }
    ];

    layers.forEach((layer, index) => {
      const radius = galaxy.radius * layer.scale;
      context.beginPath();
      context.globalAlpha = layer.alpha;
      context.lineWidth = layer.width;
      context.strokeStyle = layer.color;
      context.ellipse(0, 0, radius, radius * galaxy.scaleY * (1 + index * 0.018), 0, Math.PI * (layer.start + phase * (index + 1)), Math.PI * (layer.end + phase * (index + 1)), false);
      context.stroke();
    });

    ringWisps.forEach((wisp) => {
      const radius = galaxy.radius * wisp.radiusScale;
      const start = wisp.start + time * wisp.speed;
      const end = start + wisp.length;
      context.beginPath();
      context.globalAlpha = wisp.alpha;
      context.lineWidth = wisp.lineWidth;
      context.strokeStyle = wisp.gold ? "rgba(253, 230, 138, 0.55)" : "rgba(224, 242, 254, 0.44)";
      context.ellipse(0, 0, radius, radius * galaxy.scaleY * wisp.yScale, 0, start, end, false);
      context.stroke();
    });

    context.restore();
  };

  const drawStars = (time) => {
    const mobile = isMobile();
    const parallax = mobile ? 0 : (pointerX / Math.max(width, 1) - 0.5) * 5;

    stars.forEach((star) => {
      if (!reducedMotion) {
        star.x += star.drift * (star.layer === "near" ? 0.44 : 0.26);
        star.y += star.drift * (star.layer === "far" ? 0.13 : 0.2);
        if (star.x > width + 8) star.x = -8;
        if (star.y > height + 8) star.y = -8;
      }

      const twinkle = Math.sin(time * 0.001 * star.twinkle + star.phase);
      const alpha = Math.max(0.08, star.alpha + twinkle * (star.layer === "far" ? 0.05 : 0.16));
      const x = star.x + parallax * (star.layer === "near" ? 1 : star.layer === "mid" ? 0.48 : 0.18);
      const y = star.y;

      if (star.layer === "near") {
        const glow = context.createRadialGradient(x, y, 0, x, y, star.r * 5.5);
        glow.addColorStop(0, `rgba(${star.hue}, ${alpha * 0.24})`);
        glow.addColorStop(1, `rgba(${star.hue}, 0)`);
        context.fillStyle = glow;
        context.beginPath();
        context.arc(x, y, star.r * 5.5, 0, TAU);
        context.fill();
      }

      context.fillStyle = `rgba(${star.hue}, ${alpha})`;
      context.beginPath();
      context.arc(x, y, star.r, 0, TAU);
      context.fill();
    });
  };

  const drawGoldDust = (time) => {
    const galaxy = getGalaxy();
    const phase = reducedMotion ? 0 : time;
    const sinTilt = Math.sin(galaxy.tilt);
    const cosTilt = Math.cos(galaxy.tilt);

    context.save();
    context.globalCompositeOperation = "screen";

    dust.forEach((particle) => {
      const angle = particle.angle + phase * particle.speed;
      const ringRadius = galaxy.radius * (1 + particle.orbit);
      const localX = Math.cos(angle) * ringRadius;
      const localY = Math.sin(angle) * ringRadius * galaxy.scaleY + particle.spread;
      const rotated = {
        x: localX * cosTilt - localY * sinTilt,
        y: localX * sinTilt + localY * cosTilt
      };
      const x = galaxy.x + rotated.x;
      const y = galaxy.y + rotated.y;

      if (x < -40 || x > width + 40 || y < -40 || y > height + 40) {
        return;
      }

      const shimmer = 0.68 + Math.sin(time * 0.0012 + particle.phase) * 0.32;
      const alpha = Math.max(0.04, particle.alpha * shimmer);
      const glow = context.createRadialGradient(x, y, 0, x, y, particle.r * 5.2);
      glow.addColorStop(0, `rgba(${particle.color}, ${alpha * 0.38})`);
      glow.addColorStop(1, `rgba(${particle.color}, 0)`);
      context.fillStyle = glow;
      context.beginPath();
      context.arc(x, y, particle.r * 5.2, 0, TAU);
      context.fill();

      context.fillStyle = `rgba(${particle.color}, ${alpha})`;
      context.beginPath();
      context.arc(x, y, particle.r, 0, TAU);
      context.fill();
    });

    context.restore();
  };

  const drawMeteors = (time) => {
    if (!reducedMotion && time > nextMeteorAt && meteors.length < 2) {
      meteors.push({
        x: randomBetween(width * 0.42, width * 0.98),
        y: randomBetween(-height * 0.08, height * 0.28),
        length: randomBetween(90, isMobile() ? 130 : 190),
        speed: randomBetween(0.62, 0.96),
        life: 0,
        maxLife: randomBetween(900, 1500),
        angle: randomBetween(2.24, 2.48)
      });
      nextMeteorAt = time + randomBetween(9000, isMobile() ? 18000 : 14000);
    }

    meteors = meteors.filter((meteor) => meteor.life < meteor.maxLife && meteor.x > -meteor.length && meteor.y < height + meteor.length);
    meteors.forEach((meteor) => {
      meteor.life += Math.max(16, lastTime ? time - lastTime : 16);
      if (!reducedMotion) {
        meteor.x += Math.cos(meteor.angle) * meteor.speed * 3.2;
        meteor.y += Math.sin(meteor.angle) * meteor.speed * 3.2;
      }

      const tailX = meteor.x - Math.cos(meteor.angle) * meteor.length;
      const tailY = meteor.y - Math.sin(meteor.angle) * meteor.length;
      const alpha = Math.sin(Math.min(1, meteor.life / meteor.maxLife) * Math.PI) * 0.32;
      const gradient = context.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
      gradient.addColorStop(0, `rgba(224, 242, 254, ${alpha})`);
      gradient.addColorStop(0.32, `rgba(56, 189, 248, ${alpha * 0.42})`);
      gradient.addColorStop(1, "rgba(56, 189, 248, 0)");
      context.strokeStyle = gradient;
      context.lineWidth = isMobile() ? 1 : 1.35;
      context.beginPath();
      context.moveTo(meteor.x, meteor.y);
      context.lineTo(tailX, tailY);
      context.stroke();
    });
  };

  const drawSubtleGrid = (time) => {
    const mobile = isMobile();
    const spacing = mobile ? 112 : 96;
    const wave = reducedMotion ? 0 : time * 0.00013;

    context.save();
    context.strokeStyle = mobile ? "rgba(34, 211, 238, 0.026)" : "rgba(34, 211, 238, 0.034)";
    context.lineWidth = 1;

    for (let y = height * 0.46; y < height + spacing; y += spacing) {
      context.beginPath();
      for (let x = -spacing; x <= width + spacing; x += 26) {
        const py = y + Math.sin(x * 0.008 + wave + y * 0.003) * (mobile ? 8 : 13);
        if (x <= -spacing) context.moveTo(x, py);
        else context.lineTo(x, py);
      }
      context.stroke();
    }
    context.restore();
  };

  const render = (time = 0) => {
    context.clearRect(0, 0, width, height);
    drawSpaceBase(time);
    drawNebulaBands(time);
    drawGalaxyRing(time);
    drawStars(time);
    drawGoldDust(time);
    drawMeteors(time);
    drawSubtleGrid(time);
    lastTime = time;
  };

  const animate = (time) => {
    if (!running) {
      return;
    }

    if (!document.hidden) {
      frameSkip += 1;
      const skip = reducedMotion ? 24 : isMobile() ? 2 : 1;
      if (frameSkip >= skip) {
        frameSkip = 0;
        render(time);
      }
    }

    rafId = reducedMotion ? 0 : window.requestAnimationFrame(animate);
  };

  const startAnimation = () => {
    if (!running || reducedMotion || rafId) {
      return;
    }
    rafId = window.requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("mousemove", (event) => {
    if (isMobile()) {
      return;
    }
    pointerX = event.clientX;
    pointerY = event.clientY;
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAnimation();
      return;
    }
    render(performance.now());
    startAnimation();
  });

  reducedMotionQuery?.addEventListener?.("change", (event) => {
    reducedMotion = Boolean(event.matches);
    stopAnimation();
    buildScene();
    render(performance.now());
    startAnimation();
  });

  resize();
  render(0);
  startAnimation();

  window.addEventListener("beforeunload", () => {
    running = false;
    stopAnimation();
  });
};

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
    <h2>历史订单状态</h2>
    <p>订单号：<strong>${escapeHtml(order.id)}</strong></p>
    <p>商品名：${escapeHtml(order.productTitle)}</p>
    <p>金额：${escapeHtml(order.amount || "¥0")}</p>
    <p>新订单请前往自动发货平台处理；本站不会显示或发放真实卡密。</p>
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
        <p>当前下单、付款与发货统一由自动发货平台完成。本站仅展示服务说明，不再创建自建人工付款订单。</p>
        <a class="button primary" href="${PAY_PLATFORM_URL}" target="_blank" rel="noopener noreferrer">前往自动发货平台</a>
        <button class="button secondary compact-button" type="button" data-copy-wechat>复制微信 ${escapeHtml(WECHAT_ID)}</button>
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
    container.dataset.state = "offline";
    container.innerHTML = `
      <article class="payment-status-card">
        <p class="eyebrow">Payment Deprecated</p>
        <h1>付款入口已切换</h1>
        <p>当前已切换为自动发货平台下单，付款与发货请以平台页面为准。本站不再创建自建人工付款订单。</p>
        <div class="payment-actions">
          <a class="button primary compact-button" href="${PAY_PLATFORM_URL}" target="_blank" rel="noopener noreferrer">前往自动发货平台</a>
          <button class="button secondary compact-button" type="button" data-copy-wechat>复制微信 ${escapeHtml(WECHAT_ID)}</button>
        </div>
      </article>
    `;
    return;
  }

  setState("正在读取订单信息...");

  fetchOrderDetail(orderId).then((detail) => {
    if (!detail?.order) {
      setState(detail?.notFound ? "未找到该订单，请检查订单号。" : "订单系统暂时不可用，请稍后再试。", "offline");
      return;
    }

    const order = detail.order;
    container.dataset.state = "connected";
    container.innerHTML = `
      <section class="section payment-detail-grid">
        <article class="payment-status-card">
          <p class="eyebrow">Historical Order</p>
          <h1>历史订单状态</h1>
          <p>当前已切换为自动发货平台下单，新的付款与发货请以平台页面为准。此页仅保留历史订单状态查看，不再作为新订单付款入口。</p>
          <div class="order-result-grid payment-order-summary">
            <p><span>订单号</span><strong>${escapeHtml(order.id)}</strong></p>
            <p><span>商品名称</span><strong>${escapeHtml(order.productTitle)}</strong></p>
            <p><span>金额</span><strong>${escapeHtml(order.amount || "¥0")}</strong></p>
            <p><span>当前状态</span><strong>${escapeHtml(order.status || "pending")}</strong></p>
            <p><span>发货状态</span><strong>${escapeHtml(order.deliveryStatus || "等待人工确认")}</strong></p>
          </div>
          <div class="payment-actions">
            <button class="button secondary compact-button" type="button" data-copy-order-id="${escapeHtml(order.id)}">复制订单号</button>
            <a class="button secondary compact-button" href="/order.html?id=${encodeURIComponent(order.id)}">查看历史订单状态</a>
            <a class="button primary compact-button" href="${PAY_PLATFORM_URL}" target="_blank" rel="noopener noreferrer">前往自动发货平台</a>
          </div>
        </article>

        <article class="payment-instructions-card">
          <p class="eyebrow">New Orders</p>
          <h2>新订单请使用自动发货平台</h2>
          <p>本站不再提供自建人工付款入口，也不会在页面显示真实卡密。请进入自动发货平台查看商品规则、付款方式、发货结果和售后说明。</p>
          <div class="payment-actions">
            <a class="button primary compact-button" href="${PAY_PLATFORM_URL}" target="_blank" rel="noopener noreferrer">进入自动发货平台</a>
            <button class="button secondary compact-button" type="button" data-copy-wechat>复制微信 ${escapeHtml(WECHAT_ID)}</button>
          </div>
        </article>
      </section>
    `;
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

const copyTextWithFallback = async (text) => {
  const value = String(text || "");

  if (!value) {
    return false;
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the textarea-based copy path.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  textarea.remove();
  return copied;
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

initCosmicBackground();

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
}

document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const rawHref = link.getAttribute("href") || "";
    const linkUrl = new URL(rawHref, window.location.origin);
    const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
    const linkPath = linkUrl.pathname.replace(/\/$/, "") || "/";
    const target = linkUrl.hash && linkPath === currentPath ? document.querySelector(linkUrl.hash) : null;

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    navLinks?.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("click", async (event) => {
  const copyButton = event.target.closest("[data-copy-wechat]");

  if (!copyButton) {
    return;
  }

  await copyTextWithFallback(WECHAT_ID);
  showToast(`微信号已复制：${WECHAT_ID}`);
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
