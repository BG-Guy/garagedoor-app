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
    acc.tip     += +e.tip        || 0;
    acc.jobs    += 1;
    return acc;
  }, {revenue:0, cc:0, check:0, cash:0, parts:0, tip:0, jobs:0});

  a.myCommission      = (a.revenue - a.parts) * 0.30;
  const myDue         = a.myCommission + a.parts;
  const iCollected    = a.check + a.cash;
  a.iOweCompany       = Math.max(0, iCollected - myDue);
  a.companyOwesMe     = Math.max(0, myDue - iCollected);
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

  const highest = week.length ? Math.max(...week.map(e => +e.totalPrice || 0)) : 0;
  const avg     = w.jobs > 0 ? w.revenue / w.jobs : 0;

  document.getElementById('wRevenue').textContent    = f0(w.revenue);
  document.getElementById('wCommission').textContent = f0((w.revenue - w.parts) * 0.30);
  document.getElementById('wJobs').textContent       = w.jobs;
  document.getElementById('wAvg').textContent        = f0(avg);
  document.getElementById('wHighest').textContent    = f0(highest);
  document.getElementById('wParts').textContent      = f0(w.parts);
  document.getElementById('wCC').textContent         = f0(w.cc);
  document.getElementById('wCheck').textContent      = f0(w.check);
  document.getElementById('wCash').textContent       = f0(w.cash);
  document.getElementById('wCompanyOwes').textContent = f0(w.companyOwesMe);
  document.getElementById('wIOwe').textContent        = f0(w.iOweCompany);

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

// ─── Edit state ────────────────────────────────────────────
let editingId = null;

function editJob(id) {
  const entry = load().find(e => e.id === id);
  if (!entry) return;

  editingId = id;
  document.getElementById('entryDate').value  = entry.date        || '';
  document.getElementById('entryDesc').value  = entry.description || '';
  document.getElementById('totalPrice').value = entry.totalPrice  || '';
  document.getElementById('paidCC').value     = entry.paidCC      || '';
  document.getElementById('paidCheck').value  = entry.paidCheck   || '';
  document.getElementById('paidCash').value   = entry.paidCash    || '';
  document.getElementById('totalParts').value = entry.totalParts  || '';
  document.getElementById('entryTip').value   = entry.tip         || '';
  recalcPaySum();

  document.getElementById('submitBtn').textContent = 'Update Job Entry ✓';
  switchTab('new');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast('Editing — make changes and save');
}

function resetForm() {
  editingId = null;
  ['entryDesc','totalPrice','paidCC','paidCheck','paidCash','totalParts','entryTip']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('entryDate').value      = new Date().toISOString().slice(0,10);
  document.getElementById('parseInput').value     = '';
  document.getElementById('parsePills').innerHTML = '';
  document.getElementById('submitBtn').textContent = 'Save Job Entry ✓';
  lastRawNote = '';
  recalcPaySum();
}

document.getElementById('entryForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const entry = {
    id:          editingId || Date.now().toString(),
    date:        document.getElementById('entryDate').value,
    description: document.getElementById('entryDesc').value.trim(),
    totalPrice:  +document.getElementById('totalPrice').value || 0,
    paidCC:      +document.getElementById('paidCC').value     || 0,
    paidCheck:   +document.getElementById('paidCheck').value  || 0,
    paidCash:    +document.getElementById('paidCash').value   || 0,
    totalParts:  +document.getElementById('totalParts').value || 0,
    tip:         +document.getElementById('entryTip').value   || 0,
    rawNote:     lastRawNote || '',
  };

  if (editingId) {
    save(load().map(e => e.id === editingId ? entry : e));
    toast('✓ Job updated!');
  } else {
    addEntry(entry);
    toast('✓ Job entry saved!');
  }

  resetForm();
  updateBanner();
});

// ─── Insights / Dashboard ──────────────────────────────────
let drFrom = '', drTo = '';

