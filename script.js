const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector("#mobile-menu");

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) {
      return;
    }
    event.preventDefault();
    document.body.dataset.navigationTarget = target.id;
    window.clearTimeout(window.navigationTargetTimer);
    window.navigationTargetTimer = window.setTimeout(() => {
      if (document.body.dataset.navigationTarget === target.id) {
        delete document.body.dataset.navigationTarget;
        window.dispatchEvent(new Event("scroll"));
      }
    }, 1500);
    document
      .querySelectorAll(".desktop-nav a, .mobile-nav a")
      .forEach((item) => {
        item.classList.toggle(
          "active",
          item.getAttribute("href") === link.getAttribute("href"),
        );
      });
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

function updateCarouselControls(carousel) {
  const track = carousel.querySelector("[data-carousel-track]");
  const previous = carousel.querySelector('[data-carousel-direction="-1"]');
  const next = carousel.querySelector('[data-carousel-direction="1"]');
  if (!track || !previous || !next) return;
  const maximumScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  previous.disabled = track.scrollLeft <= 2;
  next.disabled = track.scrollLeft >= maximumScroll - 2;
}

function initializeCarousels() {
  document.querySelectorAll("[data-carousel]").forEach(updateCarouselControls);
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-carousel-direction]");
  if (button && !button.disabled) {
    const carousel = button.closest("[data-carousel]");
    const track = carousel.querySelector("[data-carousel-track]");
    const firstItem = track.firstElementChild;
    const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
    const distance = (firstItem?.getBoundingClientRect().width || track.clientWidth) + gap;
    const maximumScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const target = Math.max(
      0,
      Math.min(
        maximumScroll,
        track.scrollLeft +
          distance * Number(button.dataset.carouselDirection),
      ),
    );
    track.scrollTo({
      left: target,
      behavior: "smooth",
    });
    window.setTimeout(() => updateCarouselControls(carousel), 350);
  }
});

document.addEventListener(
  "scroll",
  (event) => {
    if (event.target.matches?.("[data-carousel-track]")) {
      updateCarouselControls(event.target.closest("[data-carousel]"));
    }
  },
  true,
);

window.addEventListener("resize", initializeCarousels);

document.querySelectorAll("[data-contact-action]").forEach((button) => {
  button.addEventListener("click", () => {
    if (
      button.dataset.contactAction === "call" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches
    ) {
      window.location.href = button.dataset.contactHref;
      return;
    }

    const details = document.querySelector(
      `#${button.getAttribute("aria-controls")}`,
    );
    const willOpen = details.hidden;
    document.querySelectorAll(".contact-action-details").forEach((item) => {
      item.hidden = true;
    });
    document.querySelectorAll("[data-contact-action]").forEach((item) => {
      item.setAttribute("aria-expanded", "false");
    });
    details.hidden = !willOpen;
    button.setAttribute("aria-expanded", String(willOpen));
  });
});

document.querySelectorAll("[data-copy-value]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copyValue;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    const originalText = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = originalText;
    }, 1400);
  });
});

if (menuButton && mobileMenu) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    mobileMenu.hidden = isOpen;
  });

  mobileMenu.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      menuButton.setAttribute("aria-expanded", "false");
      mobileMenu.hidden = true;
    }
  });
}

function initializeReviewForms() {
  document.querySelectorAll("[data-review-form]").forEach((form) => {
    if (form.dataset.reviewReady === "true") return;
    form.dataset.reviewReady = "true";
    const subjectFields = form.querySelectorAll("[data-review-subject]");
    const company = form.dataset.company;
    form.querySelectorAll('input[name="stars"]').forEach((field) => {
      field.addEventListener("change", () => {
        const subject = `New ${field.value}-star customer review for ${company}`;
        subjectFields.forEach((subjectField) => {
          subjectField.value = subject;
        });
      });
    });
  });
}

const web3FormsCaptchaSiteKey = "50b2fe65-b00b-4b9e-ad62-3ba471098be2";
const captchaWidgetIds = new WeakMap();

