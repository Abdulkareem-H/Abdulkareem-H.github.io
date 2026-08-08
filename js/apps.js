/* ============================================================
   apps.js — the APP STATION (palantir.html, #apps section)

   Three working demo apps share one window:

   APP 1 · DAILY SALES REPORT — pick a scope, GENERATE, and a
   finished report document lands on the output stage.

   APP 2 · RTM PERFORMANCE — scores all 10 routes on strike
   rate, drop size, and coverage; renders a route league table
   you can re-rank by different metrics.

   APP 3 · SKU & BRAND REPORT — compiles sales into brand or
   SKU league tables (generic names only: "Brand 1", "SKU 12").

   All numbers synthetic; outputs describe WHAT the apps do —
   never how they're built (hard rule).
   ============================================================ */

(function () {
  const appDemo = document.getElementById('app-demo');
  if (!appDemo) return;

  const REDUCED_MOTION = window.SITE ? window.SITE.reducedMotion : false;

  // ----------------------------------------------------------
  // SHARED HELPERS
  // ----------------------------------------------------------
  function playLog(logEl, lines, onDone) {
    logEl.innerHTML = '';
    if (REDUCED_MOTION) {
      logEl.innerHTML = lines.map(([html]) => `<p>${html}</p>`).join('');
      if (onDone) onDone();
      return;
    }
    const caret = document.createElement('span');
    caret.className = 'caret';
    let i = 0;
    (function next() {
      if (i >= lines.length) {
        caret.remove();
        if (onDone) onDone();
        return;
      }
      const [html, pause] = lines[i];
      const line = document.createElement('p');
      line.innerHTML = html;
      logEl.appendChild(line);
      line.appendChild(caret);
      i++;
      setTimeout(next, pause || 400);
    })();
  }

  function showOutput(panel, html) {
    panel.classList.add('has-output');
    panel.innerHTML = html;
    if (!REDUCED_MOTION && window.gsap) {
      gsap.from(panel.firstElementChild, { opacity: 0, y: 16, duration: 0.5, ease: 'power3.out' });
    }
  }

  const wobble = (v, pct) => v * (1 + (Math.random() - 0.5) * pct);
  const signed = (v, suffix) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + suffix;
  const bar = (pct) => `<span class="rs-bar"><i style="width:${Math.max(3, Math.min(100, pct))}%"></i></span>`;

  function todayStamp() {
    const d = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return {
      pretty: `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
      file: d.toISOString().slice(0, 10),
    };
  }

  // ==========================================================
  // APP 1 · DAILY SALES REPORT
  // ==========================================================
  const reportLog = document.getElementById('app-log');
  const reportOut = document.getElementById('report-out');
  const reportStatus = document.getElementById('report-status');
  const generateBtn = document.getElementById('report-generate');
  const scopeChips = document.querySelectorAll('#report-scope .chip');

  let scope = 'National';
  let generating = false;

  const REGION_BASE = { Central: 4.61, Western: 3.72, Eastern: 2.58 };
  const CHANNEL_MIX = { Hypermarket: 0.27, Supermarket: 0.22, Convenience: 0.19, Grocery: 0.21, Wholesale: 0.11 };
  const fmtM = (v) => 'SAR ' + v.toFixed(2) + 'M';

  function renderReport() {
    const names = scope === 'National' ? Object.keys(REGION_BASE) : Object.keys(CHANNEL_MIX);
    const rows = names.map((name) => {
      const base = scope === 'National'
        ? REGION_BASE[name]
        : REGION_BASE[scope] * CHANNEL_MIX[name];
      return {
        name,
        sales: wobble(base, 0.06),
        vsLY: wobble(4, 1.6),
        achievement: wobble(101, 0.07),
      };
    });
    const total = rows.reduce((s, r) => s + r.sales, 0);
    const vsLY = rows.reduce((s, r) => s + r.vsLY * r.sales, 0) / total;
    const ach = rows.reduce((s, r) => s + r.achievement * r.sales, 0) / total;
    const best = [...rows].sort((a, b) => b.vsLY - a.vsLY)[0];
    const worst = [...rows].sort((a, b) => a.achievement - b.achievement)[0];
    const stamp = todayStamp();
    const dim = scope === 'National' ? 'REGION' : 'CHANNEL';

    const tableRows = rows.map((r) => `
      <tr class="${r === worst ? 'is-flagged' : ''}${r === best ? 'is-leader' : ''}">
        <td>${r.name}</td>
        <td class="num">${r.sales.toFixed(2)}</td>
        <td class="num">${signed(r.vsLY, '%')}</td>
        <td class="num">${r.achievement.toFixed(1)}%</td>
        <td>${bar(r.achievement - 40)}</td>
      </tr>`).join('');

    showOutput(reportOut, `
      <div class="report-sheet">
        <p class="rs-title">DAILY SALES REPORT — ${scope.toUpperCase()}</p>
        <p class="rs-date">${stamp.pretty} · GENERATED 07:08 · SYNTHETIC DATA</p>
        <div class="rs-kpis">
          <div class="rs-kpi"><span>NET SALES</span><b>${fmtM(total)}</b></div>
          <div class="rs-kpi"><span>VS LY</span><b>${signed(vsLY, '%')}</b></div>
          <div class="rs-kpi"><span>TARGET ACH.</span><b>${ach.toFixed(1)}%</b></div>
        </div>
        <table class="rs-table">
          <thead><tr><th>${dim}</th><th>SAR M</th><th>VS LY</th><th>ACH.</th><th></th></tr></thead>
          <tbody>
            ${tableRows}
            <tr class="rs-total">
              <td>TOTAL</td>
              <td class="num">${total.toFixed(2)}</td>
              <td class="num">${signed(vsLY, '%')}</td>
              <td class="num">${ach.toFixed(1)}%</td>
              <td>${bar(ach - 40)}</td>
            </tr>
          </tbody>
        </table>
        <ul class="rs-notes">
          <li><strong>${best.name}</strong> leads growth at ${signed(best.vsLY, '%')} vs LY.</li>
          <li><strong>${worst.name}</strong> is the watch-out — ${worst.achievement.toFixed(1)}% of target (row shaded).</li>
        </ul>
        <p class="rs-file">DAILY_SALES_REPORT_${scope.toUpperCase()}_${stamp.file}.xlsx · 38,412 rows processed · sent to 14 recipients</p>
      </div>
    `);
  }

  function generate() {
    if (generating) return;
    generating = true;
    generateBtn.disabled = true;
    reportStatus.textContent = 'GENERATING…';
    playLog(reportLog, [
      [`<span class="cmd">&gt; run daily_sales_report --scope ${scope.toLowerCase()}</span>`, 600],
      ['[07:06:41] connecting to data source … <span class="ok">OK</span>', 800],
      ['[07:06:44] 4 source files · 38,412 rows', 900],
      ['[07:06:52] cleaning … 217 duplicates dropped', 900],
      [`[07:07:48] building ${scope === 'National' ? 'region' : 'channel'} views …`, 900],
      ['[07:08:05] writing <span class="ok">.xlsx</span> … <span class="ok">SENT</span>', 700],
      ['<span class="done">✓ COMPLETE — run 09:51 · manual: ~4 hrs</span>', 300],
    ], () => {
      renderReport();
      reportStatus.textContent = 'REPORT READY — RE-RUN ANY TIME';
      generateBtn.disabled = false;
      generating = false;
    });
  }

  scopeChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      scopeChips.forEach((c) => {
        const active = c === chip;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', active);
      });
      scope = chip.dataset.scope;
      reportStatus.textContent = `SCOPE: ${scope.toUpperCase()} — READY`;
    });
  });
  generateBtn.addEventListener('click', generate);

  // ==========================================================
  // APP 2 · RTM PERFORMANCE — route league table
  // ==========================================================
  const rtmLog = document.getElementById('rtm-log');
  const rtmOut = document.getElementById('rtm-out');
  const rtmStatus = document.getElementById('rtm-status');
  const rtmRunBtn = document.getElementById('rtm-run');
  const rtmSortChips = document.querySelectorAll('#rtm-sort .chip');

  let routes = null;          // built once per run
  let rtmSort = 'score';

  function buildRoutes() {
    routes = Array.from({ length: 10 }, (_, i) => {
      const planned = 42 + Math.round(Math.random() * 6);
      const visited = Math.round(planned * (0.82 + Math.random() * 0.16));
      const strike = 52 + Math.random() * 28;              // % of visits that sell
      const drop = 14 + Math.random() * 12;                // units per productive call
      // composite score: coverage + conversion + weight of the basket
      const score = (visited / planned) * 34 + (strike / 80) * 40 + (drop / 26) * 26;
      return { route: 'RT-1' + String(i + 1).padStart(2, '0'), planned, visited, strike, drop, score };
    });
  }

  function renderRoutes() {
    const key = rtmSort === 'strike' ? 'strike' : rtmSort === 'drop' ? 'drop' : 'score';
    const sorted = [...routes].sort((a, b) => b[key] - a[key]);
    const benchmark = routes.reduce((s, r) => s + r.score, 0) / routes.length;
    const worst = [...routes].sort((a, b) => a.score - b.score)[0];
    const stamp = todayStamp();

    const rows = sorted.map((r, rank) => `
      <tr class="${r === worst ? 'is-flagged' : ''}${rank === 0 ? 'is-leader' : ''}">
        <td>${rank + 1}</td>
        <td>${r.route}</td>
        <td class="num">${r.visited}/${r.planned}</td>
        <td class="num">${r.strike.toFixed(0)}%</td>
        <td class="num">${r.drop.toFixed(1)}</td>
        <td class="num">${r.score.toFixed(0)}</td>
        <td>${bar(r.score)}</td>
      </tr>`).join('');

    showOutput(rtmOut, `
      <div class="report-sheet">
        <p class="rs-title">RTM PERFORMANCE — ROUTE LEAGUE TABLE</p>
        <p class="rs-date">${stamp.pretty} · RANKED BY ${rtmSort.toUpperCase()} · SYNTHETIC DATA</p>
        <div class="rs-kpis">
          <div class="rs-kpi"><span>ROUTES ANALYZED</span><b>10</b></div>
          <div class="rs-kpi"><span>AVG SUCCESS RATE</span><b>${(routes.reduce((s, r) => s + r.strike, 0) / 10).toFixed(0)}%</b></div>
          <div class="rs-kpi"><span>BELOW BENCHMARK</span><b>${routes.filter((r) => r.score < benchmark).length} routes</b></div>
        </div>
        <table class="rs-table">
          <thead><tr><th>#</th><th>ROUTE</th><th>VISITS</th><th>SUCCESS</th><th>AVG ORDER</th><th>SCORE</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <ul class="rs-notes">
          <li><strong>${sorted[0].route}</strong> leads — ${sorted[0].strike.toFixed(0)}% of visits end in a sale, at ${sorted[0].drop.toFixed(1)} units per order. Study the route, copy the habits.</li>
          <li><strong>${worst.route}</strong> is ${(100 - (worst.score / benchmark) * 100).toFixed(0)}% below benchmark — replan the route and ride along this week.</li>
        </ul>
        <p class="rs-file">RTM_ROUTE_SCORECARD_${stamp.file}.xlsx · 10 routes · 3 metrics · daily refresh</p>
      </div>
    `);
  }

  function runRtm() {
    rtmRunBtn.disabled = true;
    rtmStatus.textContent = 'ANALYZING…';
    playLog(rtmLog, [
      ['<span class="cmd">&gt; run rtm_performance --period week</span>', 600],
      ['[08:02:11] loading visit files … 10 routes · 438 visits', 900],
      ['[08:02:19] computing success rates & order sizes …', 1000],
      ['[08:02:31] scoring vs benchmark …', 900],
      ['<span class="done">✓ SCORED — 10 routes ranked. league table below.</span>', 300],
    ], () => {
      buildRoutes();
      renderRoutes();
      rtmStatus.textContent = 'RANKED — SWITCH THE METRIC TO RE-RANK';
      rtmRunBtn.disabled = false;
    });
  }

  rtmRunBtn.addEventListener('click', runRtm);
  rtmSortChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      rtmSortChips.forEach((c) => {
        const active = c === chip;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', active);
      });
      rtmSort = chip.dataset.sort;
      if (routes) renderRoutes(); // instant re-rank, no re-run needed
    });
  });

  // ==========================================================
  // APP 3 · SKU & BRAND REPORT — generic names only
  // ==========================================================
  const skuLog = document.getElementById('sku-log');
  const skuOut = document.getElementById('sku-out');
  const skuStatus = document.getElementById('sku-status');
  const skuRunBtn = document.getElementById('sku-run');
  const skuViewChips = document.querySelectorAll('#sku-view .chip');

  let portfolio = null;
  let skuView = 'brand';

  function buildPortfolio() {
    const brands = Array.from({ length: 6 }, (_, i) => ({
      name: 'Brand ' + (i + 1),
      sales: wobble([3.9, 2.8, 2.1, 1.4, 0.9, 0.6][i], 0.08),
      vsLY: wobble([6, 3, -2, 8, -5, 12][i], 0.5),
    }));
    const totalSales = brands.reduce((s, b) => s + b.sales, 0);
    brands.forEach((b) => { b.share = (b.sales / totalSales) * 100; });

    const skus = Array.from({ length: 10 }, (_, i) => ({
      name: 'SKU ' + (i + 1),
      brand: 'Brand ' + (1 + (i % 4)),
      sales: wobble(0.9 - i * 0.07, 0.1),
      vsLY: wobble(10 - i * 2.4, 0.6),
      rankMove: [2, 0, 1, -1, 3, 0, -2, 1, 0, -3][i],
    }));
    portfolio = { brands, skus, totalSales };
  }

  function renderPortfolio() {
    const stamp = todayStamp();
    let table, notes;

    if (skuView === 'brand') {
      const rows = portfolio.brands.map((b, i) => `
        <tr class="${i === 0 ? 'is-leader' : ''}${b.vsLY < -4 ? 'is-flagged' : ''}">
          <td>${b.name}</td>
          <td class="num">${b.sales.toFixed(2)}</td>
          <td class="num">${b.share.toFixed(1)}%</td>
          <td class="num">${signed(b.vsLY, '%')}</td>
          <td>${bar(b.share * 2.4)}</td>
        </tr>`).join('');
      table = `
        <table class="rs-table">
          <thead><tr><th>BRAND</th><th>SAR M</th><th>SHARE</th><th>VS LY</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
      const grower = [...portfolio.brands].sort((a, b) => b.vsLY - a.vsLY)[0];
      const decliner = [...portfolio.brands].sort((a, b) => a.vsLY - b.vsLY)[0];
      notes = `
        <li><strong>${grower.name}</strong> is the growth engine — ${signed(grower.vsLY, '%')} vs LY.</li>
        <li><strong>${decliner.name}</strong> declining ${signed(decliner.vsLY, '%')} — investigate price position vs the category.</li>`;
    } else {
      const rows = portfolio.skus.map((s, i) => `
        <tr class="${i === 0 ? 'is-leader' : ''}">
          <td>${s.name}<span class="rs-tag">${s.brand}</span></td>
          <td class="num">${s.sales.toFixed(2)}</td>
          <td class="num">${signed(s.vsLY, '%')}</td>
          <td class="num ${s.rankMove > 0 ? 'rs-move-up' : s.rankMove < 0 ? 'rs-move-down' : ''}">
            ${s.rankMove > 0 ? '▲' + s.rankMove : s.rankMove < 0 ? '▼' + Math.abs(s.rankMove) : '—'}
          </td>
          <td>${bar(s.sales * 105)}</td>
        </tr>`).join('');
      table = `
        <table class="rs-table">
          <thead><tr><th>SKU (TOP 10 OF 214)</th><th>SAR M</th><th>VS LY</th><th>RANK Δ</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
      notes = `
        <li><strong>SKU 5</strong> jumped 3 ranks — distribution gains doing the work.</li>
        <li>The tail below the top 30 is <strong>8% of sales across 180+ SKUs</strong> — rationalization candidate.</li>`;
    }

    showOutput(skuOut, `
      <div class="report-sheet">
        <p class="rs-title">PORTFOLIO PERFORMANCE — ${skuView === 'brand' ? 'BY BRAND' : 'BY SKU'}</p>
        <p class="rs-date">${stamp.pretty} · MTD · 214 SKUS COMPILED · SYNTHETIC DATA</p>
        <div class="rs-kpis">
          <div class="rs-kpi"><span>PORTFOLIO SALES</span><b>SAR ${portfolio.totalSales.toFixed(1)}M</b></div>
          <div class="rs-kpi"><span>BRANDS</span><b>6</b></div>
          <div class="rs-kpi"><span>ACTIVE SKUS</span><b>214</b></div>
        </div>
        ${table}
        <ul class="rs-notes">${notes}</ul>
        <p class="rs-file">PORTFOLIO_REPORT_${stamp.file}.xlsx · brand + SKU league tables · MTD & full-year views</p>
      </div>
    `);
  }

  function runSku() {
    skuRunBtn.disabled = true;
    skuStatus.textContent = 'COMPILING…';
    playLog(skuLog, [
      ['<span class="cmd">&gt; run portfolio_report --period mtd</span>', 600],
      ['[08:44:02] compiling sales lines … 214 SKUs · 6 brands', 900],
      ['[08:44:11] computing share, growth, rank moves …', 1000],
      ['[08:44:20] building league tables …', 900],
      ['<span class="done">✓ COMPILED — brand & SKU views ready.</span>', 300],
    ], () => {
      buildPortfolio();
      renderPortfolio();
      skuStatus.textContent = 'COMPILED — FLIP THE VIEW ANY TIME';
      skuRunBtn.disabled = false;
    });
  }

  skuRunBtn.addEventListener('click', runSku);
  skuViewChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      skuViewChips.forEach((c) => {
        const active = c === chip;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', active);
      });
      skuView = chip.dataset.view;
      if (portfolio) renderPortfolio(); // instant flip, no re-run
    });
  });

  // ==========================================================
  // APP TAB SWITCHING (one window, three tools)
  // ==========================================================
  const tabs = document.querySelectorAll('.app-tab');
  const panes = {
    report: document.getElementById('pane-report'),
    rtm: document.getElementById('pane-rtm'),
    sku: document.getElementById('pane-sku'),
  };
  const appTitle = document.getElementById('app-title');
  const TITLES = {
    report: 'DAILY-SALES-REPORT — APP',
    rtm: 'RTM-PERFORMANCE — APP',
    sku: 'SKU-BRAND-REPORT — APP',
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active);
      });
      const app = tab.dataset.app;
      Object.entries(panes).forEach(([name, pane]) => { pane.hidden = name !== app; });
      appTitle.textContent = TITLES[app];
      // First visit auto-runs that app
      if (app === 'rtm' && !routes && !REDUCED_MOTION) runRtm();
      if (app === 'sku' && !portfolio && !REDUCED_MOTION) runSku();
    });
  });

  // ==========================================================
  // KICK-OFF — app 1 auto-runs when scrolled into view
  // ==========================================================
  if (REDUCED_MOTION) {
    generate();
    buildRoutes(); renderRoutes();
    buildPortfolio(); renderPortfolio();
  } else {
    new IntersectionObserver((entries, observer) => {
      if (entries[0].isIntersecting) {
        generate();
        observer.disconnect();
      }
    }, { threshold: 0.3 }).observe(appDemo);
  }
})();
