// ─── Storage ───────────────────────────────────────────────
const KEY = 'garagepro_v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

function save(entries) { localStorage.setItem(KEY, JSON.stringify(entries)); }

function addEntry(e) { const arr = load(); arr.push(e); save(arr); }
function removeEntry(id) { save(load().filter(e => e.id !== id)); }

// ─── Date helpers ──────────────────────────────────────────
function weekStart(d) {
  const x = new Date(d); x.setHours(0,0,0,0);
  const day = x.getDay();
  x.setDate(x.getDate() - (day === 0 ? 6 : day - 1));
  return x;
}
function weekEnd(d) {
  const x = weekStart(d); x.setDate(x.getDate() + 6); x.setHours(23,59,59,999);
  return x;
}
function monthStart(d)   { return new Date(d.getFullYear(), d.getMonth(), 1, 0,0,0,0); }
function monthEnd(d)     { return new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999); }
function lastMonthStart(d){ return new Date(d.getFullYear(), d.getMonth()-1, 1, 0,0,0,0); }
function lastMonthEnd(d)  { return new Date(d.getFullYear(), d.getMonth(), 0, 23,59,59,999); }

function inRange(dateStr, a, b) {
  const d = new Date(dateStr + 'T00:00:00'); return d >= a && d <= b;
}

// ─── Aggregation ───────────────────────────────────────────
// Business rules:
//   - Cash & Check go directly to me
//   - CC goes to the company
//   - I earn 30% commission on every job's total price
//   - Company reimburses my parts
//   - My due = (totalPrice × 30%) + parts
//   - If I collected (check+cash) > my due → I owe company the excess
//   - If I collected less than my due   → company owes me the difference
function agg(entries) {
  const a = entries.reduce((acc, e) => {
    acc.revenue += +e.totalPrice || 0;
    acc.cc      += +e.paidCC     || 0;
    acc.check   += +e.paidCheck  || 0;
    acc.cash    += +e.paidCash   || 0;
    acc.parts   += +e.totalParts || 0;
    acc.jobs    += 1;
    return acc;
  }, {revenue:0, cc:0, check:0, cash:0, parts:0, jobs:0});

  const myDue         = a.revenue * 0.30 + a.parts;
  const iCollected    = a.check + a.cash;
  a.iOweCompany       = Math.max(0, iCollected - myDue);
  a.companyOwesMe     = Math.max(0, myDue - iCollected);
  a.myCommission      = a.revenue * 0.30;
  return a;
}

// ─── Formatters ────────────────────────────────────────────
const f0   = n => '$' + Math.round(n||0).toLocaleString('en-US');
const f2   = n => '$' + (n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fDate = s => new Date(s+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});