function loadWeb3FormsCaptcha() {
  if (!document.querySelector(".h-captcha")) return Promise.resolve();
  const existing = document.querySelector(
    'script[src*="js.hcaptcha.com/1/api.js"]',
  );
  if (existing) {
    return existing.dataset.loaded === "true"
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          existing.addEventListener("load", resolve, { once: true });
          existing.addEventListener("error", reject, { once: true });
        });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://js.hcaptcha.com/1/api.js?recaptchacompat=off&render=explicit";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () => {
      reject(new Error("Could not load the CAPTCHA service."));
    });
    document.head.append(script);
  });
}

function initializeCaptchaForms() {
  document.querySelectorAll(".h-captcha").forEach((captcha) => {
    const form = captcha.closest("form");
    if (!form || form.dataset.captchaReady === "true") return;
    const widgetId = window.hcaptcha.render(captcha, {
      sitekey: web3FormsCaptchaSiteKey,
    });
    captchaWidgetIds.set(captcha, widgetId);
    form.dataset.captchaReady = "true";
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (
        form.dataset.formKind === "review" &&
        !form.querySelector('input[name="stars"]:checked')
      ) {
        showFormToast("Please select a star rating before submitting.", true);
        return;
      }
      const response = form.querySelector(
        'textarea[name="h-captcha-response"]',
      );
      if (!response?.value) {
        showFormToast("Please complete the CAPTCHA before submitting.", true);
        return;
      }
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton?.textContent;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting…";
      }
      let submissionAttempted = false;
      try {
        submissionAttempted = true;
        const result = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        const responseText = await result.text();
        let responseData = {};
        if (responseText) {
          try {
            responseData = JSON.parse(responseText);
          } catch {
            responseData = {};
          }
        }
        if (!result.ok || responseData.success === false) {
          throw new Error(
            responseData.message || "The form could not be submitted.",
          );
        }
        form.reset();
        showFormToast("Thank you. Your submission was sent successfully.");
      } catch (error) {
        showFormToast(error.message || "The form could not be submitted.", true);
      } finally {
        if (submissionAttempted) {
          try {
            window.hcaptcha.reset(captchaWidgetIds.get(captcha));
          } catch (resetError) {
            console.error("Could not reset CAPTCHA.", resetError);
          }
        }
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  });
}

function showFormToast(message, isError = false) {
  let toast = document.querySelector("#form-status-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "form-status-toast";
    toast.className = "form-status-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("visible");
  window.clearTimeout(window.formToastTimer);
  window.formToastTimer = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 4200);
}

async function initializeWeb3FormsCaptcha() {
  try {
    await loadWeb3FormsCaptcha();
    initializeCaptchaForms();
  } catch (error) {
    document.querySelectorAll(".captcha-field").forEach((field) => {
      field.textContent = error.message;
      field.classList.add("data-status", "error");
    });
  }
}

const copyrightYears = document.querySelector("#copyright-years");
const currentYear = new Date().getFullYear();
const startYear = Number(copyrightYears.dataset.startYear);
copyrightYears.textContent =
  startYear < currentYear ? `${startYear}–${currentYear}` : String(currentYear);
initializeCarousels();
initializeReviewForms();
initializeWeb3FormsCaptcha();


function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}

