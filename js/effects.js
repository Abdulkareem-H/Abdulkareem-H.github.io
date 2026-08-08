/* ============================================================
   effects.js — the PREMIUM MOTION LAYER
   Everything in here is polish inspired by award-tier sites
   (Rockstar VI, landonorris.com, Team USA, Netflix Jobs):

   1. Preloader → curtain lift → hero line-mask intro
   2. SplitText masked line reveals on all big headlines
   3. Scroll progress hairline
   4. Hero parallax-out on scroll (scrubbed)
   5. Dashboard 3D tilt-up entrance (scrubbed)
   6. Ghost background words drifting at parallax speed
   7. Experience timeline spine that draws itself
   8. Custom cursor (dot + trailing ring)
   9. Magnetic buttons

   Every effect: skipped under prefers-reduced-motion, and the
   page stays fully readable if any library fails to load.
   ============================================================ */

(function () {
  const REDUCED_MOTION = window.SITE ? window.SITE.reducedMotion : false;
  const preloader = document.getElementById('preloader');

  // If GSAP didn't load, remove the preloader and stop —
  // the site falls back to a plain, fully readable page.
  if (!window.gsap) {
    if (preloader) preloader.remove();
    return;
  }

  const hasSplit = !!window.SplitText;
  if (hasSplit) gsap.registerPlugin(SplitText);

  // ----------------------------------------------------------
  // Helper: masked line reveal.
  // SplitText slices a headline into lines and wraps each in a
  // clipping mask, so lines slide up from "behind" an invisible
  // edge — the signature premium type move.
  // ----------------------------------------------------------
  function splitLines(el) {
    return new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
  }

  // ==========================================================
  // 1 + 2. PRELOADER → HERO INTRO, then scroll-based headline
  // reveals. Wrapped in fonts.ready so SplitText measures the
  // REAL fonts (splitting before fonts load = wrong line breaks).
  // ==========================================================
  document.fonts.ready.then(() => {

    // ---- Scroll-triggered headline reveals (.split-title) ----
    document.querySelectorAll('.split-title').forEach((el) => {
      if (REDUCED_MOTION || !hasSplit) return; // headline just stays visible
      // Hidden titles can't be measured for line-splitting — the
      // WORK console splits + reveals them when their block shows.
      if (el.closest('[hidden]')) return;
      const split = splitLines(el);
      gsap.from(split.lines, {
        yPercent: 115,
        duration: 1.1,
        stagger: 0.09,
        ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });

    // ---- The hero intro (runs after the curtain lifts) ----
    function heroIntro() {
      if (REDUCED_MOTION) return;

      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      // Headline: masked lines slide up...
      if (hasSplit) {
        const split = splitLines(document.getElementById('hero-title'));
        tl.from(split.lines, { yPercent: 115, duration: 1.2, stagger: 0.12 });
      } else {
        tl.from('.hero-title', { opacity: 0, y: 60, duration: 1.2 });
      }

      // ...then the supporting cast staggers in around it.
      tl.from('.hero-eyebrow', { opacity: 0, y: 20, duration: 0.8 }, '-=0.9')
        .from('.hero-tagline', { opacity: 0, y: 30, duration: 0.9 }, '-=0.6')
        .from('.hero-cta', { opacity: 0, y: 30, duration: 0.9 }, '-=0.7')
        .from('.hero-meta', { opacity: 0, duration: 0.8 }, '-=0.5')
        .from('.hero-scroll-cue', { opacity: 0, duration: 0.8 }, '-=0.4');
    }

    // ---- Preloader sequence ----
    if (!preloader || REDUCED_MOTION) {
      if (preloader) preloader.remove();
      return; // no intro animation under reduced motion
    }

    // Freeze scrolling while the curtain is down.
    if (window.SITE.lenis) window.SITE.lenis.stop();

    // Shared cleanup — the ONE place that unlocks the page.
    // Called by the timeline when it finishes, or by the failsafe
    // if anything goes wrong. Safe to call twice.
    let finished = false;
    let failsafe = null;
    function finishPreloader() {
      if (finished) return;
      finished = true;
      clearTimeout(failsafe);
      preloader.remove();
      if (window.SITE.lenis) window.SITE.lenis.start();
      ScrollTrigger.refresh(); // recalculate positions now that layout is final
    }

    // A variant page can replace the default counter/curtain with
    // its own opener: mark the preloader with data-custom, then
    // build a timeline using window.SITE.openerAPI (set below).
    // Scroll-lock, tab-visibility gating, and the failsafe stay
    // centralized here either way.
    const isCustomOpener = preloader.hasAttribute('data-custom');

    function playSequence() {
      // Never trap the user behind the curtain — if the animation
      // can't finish for any reason, force-open after a few seconds.
      failsafe = setTimeout(finishPreloader, isCustomOpener ? 8000 : 6000);

      if (isCustomOpener) {
        // Hand over the controls; the variant script polls for this.
        window.SITE.openerAPI = { heroIntro, finish: finishPreloader };
        return;
      }

      const count = { value: 0 };
      const countEl = document.getElementById('preload-count');
      const barEl = document.getElementById('preload-bar');

      gsap.timeline()
        // Counter 0 → 100 with the bar filling underneath it.
        .to(count, {
          value: 100,
          duration: 1.6,
          ease: 'power2.inOut',
          onUpdate() {
            countEl.textContent = Math.round(count.value);
            barEl.style.transform = `scaleX(${count.value / 100})`;
          },
        })
        // Small breath at 100%...
        .to({}, { duration: 0.25 })
        // ...then the curtain lifts.
        .to(preloader, {
          yPercent: -100,
          duration: 1.0,
          ease: 'power4.inOut',
          onStart: heroIntro, // hero text rises WHILE the curtain lifts
          onComplete: finishPreloader,
        });
    }

    // Browsers pause animation frames in background tabs — and
    // recruiters often open portfolios in background tabs. So if
    // we're hidden, hold the curtain and play the moment the tab
    // becomes visible instead of animating into the void.
    if (document.hidden) {
      document.addEventListener('visibilitychange', function onVisible() {
        if (document.hidden) return;
        document.removeEventListener('visibilitychange', onVisible);
        playSequence();
      });
    } else {
      playSequence();
    }
  });

  // Everything below is scroll polish — none of it runs under
  // reduced motion.
  if (REDUCED_MOTION) return;

  // ==========================================================
  // 3. SCROLL PROGRESS HAIRLINE
  // scrub: 0.3 = the bar eases toward the scroll position with
  // a 0.3s lag, which feels smoother than hard-linking it.
  // ==========================================================
  gsap.to('#scroll-progress', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
  });

  // ==========================================================
  // 4. HERO PARALLAX-OUT
  // As you scroll past the hero, its content drifts up faster
  // than the page and fades — classic cinematic exit.
  // ==========================================================
  gsap.to('.hero-content', {
    yPercent: -30,
    opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom 30%',
      scrub: true,
    },
  });

  // ==========================================================
  // 5. DASHBOARD 3D ENTRANCE
  // The frame starts tilted back (rotateX) and slightly small,
  // and scroll position drives it up into place — like a
  // product reveal. scrub: 1 = follows scroll with 1s of easing.
  // ==========================================================
  // Every dashboard frame on the page gets the same reveal —
  // each .dash-stage drives its own dashboard's entrance.
  gsap.utils.toArray('.dash-stage').forEach((stage) => {
    // Stages inside hidden showcase blocks (the WORK console) get
    // their entrance from js/work-console.js when they're shown.
    if (stage.closest('[hidden]')) return;
    const frame = stage.querySelector('.dashboard');
    if (!frame) return;

    gsap.fromTo(frame,
      { rotateX: 10, scale: 0.94, y: 80, opacity: 0.4 },
      {
        rotateX: 0, scale: 1, y: 0, opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: stage,
          start: 'top 92%',
          end: 'top 40%',
          scrub: 1,
        },
      }
    );

    // KPI cards inside this frame pop in once it has landed.
    const cards = frame.querySelectorAll('.kpi-card');
    if (cards.length) {
      gsap.from(cards, {
        opacity: 0,
        y: 24,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: frame, start: 'top 55%', once: true },
      });
    }
  });

  // ==========================================================
  // 6. GHOST WORDS — huge outlined words behind section titles,
  // drifting slower than the page (parallax = depth).
  // ==========================================================
  document.querySelectorAll('.ghost').forEach((el) => {
    gsap.fromTo(el,
      { yPercent: 40 },
      {
        yPercent: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: el.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });

  // ==========================================================
  // 7. TIMELINE SPINE DRAW
  // The vertical line is a pseudo-element, and GSAP can animate
  // CSS custom properties — so we tween --draw from 0 → 1 and
  // the CSS does transform: scaleY(var(--draw)).
  // ==========================================================
  gsap.to('#timeline', {
    '--draw': 1,
    ease: 'none',
    scrollTrigger: {
      trigger: '#timeline',
      start: 'top 75%',
      end: 'bottom 55%',
      scrub: true,
    },
  });

  // ==========================================================
  // 8. CUSTOM CURSOR — desktop / fine pointers only.
  // The dot tracks the mouse almost 1:1; the ring trails behind
  // it (two different quickTo durations = the "weight").
  // ==========================================================
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  if (finePointer && dot && ring) {
    document.documentElement.classList.add('has-cursor');

    // quickTo = a pre-compiled tween you can retarget every
    // mousemove without creating garbage. Perfect for cursors.
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

    let cursorShown = false;
    window.addEventListener('pointermove', (e) => {
      if (!cursorShown) { // don't show the cursor at (0,0) before first move
        cursorShown = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
      }
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    }, { passive: true });

    // Ring grows over anything clickable.
    document.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hovering'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hovering'));
    });
  }

  // ==========================================================
  // 9. MAGNETIC BUTTONS
  // Inside the button, it leans toward your cursor (30% of the
  // distance, so it feels attracted, not glued). On leave it
  // springs back with an elastic ease.
  // ==========================================================
  if (finePointer) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, { x: relX * 0.3, y: relY * 0.3, duration: 0.4, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }
})();
