/* ============================================================
   dashboard.js — Showcase 01: Trade Performance (SYNTHETIC DATA)

   HARD RULE: every number in this file is invented. It's shaped
   to look like realistic KSA trade analytics, but nothing here
   is real BAT data.

   What this file does:
   1. Defines the synthetic dataset (KPIs, monthly series, channel mix)
   2. Builds two Chart.js charts when the dashboard scrolls into view
   3. Wires the region filter chips — every click re-animates
      the KPI numbers, both charts, and the analyst note
   ============================================================ */

(function () {
  const dashboard = document.getElementById('dashboard-01');
  if (!dashboard || !window.Chart) return;

  const REDUCED_MOTION = window.SITE ? window.SITE.reducedMotion : false;

  // ----------------------------------------------------------
  // 1. SYNTHETIC DATASET
  // ----------------------------------------------------------
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // A shared seasonality curve (Q4 push, quieter mid-summer) so
  // every region's trend feels like it belongs to one market.
  const SEASONALITY = [0.92, 0.95, 1.08, 0.98, 0.94, 0.90,
                       0.96, 1.00, 1.04, 1.06, 1.10, 1.07];

  // Deterministic "randomness": same wobble every page load, so
  // the dashboard always tells the same story. (A seeded PRNG —
  // Math.random() would reshuffle the narrative on every visit.)
  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  // Monthly volume series per region (millions of units).
  // base = the region's typical month; wobble adds realism.
  function makeSeries(base, seed) {
    const rand = seeded(seed);
    return SEASONALITY.map((s) => +(base * s * (0.95 + rand() * 0.1)).toFixed(1));
  }

  const REGIONS = {
    Central:  { volume: makeSeries(9.5, 11), share: [0.14, 0.20, 0.16, 0.22, 0.28] },
    Western:  { volume: makeSeries(7.8, 23), share: [0.18, 0.24, 0.18, 0.21, 0.19] },
    Eastern:  { volume: makeSeries(5.6, 37), share: [0.22, 0.28, 0.17, 0.18, 0.15] },
    Southern: { volume: makeSeries(3.4, 51), share: [0.30, 0.32, 0.14, 0.14, 0.10] },
  };

  const CHANNELS = ['Wholesale', 'Grocery', 'Convenience', 'Supermarket', 'Hypermarket'];

  // Headline KPIs per region view. volume = M units, revenue = SAR M,
  // dist / strike = %, d = variance vs last year (percentage points or %).
  const KPI = {
    All:      { volume: 78.4, revenue: 412, dist: 87.8, strike: 64.2,
                d: { volume: 4.6, revenue: 5.8, dist: 1.9, strike: 3.4 } },
    Central:  { volume: 28.9, revenue: 158, dist: 92.4, strike: 68.5,
                d: { volume: 4.2, revenue: 5.1, dist: 0.8, strike: 2.2 } },
    Western:  { volume: 23.6, revenue: 129, dist: 88.1, strike: 65.0,
                d: { volume: 6.8, revenue: 8.2, dist: 2.6, strike: 4.1 } },
    Eastern:  { volume: 16.4, revenue: 82,  dist: 84.6, strike: 59.8,
                d: { volume: -1.9, revenue: -0.8, dist: -1.2, strike: 0.6 } },
    Southern: { volume: 9.5,  revenue: 43,  dist: 79.3, strike: 61.4,
                d: { volume: 9.4, revenue: 10.6, dist: 4.8, strike: 5.9 } },
  };

  // The "insight engine" — a real analyst summary per filter.
  // This is the recruiter-facing magic: the dashboard doesn't just
  // show numbers, it reads them.
  const NOTES = {
    All: '<strong>National volume is pacing +4.6% vs LY</strong> with the Q4 build led by Western and Southern. Eastern is the only region tracking below last year — recommend ring-fencing trade investment there before it drags the full-year number.',
    Central: '<strong>Central remains the volume engine</strong> (37% of national) but growth is maturing at +4.2%. Recommendation: defend hypermarket share and shift incremental spend toward premium SKUs where margin headroom is strongest.',
    Western: '<strong>Western is the growth story — +6.8% vs LY</strong>, driven by modern trade. Distribution gained 2.6pts. Recommendation: double down on supermarket activations while momentum compounds.',
    Eastern: '<strong>Eastern is the watch-out: −1.9% vs LY</strong> with distribution slipping 1.2pts, concentrated in grocery. Recommendation: rebalance rep routes toward lapsed outlets and launch a win-back program this quarter.',
    Southern: '<strong>Southern is small but sprinting — +9.4% vs LY</strong> from the lowest distribution base (79.3%). Every point of coverage converts. Recommendation: expand the wholesale partner network to accelerate reach.',
  };

  // ----------------------------------------------------------
  // 2. FORMAT HELPERS
  // ----------------------------------------------------------
  const fmt = {
    volume:  (v) => v.toFixed(1) + 'M',
    revenue: (v) => 'SAR ' + Math.round(v) + 'M',
    dist:    (v) => v.toFixed(1) + '%',
    strike:  (v) => v.toFixed(1) + '%',
  };

  function renderDelta(el, delta) {
    const up = delta >= 0;
    el.textContent = (up ? '▲ +' : '▼ ') + delta.toFixed(1) + '% vs LY';
    el.classList.toggle('up', up);
    el.classList.toggle('down', !up);
  }

  // Sum monthly series across all regions (for the "All" view).
  function nationalSeries() {
    return MONTHS.map((_, i) =>
      +Object.values(REGIONS).reduce((sum, r) => sum + r.volume[i], 0).toFixed(1)
    );
  }

  function seriesFor(region) {
    return region === 'All' ? nationalSeries() : REGIONS[region].volume;
  }

  // Targets sit ~3% above actuals — close enough to feel like a
  // real stretch target, far enough to create visible variance.
  function targetFor(region) {
    return seriesFor(region).map((v) => +(v * 1.03).toFixed(1));
  }

  // Channel revenue = region revenue split by that region's mix.
  function channelsFor(region) {
    if (region === 'All') {
      return CHANNELS.map((_, c) =>
        +Object.keys(REGIONS).reduce(
          (sum, r) => sum + KPI[r].revenue * REGIONS[r].share[c], 0
        ).toFixed(0)
      );
    }
    return REGIONS[region].share.map((s) => +(KPI[region].revenue * s).toFixed(0));
  }

  // ----------------------------------------------------------
  // 3. CHART.JS GLOBAL STYLE — match the design system
  // ----------------------------------------------------------
  // Read tokens from the dashboard element itself, not the page
  // root — CSS variables cascade, so if the dashboard sits inside
  // a themed "band" section (e.g. an ink-dark band on the ivory
  // variant), the charts automatically pick up the band's colors.
  const css = getComputedStyle(dashboard);
  const COLOR = {
    accent:   css.getPropertyValue('--accent').trim(),
    dim:      css.getPropertyValue('--text-dim').trim(),
    hairline: css.getPropertyValue('--hairline').trim(),
    surface:  css.getPropertyValue('--surface').trim(),
    text:     css.getPropertyValue('--text').trim(),
  };

  // Turn the theme's accent (e.g. "#00d9a3") into rgba() at any
  // opacity — so charts recolor themselves per theme, and we never
  // hardcode a color here (design-system rule).
  function accentAlpha(alpha) {
    let h = COLOR.accent.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  Chart.defaults.font.family = "'JetBrains Mono', monospace";
  Chart.defaults.font.size = 10;
  Chart.defaults.color = COLOR.dim;

  // Shared tooltip look: dark surface, hairline border, mono type.
  const TOOLTIP = {
    backgroundColor: COLOR.surface,
    borderColor: COLOR.hairline,
    borderWidth: 1,
    titleColor: COLOR.text,
    bodyColor: COLOR.dim,
    padding: 12,
    cornerRadius: 8,
    displayColors: false,
  };

  // Stagger points/bars left→right so charts "draw in".
  const drawIn = REDUCED_MOTION
    ? false
    : { delay: (ctx) => (ctx.type === 'data' && ctx.mode === 'default' ? ctx.dataIndex * 55 : 0) };

  let trendChart = null;
  let channelChart = null;

  function buildCharts(region) {
    // — LINE: volume vs target —
    const trendCtx = document.getElementById('chart-trend').getContext('2d');

    // Vertical emerald gradient under the actuals line.
    const fillGrad = trendCtx.createLinearGradient(0, 0, 0, 280);
    fillGrad.addColorStop(0, accentAlpha(0.18));
    fillGrad.addColorStop(1, accentAlpha(0));

    trendChart = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: MONTHS,
        datasets: [
          {
            label: 'Actual',
            data: seriesFor(region),
            borderColor: COLOR.accent,
            backgroundColor: fillGrad,
            fill: true,
            tension: 0.4,          // smooth curve
            borderWidth: 2,
            pointRadius: 0,        // clean line...
            pointHitRadius: 16,    // ...but easy to hover
          },
          {
            label: 'Target',
            data: targetFor(region),
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
        animation: drawIn,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { boxWidth: 14, boxHeight: 1, padding: 16 },
          },
          tooltip: {
            ...TOOLTIP,
            callbacks: { label: (c) => ` ${c.dataset.label}: ${c.parsed.y}M units` },
          },
        },
        scales: {
          x: { grid: { display: false }, border: { color: COLOR.hairline } },
          y: {
            grid: { color: COLOR.hairline },
            border: { display: false },
            ticks: { callback: (v) => v + 'M' },
          },
        },
      },
    });

    // — BAR: revenue by channel —
    channelChart = new Chart(document.getElementById('chart-channel'), {
      type: 'bar',
      data: {
        labels: CHANNELS,
        datasets: [{
          data: channelsFor(region),
          backgroundColor: accentAlpha(0.55),
          hoverBackgroundColor: COLOR.accent,
          borderRadius: 5,
          maxBarThickness: 34,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: drawIn,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...TOOLTIP,
            callbacks: { label: (c) => ` SAR ${c.parsed.y}M` },
          },
        },
        scales: {
          x: { grid: { display: false }, border: { color: COLOR.hairline } },
          y: {
            grid: { color: COLOR.hairline },
            border: { display: false },
            ticks: { callback: (v) => v },
          },
        },
      },
    });
  }

  // ----------------------------------------------------------
  // 4. KPI CARDS — numbers count from old value to new value
  // ----------------------------------------------------------
  const kpiCards = dashboard.querySelectorAll('.kpi-card');
  const current = { volume: 0, revenue: 0, dist: 0, strike: 0 }; // animate FROM here

  function updateKPIs(region, animate) {
    const data = KPI[region];

    kpiCards.forEach((card) => {
      const key = card.dataset.kpi;
      const valueEl = card.querySelector('.kpi-value');
      const deltaEl = card.querySelector('.kpi-delta');

      renderDelta(deltaEl, data.d[key]);

      if (!animate || REDUCED_MOTION || !window.gsap) {
        current[key] = data[key];
        valueEl.textContent = fmt[key](data[key]);
        return;
      }

      gsap.to(current, {
        [key]: data[key],
        duration: 0.9,
        ease: 'power2.out',
        onUpdate: () => { valueEl.textContent = fmt[key](current[key]); },
      });
    });
  }

  // ----------------------------------------------------------
  // 5. ANALYST NOTE — quick fade swap when the region changes
  // ----------------------------------------------------------
  const noteEl = document.getElementById('analyst-note');

  function updateNote(region) {
    if (REDUCED_MOTION) { noteEl.innerHTML = NOTES[region]; return; }
    noteEl.style.opacity = 0;
    setTimeout(() => {
      noteEl.innerHTML = NOTES[region];
      noteEl.style.opacity = 1;
    }, 250);
  }

  // ----------------------------------------------------------
  // 6. FILTER CHIPS
  // ----------------------------------------------------------
  const chips = document.querySelectorAll('#region-chips .chip');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const region = chip.dataset.region;

      chips.forEach((c) => {
        const active = c === chip;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', active);
      });

      updateKPIs(region, true);
      updateNote(region);

      if (trendChart) {
        trendChart.data.datasets[0].data = seriesFor(region);
        trendChart.data.datasets[1].data = targetFor(region);
        trendChart.update(); // Chart.js tweens old values → new values
      }
      if (channelChart) {
        channelChart.data.datasets[0].data = channelsFor(region);
        channelChart.update();
      }
    });
  });

  // ----------------------------------------------------------
  // 7. KICK-OFF — build everything the first time the dashboard
  // scrolls into view, so the draw-in animation happens on-screen.
  // ----------------------------------------------------------
  let started = false;
  function start() {
    if (started) return;
    started = true;
    buildCharts('All');
    updateKPIs('All', !REDUCED_MOTION);
    noteEl.innerHTML = NOTES.All;
  }

  if (REDUCED_MOTION) {
    start(); // no scroll choreography — just render it
  } else {
    new IntersectionObserver((entries, observer) => {
      if (entries[0].isIntersecting) {
        start();
        observer.disconnect();
      }
    }, { threshold: 0.25 }).observe(dashboard);
  }
})();
