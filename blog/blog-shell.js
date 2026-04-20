/* Shared behavior for blog pages: sticky header, mobile drawer, year, Save as PDF */
(function () {
  const header = document.querySelector("[data-header]");
  const drawer = document.querySelector("[data-drawer]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const drawerClose = document.querySelector("[data-drawer-close]");

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

  document.querySelectorAll(".drawer-links a").forEach((link) => {
    link.addEventListener("click", () => setDrawerOpen(false));
  });

  const setHeaderSolid = () => {
    if (!header) return;
    header.classList.toggle("is-solid", window.scrollY > 10);
  };
  setHeaderSolid();
  window.addEventListener("scroll", setHeaderSolid, { passive: true });

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const downloadPdf = document.getElementById("download-pdf");
  downloadPdf?.addEventListener("click", () => {
    window.scrollTo(0, 0);
    window.print();
  });
})();
