"use strict";

/* ==========================================================================
   Topaz Portfolio — Interactions
   1) Reveal-on-scroll
   2) ScrollSpy
   3) Smooth scroll
   4) Email: copy + toast + mailto
   5) GitHub Projects: fetch → cache → render
   ========================================================================== */

/* ------------------------------------
 * Global Toast helper (10s default)
 * ------------------------------------ */
function showToast(message, ms = 10000) {
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

  // אם אין CSS לטוסט – נותנים סטייל בסיסי inline
  const cs = window.getComputedStyle(el);
  const hasCss =
    cs.transitionDuration !== "0s" || cs.opacity !== "" || cs.opacity === "0";
  if (!hasCss) {
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

  el.textContent = message;
  clearTimeout(showToast._t);

  // אם יש מחלקת .toast .show ב־CSS – נשתמש בה; אחרת פולבאק inline
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

  const registerReveal = (el) => io.observe(el);
  revealTargets.forEach((el) => registerReveal(el));

  /* ------------------------------------
   * 2) ScrollSpy
   * ------------------------------------ */
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean); // [#about, #projects, #contact]

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
    { rootMargin: "-35% 0px -50% 0px", threshold: 0.01 }
  );
  sections.forEach((sec) => spy.observe(sec));

  // אם ממש בתחתית – הדלק "Contact"
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
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      try { history.pushState(null, "", href); } catch (_) {}
    });
  });

  /* ------------------------------------
   * 4) Email: copy + toast + mailto
   * ------------------------------------ */
  const emailLinks = document.querySelectorAll(".js-copy-email");

  const copyText = async (text) => {
    if (!text) return false;
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // פולבאק: textarea זמני
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
    try { ok = document.execCommand("copy"); } catch (_) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  };

  emailLinks.forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = link.dataset.email || "";
      const mailto = link.getAttribute("href") || `mailto:${email}`;

      try {
        await copyText(email);
        showToast(`Email copied: ${email}`, 10000);
      } catch (_) {
        showToast(`Open your mail app to contact: ${email}`, 6000);
      }

      setTimeout(() => { window.location.href = mailto; }, 150);
    });
  });

  /* ------------------------------------
   /* ------------------------------------
 * 5) GitHub Projects (fetch → cache → render)
 * ------------------------------------ */
(function loadGitHubProjects() {
  const USER = "TopazLah"; // ודא שזה בדיוק ה־username שלך
  const API  = `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`;

  const grid = document.getElementById("projects-grid");
  const tpl  = document.getElementById("project-card-template");
  if (!grid || !tpl) {
    console.error("[Projects] Missing #projects-grid or #project-card-template");
    showToast("Projects container not found.", 5000);
    return;
  }

  // ניקוי שלדי טעינה
  const cleanSkeletons = () =>
    grid.querySelectorAll(".is-skeleton").forEach((el) => el.remove());

  // קאש פשוט (30 דק’)
  const CACHE_KEY = "gh_repos_cache_v1";
  const now = Date.now();
  const fromCache = (() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data?.time || !data?.items) return null;
      if (now - data.time > 30 * 60 * 1000) return null;
      return data.items;
    } catch { return null; }
  })();

  const prettyName = (n) =>
    n.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const timeAgo = (iso) => {
    const d = new Date(iso);
    const diff = Math.max(0, (Date.now() - d.getTime()) / 1000);
    const units = [
      ["y", 31536000],
      ["mo", 2592000],
      ["d", 86400],
      ["h", 3600],
      ["m", 60],
    ];
    for (const [u, s] of units) {
      const v = Math.floor(diff / s);
      if (v >= 1) return `${v}${u} ago`;
    }
    return "just now";
  };

  const makeCard = (repo) => {
    const node = tpl.content.firstElementChild.cloneNode(true);

    node.querySelector(".project-title").textContent = prettyName(repo.name);
    node.querySelector(".project-desc").textContent =
      repo.description || "No description provided.";
    node.querySelector(".github-link").href = repo.html_url;

    // meta
    const meta = node.querySelector(".project-meta");
    if (repo.language) {
      const lang = document.createElement("span");
      lang.className = "tag";
      lang.textContent = repo.language;
      meta.appendChild(lang);
    }
    const stars = document.createElement("span");
    stars.className = "tag";
    stars.textContent = `★ ${repo.stargazers_count || 0}`;
    meta.appendChild(stars);

    const upd = document.createElement("span");
    upd.className = "tag";
    upd.textContent = `Updated ${timeAgo(repo.updated_at)}`;
    meta.appendChild(upd);

    // קישור Live אם יש homepage תקין
    const live = node.querySelector(".live-link");
    if (repo.homepage && /^https?:\/\//i.test(repo.homepage)) {
      live.href = repo.homepage;
      live.hidden = false;
    }

    // מצב התחלתי “מוסתר” (לא חובה אם עברת למודל .reveal, אבל זה בטוח)
    node.style.opacity = "0";
    node.style.transform = "translateY(10px)";

    return node;
  };

  const renderList = (repos) => {
    cleanSkeletons();

    const list = (repos || [])
      .filter((r) => !r.fork && !r.archived)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 9);

    console.log(`[Projects] fetched=${repos?.length || 0}, rendered=${list.length}`);

    grid.innerHTML = "";
    if (!list.length) {
      const p = document.createElement("p");
      p.className = "section-text";
      p.textContent = "No public repositories to show.";
      grid.appendChild(p);
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach((repo) => frag.appendChild(makeCard(repo)));
    grid.appendChild(frag);

    // ✅ מבטיח שהכרטיסים לא יישארו שקופים:
    requestAnimationFrame(() => {
      grid.querySelectorAll(".project-card").forEach((card) => {
        card.classList.add("is-visible"); // אם יש לך מודל .reveal — שנה ל .reveal.is-visible
        // בנוסף ננקה inline styles כדי לתת ל-CSS לשלוט:
        card.style.opacity = "";
        card.style.transform = "";
      });
    });
  };

  // שימוש בקאש (אם יש) כדי לא להראות ריק
  if (fromCache) {
    renderList(fromCache);
  }

  // פנייה לרשת
  fetch(API)
    .then((r) => {
      if (!r.ok) throw new Error(`GitHub API ${r.status} ${r.statusText}`);
      return r.json();
    })
    .then((items) => {
      renderList(items);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ time: now, items }));
      } catch {}
    })
    .catch((err) => {
      console.error("[Projects] fetch error:", err);
      if (!fromCache) {
        cleanSkeletons();
        showToast("Failed to load GitHub projects. See console for details.", 6000);
      }
    });
})();
});