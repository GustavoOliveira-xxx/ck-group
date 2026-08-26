/* ============================================================
   CONSCIOUS KNOWLEDGE — INTERACTION SYSTEM
   Vanilla JS · accessible · motion-aware
   ============================================================ */

(() => {
  "use strict";

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  document.body.classList.add("preloading");

  /* ---------- 01. Preloader ---------- */
  const preloader = $("[data-preloader]");
  const finishLoading = () => {
    if (!preloader || preloader.classList.contains("is-done")) return;
    preloader.classList.add("is-done");
    document.body.classList.remove("preloading");
    window.setTimeout(() => preloader.remove(), 800);
  };

  window.addEventListener("load", () => window.setTimeout(finishLoading, reducedMotion ? 0 : 650), { once: true });
  window.setTimeout(finishLoading, 3200);

  /* ---------- 02. Header, mobile nav and scroll progress ---------- */
  const header = $("[data-header]");
  const nav = $("[data-nav]");
  const navToggle = $("[data-nav-toggle]");
  const navLinks = $$('a[href^="#"]', nav || document);
  const scrollProgress = $("[data-scroll-progress]");
  let previousScroll = window.scrollY;
  let scrollTicking = false;

  const closeNav = () => {
    nav?.classList.remove("is-open");
    navToggle?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Abrir menu");
  };

  navToggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", Boolean(open));
    navToggle.setAttribute("aria-expanded", String(Boolean(open)));
    navToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });

  navLinks.forEach((link) => link.addEventListener("click", closeNav));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });

  const updateScroll = () => {
    const y = window.scrollY;
    const pageHeight = document.documentElement.scrollHeight - window.innerHeight;

    header?.classList.toggle("is-scrolled", y > 18);
    if (y > 160 && y > previousScroll + 7 && !nav?.classList.contains("is-open")) {
      header?.classList.add("is-hidden");
    } else if (y < previousScroll - 5 || y < 160) {
      header?.classList.remove("is-hidden");
    }

    if (scrollProgress) {
      scrollProgress.style.width = `${pageHeight > 0 ? (y / pageHeight) * 100 : 0}%`;
    }

    previousScroll = y;
    scrollTicking = false;
  };

  window.addEventListener("scroll", () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateScroll);
  }, { passive: true });
  updateScroll();

  const observedSections = $$('main section[id]');
  if ("IntersectionObserver" in window) {
    const sectionSpy = new IntersectionObserver((entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!current) return;
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${current.target.id}`);
      });
    }, { rootMargin: "-42% 0px -46% 0px", threshold: [0.08, 0.25, 0.5] });
    observedSections.forEach((section) => sectionSpy.observe(section));
  }

  /* ---------- 03. Reveal on entry ---------- */
  const revealGroups = [
    ".section-heading",
    ".about__manifesto",
    ".principle",
    ".product",
    ".palette-switcher",
    ".identity-card",
    ".identity-bridge",
    ".journey",
    ".team",
    ".contact__content",
    ".contact__orb",
    ".site-footer",
  ];

  const revealElements = revealGroups.flatMap((selector) => $$(selector));
  revealElements.forEach((element, index) => {
    element.classList.add("reveal");
    if (element.classList.contains("identity-card--origin")) element.classList.add("reveal--left");
    if (element.classList.contains("identity-card--future")) element.classList.add("reveal--right");
    element.style.transitionDelay = `${Math.min((index % 4) * 0.07, 0.21)}s`;
  });

  if ("IntersectionObserver" in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -5%" });
    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  /* ---------- 04. Dual identity controls ---------- */
  const brandEmblems = $$('[data-brand-emblem]');
  const activateBrand = (selected) => {
    brandEmblems.forEach((emblem) => {
      const active = emblem === selected;
      emblem.classList.toggle("is-front", active);
      emblem.setAttribute("aria-pressed", String(active));
    });
  };
  brandEmblems.forEach((emblem) => emblem.addEventListener("click", () => activateBrand(emblem)));

  const paletteButtons = $$('[data-palette-button]');
  const themeMeta = $('meta[name="theme-color"]');
  const themeColors = { origin: "#08050d", fusion: "#050807", future: "#03100c" };

  const setPalette = (palette) => {
    document.body.dataset.palette = palette;
    themeMeta?.setAttribute("content", themeColors[palette] || themeColors.fusion);
    paletteButtons.forEach((button) => {
      const active = button.dataset.paletteButton === palette;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    window.dispatchEvent(new CustomEvent("ck:palette", { detail: palette }));
  };
  paletteButtons.forEach((button) => button.addEventListener("click", () => setPalette(button.dataset.paletteButton)));

  /* ---------- 05. Typed hero statement ---------- */
  const typed = $("[data-typed]");
  if (typed) {
    const output = $("[data-typed-text]", typed);
    const words = (typed.dataset.words || "").split("|").filter(Boolean);

    if (output && words.length && !reducedMotion) {
      let wordIndex = 0;
      let letterIndex = words[0].length;
      let deleting = true;

      const typeStep = () => {
        const word = words[wordIndex];
        letterIndex += deleting ? -1 : 1;
        output.textContent = word.slice(0, letterIndex);

        let delay = deleting ? 42 : 76;
        if (!deleting && letterIndex === word.length) {
          deleting = true;
          delay = 1750;
        } else if (deleting && letterIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          delay = 280;
        }
        window.setTimeout(typeStep, delay);
      };
      window.setTimeout(typeStep, 2600);
    }
  }

  /* ---------- 06. Reactive constellation background ---------- */
  const canvas = $("[data-canvas]");
  if (canvas && !reducedMotion) {
    const context = canvas.getContext("2d", { alpha: true });
    const pointer = { x: -9999, y: -9999 };
    const palettes = {
      fusion: ["155,69,245", "53,239,170", "255,216,77", "94,231,242"],
      origin: ["155,69,245", "193,132,255", "255,216,77"],
      future: ["53,239,170", "15,191,159", "94,231,242", "234,255,223"],
    };
    let particles = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame = 0;
    let running = true;

    const createParticles = () => {
      const colors = palettes[document.body.dataset.palette] || palettes.fusion;
      const count = clamp(Math.round((width * height) / 17500), 35, 105);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        radius: Math.random() * 1.4 + 0.45,
        alpha: Math.random() * 0.42 + 0.18,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
    };

    const resizeCanvas = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
    };

    const render = () => {
      if (!running) return;
      animationFrame = requestAnimationFrame(render);
      context.clearRect(0, 0, width, height);

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        const dxPointer = particle.x - pointer.x;
        const dyPointer = particle.y - pointer.y;
        const pointerDistance = Math.hypot(dxPointer, dyPointer);

        if (pointerDistance < 150 && pointerDistance > 0.1) {
          const force = (150 - pointerDistance) / 150;
          particle.vx += (dxPointer / pointerDistance) * force * 0.035;
          particle.vy += (dyPointer / pointerDistance) * force * 0.035;
        }

        particle.vx *= 0.994;
        particle.vy *= 0.994;
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < -15) particle.x = width + 15;
        if (particle.x > width + 15) particle.x = -15;
        if (particle.y < -15) particle.y = height + 15;
        if (particle.y > height + 15) particle.y = -15;

        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${particle.color},${particle.alpha})`;
        context.fill();

        for (let secondIndex = index + 1; secondIndex < particles.length; secondIndex += 1) {
          const second = particles[secondIndex];
          const dx = particle.x - second.x;
          const dy = particle.y - second.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared > 15000) continue;
          const alpha = (1 - Math.sqrt(distanceSquared) / Math.sqrt(15000)) * 0.12;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(second.x, second.y);
          context.strokeStyle = `rgba(${particle.color},${alpha})`;
          context.lineWidth = 0.65;
          context.stroke();
        }
      }
    };

    resizeCanvas();
    render();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resizeCanvas, 140);
    });
    window.addEventListener("pointermove", (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }, { passive: true });
    document.addEventListener("mouseleave", () => { pointer.x = pointer.y = -9999; });
    window.addEventListener("ck:palette", createParticles);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(animationFrame);
      } else if (!running) {
        running = true;
        render();
      }
    });
  }

  /* ---------- 07. Custom cursor ---------- */
  const cursor = $("[data-cursor]");
  const cursorRing = $("[data-cursor-ring]");
  if (cursor && cursorRing && precisePointer && !reducedMotion) {
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;
    document.body.classList.add("has-custom-cursor");

    window.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      cursor.style.transform = `translate3d(${pointerX - 3.5}px, ${pointerY - 3.5}px, 0)`;
    }, { passive: true });

    const moveRing = () => {
      ringX += (pointerX - ringX) * 0.15;
      ringY += (pointerY - ringY) * 0.15;
      const size = document.body.classList.contains("cursor-hover") ? 62 : 42;
      cursorRing.style.transform = `translate3d(${ringX - size / 2}px, ${ringY - size / 2}px, 0)`;
      requestAnimationFrame(moveRing);
    };
    moveRing();

    const interactiveSelector = "a, button, input, [tabindex], [data-tilt]";
    document.addEventListener("pointerover", (event) => {
      if (event.target.closest(interactiveSelector)) document.body.classList.add("cursor-hover");
    });
    document.addEventListener("pointerout", (event) => {
      if (event.target.closest(interactiveSelector)) document.body.classList.remove("cursor-hover");
    });
  }

  /* ---------- 08. Card tilt + responsive spotlights ---------- */
  if (precisePointer && !reducedMotion) {
    $$('[data-tilt]').forEach((element) => {
      const maxTilt = element.classList.contains("product") ? 1.8 : 5;
      element.addEventListener("pointermove", (event) => {
        const bounds = element.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        element.style.setProperty("--mx", `${x * 100}%`);
        element.style.setProperty("--my", `${y * 100}%`);
        element.style.setProperty("--tilt-x", `${(0.5 - y) * maxTilt}deg`);
        element.style.setProperty("--tilt-y", `${(x - 0.5) * maxTilt}deg`);
      });
      element.addEventListener("pointerleave", () => {
        element.style.setProperty("--tilt-x", "0deg");
        element.style.setProperty("--tilt-y", "0deg");
      });
    });

    $$('[data-magnetic]').forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        const bounds = element.getBoundingClientRect();
        const x = event.clientX - (bounds.left + bounds.width / 2);
        const y = event.clientY - (bounds.top + bounds.height / 2);
        element.style.transform = `translate(${x * 0.11}px, ${y * 0.16 - 2}px)`;
      });
      element.addEventListener("pointerleave", () => { element.style.transform = ""; });
    });
  }

  /* ---------- 09. FinCK live calculation ---------- */
  const finckInputs = {
    price: $("[data-finck-price]"),
    income: $("[data-finck-income]"),
    hours: $("[data-finck-hours]"),
  };
  const finckOutputs = {
    time: $("[data-finck-time]"),
    percent: $("[data-finck-percent]"),
    days: $("[data-finck-days]"),
    hourValue: $("[data-finck-hour-value]"),
    dial: $("[data-time-dial]"),
  };
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const decimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const updateFinck = () => {
    const price = Math.max(0, Number(finckInputs.price?.value) || 0);
    const income = Math.max(1, Number(finckInputs.income?.value) || 1);
    const monthlyHours = Math.max(1, Number(finckInputs.hours?.value) || 1);
    const hourValue = income / monthlyHours;
    const workHours = price / hourValue;
    const wholeHours = Math.floor(workHours);
    const minutes = Math.round((workHours - wholeHours) * 60);
    const percent = (price / income) * 100;
    const workDays = workHours / 8;

    if (finckOutputs.time) finckOutputs.time.textContent = `${wholeHours}h ${minutes.toString().padStart(2, "0")}min`;
    if (finckOutputs.percent) finckOutputs.percent.textContent = `${decimal.format(percent)}%`;
    if (finckOutputs.days) finckOutputs.days.textContent = decimal.format(workDays);
    if (finckOutputs.hourValue) finckOutputs.hourValue.textContent = brl.format(hourValue);
    if (finckOutputs.dial) finckOutputs.dial.style.setProperty("--dial", `${clamp((workHours / monthlyHours) * 360, 4, 356)}deg`);
  };
  Object.values(finckInputs).forEach((input) => input?.addEventListener("input", updateFinck));
  updateFinck();

  /* ---------- 10. DynamiCK study session ---------- */
  const studyRange = $("[data-study-range]");
  const studyOutputs = {
    total: $("[data-study-time]"),
    learnBar: $("[data-study-learn]"),
    learnText: $("[data-study-learn-text]"),
    practiceBar: $("[data-study-practice]"),
    practiceText: $("[data-study-practice-text]"),
    reviewBar: $("[data-study-review]"),
    reviewText: $("[data-study-review-text]"),
  };

  const updateStudyPlan = () => {
    if (!studyRange) return;
    const total = Number(studyRange.value);
    const learn = Math.max(3, Math.round(total * 0.2));
    const review = Math.max(3, Math.round(total * 0.2));
    const practice = total - learn - review;
    const rangePercent = ((total - Number(studyRange.min)) / (Number(studyRange.max) - Number(studyRange.min))) * 100;
    const unit = 1.15;

    studyRange.style.setProperty("--range-p", `${rangePercent}%`);
    if (studyOutputs.total) studyOutputs.total.textContent = `${total} min`;
    if (studyOutputs.learnText) studyOutputs.learnText.textContent = `${learn} min`;
    if (studyOutputs.practiceText) studyOutputs.practiceText.textContent = `${practice} min`;
    if (studyOutputs.reviewText) studyOutputs.reviewText.textContent = `${review} min`;
    studyOutputs.learnBar?.style.setProperty("--bar-h", `${clamp(learn * unit, 12, 56)}px`);
    studyOutputs.practiceBar?.style.setProperty("--bar-h", `${clamp(practice * unit, 22, 64)}px`);
    studyOutputs.reviewBar?.style.setProperty("--bar-h", `${clamp(review * unit, 12, 56)}px`);
  };
  studyRange?.addEventListener("input", updateStudyPlan);
  updateStudyPlan();

  /* ---------- 11. Draggable and keyboard-accessible study cube ---------- */
  const studyCube = $("[data-study-cube]");
  if (studyCube) {
    const cubeBody = $(".study-cube__body", studyCube);
    let rotationX = -22;
    let rotationY = 34;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = rotationX;
    let initialY = rotationY;

    const applyCubeRotation = () => {
      cubeBody?.style.setProperty("--rx", `${rotationX}deg`);
      cubeBody?.style.setProperty("--ry", `${rotationY}deg`);
    };

    studyCube.addEventListener("pointerdown", (event) => {
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      initialX = rotationX;
      initialY = rotationY;
      studyCube.classList.add("is-dragging");
      studyCube.setPointerCapture?.(event.pointerId);
    });
    studyCube.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      rotationY = initialY + (event.clientX - startX) * 0.55;
      rotationX = clamp(initialX - (event.clientY - startY) * 0.45, -75, 75);
      applyCubeRotation();
    });

    const releaseCube = (event) => {
      if (!dragging) return;
      dragging = false;
      studyCube.classList.remove("is-dragging");
      studyCube.releasePointerCapture?.(event.pointerId);
    };
    studyCube.addEventListener("pointerup", releaseCube);
    studyCube.addEventListener("pointercancel", releaseCube);

    studyCube.addEventListener("keydown", (event) => {
      const step = event.shiftKey ? 30 : 12;
      if (event.key === "ArrowLeft") rotationY -= step;
      else if (event.key === "ArrowRight") rotationY += step;
      else if (event.key === "ArrowUp") rotationX = clamp(rotationX - step, -75, 75);
      else if (event.key === "ArrowDown") rotationX = clamp(rotationX + step, -75, 75);
      else return;
      event.preventDefault();
      studyCube.classList.add("is-dragging");
      applyCubeRotation();
      window.setTimeout(() => studyCube.classList.remove("is-dragging"), 350);
    });
  }

  /* ---------- 12. Count-up metrics ---------- */
  const counters = $$('[data-counter]');
  const animateCounter = (element) => {
    const target = Number(element.dataset.counter) || 0;
    if (reducedMotion) {
      element.textContent = String(target);
      return;
    }
    const startedAt = performance.now();
    const duration = 900;
    const step = (now) => {
      const progress = clamp((now - startedAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach(animateCounter);
  }
})();
