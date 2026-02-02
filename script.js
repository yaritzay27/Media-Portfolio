// ===== Hamburger Navigation ===== //
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

// ===== Scroll Bar ===== //
document.addEventListener("DOMContentLoaded", () => {
  const scroller = document.getElementById("workScroller");
  if (!scroller) return;

  const cards = Array.from(scroller.querySelectorAll(".work-card"));

  // ===== SPEED SETTINGS =====
  const MAX_SPEED = 0.6;
  const EASE = 0.06;

  // ===== STATE VARIABLES =====
  let currentSpeed = MAX_SPEED;
  let targetSpeed = MAX_SPEED;

  let pinnedCard = null;
  let pauseMode = false;
  let isHovering = false;
  let rafId = null;
  let isTouching = false;

  // ===== ACCESSIBILITY: Check if user prefers reduced motion =====
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) targetSpeed = 0; // Stop auto-scroll for accessibility

  // ===== HELPER FUNCTIONS =====
  const maxScrollLeft = () => scroller.scrollWidth - scroller.clientWidth;

  function centerScrollLeftFor(card) {
    const scrollerRect = scroller.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    
    const cardCenterRelativeToViewport = cardRect.left + cardRect.width / 2;
    const scrollerCenterRelativeToViewport = scrollerRect.left + scrollerRect.width / 2;
    const offset = cardCenterRelativeToViewport - scrollerCenterRelativeToViewport;
    
    let desired = scroller.scrollLeft + offset;
    
    const max = maxScrollLeft();
    if (desired < 0) desired = 0;
    if (desired > max) desired = max;
    
    return desired;
  }

  // ===== SETUP =====
  scroller.classList.add("is-auto");

  // ===== MAIN ANIMATION LOOP =====
  function loop() {
    if (!isHovering) {
      currentSpeed += (targetSpeed - currentSpeed) * EASE;
    }

    const max = maxScrollLeft();

    if (!isHovering && !pauseMode && !pinnedCard) {
      if (max > 0 && Math.abs(currentSpeed) > 0.001) {
        scroller.scrollLeft += currentSpeed;
        
        if (scroller.scrollLeft >= max - 1) scroller.scrollLeft = 0;
      }
    }

    if (pinnedCard && isHovering) {
      const desired = centerScrollLeftFor(pinnedCard);
      const current = scroller.scrollLeft;
      const diff = desired - current;

      if (Math.abs(diff) > 0.5) {
        scroller.scrollLeft += diff * 0.04; // 0.04 = transition speed when switching between cards
      } 
      
      else {
        scroller.scrollLeft = desired;
        pauseMode = true;
      }
    }
    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);

  // ===== EVENT HANDLERS =====
  function pinTo(card) {
    if (!card) return;
    
    isHovering = true;
    pinnedCard = card;
    pauseMode = false;
    targetSpeed = 0;
    currentSpeed = 0;
    
    scroller.classList.add("is-auto");
  }

  function unpinAndResume() {
    isHovering = false;
    pinnedCard = null;
    pauseMode = false;

    if (reduceMotion.matches) return;

    targetSpeed = MAX_SPEED;
    scroller.classList.add("is-auto");
  }

  // ===== ATTACH EVENT LISTENERS =====
  // DESKTOP: When mouse enters a card, pin/center it
  cards.forEach(card => {
    card.addEventListener("mouseenter", () => pinTo(card));
  });

  // DESKTOP: When mouse leaves the entire scroller, resume auto-scroll
  scroller.addEventListener("mouseleave", unpinAndResume);

  // MOBILE: When user taps a card, pin/center it
  cards.forEach(card => {
    card.addEventListener("touchstart", () => pinTo(card), { passive: true });
  });

  // MOBILE: When touch ends, resume auto-scroll
  scroller.addEventListener("touchend", unpinAndResume, { passive: true });
  
  // MOBILE/DESKTOP: When user starts dragging, stop auto-scroll
  scroller.addEventListener("pointerdown", () => {
    targetSpeed = 0;
    isHovering = true;
  });
  
  // MOBILE/DESKTOP: When user stops dragging, resume
  scroller.addEventListener("pointerup", unpinAndResume);
  scroller.addEventListener("pointercancel", unpinAndResume);

  // ===== ACCESSIBILITY =====
  reduceMotion.addEventListener("change", e => {
    if (e.matches) {
      targetSpeed = 0;
    } else {
      unpinAndResume();
    }
  });
});