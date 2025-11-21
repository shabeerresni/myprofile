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
      const response = await fetch(contactForm.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(contactForm),
      });

      if (response.ok) {
        contactForm.reset();
        formStatus.textContent = "Message sent! I’ll reply soon.";
        formStatus.style.color = "#36f0a0";
      } else {
        throw new Error("Form submission failed");
      }
    } catch (error) {
      formStatus.textContent = "Something went wrong. Try again or email me.";
      formStatus.style.color = "#ff4da6";
    }
  });
}

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

