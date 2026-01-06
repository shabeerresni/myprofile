const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".main-nav");
const navLinks = document.querySelectorAll(".main-nav a");
const sections = document.querySelectorAll("main section");
const contactForm = document.getElementById("contact-form");
const formStatus = document.querySelector(".form-status");
const yearEl = document.getElementById("year");

const closeNav = () => nav?.classList.remove("open");

navToggle?.addEventListener("click", () => {
  nav?.classList.toggle("open");
});

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const targetId = link.getAttribute("href");
    const section = targetId ? document.querySelector(targetId) : null;
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
    closeNav();
  });
});

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

// PDF Download functionality
const downloadPdfBtn = document.getElementById("download-pdf");

if (downloadPdfBtn) {
  downloadPdfBtn.addEventListener("click", async () => {
    // Disable button during generation
    downloadPdfBtn.disabled = true;
    downloadPdfBtn.textContent = "⏳ Generating PDF...";
    
    try {
      // Get the main content element
      const element = document.querySelector("main");
      
      // Configure PDF options
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Shabeer_Mohamed_Portfolio_${new Date().getFullYear()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#050114"
        },
        jsPDF: { 
          unit: "mm", 
          format: "a4", 
          orientation: "portrait",
          compress: true
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] }
      };
      
      // Generate and download PDF
      await html2pdf().set(opt).from(element).save();
      
      // Reset button
      downloadPdfBtn.disabled = false;
      downloadPdfBtn.textContent = "📄 Download as PDF";
    } catch (error) {
      console.error("Error generating PDF:", error);
      downloadPdfBtn.disabled = false;
      downloadPdfBtn.textContent = "❌ Error - Try Again";
      setTimeout(() => {
        downloadPdfBtn.textContent = "📄 Download as PDF";
      }, 3000);
    }
  });
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