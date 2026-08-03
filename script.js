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
});
