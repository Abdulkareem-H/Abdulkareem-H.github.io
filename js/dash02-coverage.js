/* ============================================================
   dash02-coverage.js — Showcase 02: This Year vs Last Year
   (SYNTHETIC)

   The one-sentence dashboard: "are we ahead or behind?"
   One chart — this year's sales on top of last year's, month by
   month — and one sentence underneath, computed from the data,
   that says what it means. No controls. Nothing to learn.

   Colors are read at BUILD time (this dashboard lives in the
   showcase console, whose paper/ink band can differ from the
   page's state at load).
   ============================================================ */

(function () {
  const dashboard = document.getElementById('dashboard-02');
  if (!dashboard || !window.Chart) return;

  const REDUCED_MOTION = window.SITE ? window.SITE.reducedMotion : false;

  // ----------------------------------------------------------
  // 1. THE DATA — monthly sales, SAR M. This year pulls ahead
  // in March and keeps the lead.
  // ----------------------------------------------------------
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const LAST_YEAR = [8.2, 8.0, 8.6, 8.4, 8.1, 7.8, 8.0, 8.3, 8.7, 8.9, 9.2, 9.4];
  const THIS_YEAR = [8.3, 8.1, 9.4, 9.1, 8.8, 8.4, 8.7, 9.0, 9.5, 9.8, 10.3, 10.6];

  // ----------------------------------------------------------
  // 2. THE ANSWER — one sentence, computed from the numbers
  // ----------------------------------------------------------
  function writeAnswer() {
    const totalNow = THIS_YEAR.reduce((s, v) => s + v, 0);
    const totalLast = LAST_YEAR.reduce((s, v) => s + v, 0);
    const aheadPct = ((totalNow / totalLast) - 1) * 100;
    const aheadSar = totalNow - totalLast;

    // The month the gap first became meaningful (> 0.5M)
    const gapMonth = MONTHS[THIS_YEAR.findIndex((v, i) => v - LAST_YEAR[i] > 0.5)];

    document.getElementById('yoy-answer').innerHTML =
      `<strong>Ahead — by ${aheadPct.toFixed(0)}%.</strong> ` +
      `The gap opened in ${gapMonth} and has held every month since. ` +
      `On this pace the year closes about SAR ${aheadSar.toFixed(0)}M ahead of last year.`;
  }

  // ----------------------------------------------------------
  // 3. THE CHART — two lines, that's all
  // ----------------------------------------------------------
  function buildChart() {
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

    const ctx = document.getElementById('chart-yoy').getContext('2d');
    const fillGrad = ctx.createLinearGradient(0, 0, 0, 340);
    fillGrad.addColorStop(0, accentAlpha(0.14));
    fillGrad.addColorStop(1, accentAlpha(0));

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: MONTHS,
        datasets: [
          {
            label: 'This year',
            data: THIS_YEAR,
            borderColor: COLOR.accent,
            backgroundColor: fillGrad,
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointRadius: 0,
            pointHitRadius: 16,
          },
          {
            label: 'Last year',
            data: LAST_YEAR,
            borderColor: COLOR.dim,
            borderDash: [4, 6],
            borderWidth: 1.5,
            pointRadius: 0,
            pointHitRadius: 16,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: REDUCED_MOTION
          ? false
          : { delay: (c) => (c.type === 'data' && c.mode === 'default' ? c.dataIndex * 45 : 0) },
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
  // 4. KICK-OFF — build when scrolled into view
  // ----------------------------------------------------------
  let started = false;
  function start() {
    if (started) return;
    started = true;
    buildChart();
    writeAnswer();
  }

  if (REDUCED_MOTION) start();
  else {
    new IntersectionObserver((entries, observer) => {
      if (entries[0].isIntersecting) { start(); observer.disconnect(); }
    }, { threshold: 0.25 }).observe(dashboard);
  }
})();
