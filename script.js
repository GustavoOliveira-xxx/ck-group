(() => {
  "use strict";

  const header = document.querySelector("body > header");
  const nav = header?.querySelector("nav");
  const navLinks = nav ? [...nav.querySelectorAll("a[href^='#']")] : [];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  /* ---- Mobile menu toggle ---- */
  let toggle = header?.querySelector(".nav-toggle");

  if (header && nav && !toggle) {
    toggle = document.createElement("button");
    toggle.className = "nav-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Abrir menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = "<span></span>";
    header.appendChild(toggle);
  }

  const closeMenu = () => {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
  };

  toggle?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  /* ---- Navbar scroll behavior ---- */
  let lastScrollY = window.scrollY;
  let ticking = false;

  const updateHeader = () => {
    const y = window.scrollY;

    header?.classList.toggle("is-scrolled", y > 24);

    if (y > 120) {
      if (y > lastScrollY + 8) {
        header?.classList.add("is-hidden");
      } else if (y < lastScrollY - 8) {
        header?.classList.remove("is-hidden");
      }
    } else {
      header?.classList.remove("is-hidden");
    }

    lastScrollY = y;
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });

  updateHeader();

  /* ---- Active nav link (scroll spy) ---- */
  const setActiveLink = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
    });
  };

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
          .forEach((entry) => setActiveLink(entry.target.id));
      },
      {
        root: null,
        rootMargin: "-45% 0px -45% 0px",
        threshold: [0.15, 0.35, 0.55],
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* ---- Reveal on scroll ---- */
  const revealTargets = document.querySelectorAll(
    ".hero-content, main > section > header, main article, .project-status, .classroom, .members, #contato address, footer"
  );

  revealTargets.forEach((el, index) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${Math.min(index * 0.05, 0.35)}s`;
  });

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---- Animated scrollbar progress (subtle top line) ---- */
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  const progressStyle = document.createElement("style");
  progressStyle.textContent = `
    .scroll-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      width: 0;
      z-index: 1100;
      background: linear-gradient(90deg, var(--purple-500), var(--yellow-500));
      box-shadow: 0 0 16px var(--purple-glow), 0 0 8px var(--yellow-glow);
      pointer-events: none;
      transition: width 0.08s linear;
    }
  `;
  document.head.appendChild(progressStyle);

  const updateProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progress.style.width = `${ratio}%`;
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();
})();