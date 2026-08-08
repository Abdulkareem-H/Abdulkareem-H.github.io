/* ============================================================
   dash05-brand.js — Showcase 05: Brand Performance (SYNTHETIC)

   The one-sentence dashboard: "pick a brand — its numbers, its
   year-end estimate, and its products ranked from hero to
   problem child."
   - three headline numbers (YTD, vs last year, year-end estimate)
   - the brand's products as ranked bars, biggest first;
     declining products render faded with a ▼
   - one takeaway sentence, written from the data
   - generic names only ("Brand 1", "Product 1") — hard rule

   Every number here is invented. YTD = 8 months, so the
   year-end estimate is simply pace × 12/8.
   ============================================================ */

(function () {
  const list = document.getElementById('bp-list');
  if (!list) return;

  const REDUCED_MOTION = window.SITE ? window.SITE.reducedMotion : false;
  const MONTHS_ELAPSED = 8;

  // ----------------------------------------------------------
  // 1. THE BRANDS — [ytd SAR M, growth %] per product
  // ----------------------------------------------------------
  const BRANDS = [
    {
      name: 'Brand 1', vsLY: 7,
      products: [
        ['Product 1', 24.8, 12], ['Product 2', 15.2, 9], ['Product 3', 11.0, 3],
        ['Product 4', 8.1, -1],  ['Product 5', 5.6, -8], ['Product 6', 3.7, 2],
      ],
    },
    {
      name: 'Brand 2', vsLY: 3,
      products: [
        ['Product 1', 12.4, 6],  ['Product 2', 9.8, -2], ['Product 3', 7.6, 8],
        ['Product 4', 5.9, 1],   ['Product 5', 3.4, -5], ['Product 6', 2.1, 14],
      ],
    },
    {
      name: 'Brand 3', vsLY: -4,
      products: [
        ['Product 1', 8.2, -9],  ['Product 2', 5.4, -6], ['Product 3', 4.1, 11],
        ['Product 4', 2.8, -3],  ['Product 5', 1.6, -12], ['Product 6', 0.5, 2],
      ],
    },
  ];

  // ----------------------------------------------------------
  // 2. RENDER — headline numbers, ranked products, the read
  // ----------------------------------------------------------
  function render(brandIndex) {
    const brand = BRANDS[brandIndex];
    const ytd = brand.products.reduce((s, [, v]) => s + v, 0);
    const estimate = ytd * (12 / MONTHS_ELAPSED);

    // — headline numbers —
    document.getElementById('bp-sales').textContent = 'SAR ' + ytd.toFixed(1) + 'M';
    document.getElementById('bp-vsly').textContent =
      (brand.vsLY >= 0 ? '+' : '−') + Math.abs(brand.vsLY) + '%';
    document.getElementById('bp-est').textContent = 'SAR ~' + Math.round(estimate) + 'M';

    // — ranked product bars (biggest first) —
    const ranked = [...brand.products].sort((a, b) => b[1] - a[1]);
    const top = ranked[0][1];
    list.innerHTML = '';
    ranked.forEach(([name, sales, growth]) => {
      const row = document.createElement('div');
      row.className = 'bp-row' + (growth < 0 ? ' is-down' : '');
      row.innerHTML = `
        <span class="bp-name">${name}</span>
        <span class="bp-track"><i style="width:${Math.max(4, (sales / top) * 100)}%"></i></span>
        <span class="bp-val">SAR ${sales.toFixed(1)}M</span>
        <span class="bp-growth ${growth >= 0 ? 'is-up' : 'is-down'}">
          ${growth >= 0 ? '▲' : '▼'} ${Math.abs(growth)}%
        </span>`;
      list.appendChild(row);
    });

    if (!REDUCED_MOTION && window.gsap) {
      gsap.from(list.children, {
        opacity: 0, x: -14, duration: 0.4, stagger: 0.05, ease: 'power2.out',
      });
    }

    // — the read: hero + drag + destination, from the data —
    const hero = ranked[0];
    const drag = [...brand.products].sort((a, b) => a[2] - b[2])[0];
    const grower = [...brand.products].sort((a, b) => b[2] - a[2])[0];
    const heroShare = Math.round((hero[1] / ytd) * 100);

    const read = brand.vsLY >= 0
      ? `<strong>${hero[0]} carries ${heroShare}% of the brand</strong>${hero[2] > 0 ? ` and is still growing (+${hero[2]}%)` : ''}. ` +
        `The drag is ${drag[0]} (−${Math.abs(drag[2])}%) — fix it or retire it. ` +
        `On this pace the brand closes the year around SAR ${Math.round(estimate)}M.`
      : `<strong>The brand is shrinking (−${Math.abs(brand.vsLY)}%).</strong> ` +
        `Only ${grower[0]} is growing (+${grower[2]}%) — that's the rebuild candidate. ` +
        `Everything else needs a decision: invest, reprice, or let go. Year-end lands around SAR ${Math.round(estimate)}M.`;

    document.getElementById('bp-takeaway').innerHTML = read;
  }

  // ----------------------------------------------------------
  // 3. BRAND CHIPS
  // ----------------------------------------------------------
  document.querySelectorAll('#bp-brands .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#bp-brands .chip').forEach((c) => {
        const active = c === chip;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', active);
      });
      render(+chip.dataset.brand);
    });
  });

  render(0);
})();