async function loadJson(path) {
  if (window.location.protocol === "file:") {
    throw new Error(
      "Open this website through start.command or a web host to load JSON data.",
    );
  }
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load ${path} (${response.status}).`);
  }
  return response.json();
}

function safeHttpUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function safeAssetUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function youtubeEmbedUrl(value) {
  const safeUrl = safeHttpUrl(value);
  if (!safeUrl) return "";
  const url = new URL(safeUrl);
  const host = url.hostname.replace(/^www\./, "");
  let videoId = "";
  if (host === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] || "";
  } else if (["youtube.com", "m.youtube.com"].includes(host)) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v") || "";
    } else if (
      url.pathname.startsWith("/embed/") ||
      url.pathname.startsWith("/shorts/")
    ) {
      videoId = url.pathname.split("/").filter(Boolean)[1] || "";
    }
  }
  return /^[A-Za-z0-9_-]{6,20}$/.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : "";
}

function renderServiceMedia(service) {
  const video = safeHttpUrl(service.video);
  const youtube = youtubeEmbedUrl(video);
  if (youtube) {
    return `<div class="service-media service-video"><iframe src="${escapeHtml(youtube)}" title="${escapeHtml(service.title)} video" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  const host = video ? new URL(video).hostname : "";
  if (video && (host.endsWith("facebook.com") || host.endsWith("fb.watch"))) {
    const embed = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video)}&show_text=false`;
    return `<div class="service-media service-video"><iframe src="${escapeHtml(embed)}" title="${escapeHtml(service.title)} video" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  const image = safeAssetUrl(service.image);
  return image
    ? `<div class="service-media"><img src="${escapeHtml(image)}" alt="${escapeHtml(service.title)}" loading="lazy" /></div>`
    : "";
}

async function renderServices() {
  const list = document.querySelector("#service-list");
  const status = document.querySelector("#services-status");
  if (!list) return;
  try {
    const services = await loadJson("data/services/services.json");
    if (!Array.isArray(services)) throw new Error("services.json must contain a list.");
    list.innerHTML = services
      .map(
        (service, index) => `
          <article class="service-card">
            ${renderServiceMedia(service)}
            <div class="service-card-content">
              <span class="service-number">${String(index + 1).padStart(2, "0")}</span>
              <h3>${escapeHtml(service.title)}</h3>
              <p>${escapeHtml(service.description)}</p>
              <div class="service-card-footer">
                ${service.price ? `<strong class="service-price">${escapeHtml(service.price)}</strong>` : ""}
                ${
                  safeHttpUrl(service.link)
                    ? `<a class="service-link" href="${escapeHtml(safeHttpUrl(service.link))}" target="_blank" rel="noopener noreferrer">View service <span aria-hidden="true">↗</span></a>`
                    : ""
                }
                ${
                  safeHttpUrl(service.paymentLink)
                    ? `<a class="service-payment-link" href="${escapeHtml(safeHttpUrl(service.paymentLink))}" target="_blank" rel="noopener noreferrer">Pay now <span aria-hidden="true">↗</span></a>`
                    : ""
                }
              </div>
            </div>
          </article>`,
      )
      .join("");
    status.hidden = true;
  } catch (error) {
    status.textContent = error.message;
    status.classList.add("error");
  }
}

async function renderReviews() {
  const list = document.querySelector("#review-list");
  const status = document.querySelector("#reviews-status");
  if (!list) return;
  try {
    const reviews = await loadJson("data/reviews/reviews.json");
    if (!Array.isArray(reviews)) throw new Error("reviews.json must contain a list.");
    if (reviews.length === 0) {
      status.textContent = "No reviews have been published yet.";
      list.closest("[data-carousel]")?.setAttribute("hidden", "");
      return;
    }
    list.innerHTML = reviews
      .map(
        (item) => `
          <blockquote>
            ${
              Number.isInteger(Number(item.stars)) &&
              Number(item.stars) >= 1 &&
              Number(item.stars) <= 5
                ? `<div class="review-stars" aria-label="${Number(item.stars)} out of 5 stars">${"★".repeat(Number(item.stars))}<span aria-hidden="true">${"★".repeat(5 - Number(item.stars))}</span></div>`
                : ""
            }
            <span class="quote-mark">“</span>
            <p>${escapeHtml(item.review)}</p>
            <footer>
              <strong>${escapeHtml(item.name)}</strong>
              ${item.date ? `<time datetime="${escapeHtml(item.date)}">${escapeHtml(formatReviewDate(item.date))}</time>` : ""}
            </footer>
          </blockquote>`,
      )
      .join("");
    status.hidden = true;
  } catch (error) {
    status.textContent = error.message;
    status.classList.add("error");
  }
}

