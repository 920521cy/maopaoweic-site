const year = document.querySelector("#year");
const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelector(".nav-links");
const navItems = document.querySelectorAll(".nav-links a");
const sections = document.querySelectorAll("main section[id]");
const clothLabRoot = document.querySelector("[data-cloth-lab]");

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

document.querySelectorAll("[data-demo-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const message = button.getAttribute("data-demo-action") || "功能正在开发中";
    showToast(message);
  });
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
