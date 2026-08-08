/* ============================================================
   hero.js — the animated background behind the hero
   Two scene modes, chosen by data-hero-mode on the canvas:

   "field" (default) — drifting 3D particle constellation (WebGL)
                       — used by index.html and blueprint.html
   "net"             — drifting node network (2D canvas) — nodes
                       link up as they pass each other; used by
                       palantir.html (the owner's pick)

   Shared rules:
   - all colors come from the theme's CSS tokens
   - light themes are auto-detected from --bg luminance
   - reduced motion → one static frame, no loop
   - rendering pauses when the hero is off-screen or tab hidden
   ============================================================ */

(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const REDUCED_MOTION = window.SITE ? window.SITE.reducedMotion : false;
  const MODE = canvas.dataset.heroMode || 'field';

  // ----------------------------------------------------------
  // THEME COLORS (from tokens — never hardcoded)
  // ----------------------------------------------------------
  const css = getComputedStyle(document.documentElement);
  const TOKEN = {
    text: css.getPropertyValue('--text').trim(),
    dim: css.getPropertyValue('--text-dim').trim(),
    accent: css.getPropertyValue('--accent').trim(),
    bg: css.getPropertyValue('--bg').trim() || '#08090c',
  };

  // "#1e2124" → "rgba(30, 33, 36, a)" for 2D canvas strokes
  function rgba(hex, alpha) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  // Perceived luminance of the background → light or dark world
  const bgNum = parseInt(TOKEN.bg.replace('#', ''), 16);
  const isLightTheme =
    (0.299 * ((bgNum >> 16) & 255) + 0.587 * ((bgNum >> 8) & 255) + 0.114 * (bgNum & 255)) / 255 > 0.5;

  // ----------------------------------------------------------
  // SHARED: mouse + visibility + loop scaffolding
  // ----------------------------------------------------------
  const mouse = { x: 0, y: 0, px: -9999, py: -9999 }; // normalized + pixel coords
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    mouse.px = e.clientX;
    mouse.py = e.clientY;
  }, { passive: true });

  let heroVisible = true;
  new IntersectionObserver((entries) => {
    heroVisible = entries[0].isIntersecting;
  }).observe(canvas);

  // Each mode provides: drawFrame(t) and onResize(). runLoop wires
  // them into reduced-motion / visibility / rAF handling.
  function runLoop(drawFrame, onResize) {
    window.addEventListener('resize', () => {
      onResize();
      if (REDUCED_MOTION) drawFrame(0);
    });

    if (REDUCED_MOTION) { drawFrame(0); return; }

    const start = performance.now();
    (function tick() {
      requestAnimationFrame(tick);
      if (!heroVisible || document.hidden) return;
      drawFrame((performance.now() - start) / 1000);
    })();
  }

  // ==========================================================
  // MODE: "field" — drifting particle constellation (WebGL)
  // ==========================================================
  function runField() {
    if (!window.THREE) return; // CDN failed — page stays fine without it

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 0.1, 100
    );
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    function makeCloud(count, colorCss, size, opacity) {
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color: new THREE.Color(colorCss),
        size,
        opacity: isLightTheme ? Math.min(opacity + 0.15, 1) : opacity,
        transparent: true,
        sizeAttenuation: true,
        depthWrite: false,
        // dark themes glow (additive); light themes draw ink dots
        blending: isLightTheme ? THREE.NormalBlending : THREE.AdditiveBlending,
      });
      return new THREE.Points(geometry, material);
    }

    const group = new THREE.Group();
    group.add(makeCloud(1100, TOKEN.dim, 0.045, 0.35));
    group.add(makeCloud(140, TOKEN.accent, 0.07, 0.75));
    scene.add(group);

    runLoop(
      (t) => {
        group.rotation.y = t * 0.02;
        group.position.y = Math.sin(t * 0.25) * 0.3;
        group.rotation.x += (mouse.y * 0.12 - group.rotation.x) * 0.03;
        group.rotation.z += (mouse.x * 0.05 - group.rotation.z) * 0.03;
        renderer.render(scene, camera);
      },
      () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    );
  }

  // ==========================================================
  // MODE: "net" — a drifting node network that links and
  // unlinks as points pass each other (2D canvas)
  // ==========================================================
  function runNet() {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio, 2);
    let w = 0, h = 0;
    const size = () => {
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    const COUNT = 110;
    const LINK_DIST = 130;
    const nodes = [];
    for (let i = 0; i < COUNT; i++) {
      nodes.push({
        x: Math.random(), y: Math.random(),   // stored 0…1, scaled on draw
        vx: (Math.random() - 0.5) * 0.00022,
        vy: (Math.random() - 0.5) * 0.00022,
      });
    }

    function drawFrame() {
      ctx.clearRect(0, 0, w, h);

      // move + wrap
      for (const n of nodes) {
        n.x = (n.x + n.vx + 1) % 1;
        n.y = (n.y + n.vy + 1) % 1;
      }

      // links (thin, fading with distance)
      ctx.lineWidth = 1;
      for (let i = 0; i < COUNT; i++) {
        const a = nodes[i];
        const ax = a.x * w, ay = a.y * h;
        for (let j = i + 1; j < COUNT; j++) {
          const b = nodes[j];
          const bx = b.x * w, by = b.y * h;
          const d = Math.hypot(ax - bx, ay - by);
          if (d > LINK_DIST) continue;
          ctx.strokeStyle = rgba(TOKEN.text, (1 - d / LINK_DIST) * 0.18);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }

      // nodes (slightly larger + brighter when the cursor is close)
      for (const n of nodes) {
        const x = n.x * w, y = n.y * h;
        const near = Math.max(0, 1 - Math.hypot(x - mouse.px, y - mouse.py) / 200);
        ctx.fillStyle = rgba(TOKEN.text, 0.44 + near * 0.4);
        ctx.beginPath();
        ctx.arc(x, y, 1.8 + near * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    runLoop(drawFrame, size);
  }

  // ----------------------------------------------------------
  // LAUNCH the chosen mode
  // ----------------------------------------------------------
  if (MODE === 'net') runNet();
  else runField();
})();
