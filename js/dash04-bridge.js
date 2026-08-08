/* ============================================================
   dash04-bridge.js — Showcase 04: Variance Bridge (SYNTHETIC)

   A budget → actual waterfall built from Chart.js floating bars
   ([start, end] pairs), upgraded to read like a real finance
   bridge:
   - value labels above every bar (+6.5 / −1.8 / totals)
   - dashed connectors walking each bar into the next
   - solid bars = totals & gains, hollow bars = givebacks
   - y-axis starts at 80 so the deltas are actually visible

   IMPORTANT: colors are read at BUILD time, not load time — this
   dashboard lives in the showcase console, and the section's
   paper/ink band (and therefore every color token) can differ
   from what it was when the page first loaded.
   ============================================================ */

(function () {
  const dashboard = document.getElementById('dashboard-04');
  if (!dashboard || !window.Chart) return;

  const REDUCED_MOTION = window.SITE ? window.SITE.reducedMotion : false;

  // ----------------------------------------------------------
  // 1. SYNTHETIC QUARTERS — budget, four drivers, and the story
  // ----------------------------------------------------------
  const QUARTERS = {
    Q1: {
      budget: 96,
      drivers: { Volume: 6.5, Price: 2.1, Mix: -1.8, FX: -1.2 },
      story: '<strong>Q1 beat budget by SAR 5.6M</strong>, and it was earned the healthy way — volume did the lifting (+6.5) with pricing support (+2.1), while mix drifted toward value packs (−1.8) and FX shaved the rest.',
    },
    Q2: {
      budget: 101,
      drivers: { Volume: -3.4, Price: 2.4, Mix: -1.1, FX: -0.6 },
      story: '<strong>Q2 missed by SAR 2.7M — and price is masking it.</strong> Volume fell 3.4 against plan; pricing (+2.4) covered most of the optics. Watch-out: beats built on price alone don\'t repeat.',
    },
    Q3: {
      budget: 104,
      drivers: { Volume: 4.2, Price: 1.2, Mix: 2.6, FX: -0.9 },
      story: '<strong>Q3\'s +7.1M is the best-quality beat of the year</strong> — volume and premium mix (+2.6) grew together, which means the growth came from the right products, not just more cases.',
    },
    Q4: {
      budget: 110,
      drivers: { Volume: 5.8, Price: -1.6, Mix: 1.4, FX: 0.8 },
      story: '<strong>Q4 closed +6.4M on a volume surge (+5.8)</strong> — but note the price giveback (−1.6): the push was bought with promo depth. FX finally turned friendly (+0.8).',
    },
  };

  // ----------------------------------------------------------
  // 2. COLORS — resolved lazily inside start() (band-aware)
  // ----------------------------------------------------------
  let COLOR = null;

  function readTokens() {
    const css = getComputedStyle(dashboard);
    COLOR = {
      accent: css.getPropertyValue('--accent').trim(),
      dim: css.getPropertyValue('--text-dim').trim(),
      hairline: css.getPropertyValue('--hairline').trim(),
      surface: css.getPropertyValue('--surface').trim(),
      text: css.getPropertyValue('--text').trim(),
    };
  }

  function alphaOf(hex, alpha) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  // ----------------------------------------------------------
  // 3. WATERFALL MATH — drivers → [start, end] bars + styling
  // Totals & gains: solid ink. Givebacks: hollow (outlined).
  // ----------------------------------------------------------
  function bridgeData(q) {
    const { budget, drivers } = QUARTERS[q];
    const labels = ['Budget', ...Object.keys(drivers), 'Actual'];
    const bars = [[0, budget]];
    const fills = [alphaOf(COLOR.accent, 0.9)];
    const borders = ['transparent'];
    const borderWidths = [0];

    let cumulative = budget;
    for (const value of Object.values(drivers)) {
      bars.push([cumulative, cumulative + value]);
      if (value >= 0) {
        fills.push(alphaOf(COLOR.accent, 0.55));
        borders.push('transparent');
        borderWidths.push(0);
      } else {
        fills.push(alphaOf(COLOR.accent, 0.06)); // hollow
        borders.push(alphaOf(COLOR.dim, 0.9));
        borderWidths.push(1);
      }
      cumulative += value;
    }
    bars.push([0, cumulative]);
    fills.push(alphaOf(COLOR.accent, 0.9));
    borders.push('transparent');
    borderWidths.push(0);

    return { labels, bars, fills, borders, borderWidths };
  }

  // ----------------------------------------------------------
  // 4. PLUGIN — value labels above bars + dashed connectors
  // (this is what turns floating bars into a readable bridge)
  // ----------------------------------------------------------
  const bridgeExtras = {
    id: 'bridgeExtras',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      const data = chart.data.datasets[0].data;
      ctx.save();
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';

      meta.data.forEach((bar, i) => {
        const [start, end] = data[i];
        const { x, width } = bar.getProps(['x', 'width'], true);
        const isTotal = i === 0 || i === data.length - 1;
        const value = isTotal ? end : end - start;
        const label = isTotal
          ? end.toFixed(1)
          : (value >= 0 ? '+' : '−') + Math.abs(value).toFixed(1);

        // value label just above the taller edge of the bar
        const yTop = chart.scales.y.getPixelForValue(Math.max(start, end));
        ctx.fillStyle = COLOR.text;
        ctx.fillText(label, x, yTop - 7);

        // dashed connector: this bar's END walks into the next bar
        if (i < meta.data.length - 1) {
          const yEnd = chart.scales.y.getPixelForValue(end);
          const next = meta.data[i + 1].getProps(['x', 'width'], true);
          ctx.strokeStyle = alphaOf(COLOR.dim, 0.7);
          ctx.setLineDash([3, 3]);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + width / 2, yEnd);
          ctx.lineTo(next.x - next.width / 2, yEnd);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
      ctx.restore();
    },
  };

  // ----------------------------------------------------------
  // 5. CHART
  // ----------------------------------------------------------
  let chart = null;

  function buildChart() {
    const { labels, bars, fills, borders, borderWidths } = bridgeData('Q1');
    chart = new Chart(document.getElementById('chart-bridge'), {
      type: 'bar',
      plugins: [bridgeExtras],
      data: {
        labels,
        datasets: [{
          data: bars,
          backgroundColor: fills,
          borderColor: borders,
          borderWidth: borderWidths,
          borderRadius: 2,
          borderSkipped: false,
          maxBarThickness: 56,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: REDUCED_MOTION ? false : { duration: 700 },
        layout: { padding: { top: 18 } }, // room for the value labels
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: COLOR.surface,
            borderColor: COLOR.hairline,
            borderWidth: 1,
            titleColor: COLOR.text,
            bodyColor: COLOR.dim,
            padding: 12,
            cornerRadius: 4,
            displayColors: false,
            callbacks: {
              label(c) {
                const [start, end] = c.raw;
                const isTotal = c.dataIndex === 0 || c.dataIndex === c.dataset.data.length - 1;
                if (isTotal) return ` SAR ${end.toFixed(1)}M`;
                const delta = end - start;
                return ` ${delta >= 0 ? '+' : '−'}SAR ${Math.abs(delta).toFixed(1)}M`;
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false }, border: { color: COLOR.hairline },
               ticks: { color: COLOR.dim } },
          y: {
            grid: { color: COLOR.hairline },
            border: { display: false },
            ticks: { color: COLOR.dim, callback: (v) => v + 'M' },
            // start at 80, not 0 — the deltas are the story, so
            // give them the vertical room to be visible
            min: 80,
            suggestedMax: 122,
          },
        },
      },
    });
  }

  // ----------------------------------------------------------
  // 6. QUARTER SWITCHING + NARRATIVE
  // ----------------------------------------------------------
  const takeaway = document.getElementById('brg-takeaway-text');
  takeaway.style.transition = 'opacity 0.25s ease';

  function show(q) {
    const { labels, bars, fills, borders, borderWidths } = bridgeData(q);
    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = bars;
      chart.data.datasets[0].backgroundColor = fills;
      chart.data.datasets[0].borderColor = borders;
      chart.data.datasets[0].borderWidth = borderWidths;
      chart.update();
    }
    if (REDUCED_MOTION) {
      takeaway.innerHTML = QUARTERS[q].story;
    } else {
      takeaway.style.opacity = 0;
      setTimeout(() => {
        takeaway.innerHTML = QUARTERS[q].story;
        takeaway.style.opacity = 1;
      }, 220);
    }
  }

  const chips = document.querySelectorAll('#quarter-chips .chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => {
        const active = c === chip;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', active);
      });
      show(chip.dataset.quarter);
    });
  });

  // ----------------------------------------------------------
  // 7. KICK-OFF — tokens are read HERE, once the block is
  // actually visible in its correct band.
  // ----------------------------------------------------------
  let started = false;
  function start() {
    if (started) return;
    started = true;
    readTokens();
    buildChart();
    takeaway.innerHTML = QUARTERS.Q1.story;
  }

  if (REDUCED_MOTION) start();
  else {
    new IntersectionObserver((entries, observer) => {
      if (entries[0].isIntersecting) { start(); observer.disconnect(); }
    }, { threshold: 0.25 }).observe(dashboard);
  }
})();
