let drFrom = '', drTo = '';

function renderDashboard() {
  const now     = new Date();
  const entries = load();

  const tw = agg(entries.filter(e => inRange(e.date, weekStart(now), weekEnd(now))));
  const lw = (() => {
    const ls = weekStart(now); ls.setDate(ls.getDate()-7);
    const le = weekEnd(now);   le.setDate(le.getDate()-7);
    return agg(entries.filter(e => inRange(e.date, ls, le)));
  })();
  document.getElementById('dWeekCompare').innerHTML = compareHtml(tw, lw, 'This Wk', 'Last Wk');
  document.getElementById('dWeekStats').innerHTML   = periodStats(tw);

  const tm = agg(entries.filter(e => inRange(e.date, monthStart(now), monthEnd(now))));
  const lm = agg(entries.filter(e => inRange(e.date, lastMonthStart(now), lastMonthEnd(now))));
  document.getElementById('dMonthCompare').innerHTML = compareHtml(tm, lm, 'This Mo', 'Last Mo');
  document.getElementById('dMonthStats').innerHTML   = periodStats(tm);

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
  const entries  = load();
  const filtered = entries.filter(e => inRange(e.date, new Date(drFrom+'T00:00:00'), new Date(drTo+'T23:59:59')));
  const a        = agg(filtered);
  const label    = rangeLabel();

  const net = a.companyOwesMe - a.iOweCompany;
  document.getElementById('dBalanceLabel').textContent = `Company Balance — ${label}`;
  document.getElementById('dCompanyOwes').textContent  = f0(a.companyOwesMe);
  document.getElementById('dIOwe').textContent         = f0(a.iOweCompany);
  const netEl = document.getElementById('dNetBalance');
  netEl.textContent = (net >= 0 ? '+' : '-') + f2(Math.abs(net));
  netEl.style.color = net >= 0 ? '#4ade80' : '#f87171';

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
      <pre id="dReportText" style="font-family:-apple-system,BlinkMacSystemFont,monospace;
        font-size:13px;line-height:2;color:rgba(255,255,255,0.88);
        white-space:pre-wrap;background:rgba(0,0,0,0.25);
        border-radius:10px;padding:14px;margin:0 0 12px;border:0;">${lines}</pre>
      <button onclick="copyDashReport()" style="background:rgba(249,115,22,0.15);border:1px solid rgba(249,115,22,0.4);
        color:#f97316;font-size:15px;font-weight:700;padding:13px;border-radius:12px;width:100%;cursor:pointer;">📋 Copy Report</button>
    </div>`;

  document.getElementById('dStatsLabel').textContent = `Stats — ${label}`;
  renderStats(a, filtered.length);
}

function copyDashReport() {
  navigator.clipboard.writeText(document.getElementById('dReportText').textContent.trim()).then(
    () => toast('✓ Copied!'), () => toast('Copy failed', '#f97316')
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
    { l:'Total Jobs',          v:jobCount,            c:'#f97316' },
    { l:'Total Revenue',       v:f0(a.revenue),        c:'#fff'    },
    { l:'My Commission (30%)', v:f0(a.myCommission),   c:'#f97316' },
    { l:'Total Parts',         v:f0(a.parts),          c:'#f87171' },
    { l:'Total Tips',          v:f0(a.tip),            c:'#4ade80' },
    { l:'Total Profit',        v:f0(profit),           c:'#4ade80' },
    { l:'Profit Margin',       v:margin+'%',           c:'#4ade80' },
    { l:'Avg Ticket',          v:f0(avg),              c:'#f97316' },
    { l:'Top Payment',         v:top,                  c:'#93c5fd' },
    { l:'Company Owes Me',     v:f0(a.companyOwesMe),  c:'#4ade80' },
    { l:'I Owe Company',       v:f0(a.iOweCompany),    c:'#f87171' },
  ];
  document.getElementById('dStats').innerHTML = rows.map(r =>
    `<div class="stat-row">
      <span style="font-size:14px;color:rgba(255,255,255,0.55);">${r.l}</span>
      <span style="font-size:16px;font-weight:700;color:${r.c};">${r.v}</span>
    </div>`).join('');
}

function periodStats(a) {
  const avg = a.jobs > 0 ? a.revenue / a.jobs : 0;
  return [
    { l:'Jobs',            v:a.jobs,              c:'#f97316' },
    { l:'Revenue',         v:f0(a.revenue),        c:'#fff'    },
    { l:'Commission (30%)',v:f0(a.myCommission),   c:'#f97316' },
    { l:'Parts',           v:f0(a.parts),          c:'#f87171' },
    { l:'Tips',            v:f0(a.tip),            c:'#4ade80' },
    { l:'Profit',          v:f0(a.revenue-a.parts),c:'#4ade80' },
    { l:'Avg Ticket',      v:f0(avg),              c:'#f97316' },
    { l:'Company Owes Me', v:f0(a.companyOwesMe),  c:'#4ade80' },
    { l:'I Owe Company',   v:f0(a.iOweCompany),    c:'#f87171' },
  ].map(r =>
    `<div class="stat-row">
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
    { label:'Revenue',    cur:cur.revenue, prev:prev.revenue, color:'#f97316' },
    { label:'Commission', cur:curComm,     prev:prevComm,     color:'#4ade80' },
    { label:'Parts Cost', cur:cur.parts,   prev:prev.parts,   color:'#f87171' },
    { label:'Jobs',       cur:cur.jobs,    prev:prev.jobs,    color:'#93c5fd', money:false },
    { label:'AVG Ticket', cur:curAvg,      prev:prevAvg,      color:'#fde047' },
  ];
  return items.map(it => {
    const diff = it.cur - it.prev;
    const pct  = it.prev > 0 ? ((diff/it.prev)*100).toFixed(0) : (it.cur > 0 ? 100 : 0);
    const dCol = diff >= 0 ? '#4ade80' : '#f87171';
    const dStr = (diff>=0?'+':'') + (it.money===false?diff:f0(diff)) + ' (' + (diff>=0?'+':'') + pct + '%)';
    const mx   = Math.max(it.cur, it.prev, 1);
    const fv   = it.money === false ? v => v : f0;
    return `<div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px;">
        <span style="font-size:13px;color:rgba(255,255,255,0.6);">${it.label}</span>
        <span style="font-size:11px;font-weight:700;color:${dCol};">${dStr}</span>
      </div>
      <div style="display:flex;gap:5px;align-items:center;margin-bottom:5px;">
        <span style="font-size:11px;color:rgba(255,255,255,0.38);width:52px;text-align:right;">${curL}</span>
        <div style="flex:1;" class="pbar-track"><div class="pbar-fill" style="width:${(it.cur/mx*100).toFixed(1)}%;background:${it.color};"></div></div>
        <span style="font-size:13px;font-weight:700;color:#fff;width:54px;">${fv(it.cur)}</span>
      </div>
      <div style="display:flex;gap:5px;align-items:center;">
        <span style="font-size:11px;color:rgba(255,255,255,0.38);width:52px;text-align:right;">${prevL}</span>
        <div style="flex:1;" class="pbar-track"><div class="pbar-fill" style="width:${(it.prev/mx*100).toFixed(1)}%;background:${it.color};opacity:0.35;"></div></div>
        <span style="font-size:13px;color:rgba(255,255,255,0.45);width:54px;">${fv(it.prev)}</span>
      </div></div>`;
  }).join('');
}
