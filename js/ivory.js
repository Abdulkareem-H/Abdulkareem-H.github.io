/* ============================================================
   ivory.js — Palantir-variant behavior (palantir.html only)

   The page alternates paper and ink "bands" (see ivory.css).
   The fixed header floats over both, so as it crosses into a
   dark band we flip its text to light, and back again — the
   same adaptive-chrome behavior palantir.com has.

   Runs regardless of reduced motion: this is color correctness,
   not decoration.
   ============================================================ */

(function () {
  if (!window.gsap || !window.ScrollTrigger) return;

  // ==========================================================
  // WORD-CYCLE OPENER
  // effects.js owns scroll-lock + visibility gating + failsafe;
  // once it's ready it exposes window.SITE.openerAPI and we run
  // the show: the craft flickers by, INTELLIGENCE settles, the
  // rule draws, then the redaction bars slide away.
  // ==========================================================
  const WORDS = ['DATA', 'MODELS', 'DASHBOARDS', 'DECISIONS'];
  const FINAL_WORD = 'INTELLIGENCE';

  function playOpener(api) {
    const word = document.getElementById('pl-word');
    const rule = document.getElementById('pl-rule');
    const tl = gsap.timeline();

    // The hairline rule draws left → right under the whole cycle
    tl.to(rule, { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0);

    // Words flicker by — hard swaps read as a signal scanning
    WORDS.forEach((w, i) => {
      tl.add(() => { word.textContent = w; }, 0.15 + i * 0.24);
    });

    // The final word settles softly instead of flickering
    tl.add(() => { word.textContent = FINAL_WORD; }, 0.15 + WORDS.length * 0.24)
      .fromTo(word,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
        0.15 + WORDS.length * 0.24
      )
      // Breath, then the readout lifts away…
      .to('.pl-center', { opacity: 0, y: -16, duration: 0.45, ease: 'power2.in' }, 2.0)
      // …and the five redaction bars slide off alternately,
      // revealing the hero (which starts its intro mid-slide).
      .to('.pl-bar', {
        xPercent: (i) => (i % 2 ? 101 : -101),
        duration: 0.85,
        stagger: 0.07,
        ease: 'power4.inOut',
        onStart: api.heroIntro,
        onComplete: api.finish,
      }, 2.2);
  }

  // effects.js publishes the API asynchronously (after fonts load
  // and only once the tab is visible) — poll until it appears.
  // If the preloader is already gone (reduced motion / failsafe),
  // stop waiting.
  const waitForAPI = setInterval(() => {
    if (window.SITE && window.SITE.openerAPI) {
      clearInterval(waitForAPI);
      playOpener(window.SITE.openerAPI);
    } else if (!document.getElementById('preloader')) {
      clearInterval(waitForAPI);
    }
  }, 60);

  // ==========================================================
  // ADAPTIVE HEADER over ink bands
  // ==========================================================
  const header = document.getElementById('site-header');
  const bands = document.querySelectorAll('.band-ink');
  if (!header || !bands.length) return;

  // The WORK console section switches its band class at runtime
  // (paper ↔ ink per showcase), so instead of counting toggles we
  // re-evaluate: is the header currently over any section that is
  // ink RIGHT NOW?
  const bandTriggers = [];

  function evaluateHeader() {
    header.classList.toggle('over-ink',
      bandTriggers.some((t) => t.isActive && t.trigger.classList.contains('band-ink'))
    );
  }

  bands.forEach((band) => {
    bandTriggers.push(ScrollTrigger.create({
      trigger: band,
      // "Active" while the band's top is above the header line
      // and its bottom hasn't passed it yet. 40px ≈ header middle.
      start: 'top 40px',
      end: 'bottom 40px',
      onToggle: evaluateHeader,
    }));
  });

  // The showcase console calls this after switching bands.
  window.SITE.refreshInkHeader = evaluateHeader;
})();
