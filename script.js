const toggle = document.querySelector(".nav-toggle");
const mobileMenu = document.querySelector("#mobileMenu");

if (!toggle || !mobileMenu) {
  console.warn("Hamburger menu elements not found");
} else {
  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";

    toggle.setAttribute("aria-expanded", String(!isOpen));

    if (isOpen) {
      mobileMenu.setAttribute("hidden", "");
    } else {
      mobileMenu.removeAttribute("hidden");
    }
  });

  // Close menu when a mobile link is clicked
  mobileMenu.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]")) {
      mobileMenu.setAttribute("hidden", "");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}