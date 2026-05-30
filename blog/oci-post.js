(function () {
  document.body.classList.add("js-ready");

  const crumb = document.getElementById("oci-sticky-crumb");
  const hero = document.querySelector(".oci-hero");
  if (crumb && hero) {
    const onScroll = () => {
      const show = window.scrollY > hero.offsetHeight * 0.35;
      crumb.classList.toggle("is-visible", show);
      crumb.setAttribute("aria-hidden", String(!show));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  document.querySelectorAll(".reveal").forEach((el) => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(el);
  });

  const countEls = document.querySelectorAll("[data-oci-count]");
  const runCounter = (el) => {
    if (el.dataset.ran === "true") return;
    el.dataset.ran = "true";
    const to = Number(el.getAttribute("data-oci-count") || "0");
    const prefix = el.getAttribute("data-count-prefix") || "";
    const suffix = el.getAttribute("data-count-suffix") || "";
    const duration = 900;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(to * eased);
      el.textContent = `${prefix}${val}${suffix}`;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (countEls.length) {
    const counterObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            counterObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    countEls.forEach((el) => counterObs.observe(el));
  }

  const lightbox = document.getElementById("oci-lightbox");
  const openBtn = document.getElementById("oci-figure-open");
  const closeBtn = document.getElementById("oci-lightbox-close");

  if (lightbox && openBtn && closeBtn) {
    const openLightbox = () => {
      lightbox.hidden = false;
      document.body.classList.add("oci-lightbox-open");
      closeBtn.focus();
    };

    const closeLightbox = () => {
      lightbox.hidden = true;
      document.body.classList.remove("oci-lightbox-open");
      openBtn.focus();
    };

    openBtn.addEventListener("click", openLightbox);
    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
    });
  }
})();