// ─── Toast ─────────────────────────────────────────────────
function toast(msg, color = '#22c55e') {
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.background = color;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

// ─── Tab switching ─────────────────────────────────────────
function switchTab(t) {
  ['new','dashboard','history'].forEach(id => {
    document.getElementById('tab-' + id).classList.toggle('active', id === t);
    document.getElementById('nav-' + id).classList.toggle('active', id === t);
  });
  if (t === 'dashboard') renderDashboard();
  if (t === 'history')   renderHistory();
}

// ─── Week Banner ───────────────────────────────────────────
function updateBanner() {
  const now     = new Date();
  const entries = load();
  const week    = entries.filter(e => inRange(e.date, weekStart(now), weekEnd(now)));
  const w       = agg(week);
  const all     = agg(entries);

  document.getElementById('wRevenue').textContent = f0(w.revenue);
  document.getElementById('wProfit').textContent  = f0(w.revenue - w.parts);
  document.getElementById('wJobs').textContent    = w.jobs;
  document.getElementById('wParts').textContent   = f0(w.parts);
  document.getElementById('wCC').textContent      = f0(w.cc);
  document.getElementById('wCheck').textContent   = f0(w.check);
  document.getElementById('wCash').textContent    = f0(w.cash);

  const net = all.companyOwesMe - all.iOweCompany;
  const hdr = document.getElementById('hdrBalance');
  hdr.textContent = (net >= 0 ? '+' : '-') + f2(Math.abs(net));
  hdr.style.color = net >= 0 ? '#4ade80' : '#f87171';
}

// ─── Form ──────────────────────────────────────────────────
document.getElementById('entryDate').value = new Date().toISOString().slice(0,10);

function recalcPaySum() {
  const cc   = +document.getElementById('paidCC').value    || 0;
  const chk  = +document.getElementById('paidCheck').value || 0;
  const cash = +document.getElementById('paidCash').value  || 0;
  const tot  = +document.getElementById('totalPrice').value || 0;
  const sum  = cc + chk + cash;
  const el   = document.getElementById('paySum');
  el.textContent = f2(sum);
  const msgEl = document.getElementById('payValidMsg');
  if (tot > 0) {
    const ok = Math.abs(sum - tot) < 0.01;
    el.style.color    = ok ? '#4ade80' : (sum > tot ? '#f87171' : 'rgba(255,255,255,0.5)');
    msgEl.style.color = ok ? '#4ade80' : (sum > tot ? '#f87171' : 'rgba(255,255,255,0.32)');
  } else {
    el.style.color    = 'rgba(255,255,255,0.5)';
    msgEl.style.color = 'rgba(255,255,255,0.32)';
  }
}

['totalPrice','paidCC','paidCheck','paidCash'].forEach(id =>
  document.getElementById(id).addEventListener('input', recalcPaySum)
);

document.getElementById('entryForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const entry = {
    id:            Date.now().toString(),
    date:          document.getElementById('entryDate').value,
    description:   document.getElementById('entryDesc').value.trim(),
    totalPrice:    +document.getElementById('totalPrice').value    || 0,
    paidCC:        +document.getElementById('paidCC').value        || 0,
    paidCheck:     +document.getElementById('paidCheck').value     || 0,
    paidCash:      +document.getElementById('paidCash').value      || 0,
    totalParts:    +document.getElementById('totalParts').value    || 0,
  };
  addEntry(entry);
  ['entryDesc','totalPrice','paidCC','paidCheck','paidCash','totalParts'].forEach(id =>
    document.getElementById(id).value = ''
  );
  document.getElementById('entryDate').value = new Date().toISOString().slice(0,10);
  recalcPaySum();
  updateBanner();
  toast('✓ Job entry saved!');
});

// ─── Dashboard ─────────────────────────────────────────────
function renderDashboard() {
  const now     = new Date();
  const entries = load();
  const all     = agg(entries);

  // Company balance (cumulative, auto-calculated)
  const net = all.companyOwesMe - all.iOweCompany;
  document.getElementById('dCompanyOwes').textContent = f0(all.companyOwesMe);
  document.getElementById('dIOwe').textContent        = f0(all.iOweCompany);
  const netEl = document.getElementById('dNetBalance');
  netEl.textContent = (net >= 0 ? '+' : '-') + f2(Math.abs(net));
  netEl.style.color = net >= 0 ? '#4ade80' : '#f87171';

  // This week
  const tw = agg(entries.filter(e => inRange(e.date, weekStart(now), weekEnd(now))));
  // Last week
  const lw = (() => {
    const ls = weekStart(now); ls.setDate(ls.getDate()-7);
    const le = weekEnd(now);   le.setDate(le.getDate()-7);
    return agg(entries.filter(e => inRange(e.date, ls, le)));
  })();

  // Week report (copyable)
  document.getElementById('dWeekReport').innerHTML = weekReportHtml(tw);

  document.getElementById('dWeekCompare').innerHTML  = compareHtml(tw, lw, 'This Wk', 'Last Wk');

  const tm = agg(entries.filter(e => inRange(e.date, monthStart(now), monthEnd(now))));
  const lm = agg(entries.filter(e => inRange(e.date, lastMonthStart(now), lastMonthEnd(now))));
  document.getElementById('dMonthCompare').innerHTML = compareHtml(tm, lm, 'This Mo', 'Last Mo');

  renderPayBreakdown(all);
  renderAllTime(all, entries.length);
}