function renderDashboard() {
  const now     = new Date();
  const entries = load();

  // Week vs last week
  const tw = agg(entries.filter(e => inRange(e.date, weekStart(now), weekEnd(now))));
  const lw = (() => {
    const ls = weekStart(now); ls.setDate(ls.getDate()-7);
    const le = weekEnd(now);   le.setDate(le.getDate()-7);
    return agg(entries.filter(e => inRange(e.date, ls, le)));
  })();
  document.getElementById('dWeekCompare').innerHTML = compareHtml(tw, lw, 'This Wk', 'Last Wk');
  document.getElementById('dWeekStats').innerHTML   = periodStats(tw);

  // Month vs last month
  const tm = agg(entries.filter(e => inRange(e.date, monthStart(now), monthEnd(now))));
  const lm = agg(entries.filter(e => inRange(e.date, lastMonthStart(now), lastMonthEnd(now))));
  document.getElementById('dMonthCompare').innerHTML = compareHtml(tm, lm, 'This Mo', 'Last Mo');
  document.getElementById('dMonthStats').innerHTML   = periodStats(tm);

  // Default date range = current week
  drFrom = weekStart(now).toISOString().slice(0,10);
  drTo   = weekEnd(now).toISOString().slice(0,10);
  document.getElementById('drFrom').value = drFrom;
  document.getElementById('drTo').value   = drTo;

  renderDateRangeSections();
}

function applyDateRange() {
  const f = document.getElementById('drFrom').value;
  const t = document.getElementById('drTo').value;
  if (!f || !t) { toast('Set both dates', '#f97316'); return; }
  drFrom = f; drTo = t;
  renderDateRangeSections();
}

function rangeLabel() {
  if (drFrom === drTo) return fDate(drFrom);
  return fDate(drFrom) + ' – ' + fDate(drTo);
}

function renderDateRangeSections() {
  const entries = load();
  const start   = new Date(drFrom + 'T00:00:00');
  const end     = new Date(drTo   + 'T23:59:59');
  const filtered = entries.filter(e => inRange(e.date, start, end));
  const a        = agg(filtered);
  const label    = rangeLabel();

  // Company balance
  const net = a.companyOwesMe - a.iOweCompany;
  document.getElementById('dBalanceLabel').textContent = `Company Balance — ${label}`;
  document.getElementById('dCompanyOwes').textContent  = f0(a.companyOwesMe);
  document.getElementById('dIOwe').textContent         = f0(a.iOweCompany);
  const netEl = document.getElementById('dNetBalance');
  netEl.textContent = (net >= 0 ? '+' : '-') + f2(Math.abs(net));
  netEl.style.color = net >= 0 ? '#4ade80' : '#f87171';

  // Copyable report
  const lines = [
    `T jobs:          ${a.jobs}`,
    `T price:         ${f2(a.revenue)}`,
    `T parts:         ${f2(a.parts)}`,
    `Paid by cc:      ${f2(a.cc)}`,
    `Paid by cash:    ${f2(a.cash)}`,
    `Paid by check:   ${f2(a.check)}`,
    `T tip:           ${f2(a.tip)}`,
    `Owe the company: ${f2(a.iOweCompany)}`,
    `Company owe me:  ${f2(a.companyOwesMe)}`,
  ].join('\n');
  document.getElementById('dReport').innerHTML = `
    <div class="card" style="border-color:rgba(249,115,22,0.25);margin-bottom:14px;">
      <div class="slabel">📋 Report — ${label}</div>
      <pre id="dReportText" style="
        font-family:-apple-system,BlinkMacSystemFont,monospace;
        font-size:13px;line-height:2;color:rgba(255,255,255,0.88);
        white-space:pre-wrap;background:rgba(0,0,0,0.25);
        border-radius:10px;padding:14px;margin:0 0 12px;border:0;">${lines}</pre>
      <button onclick="copyDashReport()" style="
        background:rgba(249,115,22,0.15);border:1px solid rgba(249,115,22,0.4);
        color:#f97316;font-size:15px;font-weight:700;
        padding:13px;border-radius:12px;width:100%;cursor:pointer;">📋 Copy Report</button>
    </div>`;

  // Stats
  document.getElementById('dStatsLabel').textContent = `Stats — ${label}`;
  renderStats(a, filtered.length);
}

function copyDashReport() {
  const text = document.getElementById('dReportText').textContent.trim();
  navigator.clipboard.writeText(text).then(
    () => toast('✓ Copied!'),
    () => toast('Copy failed', '#f97316')
  );
}

