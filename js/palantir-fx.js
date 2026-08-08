/* ============================================================
   palantir-fx.js — EXTRA animation push, Palantir variant only
   (loaded by palantir.html, never by index.html)

   1. Scan sweep — a light beam passes over the dashboard once
   2. Filter chips pop in one-by-one
   3. Capability cards trace their own borders
   4. Timeline markers ping as the spine reaches them
   5. KPI values do a quick "signal glitch" on region change
   ============================================================ */

(function () {
  const REDUCED_MOTION = window.SITE ? window.SITE.reducedMotion : false;
  if (REDUCED_MOTION || !window.gsap || !window.ScrollTrigger) return;

  // ----------------------------------------------------------
  // 1. SCAN SWEEP — fires once as EACH dashboard frame lands
  // ----------------------------------------------------------
  document.querySelectorAll('.dash-stage').forEach((stage) => {
    if (stage.closest('[hidden]')) return; // console blocks sweep on show
    const sweep = stage.querySelector('.scan-sweep');
    if (!sweep) return;
    ScrollTrigger.create({
      trigger: stage,
      start: 'top 65%',
      once: true,
      onEnter() {
        gsap.fromTo(sweep,
          { top: '0%', opacity: 1 },
          { top: '100%', opacity: 0, duration: 1.5, ease: 'power2.inOut' }
        );
      },
    });
  });

  // ----------------------------------------------------------
  // 2. CHIP POP-IN — every slicer row's chips arrive one at a time
  // ----------------------------------------------------------
  document.querySelectorAll('.chip-row').forEach((row) => {
    gsap.from(row.querySelectorAll('.chip'), {
      opacity: 0,
      y: 14,
      duration: 0.5,
      stagger: 0.06,
      ease: 'power3.out',
      scrollTrigger: { trigger: row, start: 'top 80%', once: true },
    });
  });

  // ----------------------------------------------------------
  // 3. BORDER DRAW — each capability card traces its outline:
  // top → right → bottom → left, then the content fades up.
  // ----------------------------------------------------------
  document.querySelectorAll('.cap-card').forEach((card, index) => {
    // Inject the four hairline spans the CSS is waiting for.
    ['t', 'r', 'b', 'l'].forEach((side) => {
      const line = document.createElement('span');
      line.className = `draw draw-${side}`;
      line.setAttribute('aria-hidden', 'true');
      card.appendChild(line);
    });

    const tl = gsap.timeline({
      delay: index * 0.1, // cards start tracing in sequence
      scrollTrigger: { trigger: card, start: 'top 82%', once: true },
    });
    tl.to(card.querySelector('.draw-t'), { scaleX: 1, duration: 0.3, ease: 'none' })
      .to(card.querySelector('.draw-r'), { scaleY: 1, duration: 0.3, ease: 'none' })
      .to(card.querySelector('.draw-b'), { scaleX: 1, duration: 0.3, ease: 'none' })
      .to(card.querySelector('.draw-l'), { scaleY: 1, duration: 0.3, ease: 'none' })
      // once the frame is traced, let the lines rest very faint
      .to(card.querySelectorAll('.draw'), { opacity: 0.18, duration: 0.6 });
  });

  // ----------------------------------------------------------
  // 4. TIMELINE PINGS — one radar pulse per marker
  // ----------------------------------------------------------
  document.querySelectorAll('.tl-marker').forEach((marker) => {
    ScrollTrigger.create({
      trigger: marker,
      start: 'top 70%',
      once: true,
      onEnter: () => marker.classList.add('is-hit'),
    });
  });

  // ----------------------------------------------------------
  // 5. CERTIFICATION STAMP-IN — credential cards press in like
  // seals (scale settles down onto the page), then each emits
  // one ring pulse. Rides on top of the standard .reveal fade.
  // ----------------------------------------------------------
  document.querySelectorAll('.cert-card').forEach((card, i) => {
    gsap.from(card, {
      scale: 1.12,
      duration: 0.55,
      delay: (i % 4) * 0.1,   // row stamps left → right
      ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 82%', once: true },
      onComplete() { card.classList.add('is-stamped'); },
    });
  });

  // ----------------------------------------------------------
  // 6. KPI SIGNAL GLITCH — a fast skew/flicker when the numbers
  // re-target after a region change (rides on dashboard.js's own
  // count animation; this is purely visual seasoning).
  // ----------------------------------------------------------
  document.querySelectorAll('#region-chips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      gsap.fromTo('.kpi-value',
        { skewX: 8, opacity: 0.35 },
        { skewX: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
      );
    });
  });
})();