// ─── Weekly copyable report ────────────────────────────────
function weekReportHtml(w) {
  const lines = [
    `Total jobs: ${w.jobs}`,
    `Total Price: ${f2(w.revenue)}`,
    `Amount paid by cash: ${f2(w.cash)}`,
    `Amount paid by CC: ${f2(w.cc)}`,
    `Amount paid by check: ${f2(w.check)}`,
    `Total parts: ${f2(w.parts)}`,
    `I owe the company: ${f2(w.iOweCompany)}`,
    `The company owes me: ${f2(w.companyOwesMe)}`,
  ].join('\n');

  return `
    <div class="card" style="border-color:rgba(249,115,22,0.25); margin-bottom:14px;">
      <div class="slabel">📋 This Week — Report</div>
      <pre id="reportText" style="
        font-family: -apple-system, BlinkMacSystemFont, monospace;
        font-size: 13px; line-height: 2; color: rgba(255,255,255,0.88);
        white-space: pre-wrap; background: rgba(0,0,0,0.25);
        border-radius: 10px; padding: 14px; margin: 0 0 12px; border: 0;
      ">${lines}</pre>
      <button onclick="copyReport()" style="
        background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.4);
        color: #f97316; font-size: 15px; font-weight: 700;
        padding: 13px; border-radius: 12px; width: 100%; cursor: pointer;
        transition: opacity 0.15s;
      ">📋 Copy to Clipboard</button>
    </div>`;
}

function copyReport() {
  const text = document.getElementById('reportText').textContent.trim();
  navigator.clipboard.writeText(text).then(
    ()  => toast('✓ Copied to clipboard!'),
    ()  => toast('Copy failed — select text manually', '#f97316')
  );
}

function compareHtml(cur, prev, curL, prevL) {
  const items = [
    { label: 'Revenue',    cur: cur.revenue,             prev: prev.revenue,             color: '#f97316' },
    { label: 'Profit',     cur: cur.revenue - cur.parts, prev: prev.revenue - prev.parts, color: '#4ade80' },
    { label: 'Parts Cost', cur: cur.parts,               prev: prev.parts,               color: '#f87171' },
    { label: 'Jobs',       cur: cur.jobs,                prev: prev.jobs,                color: '#93c5fd', money: false },
  ];
  return items.map(it => {
    const diff = it.cur - it.prev;
    const pct  = it.prev > 0 ? ((diff/it.prev)*100).toFixed(0) : (it.cur > 0 ? 100 : 0);
    const dCol = diff >= 0 ? '#4ade80' : '#f87171';
    const sign = diff >= 0 ? '+' : '';
    const dStr = sign + (it.money === false ? diff : f0(diff)) + ' (' + (diff >= 0 ? '+' : '') + pct + '%)';
    const mx   = Math.max(it.cur, it.prev, 1);
    const cw   = (it.cur/mx*100).toFixed(1);
    const pw   = (it.prev/mx*100).toFixed(1);
    const fv   = it.money === false ? v => v : f0;
    return `
      <div style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px;">
          <span style="font-size:13px;color:rgba(255,255,255,0.6);">${it.label}</span>
          <span style="font-size:11px;font-weight:700;color:${dCol};">${dStr}</span>
        </div>
        <div style="display:flex;gap:5px;align-items:center;margin-bottom:5px;">
          <span style="font-size:11px;color:rgba(255,255,255,0.38);width:52px;text-align:right;">${curL}</span>
          <div style="flex:1;" class="pbar-track">
            <div class="pbar-fill" style="width:${cw}%;background:${it.color};"></div>
          </div>
          <span style="font-size:13px;font-weight:700;color:#fff;width:54px;">${fv(it.cur)}</span>
        </div>
        <div style="display:flex;gap:5px;align-items:center;">
          <span style="font-size:11px;color:rgba(255,255,255,0.38);width:52px;text-align:right;">${prevL}</span>
          <div style="flex:1;" class="pbar-track">
            <div class="pbar-fill" style="width:${pw}%;background:${it.color};opacity:0.35;"></div>
          </div>
          <span style="font-size:13px;color:rgba(255,255,255,0.45);width:54px;">${fv(it.prev)}</span>
        </div>
      </div>`;
  }).join('');
}