function renderStats(a, jobCount) {
  const profit = a.revenue - a.parts;
  const margin = a.revenue > 0 ? ((profit/a.revenue)*100).toFixed(1) : '0.0';
  const avg    = jobCount > 0 ? a.revenue / jobCount : 0;
  let top = '—';
  if (a.cc > 0 || a.check > 0 || a.cash > 0) {
    if (a.cc >= a.check && a.cc >= a.cash)         top = '💳 Credit Card';
    else if (a.check >= a.cc && a.check >= a.cash) top = '📝 Check';
    else                                            top = '💵 Cash';
  }
  const rows = [
    { l: 'Total Jobs',          v: jobCount,           c: '#f97316' },
    { l: 'Total Revenue',       v: f0(a.revenue),      c: '#fff'    },
    { l: 'My Commission (30%)', v: f0(a.myCommission), c: '#f97316' },
    { l: 'Total Parts',         v: f0(a.parts),        c: '#f87171' },
    { l: 'Total Tips',          v: f0(a.tip),          c: '#4ade80' },
    { l: 'Total Profit',        v: f0(profit),         c: '#4ade80' },
    { l: 'Profit Margin',       v: margin + '%',       c: '#4ade80' },
    { l: 'Avg Ticket',          v: f0(avg),            c: '#f97316' },
    { l: 'Top Payment',         v: top,                c: '#93c5fd' },
    { l: 'Company Owes Me',     v: f0(a.companyOwesMe), c: '#4ade80' },
    { l: 'I Owe Company',       v: f0(a.iOweCompany),   c: '#f87171' },
  ];
  document.getElementById('dStats').innerHTML = rows.map(r => `
    <div class="stat-row">
      <span style="font-size:14px;color:rgba(255,255,255,0.55);">${r.l}</span>
      <span style="font-size:16px;font-weight:700;color:${r.c};">${r.v}</span>
    </div>`).join('');
}

function periodStats(a) {
  const profit = a.revenue - a.parts;
  const avg    = a.jobs > 0 ? a.revenue / a.jobs : 0;
  const rows = [
    { l: 'Jobs',            v: a.jobs,             c: '#f97316' },
    { l: 'Revenue',         v: f0(a.revenue),       c: '#fff'    },
    { l: 'Commission (30%)',v: f0(a.myCommission),  c: '#f97316' },
    { l: 'Parts',           v: f0(a.parts),         c: '#f87171' },
    { l: 'Tips',            v: f0(a.tip),           c: '#4ade80' },
    { l: 'Profit',          v: f0(profit),          c: '#4ade80' },
    { l: 'Avg Ticket',      v: f0(avg),             c: '#f97316' },
    { l: 'Company Owes Me', v: f0(a.companyOwesMe), c: '#4ade80' },
    { l: 'I Owe Company',   v: f0(a.iOweCompany),   c: '#f87171' },
  ];
  return rows.map(r => `
    <div class="stat-row">
      <span style="font-size:13px;color:rgba(255,255,255,0.5);">${r.l}</span>
      <span style="font-size:14px;font-weight:700;color:${r.c};">${r.v}</span>
    </div>`).join('');
}

