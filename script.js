const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const drawer = document.querySelector("[data-drawer]");
const drawerClose = document.querySelector("[data-drawer-close]");
const drawerLinks = document.querySelectorAll(".drawer-links a");
const headerDownload = document.querySelector("[data-download-cv]");

const navLinks = document.querySelectorAll(".main-nav a");
const sections = document.querySelectorAll("main section");
const contactForm = document.getElementById("contact-form");
const formStatus = document.querySelector(".form-status");
const yearEl = document.getElementById("year");

const setDrawerOpen = (isOpen) => {
  if (!drawer) return;
  drawer.classList.toggle("is-open", isOpen);
  drawer.setAttribute("aria-hidden", String(!isOpen));
  document.documentElement.style.overflow = isOpen ? "hidden" : "";
};

navToggle?.addEventListener("click", () => setDrawerOpen(true));
drawerClose?.addEventListener("click", () => setDrawerOpen(false));
drawer?.addEventListener("click", (e) => {
  if (e.target === drawer) setDrawerOpen(false);
});

const handleNavClick = (event, href) => {
  event.preventDefault();
  const target = href ? document.querySelector(href) : null;
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
};

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => handleNavClick(event, link.getAttribute("href")));
});

drawerLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    handleNavClick(event, link.getAttribute("href"));
    setDrawerOpen(false);
  });
});

headerDownload?.addEventListener("click", () => {
  const btn = document.getElementById("download-pdf");
  btn?.click();
  setDrawerOpen(false);
});

// Sticky header: transparent -> solid on scroll
const setHeaderSolid = () => {
  if (!header) return;
  header.classList.toggle("is-solid", window.scrollY > 10);
};
setHeaderSolid();
window.addEventListener("scroll", setHeaderSolid, { passive: true });

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const id = entry.target.getAttribute("id");
      const navLink = document.querySelector(`.main-nav a[href="#${id}"]`);
      if (navLink) {
        navLink.classList.toggle("active", entry.isIntersecting);
      }
    });
  },
  { threshold: 0.4 }
);

sections.forEach((section) => observer.observe(section));

// Entrance animations
const animTargets = document.querySelectorAll(
  ".panel, .timeline article, .skill-card, .ag-card, .highlight-grid article, .projects .project-card"
);
animTargets.forEach((el) => el.classList.add("reveal"));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
);

animTargets.forEach((el) => revealObserver.observe(el));

// Animated counters (hero stats)
const counterScope = document.querySelector("[data-counter-scope]");
const countEls = counterScope?.querySelectorAll("[data-count-to]") || [];

// Enable reveal animations only after JS is running.
document.body.classList.add("js-ready");

const runCounters = () => {
  countEls.forEach((el) => {
    if (el.dataset.ran === "true") return;
    el.dataset.ran = "true";

    const to = Number(el.getAttribute("data-count-to") || "0");
    const suffix = el.getAttribute("data-count-suffix") || "";
    const start = 0;
    const duration = 900;
    const t0 = performance.now();

    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(start + (to - start) * eased);
      el.textContent = `${val}${suffix}`;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
};

if (counterScope) {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        runCounters();
        counterObserver.disconnect();
      }
    },
    { threshold: 0.35 }
  );
  counterObserver.observe(counterScope);
}

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;

    formStatus.textContent = "Sending...";
    formStatus.style.color = "#36c5f0";

    try {
      // Get form data and set _replyto for Formspree
      const formData = new FormData(contactForm);
      const userEmail = formData.get("email");
      if (userEmail) {
        formData.set("_replyto", userEmail);
      }

      const response = await fetch(contactForm.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = { error: "Invalid response from server" };
      }

      if (response.ok) {
        contactForm.reset();
        formStatus.textContent = "Message sent! I'll reply soon.";
        formStatus.style.color = "#36f0a0";
      } else {
        const errorMsg = responseData.error || responseData.message || "Form submission failed";
        console.error("Formspree error:", errorMsg, responseData);
        formStatus.textContent = `Error: ${errorMsg}. Please email directly at shabeer_mk@outlook.com`;
        formStatus.style.color = "#ff4da6";
      }
    } catch (error) {
      console.error("Form submission error:", error);
      formStatus.textContent = "Network error. Please email directly at shabeer_mk@outlook.com";
      formStatus.style.color = "#ff4da6";
    }
  });
}

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

/**
 * "Save as PDF" uses the browser print engine (Chrome: Print → Destination → Save as PDF).
 * html2canvas/html2pdf was producing a narrow clipped strip; native print matches full layout.
 */
function initSavePdf() {
  const downloadPdfBtn = document.getElementById("download-pdf");
  if (!downloadPdfBtn || downloadPdfBtn.dataset.savePdfInit === "1") return;
  downloadPdfBtn.dataset.savePdfInit = "1";

  const openPrint = () => {
    window.scrollTo(0, 0);
    window.print();
  };

  downloadPdfBtn.addEventListener("click", openPrint);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSavePdf);
} else {
  initSavePdf();
}

// Slideshow functionality
(function() {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  const prevBtn = document.querySelector('.slideshow-prev');
  const nextBtn = document.querySelector('.slideshow-next');
  let currentSlide = 0;
  let slideInterval;

  if (slides.length === 0) return;

  function showSlide(index) {
    // Remove active class from all slides and dots
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    // Add active class to current slide and dot
    if (slides[index]) {
      slides[index].classList.add('active');
    }
    if (dots[index]) {
      dots[index].classList.add('active');
    }
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }

  function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
  }

  function startSlideshow() {
    slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
  }

  function stopSlideshow() {
    clearInterval(slideInterval);
  }

  // Initialize slideshow
  showSlide(0);
  startSlideshow();

  // Event listeners
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      stopSlideshow();
      nextSlide();
      startSlideshow();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      stopSlideshow();
      prevSlide();
      startSlideshow();
    });
  }

  // Dot navigation
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      stopSlideshow();
      currentSlide = index;
      showSlide(currentSlide);
      startSlideshow();
    });
  });

  // Pause on hover
  const slideshowContainer = document.querySelector('.slideshow-container');
  if (slideshowContainer) {
    slideshowContainer.addEventListener('mouseenter', stopSlideshow);
    slideshowContainer.addEventListener('mouseleave', startSlideshow);
  }

  // Touch swipe support for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  if (slideshowContainer) {
    slideshowContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopSlideshow();
    });

    slideshowContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
      startSlideshow();
    });
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        nextSlide(); // Swipe left - next slide
      } else {
        prevSlide(); // Swipe right - previous slide
      }
    }
  }
})();