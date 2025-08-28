"use strict";

// Topaz Portfolio — Interactions (toast-only, hardened)
// Features:
// 1) Reveal-on-scroll (About / Project cards / Footer)
// 2) ScrollSpy (highlight active nav link)
// 3) Smooth scroll for nav links
// 4) Email: copy-to-clipboard + global toast (10s) + then open mailto

/* ------------------------------------
 * Global Toast helper (auto-create + inline fallback)
 * ------------------------------------ */
function showToast(message, ms = 10000) {
  // Ensure element exists
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
    document.body.appendChild(el);
  }

  // Minimal inline fallback styling (in case CSS isn't applied)
  const cs = window.getComputedStyle(el);
  const cssLooksApplied =
    cs.transitionDuration !== "0s" || cs.opacity !== "" || cs.opacity === "0";
  if (!cssLooksApplied) {
    Object.assign(el.style, {
      position: "fixed",
      left: "50%",
      bottom: "24px",
      transform: "translateX(-50%) translateY(16px)",
      minWidth: "min(560px, 92vw)",
      maxWidth: "92vw",
      padding: "12px 16px",
      borderRadius: "12px",
      background: "#111",
      color: "#fff",
      border: "1px solid #333",
      boxShadow: "0 18px 40px rgba(0,0,0,.45)",
      fontSize: "14px",
      zIndex: "99999",
      opacity: "0",
      transition: "opacity .25s ease, transform .25s ease",
      pointerEvents: "none",
    });
  }

  // Show / hide
  el.textContent = message;
  clearTimeout(showToast._t);

  // Prefer class toggle if CSS exists; otherwise animate inline
  if ([...document.styleSheets].length) {
    el.classList.add("show");
    showToast._t = setTimeout(() => el.classList.remove("show"), ms);
  } else {
    el.style.opacity = "1";
    el.style.transform = "translateX(-50%)";
    showToast._t = setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateX(-50%) translateY(16px)";
    }, ms);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------------------------
   * 1) Reveal-on-scroll
   * ------------------------------------ */
  const revealTargets = [
    ...document.querySelectorAll(".section.section--about"),
    ...document.querySelectorAll(".project-card"),
    ...document.querySelectorAll(".site-footer"),
  ];

  const reveal = (el) => el.classList.add("is-visible");

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealTargets.forEach((el) => io.observe(el));

  /* ------------------------------------
   * 2) ScrollSpy
   * ------------------------------------ */
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean); // e.g. [#about, #projects, #contact]

  const setActiveById = (id) => {
    navLinks.forEach((a) => {
      const isActive = a.getAttribute("href") === `#${id}`;
      a.classList.toggle("is-active", isActive);
      if (isActive) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  };

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        if (id) setActiveById(id);
      });
    },
    {
      rootMargin: "-35% 0px -50% 0px",
      threshold: 0.01,
    }
  );

  sections.forEach((sec) => spy.observe(sec));

  // Edge case: bottom of page => mark #contact as active
  const atBottom = () =>
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 2;

  window.addEventListener("scroll", () => {
    if (atBottom() && document.getElementById("contact")) setActiveById("contact");
  });

  /* ------------------------------------
   * 3) Smooth scroll (nav)
   * ------------------------------------ */
  navLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      setActiveById(href.slice(1));

      // Smooth scroll
      target.scrollIntoView({ behavior: "smooth", block: "start" });

      // Update URL hash (no scroll jump because we've prevented default)
      try {
        history.pushState(null, "", href);
      } catch (_) {
        // no-op
      }
    });
  });

  /* ------------------------------------
   * 4) Email: copy (then toast 10s) + open mailto
   * ------------------------------------ */
  const emailLinks = document.querySelectorAll(".js-copy-email");

  const copyText = async (text) => {
    if (!text) return false;

    // Clipboard API (secure contexts)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback: hidden textarea
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    Object.assign(ta.style, {
      position: "fixed",
      opacity: "0",
      left: "-9999px",
      top: "0",
    });
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (_) {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  };

  emailLinks.forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault(); // ensure copy + toast before navigation

      const email = link.dataset.email || "";
      const mailto = link.getAttribute("href") || `mailto:${email}`;

      try {
        await copyText(email);
        showToast(`Email copied: ${email}`, 10000); // 10 seconds
      } catch (_) {
        showToast(`Open your mail app to contact: ${email}`, 6000);
      }

      // Trigger mailto shortly after feedback starts
      setTimeout(() => {
        window.location.href = mailto;
      }, 150);
    });
  });
});