function compareHtml(cur, prev, curL, prevL) {
  const curComm  = (cur.revenue  - cur.parts)  * 0.30;
  const prevComm = (prev.revenue - prev.parts) * 0.30;
  const curAvg   = cur.jobs  > 0 ? cur.revenue  / cur.jobs  : 0;
  const prevAvg  = prev.jobs > 0 ? prev.revenue / prev.jobs : 0;

  const items = [
    { label: 'Revenue',    cur: cur.revenue, prev: prev.revenue, color: '#f97316' },
    { label: 'Commission', cur: curComm,      prev: prevComm,     color: '#4ade80' },
    { label: 'Parts Cost', cur: cur.parts,    prev: prev.parts,   color: '#f87171' },
    { label: 'Jobs',       cur: cur.jobs,     prev: prev.jobs,    color: '#93c5fd', money: false },
    { label: 'AVG Ticket', cur: curAvg,       prev: prevAvg,      color: '#fde047' },
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

// ─── History selection state ───────────────────────────────
let selectedIds = new Set();

function toggleSelect(id) {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  // Toggle class on the card directly — no full re-render
  const card = document.querySelector(`.entry-item[data-id="${id}"]`);
  if (card) card.classList.toggle('selected', selectedIds.has(id));
  const chk = document.getElementById('chk_' + id);
  if (chk) { chk.textContent = selectedIds.has(id) ? '✓' : ''; chk.style.background = selectedIds.has(id) ? '#f97316' : 'transparent'; chk.style.borderColor = selectedIds.has(id) ? '#f97316' : 'rgba(255,255,255,0.25)'; }
  updateSelectionUI();
}

function updateSelectionUI() {
  const count   = selectedIds.size;
  const bar     = document.getElementById('summarizeBar');
  const countEl = document.getElementById('summarizeCount');
  const selBtn  = document.getElementById('selectAllBtn');
  bar.style.display   = count > 0 ? 'block' : 'none';
  if (countEl) countEl.textContent = count;
  if (selBtn) selBtn.textContent = selectedIds.size > 0 ? 'Clear Selection' : 'Select All';
}

function toggleSelectAll() {
  const entries = load();
  if (selectedIds.size === entries.length) {
    selectedIds.clear();
  } else {
    entries.forEach(e => selectedIds.add(e.id));
  }
  renderHistory();
}

// ─── Calendar view ─────────────────────────────────────────
let calView    = false;
let calYear    = new Date().getFullYear();
let calMonth   = new Date().getMonth();
let calSelDate = null;

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

function setCalView(on) {
  calView = on;
  document.getElementById('calToggleBtn').textContent              = on ? '📋 List'     : '🗓 Calendar';
  document.getElementById('historyDateFilter').style.display       = on ? 'none'        : 'block';
  document.getElementById('historyList').style.display             = on ? 'none'        : 'block';
  document.getElementById('historyEmpty').style.display            = 'none';
  document.getElementById('calendarView').style.display            = on ? 'block'       : 'none';
}

function toggleCalendarView() {
  if (!calView) {
    calYear    = new Date().getFullYear();
    calMonth   = new Date().getMonth();
    calSelDate = null;
    setCalView(true);
    renderCalendar();
  } else {
    setCalView(false);
    renderHistory();
  }
}

function renderCalendar() {
  const container = document.getElementById('calendarView');
  const entries   = load();
  const dayMap    = {};
  entries.forEach(e => { (dayMap[e.date] = dayMap[e.date] || []).push(e); });

  const today    = new Date().toISOString().slice(0,10);
  let   firstDow = new Date(calYear, calMonth, 1).getDay() - 1;
  if (firstDow < 0) firstDow = 6;
  const daysInMo = new Date(calYear, calMonth + 1, 0).getDate();
  const prevLast = new Date(calYear, calMonth, 0).getDate();

  // Build cells array
  const cells = [];
  for (let i = firstDow - 1; i >= 0; i--) cells.push({ day: prevLast - i, mine: false, ds: null });
  for (let d = 1; d <= daysInMo; d++) {
    const m  = String(calMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push({ day: d, mine: true, ds: calYear + '-' + m + '-' + dd });
  }
  const rem = (7 - cells.length % 7) % 7;
  for (let i = 1; i <= rem; i++) cells.push({ day: i, mine: false, ds: null });

  // Build day-header row
  let gridHtml = '<div class="cal-grid" style="margin-bottom:4px;">';
  ['Mo','Tu','We','Th','Fr','Sa','Su'].forEach(function(h) {
    gridHtml += '<div class="cal-hdr">' + h + '</div>';
  });
  gridHtml += '</div><div class="cal-grid" id="calGrid">';

  cells.forEach(function(c) {
    if (!c.mine) { gridHtml += '<div class="cal-day other-month">' + c.day + '</div>'; return; }
    const jobs    = dayMap[c.ds] || [];
    const isToday = c.ds === today;
    const isSel   = c.ds === calSelDate;
    const hasJobs = jobs.length > 0;
    let cls = 'cal-day';
    if (hasJobs) cls += ' has-jobs';
    if (isToday) cls += ' today';
    if (isSel)   cls += ' selected';
    const dot = hasJobs ? '<span class="cal-dot">' + (jobs.length > 1 ? jobs.length : '●') + '</span>' : '';
    gridHtml += '<div class="' + cls + '" data-date="' + c.ds + '"><span>' + c.day + '</span>' + dot + '</div>';
  });
  gridHtml += '</div>';

  // Assemble calendar card
  let html = '<div class="card" style="margin-bottom:10px;">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">';
  html += '<button id="calPrev" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:36px;height:36px;border-radius:10px;font-size:22px;cursor:pointer;line-height:1;">‹</button>';
  html += '<div style="font-size:17px;font-weight:800;">' + MONTH_NAMES[calMonth] + ' ' + calYear + '</div>';
  html += '<button id="calNext" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:36px;height:36px;border-radius:10px;font-size:22px;cursor:pointer;line-height:1;">›</button>';
  html += '</div>' + gridHtml + '</div>';

  // Selected day jobs
  if (calSelDate && dayMap[calSelDate]) {
    const jobs = dayMap[calSelDate];
    html += '<div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.45);margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">';
    html += fDate(calSelDate) + ' — ' + jobs.length + ' job' + (jobs.length > 1 ? 's' : '') + '</div>';
    jobs.forEach(function(e) {
      const comm = ((+e.totalPrice||0) - (+e.totalParts||0)) * 0.30;
      let badges = '';
      if (e.paidCC    > 0) badges += '<span class="badge" style="background:rgba(147,197,253,0.15);color:#93c5fd;">💳 ' + f0(e.paidCC)    + '</span>';
      if (e.paidCheck > 0) badges += '<span class="badge" style="background:rgba(253,224,71,0.15);color:#fde047;">📝 '  + f0(e.paidCheck) + '</span>';
      if (e.paidCash  > 0) badges += '<span class="badge" style="background:rgba(74,222,128,0.15);color:#4ade80;">💵 '  + f0(e.paidCash)  + '</span>';
      html += '<div class="entry-item" style="cursor:default;">';
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">';
      html += '<div style="font-size:15px;font-weight:700;">' + (e.description || 'Job Entry') + '</div>';
      html += '<div style="text-align:right;flex-shrink:0;margin-left:12px;">';
      html += '<div style="font-size:20px;font-weight:800;color:#f97316;">' + f0(e.totalPrice) + '</div>';
      html += '<div style="font-size:12px;font-weight:600;color:#4ade80;">Commission: ' + f0(comm) + '</div></div></div>';
      if (badges) html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">' + badges + '</div>';
      if (e.totalParts > 0) html += '<div style="font-size:12px;color:#f87171;margin-bottom:4px;">Parts: ' + f0(e.totalParts) + '</div>';
      html += '<div style="display:flex;justify-content:flex-end;margin-top:6px;"><button class="btn-sm" data-edit="' + e.id + '">Edit</button></div>';
      html += '</div>';
    });
  }

  container.innerHTML = html;

  // Attach events via addEventListener (no inline onclick)
  document.getElementById('calPrev').addEventListener('click', function() {
    calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; }
    calSelDate = null; renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', function() {
    calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; }
    calSelDate = null; renderCalendar();
  });
  document.getElementById('calGrid').addEventListener('click', function(ev) {
    const cell = ev.target.closest('[data-date]');
    if (!cell) return;
    const ds = cell.getAttribute('data-date');
    calSelDate = calSelDate === ds ? null : ds;
    renderCalendar();
  });
  container.querySelectorAll('[data-edit]').forEach(function(btn) {
    btn.addEventListener('click', function() { editJob(btn.getAttribute('data-edit')); });
  });
}

// ─── History date filter ───────────────────────────────────
function setHistoryRange(mode) {
  const now = new Date();
  if (mode === 'week') {
    document.getElementById('hFrom').value = weekStart(now).toISOString().slice(0,10);
    document.getElementById('hTo').value   = weekEnd(now).toISOString().slice(0,10);
  } else if (mode === 'month') {
    document.getElementById('hFrom').value = monthStart(now).toISOString().slice(0,10);
    document.getElementById('hTo').value   = monthEnd(now).toISOString().slice(0,10);
  } else {
    document.getElementById('hFrom').value = '';
    document.getElementById('hTo').value   = '';
  }
  renderHistory();
}

// ─── History ───────────────────────────────────────────────
function renderHistory() {
  if (calView) { setCalView(true); renderCalendar(); return; }

  const hFrom = document.getElementById('hFrom').value;
  const hTo   = document.getElementById('hTo').value;

  let entries = load().sort((a,b) => new Date(b.date) - new Date(a.date));

  if (hFrom || hTo) {
    const start = hFrom ? new Date(hFrom + 'T00:00:00') : new Date(0);
    const end   = hTo   ? new Date(hTo   + 'T23:59:59') : new Date(9999,0,1);
    entries = entries.filter(e => inRange(e.date, start, end));
  }

  const titleEl = document.getElementById('historyTitle');
  if (titleEl) {
    if (hFrom && hTo)   titleEl.textContent = fDate(hFrom) + ' – ' + fDate(hTo);
    else if (hFrom)     titleEl.textContent = 'From ' + fDate(hFrom);
    else if (hTo)       titleEl.textContent = 'Until ' + fDate(hTo);
    else                titleEl.textContent = 'All Entries';
  }
  const list    = document.getElementById('historyList');
  const empty   = document.getElementById('historyEmpty');
  if (!entries.length) { list.innerHTML = ''; empty.style.display = 'block'; updateSelectionUI(); return; }
  empty.style.display = 'none';

  list.innerHTML = entries.map(e => {
    const sel        = selectedIds.has(e.id);
    const commission = ((+e.totalPrice||0) - (+e.totalParts||0)) * 0.30;
    const badges     = [];
    if (e.paidCC    > 0) badges.push(`<span class="badge" style="background:rgba(147,197,253,0.15);color:#93c5fd;">💳 ${f0(e.paidCC)}</span>`);
    if (e.paidCheck > 0) badges.push(`<span class="badge" style="background:rgba(253,224,71,0.15);color:#fde047;">📝 ${f0(e.paidCheck)}</span>`);
    if (e.paidCash  > 0) badges.push(`<span class="badge" style="background:rgba(74,222,128,0.15);color:#4ade80;">💵 ${f0(e.paidCash)}</span>`);
    if ((+e.tip||0) > 0) badges.push(`<span class="badge" style="background:rgba(74,222,128,0.12);color:#86efac;">🎁 Tip ${f0(e.tip)}</span>`);

    return `
      <div class="entry-item${sel ? ' selected' : ''}" data-id="${e.id}" onclick="toggleSelect('${e.id}')">
        <!-- Checkbox indicator -->
        <div id="chk_${e.id}" style="
            position:absolute;top:14px;right:14px;
            width:22px;height:22px;border-radius:50%;
            border:2px solid ${sel ? '#f97316' : 'rgba(255,255,255,0.25)'};
            background:${sel ? '#f97316' : 'transparent'};
            display:flex;align-items:center;justify-content:center;
            font-size:12px;font-weight:700;color:#fff;flex-shrink:0;">
          ${sel ? '✓' : ''}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;padding-right:32px;">
          <div>
            <div style="font-size:12px;color:rgba(255,255,255,0.38);">${fDate(e.date)}</div>
            <div style="font-size:15px;font-weight:700;margin-top:2px;">${e.description || 'Job Entry'}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;margin-left:12px;">
            <div style="font-size:22px;font-weight:800;color:#f97316;">${f0(e.totalPrice)}</div>
            <div style="font-size:12px;font-weight:600;color:#4ade80;">Commission: ${f0(commission)}</div>
          </div>
        </div>
        ${badges.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">${badges.join('')}</div>` : ''}
        ${e.totalParts > 0 ? `<div style="font-size:12px;color:#f87171;margin-bottom:6px;">Parts: ${f0(e.totalParts)}</div>` : ''}
        ${(() => {
          const myDue  = ((+e.totalPrice||0) - (+e.totalParts||0)) * 0.30 + (+e.totalParts||0);
          const iGot   = (+e.paidCheck||0) + (+e.paidCash||0);
          const iOweCo = Math.max(0, iGot - myDue);
          const coOwes = Math.max(0, myDue - iGot);
          const pts    = [];
          if (coOwes > 0) pts.push(`<span style="color:#4ade80;">Co. owes me: ${f0(coOwes)}</span>`);
          if (iOweCo > 0) pts.push(`<span style="color:#f87171;">I owe co.: ${f0(iOweCo)}</span>`);
          return pts.length ? `<div style="font-size:12px;margin-bottom:6px;">${pts.join(' &nbsp;·&nbsp; ')}</div>` : '';
        })()}
        ${e.rawNote ? `
        <div style="margin-top:8px;">
          <button onclick="event.stopPropagation();this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.textContent=this.textContent.includes('▼')?'📋 Original Note ▲':'📋 Original Note ▼';"
            style="background:none;border:none;color:rgba(255,255,255,0.35);font-size:11px;font-weight:600;cursor:pointer;padding:0;">
            📋 Original Note ▼
          </button>
          <pre style="display:none;margin-top:8px;font-family:-apple-system,BlinkMacSystemFont,monospace;
            font-size:11px;line-height:1.7;color:rgba(255,255,255,0.55);
            white-space:pre-wrap;background:rgba(0,0,0,0.2);
            border-radius:8px;padding:10px;border:0;overflow-x:auto;">${e.rawNote.replace(/</g,'&lt;')}</pre>
        </div>` : ''}
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:6px;">
          <button class="btn-sm" onclick="event.stopPropagation();editJob('${e.id}')">Edit</button>
          <button class="btn-sm danger" onclick="event.stopPropagation();deleteOne('${e.id}')">Delete</button>
        </div>
      </div>`;
  }).join('');

  updateSelectionUI();
}

// ─── Summary modal ─────────────────────────────────────────
function summarizeSelected() {
  const entries = load().filter(e => selectedIds.has(e.id));
  if (!entries.length) { toast('Select at least one job', '#f97316'); return; }

  const t = entries.reduce((a, e) => {
    a.price += +e.totalPrice || 0;
    a.parts += +e.totalParts || 0;
    a.cc    += +e.paidCC     || 0;
    a.cash  += +e.paidCash   || 0;
    a.check += +e.paidCheck  || 0;
    a.tip   += +e.tip        || 0;
    return a;
  }, { price:0, parts:0, cc:0, cash:0, check:0, tip:0 });

  const myDue   = (t.price - t.parts) * 0.30 + t.parts;
  const iGot    = t.check + t.cash;
  const iOwe    = Math.max(0, iGot - myDue);
  const coOwes  = Math.max(0, myDue - iGot);

  const text = [
    `T jobs:          ${entries.length}`,
    `T price:         ${f2(t.price)}`,
    `T parts:         ${f2(t.parts)}`,
    `Paid by cc:      ${f2(t.cc)}`,
    `Paid by cash:    ${f2(t.cash)}`,
    `Paid by check:   ${f2(t.check)}`,
    `T tip:           ${f2(t.tip)}`,
    `Owe the company: ${f2(iOwe)}`,
    `Company owe me:  ${f2(coOwes)}`,
  ].join('\n');

  document.getElementById('summaryText').textContent = text;
  document.getElementById('summarySubtitle').textContent =
    `${entries.length} job${entries.length > 1 ? 's' : ''} selected`;

  const overlay = document.getElementById('summaryOverlay');
  overlay.style.display = 'flex';
  overlay.addEventListener('click', function onBg(ev) {
    if (ev.target === overlay) { closeSummaryModal(); overlay.removeEventListener('click', onBg); }
  });
}

function closeSummaryModal() {
  document.getElementById('summaryOverlay').style.display = 'none';
}

function copySummaryText() {
  const text = document.getElementById('summaryText').textContent.trim();
  navigator.clipboard.writeText(text).then(
    ()  => toast('✓ Copied!'),
    ()  => toast('Copy failed — select text manually', '#f97316')
  );
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
    const comm   = (price - parts) * 0.30;
    const myDue  = comm + parts;
    const iGot   = check + cash;
    return [
      e.date,
      '"' + (e.description||'').replace(/"/g,'""') + '"',
      price, e.paidCC||0, check, cash, parts,
      comm.toFixed(2),
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

// ─── Job Note Parser ───────────────────────────────────────
function parseJobText(raw) {
  const result = {
    date:        new Date().toISOString().slice(0,10),
    description: '',
    totalPrice:  0,
    paidCC:      0,
    paidCheck:   0,
    paidCash:    0,
    totalParts:  0,
    tip:         0,
    pills:       [],
    payMethod:   '',
  };

  // ── Split on *** (or --- / —- variants) ───────────────────
  const sepRx  = /\*{3,}|[-–—]{2,}/;
  const halves = raw.split(sepRx);
  const header  = halves[0] || '';
  const jobBlock = (halves[1] || '').trim();

  // ── Date: find M/D/YY or M/D/YYYY anywhere in text ────────
  const dateM = raw.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (dateM) {
    let y = dateM[3];
    if (y.length === 2) y = '20' + y;
    result.date = `${y}-${dateM[1].padStart(2,'0')}-${dateM[2].padStart(2,'0')}`;
    result.pills.push({ label: `📅 ${dateM[1]}/${dateM[2]}/${dateM[3]}`, ok: true });
  }

  // ── Parse job block (everything after ***) ─────────────────
  const jobLines = jobBlock.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of jobLines) {

    // ── T price: 1317.12$  /  T price 1260 cc  /  T price: 1260 cc ──
    if (/^t\s*price/i.test(line)) {
      // Extract the number (handles "1317.12$", "1260", "1,260.50")
      const numM = line.match(/(\d[\d,]*(?:\.\d+)?)\s*\$?/);
      if (numM) {
        result.totalPrice = parseFloat(numM[1].replace(/,/g, ''));
        result.pills.push({ label: `💰 $${result.totalPrice}`, ok: true });
      }
      // Payment on the same line after colon or at end: "T price: 1260 cc"
      const payM = line.match(/(?::\s*[\d.,]+\$?\s*|\s)(cc|credit\s*card|check|cash)\s*$/i);
      if (payM) result.payMethod = normalPay(payM[1]);
      continue;
    }

    // ── paid by: cc  /  paid by: check  /  paid by: cash ──
    if (/^paid\s*by\s*:/i.test(line)) {
      const valM = line.match(/:\s*(.+)/);
      if (valM) result.payMethod = normalPay(valM[1].trim());
      continue;
    }

    // ── T parts - 230$  /  T parts: 230  /  T parts 157$ ──
    if (/^t\s*parts?/i.test(line)) {
      const numM = line.replace(/^t\s*parts?\s*/i, '').match(/(\d[\d,]*(?:\.\d+)?)/);
      if (numM) {
        result.totalParts = parseFloat(numM[1].replace(/,/g, ''));
        result.pills.push({ label: `🔩 Parts $${result.totalParts}`, ok: true });
      }
      continue;
    }

    // ── T tip: 126  /  T tip - 20$  /  T tip 50 ──
    if (/^t\s*tip/i.test(line)) {
      const numM = line.replace(/^t\s*tip\s*/i, '').match(/(\d[\d,]*(?:\.\d+)?)/);
      if (numM) {
        result.tip = parseFloat(numM[1].replace(/,/g, ''));
        result.pills.push({ label: `🎁 Tip $${result.tip}`, ok: true });
      }
      continue;
    }

    // ── Standalone payment line: "Check" / "Cash" / "CC" ──
    if (/^\s*(cc|credit\s*card|check|cash)\s*$/i.test(line)) {
      result.payMethod = normalPay(line.trim());
      continue;
    }

    // ── First descriptive line = job description ──
    if (!result.description) {
      result.description = line;
    }
  }

  // ── Fallback description from header if job block had none ─
  if (!result.description) {
    const occuM = header.match(/Occu\s*:\s*(.+)/i);
    const descM = header.match(/Desc\s*:\s*(.+)/i);
    const svcM  = header.match(/Service\s*:\s*(.+)/i);
    const hd = occuM || descM || svcM;
    if (hd) result.description = hd[1].trim();
  }

  // ── Assign payment buckets + pills ────────────────────────
  const pm = result.payMethod;
  if      (pm === 'cc')    { result.paidCC    = result.totalPrice; result.pills.push({ label: '💳 CC',    ok: true }); }
  else if (pm === 'check') { result.paidCheck = result.totalPrice; result.pills.push({ label: '📝 Check', ok: true }); }
  else if (pm === 'cash')  { result.paidCash  = result.totalPrice; result.pills.push({ label: '💵 Cash',  ok: true }); }
  else                     { result.pills.push({ label: '⚠️ Payment not found — select below', ok: false }); }

  if (!result.totalPrice)  result.pills.push({ label: '⚠️ Price not found',       ok: false });
  if (!result.description) result.pills.push({ label: '⚠️ No description',        ok: false });

  return result;
}

function normalPay(s) {
  s = (s || '').toLowerCase().trim();
  if (s === 'cc' || s.includes('credit')) return 'cc';
  if (s.includes('check'))                return 'check';
  if (s.includes('cash'))                 return 'cash';
  return '';
}

// ─── Parser → fills main entry form ───────────────────────
let lastRawNote = '';

function clearParseBox() {
  document.getElementById('parseInput').value     = '';
  document.getElementById('parsePills').innerHTML = '';
  lastRawNote = '';
}

function runParser() {
  const raw = document.getElementById('parseInput').value.trim();
  if (!raw) { toast('Paste a job note first', '#f97316'); return; }
  lastRawNote = raw;

  const p = parseJobText(raw);

  // Fill the main form fields
  if (p.date)        document.getElementById('entryDate').value  = p.date;
  if (p.description) document.getElementById('entryDesc').value  = p.description;
  document.getElementById('totalPrice').value = p.totalPrice || '';
  document.getElementById('paidCC').value     = p.paidCC     || '';
  document.getElementById('paidCheck').value  = p.paidCheck  || '';
  document.getElementById('paidCash').value   = p.paidCash   || '';
  document.getElementById('totalParts').value = p.totalParts || '';
  document.getElementById('entryTip').value   = p.tip        || '';

  recalcPaySum();

  // Show detection pills
  document.getElementById('parsePills').innerHTML = (p.pills || []).map(pl => `
    <span style="
      display:inline-flex;align-items:center;
      padding:3px 10px;border-radius:50px;font-size:11px;font-weight:700;
      background:${pl.ok ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)'};
      border:1px solid ${pl.ok ? 'rgba(74,222,128,0.35)' : 'rgba(248,113,113,0.35)'};
      color:${pl.ok ? '#4ade80' : '#f87171'};
    ">${pl.label}</span>`).join('');

  // Scroll to form
  document.getElementById('entryForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  toast('✓ Form filled — review and save!');
}

// ─── Init ──────────────────────────────────────────────────
updateBanner();
