// ============================================================
// ASK REMI — shared site behavior
// Scroll reveals, mobile nav, category filtering.
// Everything here is progressive enhancement: the page is fully
// readable and navigable with JS disabled.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  /* ---- Mobile nav toggle ---- */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", () => nav.classList.remove("open"))
    );
  }

  /* ---- Scroll reveal ---- */
  const reveals = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el, i) => {
      el.style.setProperty("--i", i % 8);
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---- Category filter pills (homepage) ---- */
  const pills = document.querySelectorAll(".filter-pill");
  const cards = document.querySelectorAll("[data-category]");
  if (pills.length && cards.length) {
    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        const target = pill.dataset.filter;
        cards.forEach((card) => {
          const match = target === "all" || card.dataset.category === target;
          card.style.display = match ? "" : "none";
        });
      });
    });
  }

  /* ---- Newsletter form (placeholder submit handling) ---- */
  document.querySelectorAll(".newsletter-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[type='email']");
      const btn = form.querySelector("button");
      if (input && input.value) {
        const original = btn.textContent;
        btn.textContent = "Subscribed";
        input.value = "";
        setTimeout(() => (btn.textContent = original), 2200);
      }
    });
  });

  /* ---- Scroll progress bar ---- */
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  document.body.appendChild(progress);

  const updateProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progress.style.width = pct + "%";
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateProgress();
        updateParallax();
        ticking = false;
      });
      ticking = true;
    }
  });
  updateProgress();

  /* ---- Parallax: elements with data-parallax="0.15" drift slower than scroll ---- */
  const parallaxEls = document.querySelectorAll("[data-parallax]");
  function updateParallax() {
    if (prefersReducedMotion || !parallaxEls.length) return;
    const viewportH = window.innerHeight;
    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.15;
      const rect = el.getBoundingClientRect();
      // Only compute while roughly in view, cheap guard for perf
      if (rect.bottom > 0 && rect.top < viewportH) {
        const offset = (rect.top - viewportH / 2) * speed;
        el.style.transform = `translateY(${offset * -0.15}px)`;
      }
    });
  }
  updateParallax();

  /* ---- Custom cursor + magnetic buttons + card tilt (desktop, motion-ok only) ---- */
  if (isFinePointer && !prefersReducedMotion) {
    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    document.body.append(dot, ring);

    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    // Ring lags slightly behind the dot for a soft trailing feel
    function trailRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(trailRing);
    }
    requestAnimationFrame(trailRing);

    document.querySelectorAll("a, button, .card").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-active"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-active"));
    });

    // Magnetic pull on buttons
    document.querySelectorAll(".btn").forEach((btn) => {
      btn.classList.add("is-magnetic");
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translate(0, 0)";
      });
    });

    // 3D tilt on cards
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--rx", `${x * 8}deg`);
        card.style.setProperty("--ry", `${y * -8}deg`);
        card.style.setProperty("--ty", `-6px`);
      });
      card.addEventListener("mouseleave", () => {
        card.style.setProperty("--rx", `0deg`);
        card.style.setProperty("--ry", `0deg`);
        card.style.setProperty("--ty", `0px`);
      });
    });
  }
});