function formatReviewDate(value) {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

async function renderGallery() {
  const list = document.querySelector("#gallery-list");
  const status = document.querySelector("#gallery-status");
  if (!list) return;
  try {
    const images = await loadJson("data/gallery/gallery.json");
    if (!Array.isArray(images)) throw new Error("gallery.json must contain a list.");
    list.innerHTML = images
      .map(
        (image) => `
          <figure>
            <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || "")}" loading="lazy" />
          </figure>`,
      )
      .join("");
    status.hidden = true;
  } catch (error) {
    status.textContent = error.message;
    status.classList.add("error");
  }
}

async function loadHomeSections() {
  const container = document.querySelector("#home-sections");
  if (!container) return;
  const status = document.querySelector("#home-sections-status");
  const pages = (container.dataset.pages || "").split(",").filter(Boolean);
  try {
    const pageDocuments = await Promise.all(
      pages.map(async (page) => {
        const response = await fetch(page, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Could not load ${page} (${response.status}).`);
        }
        const source = await response.text();
        const parsed = new DOMParser().parseFromString(source, "text/html");
        const main = parsed.querySelector("main");
        if (!main) throw new Error(`${page} does not contain a main section.`);
        return { page, content: main.innerHTML };
      }),
    );

    status.remove();
    pageDocuments.forEach(({ page, content }) => {
      const section = document.createElement("section");
      section.className = "home-page-section";
      section.id = page.replace(/\.html$/, "");
      section.innerHTML = content;
      container.append(section);
    });
  } catch (error) {
    status.textContent = error.message;
    status.classList.add("error");
  }
}

function initializeHomeNavigation() {
  const container = document.querySelector("#home-sections");
  if (!container) return;
  const targets = [
    document.querySelector("#top"),
    ...container.querySelectorAll(".home-page-section"),
  ].filter(Boolean);
  let currentId = "";
  let frameRequested = false;

  function updateActiveNavigation() {
    frameRequested = false;
    const requestedId = document.body.dataset.navigationTarget;
    let activeTarget = requestedId
      ? targets.find((target) => target.id === requestedId)
      : null;
    if (!activeTarget) {
      const viewportTop = 80;
      const viewportBottom = window.innerHeight;
      let largestVisibleArea = -1;
      for (const target of targets) {
        const bounds = target.getBoundingClientRect();
        const visibleArea = Math.max(
          0,
          Math.min(bounds.bottom, viewportBottom) -
            Math.max(bounds.top, viewportTop),
        );
        if (visibleArea > largestVisibleArea) {
          largestVisibleArea = visibleArea;
          activeTarget = target;
        }
      }
    }

    if (
      !requestedId &&
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 4
    ) {
      activeTarget = targets[targets.length - 1];
    }

    if (!activeTarget || activeTarget.id === currentId) return;
    currentId = activeTarget.id;
    const href = `#${currentId}`;
    document.body.dataset.currentSection = currentId;
    document
      .querySelectorAll(".desktop-nav a, .mobile-nav a")
      .forEach((link) => {
        const isActive = link.getAttribute("href") === href;
        link.classList.toggle("active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
  }

  function requestNavigationUpdate() {
    const requestedId = document.body.dataset.navigationTarget;
    if (requestedId) {
      window.clearTimeout(window.navigationTargetTimer);
      window.navigationTargetTimer = window.setTimeout(() => {
        if (document.body.dataset.navigationTarget === requestedId) {
          delete document.body.dataset.navigationTarget;
          requestNavigationUpdate();
        }
      }, 180);
    }
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(updateActiveNavigation);
  }

  window.addEventListener("scroll", requestNavigationUpdate, { passive: true });
  window.addEventListener("resize", requestNavigationUpdate);
  updateActiveNavigation();
}

async function initializeDataPages() {
  await loadHomeSections();
  await initializeWeb3FormsCaptcha();
  await Promise.all([renderServices(), renderReviews(), renderGallery()]);
  initializeReviewForms();
  initializeCarousels();
  initializeHomeNavigation();
  if (window.location.hash) {
    document.querySelector(window.location.hash)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

initializeDataPages();