function renderPayBreakdown(all) {
  const total = all.revenue || 1;
  const items = [
    { label: '💳 Credit Card', val: all.cc,    color: '#93c5fd' },
    { label: '📝 Check',       val: all.check, color: '#fde047' },
    { label: '💵 Cash',        val: all.cash,  color: '#4ade80' },
  ];
  document.getElementById('dPayBreakdown').innerHTML = items.map(it => {
    const pct = ((it.val/total)*100).toFixed(1);
    return `
      <div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:14px;font-weight:600;">${it.label}</span>
          <span style="font-size:14px;font-weight:700;color:${it.color};">${f0(it.val)}<span style="font-size:11px;color:rgba(255,255,255,0.35);"> (${pct}%)</span></span>
        </div>
        <div class="pbar-track"><div class="pbar-fill" style="width:${pct}%;background:${it.color};"></div></div>
      </div>`;
  }).join('');
}

function renderAllTime(all, jobCount) {
  const profit = all.revenue - all.parts;
  const margin = all.revenue > 0 ? ((profit/all.revenue)*100).toFixed(1) : '0.0';
  const avg    = jobCount > 0 ? all.revenue / jobCount : 0;
  let top = '—';
  if (all.cc > 0 || all.check > 0 || all.cash > 0) {
    if (all.cc >= all.check && all.cc >= all.cash)         top = '💳 Credit Card';
    else if (all.check >= all.cc && all.check >= all.cash) top = '📝 Check';
    else                                                    top = '💵 Cash';
  }
  const rows = [
    { l: 'Total Jobs',          v: jobCount,                   c: '#f97316' },
    { l: 'Total Revenue',       v: f0(all.revenue),            c: '#fff'    },
    { l: 'My Commission (30%)', v: f0(all.myCommission),       c: '#f97316' },
    { l: 'Total Parts Cost',    v: f0(all.parts),              c: '#f87171' },
    { l: 'Total Profit',        v: f0(profit),                 c: '#4ade80' },
    { l: 'Profit Margin',       v: margin + '%',               c: '#4ade80' },
    { l: 'Avg Ticket Size',     v: f0(avg),                    c: '#f97316' },
    { l: 'Top Payment',         v: top,                        c: '#93c5fd' },
    { l: 'Company Owes Me',     v: f0(all.companyOwesMe),      c: '#4ade80' },
    { l: 'I Owe Company',       v: f0(all.iOweCompany),        c: '#f87171' },
  ];
  document.getElementById('dAllTime').innerHTML = rows.map(r => `
    <div class="stat-row">
      <span style="font-size:14px;color:rgba(255,255,255,0.55);">${r.l}</span>
      <span style="font-size:16px;font-weight:700;color:${r.c};">${r.v}</span>
    </div>`).join('');
}

