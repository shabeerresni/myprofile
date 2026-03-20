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
const animTargets = document.querySelectorAll(".panel, .timeline article, .skill-card, .highlight-grid article, .projects .project-card");
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

// PDF download (html2pdf.js) — single handler; library loaded before this script in index.html
const PDF_CONTENT_PX = 700; // ~A4 printable width at 96dpi with margins

function initPdfDownload() {
  const downloadPdfBtn = document.getElementById("download-pdf");
  if (!downloadPdfBtn || downloadPdfBtn.dataset.pdfInit === "1") return;
  downloadPdfBtn.dataset.pdfInit = "1";

  downloadPdfBtn.addEventListener("click", async () => {
    const originalText = downloadPdfBtn.textContent;

    if (typeof html2pdf === "undefined") {
      alert("PDF is still loading. Please wait a few seconds and try again.");
      return;
    }

    downloadPdfBtn.disabled = true;
    downloadPdfBtn.textContent = "⏳ Generating PDF...";

    const header = document.querySelector(".site-header");
    const footer = document.querySelector(".site-footer");
    const drawer = document.querySelector(".nav-drawer");
    const prev = {
      header: header?.style.display ?? "",
      footer: footer?.style.display ?? "",
      drawer: drawer?.style.display ?? "",
    };
    if (header) header.style.display = "none";
    if (footer) footer.style.display = "none";
    if (drawer) drawer.style.display = "none";

    const element = document.querySelector("main");
    if (!element) {
      downloadPdfBtn.disabled = false;
      downloadPdfBtn.textContent = originalText;
      if (header) header.style.display = prev.header;
      if (footer) footer.style.display = prev.footer;
      if (drawer) drawer.style.display = prev.drawer;
      return;
    }

    window.scrollTo(0, 0);
    element.classList.add("pdf-export");

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise((r) => setTimeout(r, 250));

    const imgs = Array.from(element.querySelectorAll("img"));
    await Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            })
      )
    );

    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch (_) {
        /* ignore */
      }
    }

    const opt = {
      margin: [12, 14, 14, 14],
      filename: `Shabeer_Mohamed_Portfolio_${new Date().getFullYear()}.pdf`,
      image: { type: "jpeg", quality: 0.9 },
      enableLinks: true,
      html2canvas: {
        scale: 1.25,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#0a1628",
        letterRendering: true,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: PDF_CONTENT_PX,
        onclone(clonedDoc) {
          const html = clonedDoc.documentElement;
          const body = clonedDoc.body;
          if (html) {
            html.style.width = `${PDF_CONTENT_PX}px`;
            html.style.maxWidth = `${PDF_CONTENT_PX}px`;
            html.style.overflow = "visible";
          }
          if (body) {
            body.style.width = `${PDF_CONTENT_PX}px`;
            body.style.maxWidth = `${PDF_CONTENT_PX}px`;
            body.style.margin = "0";
            body.style.padding = "0";
            body.style.overflow = "visible";
          }
          const mainEl = clonedDoc.querySelector("main");
          if (mainEl) {
            mainEl.classList.add("pdf-export");
            mainEl.style.width = `${PDF_CONTENT_PX}px`;
            mainEl.style.maxWidth = `${PDF_CONTENT_PX}px`;
            mainEl.style.boxSizing = "border-box";
          }
          clonedDoc.querySelectorAll("img").forEach((img) => {
            img.style.maxWidth = "100%";
            img.style.height = "auto";
            img.style.objectFit = "contain";
          });
        },
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      },
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: ["h2", "h3"],
      },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      downloadPdfBtn.textContent = "❌ Error — try again";
      setTimeout(() => {
        downloadPdfBtn.textContent = originalText;
      }, 3500);
    } finally {
      element.classList.remove("pdf-export");
      if (header) header.style.display = prev.header;
      if (footer) footer.style.display = prev.footer;
      if (drawer) drawer.style.display = prev.drawer;
      downloadPdfBtn.disabled = false;
      if (downloadPdfBtn.textContent !== "❌ Error — try again") {
        downloadPdfBtn.textContent = originalText;
      }
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPdfDownload);
} else {
  initPdfDownload();
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