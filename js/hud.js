/* ============================================================
   hud.js — the "intelligence platform" layer (Palantir-grade)
   1. Live UTC clock in the hero HUD + footer readout
   2. Text decode effect — mono labels resolve out of scrambled
      characters when they scroll into view
   3. Terminal boot log inside the preloader

   All decorative: with reduced motion (or if JS fails) every
   label simply shows its final text.
   ============================================================ */

(function () {
  const REDUCED_MOTION = window.SITE ? window.SITE.reducedMotion : false;

  // ----------------------------------------------------------
  // 1. LIVE UTC CLOCK — every .hud-clock element ticks together
  // ----------------------------------------------------------
  const clocks = document.querySelectorAll('.hud-clock');
  if (clocks.length) {
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const d = new Date();
      const stamp = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
      clocks.forEach((c) => { c.textContent = stamp; });
    };
    tick();
    setInterval(tick, 1000);
  }

  // ----------------------------------------------------------
  // 2. TEXT DECODE — [data-scramble] elements resolve from noise
  // Characters lock in left-to-right, like a decrypting readout.
  // ----------------------------------------------------------
  const NOISE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/+=#';

  function decode(el) {
    const finalText = el.textContent;
    const totalFrames = Math.max(16, finalText.length + 6);
    let frame = 0;

    const interval = setInterval(() => {
      frame++;
      // How many characters (from the left) are locked in so far:
      const lockedCount = (frame / totalFrames) * finalText.length;

      el.textContent = finalText
        .split('')
        .map((ch, i) => {
          if (ch === ' ' || i < lockedCount) return ch; // spaces stay, locked chars stay
          return NOISE[Math.floor(Math.random() * NOISE.length)];
        })
        .join('');

      if (frame >= totalFrames) {
        el.textContent = finalText; // always end EXACTLY on the real text
        clearInterval(interval);
      }
    }, 32); // ≈30fps — cheap, and works even where rAF is throttled
  }

  if (!REDUCED_MOTION) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        decode(entry.target);
        observer.unobserve(entry.target); // decode once, never again
      });
    }, { threshold: 0.5 });

    // Hold the hero labels until the preloader curtain is gone,
    // so their decode moment isn't wasted behind it.
    const startObserving = () => {
      document.querySelectorAll('[data-scramble]').forEach((el) => observer.observe(el));
    };
    const waitForCurtain = setInterval(() => {
      if (!document.getElementById('preloader')) {
        clearInterval(waitForCurtain);
        startObserving();
      }
    }, 200);
  }

  // ----------------------------------------------------------
  // 3. PRELOADER BOOT LOG — terminal lines typed under the bar
  // ----------------------------------------------------------
  const log = document.getElementById('preload-log');
  if (log && !REDUCED_MOTION) {
    const LINES = [
      '&gt; INIT RENDER CORE',
      '&gt; LOAD PARTICLE FIELD',
      '&gt; BIND DATA MODEL',
      '&gt; DECRYPT PORTFOLIO',
    ];

    const startLog = () => {
      let i = 0;
      const interval = setInterval(() => {
        // Stop cleanly if the curtain already lifted or we're done.
        if (!document.body.contains(log) || i >= LINES.length) {
          clearInterval(interval);
          return;
        }
        const line = document.createElement('p');
        line.innerHTML = `${LINES[i]} <span class="ok">[OK]</span>`;
        log.appendChild(line);
        i++;
      }, 420);
    };

    // Same background-tab rule as the preloader itself: don't
    // type into the void, start when the page is actually seen.
    if (document.hidden) {
      document.addEventListener('visibilitychange', function onVisible() {
        if (document.hidden) return;
        document.removeEventListener('visibilitychange', onVisible);
        startLog();
      });
    } else {
      startLog();
    }
  }
})();