// ─── History ───────────────────────────────────────────────
function renderHistory() {
  const entries = load().sort((a,b) => new Date(b.date) - new Date(a.date));
  const list    = document.getElementById('historyList');
  const empty   = document.getElementById('historyEmpty');
  if (!entries.length) { list.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  list.innerHTML = entries.map(e => {
    const profit    = (+e.totalPrice||0) - (+e.totalParts||0);
    const profitCol = profit >= 0 ? '#4ade80' : '#f87171';
    const badges    = [];
    if (e.paidCC    > 0) badges.push(`<span class="badge" style="background:rgba(147,197,253,0.15);color:#93c5fd;">💳 ${f0(e.paidCC)}</span>`);
    if (e.paidCheck > 0) badges.push(`<span class="badge" style="background:rgba(253,224,71,0.15);color:#fde047;">📝 ${f0(e.paidCheck)}</span>`);
    if (e.paidCash  > 0) badges.push(`<span class="badge" style="background:rgba(74,222,128,0.15);color:#4ade80;">💵 ${f0(e.paidCash)}</span>`);

    return `
      <div class="entry-item">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <div>
            <div style="font-size:12px;color:rgba(255,255,255,0.38);">${fDate(e.date)}</div>
            <div style="font-size:15px;font-weight:700;margin-top:2px;">${e.description || 'Job Entry'}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;margin-left:12px;">
            <div style="font-size:22px;font-weight:800;color:#f97316;">${f0(e.totalPrice)}</div>
            <div style="font-size:12px;font-weight:600;color:${profitCol};">Profit: ${f0(profit)}</div>
          </div>
        </div>
        ${badges.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">${badges.join('')}</div>` : ''}
        ${e.totalParts > 0 ? `<div style="font-size:12px;color:#f87171;margin-bottom:6px;">Parts: ${f0(e.totalParts)}</div>` : ''}
        ${(() => {
          const myDue   = (+e.totalPrice||0) * 0.30 + (+e.totalParts||0);
          const iGot    = (+e.paidCheck||0) + (+e.paidCash||0);
          const iOweCo  = Math.max(0, iGot - myDue);
          const coOwes  = Math.max(0, myDue - iGot);
          const parts   = [];
          if (coOwes > 0) parts.push(`<span style="color:#4ade80;">Co. owes me: ${f0(coOwes)}</span>`);
          if (iOweCo > 0) parts.push(`<span style="color:#f87171;">I owe co.: ${f0(iOweCo)}</span>`);
          return parts.length ? `<div style="font-size:12px;margin-bottom:6px;">${parts.join(' &nbsp;·&nbsp; ')}</div>` : '';
        })()}
        <div style="display:flex;justify-content:flex-end;margin-top:4px;">
          <button class="btn-sm danger" onclick="deleteOne('${e.id}')">Delete</button>
        </div>
      </div>`;
  }).join('');
}

function deleteOne(id) {
  if (confirm('Delete this entry?')) {
    removeEntry(id); updateBanner(); renderHistory();
    toast('Entry deleted', '#ef4444');
  }
}

function confirmClearAll() {
  if (confirm('Delete ALL entries? This cannot be undone.')) {
    localStorage.removeItem(KEY); updateBanner(); renderHistory();
    toast('All entries cleared', '#ef4444');
  }
}

// ─── CSV Export ────────────────────────────────────────────
function exportCSV() {
  const entries = load().sort((a,b) => new Date(a.date) - new Date(b.date));
  if (!entries.length) { toast('No data to export', '#f97316'); return; }
  const hdr  = ['Date','Description','Total Price','Paid CC','Paid Check','Paid Cash','Total Parts','My Commission (30%)','Company Owes Me','I Owe Company'];
  const rows = entries.map(e => {
    const price  = +e.totalPrice||0;
    const parts  = +e.totalParts||0;
    const check  = +e.paidCheck||0;
    const cash   = +e.paidCash||0;
    const myDue  = price * 0.30 + parts;
    const iGot   = check + cash;
    return [
      e.date,
      '"' + (e.description||'').replace(/"/g,'""') + '"',
      price, e.paidCC||0, check, cash, parts,
      (price * 0.30).toFixed(2),
      Math.max(0, myDue - iGot).toFixed(2),
      Math.max(0, iGot - myDue).toFixed(2),
    ];
  });
  const csv = [hdr.join(','), ...rows.map(r => r.join(','))].join('\n');
  const a   = Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(new Blob([csv], {type:'text/csv'})),
    download: 'garagepro_' + new Date().toISOString().slice(0,10) + '.csv'
  });
  a.click(); URL.revokeObjectURL(a.href);
  toast('✓ CSV exported!');
}

// ─── Install prompt (iOS only) ─────────────────────────────
function openInstallModal() {
  const el = document.getElementById('installOverlay');
  el.style.display = 'flex';
  // close on backdrop tap
  el.addEventListener('click', function onBg(e) {
    if (e.target === el) { closeInstallModal(); el.removeEventListener('click', onBg); }
  });
}

function closeInstallModal() {
  document.getElementById('installOverlay').style.display = 'none';
}

(function initInstallBtn() {
  const isIOS        = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInstalled  = window.navigator.standalone === true;
  if (isIOS && !isInstalled) {
    document.getElementById('installBtn').style.display = 'block';
  }
})();

// ─── Init ──────────────────────────────────────────────────
updateBanner();
