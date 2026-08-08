/* ============================================================
   work-console.js — the SHOWCASE CONSOLE (palantir.html)

   All five dashboards live inside one #work section as .sc-block
   elements (each block = its own headline + frame + caption).
   This file:
   1. Switches blocks on tab / arrow clicks
   2. Morphs the section background (paper ↔ ink) to match the
      active showcase's data-band
   3. Choreographs the exit/enter animation: headline lines mask
      up, the frame tilts in, the scan beam sweeps
   ============================================================ */

(function () {
  const section = document.getElementById('work');
  const blocks = section ? [...section.querySelectorAll('.sc-block')] : [];
  const tabs = [...document.querySelectorAll('.console-tab')];
  if (!section || blocks.length < 2 || !tabs.length) return;

  const REDUCED_MOTION = window.SITE ? window.SITE.reducedMotion : false;
  let index = 0;
  let busy = false; // ignore clicks while a switch is animating

  // ----------------------------------------------------------
  // Band morph: toggling .band-ink swaps the section's CSS
  // tokens; the background-color transition in CSS does the
  // visual morph. Then tell the header to re-check its color.
  // ----------------------------------------------------------
  function applyBand(i) {
    section.classList.toggle('band-ink', blocks[i].dataset.band === 'ink');
    if (window.SITE && window.SITE.refreshInkHeader) window.SITE.refreshInkHeader();
  }

  function markActiveTab(i) {
    tabs.forEach((tab, t) => {
      tab.classList.toggle('is-active', t === i);
      tab.setAttribute('aria-selected', t === i);
    });
  }

  // ----------------------------------------------------------
  // Enter animation for a block that just became visible
  // ----------------------------------------------------------
  function animateIn(block, onDone) {
    const frame = block.querySelector('.dashboard');
    const title = block.querySelector('.sc-title');
    const headEls = block.querySelectorAll('.section-rail, .section-sub');
    const caption = block.querySelector('.dash-caption');
    const sweep = block.querySelector('.scan-sweep');

    // Split the headline into masked lines on first show (it was
    // hidden at load, so effects.js couldn't measure it then).
    if (window.SplitText && title && !title.querySelector('.split-line')) {
      try {
        new SplitText(title, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
      } catch (e) { /* headline just animates as a block instead */ }
    }
    const lines = title ? title.querySelectorAll('.split-line') : [];

    const tl = gsap.timeline({ onComplete: onDone });
    tl.fromTo(block, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0);
    if (lines.length) {
      tl.fromTo(lines, { yPercent: 115 },
        { yPercent: 0, duration: 0.8, stagger: 0.08, ease: 'power4.out' }, 0.05);
    } else if (title) {
      tl.fromTo(title, { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.05);
    }
    tl.fromTo(headEls, { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' }, 0.1)
      .fromTo(frame, { opacity: 0, y: 44, rotateX: 6, scale: 0.98 },
        { opacity: 1, y: 0, rotateX: 0, scale: 1, duration: 0.7, ease: 'power3.out' }, 0.15)
      .fromTo(caption, { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.35);
    if (sweep) {
      tl.fromTo(sweep, { top: '0%', opacity: 1 },
        { top: '100%', opacity: 0, duration: 1.1, ease: 'power2.inOut' }, 0.25);
    }
  }

  // ----------------------------------------------------------
  // The switch
  // ----------------------------------------------------------
  function show(i) {
    if (busy || i === index || !blocks[i]) return;
    const prev = blocks[index];
    const next = blocks[i];
    markActiveTab(i);

    // Reduced motion (or no GSAP): instant, honest swap.
    if (REDUCED_MOTION || !window.gsap) {
      prev.hidden = true;
      next.hidden = false;
      applyBand(i);
      index = i;
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      return;
    }

    busy = true;
    gsap.to(prev, {
      opacity: 0,
      y: 16,
      duration: 0.28,
      ease: 'power2.in',
      onComplete() {
        gsap.set(prev, { clearProps: 'all' });
        prev.hidden = true;
        next.hidden = false;
        applyBand(i);          // background morphs while content enters
        index = i;
        if (window.ScrollTrigger) ScrollTrigger.refresh();
        animateIn(next, () => { busy = false; });
      },
    });
  }

  // ----------------------------------------------------------
  // Wiring: tabs + arrows (arrows wrap around)
  // ----------------------------------------------------------
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => show(+tab.dataset.index));
  });

  const prevBtn = document.getElementById('console-prev');
  const nextBtn = document.getElementById('console-next');
  if (prevBtn) prevBtn.addEventListener('click', () =>
    show((index - 1 + blocks.length) % blocks.length));
  if (nextBtn) nextBtn.addEventListener('click', () =>
    show((index + 1) % blocks.length));
})();
