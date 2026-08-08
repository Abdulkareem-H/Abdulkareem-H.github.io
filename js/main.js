/* ============================================================
   main.js — the site "engine"
   1. Respect prefers-reduced-motion everywhere
   2. Lenis smooth scrolling
   3. Universal .reveal fade-up system (GSAP + ScrollTrigger)
   4. Counting numbers for the proof bar
   5. Header state + smooth anchor links
   ============================================================ */

// ------------------------------------------------------------
// 0. SETUP
// ------------------------------------------------------------

// One shared flag: if the user's OS asks for less motion, we honor it
// in every script on the site.
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Other scripts (hero.js, dashboard.js) read this global to stay in sync.
window.SITE = { reducedMotion: REDUCED_MOTION, lenis: null };

// GSAP's scroll plugin must be registered once before use.
gsap.registerPlugin(ScrollTrigger);

// ------------------------------------------------------------
// 1. LENIS SMOOTH SCROLL
// Lenis softens mouse-wheel scrolling. We drive it from GSAP's
// ticker (its internal clock) so scroll + animations share one
// heartbeat — that keeps ScrollTrigger perfectly in sync.
// ------------------------------------------------------------
if (!REDUCED_MOTION && window.Lenis) {
  const lenis = new Lenis({
    lerp: 0.1,          // 0–1: lower = floatier, higher = snappier
    wheelMultiplier: 1,
  });
  window.SITE.lenis = lenis;

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// ------------------------------------------------------------
// 2. UNIVERSAL REVEAL SYSTEM
// Any element with class="reveal" fades up when it scrolls into
// view. Optional data-delay="0.2" staggers siblings.
// ------------------------------------------------------------
document.querySelectorAll('.reveal').forEach((el) => {
  const delay = parseFloat(el.dataset.delay || 0);

  if (REDUCED_MOTION) {
    // No animation — just make sure nothing stays hidden.
    el.style.opacity = 1;
    return;
  }

  gsap.fromTo(el,
    { opacity: 0, y: 32 },
    {
      opacity: 1,
      y: 0,
      duration: 0.9,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 86%',   // fire when the element's top hits 86% down the viewport
        once: true,         // reveal once, don't re-hide on scroll up
      },
    }
  );
});

// ------------------------------------------------------------
// 3. COUNTING NUMBERS (proof bar)
// <span data-count="50" data-suffix="+">0</span> counts 0 → 50+
// ------------------------------------------------------------
document.querySelectorAll('[data-count]').forEach((el) => {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';

  if (REDUCED_MOTION) {
    el.textContent = target + suffix;
    return;
  }

  const counter = { value: 0 }; // a plain object GSAP can tween
  gsap.to(counter, {
    value: target,
    duration: 1.8,
    ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    onUpdate() {
      el.textContent = Math.round(counter.value) + suffix;
    },
  });
});

// ------------------------------------------------------------
// 4. HEADER — gets a blurred background once you scroll past 40px
// ------------------------------------------------------------
const header = document.getElementById('site-header');
const updateHeader = () => {
  header.classList.toggle('is-scrolled', window.scrollY > 40);
};
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader(); // run once on load in case the page opens mid-scroll

// ------------------------------------------------------------
// 5. SMOOTH ANCHOR LINKS
// Nav links like href="#work" glide there via Lenis (with an
// offset so the fixed header doesn't cover the section title).
// ------------------------------------------------------------
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();

    if (window.SITE.lenis) {
      window.SITE.lenis.scrollTo(target, { offset: -64, duration: 1.2 });
    } else {
      target.scrollIntoView(); // reduced-motion fallback: instant jump
    }
  });
});

// NOTE: the hero intro animation lives in js/effects.js now —
// it has to wait for the preloader curtain, so the preloader
// timeline owns it.
