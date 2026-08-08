/* ============================================================
   dash03-scenario.js — Showcase 03: Scenario Studio (SYNTHETIC)

   A what-if simulator. Three levers re-plan a 12-month revenue
   forecast in real time:
   - Distribution push (pts)  → volume uplift, ramps in over 4 months
   - Price index (95–110)     → revenue up, volume down (elasticity)
   - Promo weeks (0–12)       → volume up, margin down

   All coefficients are invented but shaped like the real thing.
   ============================================================ */

(function () {
  const dashboard = document.getElementById('dashboard-03');
  if (!dashboard || !window.Chart) return;

  const REDUCED_MOTION = window.SITE ? window.SITE.reducedMotion : false;

  // ----------------------------------------------------------
  // 1. BASE PLAN — next 12 months of revenue (SAR M)
  // Gentle growth + the same seasonality curve as Showcase 01.
  // ----------------------------------------------------------
  const MONTHS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6',
                  'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];
  const SEASONALITY = [0.92, 0.95, 1.08, 0.98, 0.94, 0.90,
                       0.96, 1.00, 1.04, 1.06, 1.10, 1.07];
  const BASE = SEASONALITY.map((s, i) =>
    +(34 * s * (1 + i * 0.006)).toFixed(1)   // ~SAR 34M/month, +0.6%/mo drift
  );

  // ----------------------------------------------------------
  // 2. THE MODEL — levers in, monthly scenario out
  // ----------------------------------------------------------
  const levers = { dist: 0, price: 100, promo: 0 };

  function scenarioSeries() {
    return BASE.map((base, month) => {
      // New distribution takes time to build — ramp over 4 months.
      const ramp = Math.min(1, (month + 1) / 4);
      const volumeMult =
        (1 + levers.dist * 0.008 * ramp) *          // +0.8% volume per point
        (1 - (levers.price - 100) * 0.012) *        // elasticity ≈ −1.2
        (1 + (levers.promo / 12) * 0.045);          // full promo load = +4.5%
      const priceMult = levers.price / 100;
      return +(base * volumeMult * priceMult).toFixed(1);
    });
  }

  function deltas() {
    const volumePct =
      ((1 + levers.dist * 0.008) *
       (1 - (levers.price - 100) * 0.012) *
       (1 + (levers.promo / 12) * 0.045) - 1) * 100;
    const revenue = scenarioSeries().reduce((s, v) => s + v, 0) -
                    BASE.reduce((s, v) => s + v, 0);
    // Margin: price is accretive, promos and route cost dilute.
    const margin = (levers.price - 100) * 0.35 -
                   levers.promo * 0.12 -
                   levers.dist * 0.05;
    return { volumePct, revenue, margin };
  }

  // ----------------------------------------------------------
  // 3. TOKENS + CHART (reads colors from its own band scope)
  // ----------------------------------------------------------
  const css = getComputedStyle(dashboard);
  const COLOR = {
    accent: css.getPropertyValue('--accent').trim(),
    dim: css.getPropertyValue('--text-dim').trim(),
    hairline: css.getPropertyValue('--hairline').trim(),
    surface: css.getPropertyValue('--surface').trim(),
    text: css.getPropertyValue('--text').trim(),
  };
  function accentAlpha(alpha) {
    let h = COLOR.accent.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  let chart = null;

  function buildChart() {
    const ctx = document.getElementById('chart-scenario').getContext('2d');
    const fillGrad = ctx.createLinearGradient(0, 0, 0, 280);
    fillGrad.addColorStop(0, accentAlpha(0.16));
    fillGrad.addColorStop(1, accentAlpha(0));

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: MONTHS,
        datasets: [
          {
            label: 'Scenario',
            data: scenarioSeries(),
            borderColor: COLOR.accent,
            backgroundColor: fillGrad,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHitRadius: 16,
          },
          {
            label: 'Base plan',
            data: BASE,
            borderColor: COLOR.dim,
            borderDash: [4, 6],
            borderWidth: 1,
            pointRadius: 0,
            pointHitRadius: 16,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: REDUCED_MOTION ? false : { duration: 600 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { boxWidth: 14, boxHeight: 1, padding: 16, color: COLOR.dim },
          },
          tooltip: {
            backgroundColor: COLOR.surface,
            borderColor: COLOR.hairline,
            borderWidth: 1,
            titleColor: COLOR.text,
            bodyColor: COLOR.dim,
            padding: 12,
            cornerRadius: 4,
            displayColors: false,
            callbacks: { label: (c) => ` ${c.dataset.label}: SAR ${c.parsed.y}M` },
          },
        },
        scales: {
          x: { grid: { display: false }, border: { color: COLOR.hairline },
               ticks: { color: COLOR.dim } },
          y: { grid: { color: COLOR.hairline }, border: { display: false },
               ticks: { color: COLOR.dim, callback: (v) => v + 'M' } },
        },
      },
    });
  }

  // ----------------------------------------------------------
  // 4. OUTPUT — chart + delta KPIs re-render on every lever move
  // ----------------------------------------------------------
  const outVol = document.getElementById('scn-dvol');
  const outRev = document.getElementById('scn-drev');
  const outMargin = document.getElementById('scn-dmargin');
  const sign = (v) => (v >= 0 ? '+' : '−');

  function render(fast) {
    const d = deltas();
    outVol.textContent = `${sign(d.volumePct)}${Math.abs(d.volumePct).toFixed(1)}%`;
    outRev.textContent = `SAR ${sign(d.revenue)}${Math.abs(d.revenue).toFixed(0)}M`;
    outMargin.textContent = `${sign(d.margin)}${Math.abs(d.margin).toFixed(1)} pts`;

    if (chart) {
      chart.data.datasets[0].data = scenarioSeries();
      // While dragging, skip Chart.js animation so it feels wired
      // directly to your hand; animate on discrete changes.
      chart.update(fast ? 'none' : undefined);
    }
  }

  // ----------------------------------------------------------
  // 5. WIRE THE LEVERS
  // ----------------------------------------------------------
  const controls = [
    { input: 'lev-dist', out: 'lev-dist-out', key: 'dist', format: (v) => `+${v} pts` },
    { input: 'lev-price', out: 'lev-price-out', key: 'price', format: (v) => `${v}` },
    { input: 'lev-promo', out: 'lev-promo-out', key: 'promo', format: (v) => `${v}` },
  ];

  controls.forEach(({ input, out, key, format }) => {
    const el = document.getElementById(input);
    const outEl = document.getElementById(out);
    el.addEventListener('input', () => {
      levers[key] = +el.value;
      outEl.textContent = format(el.value);
      render(true);
    });
  });

  document.getElementById('scn-reset').addEventListener('click', () => {
    controls.forEach(({ input, out, key, format }) => {
      const el = document.getElementById(input);
      el.value = el.getAttribute('value'); // back to the markup default
      levers[key] = +el.value;
      document.getElementById(out).textContent = format(el.value);
    });
    render(false);
  });

  // ----------------------------------------------------------
  // 6. KICK-OFF — build when scrolled into view (charts animate
  // on-screen), or immediately under reduced motion.
  // ----------------------------------------------------------
  let started = false;
  function start() {
    if (started) return;
    started = true;
    buildChart();
    render(false);
  }

  if (REDUCED_MOTION) start();
  else {
    new IntersectionObserver((entries, observer) => {
      if (entries[0].isIntersecting) { start(); observer.disconnect(); }
    }, { threshold: 0.25 }).observe(dashboard);
  }
})();
