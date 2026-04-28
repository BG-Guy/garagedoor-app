// ── Date helpers ──────────────────────────────────────────────
function weekStart(d) {
  const x = new Date(d); x.setHours(0,0,0,0);
  const day = x.getDay();
  x.setDate(x.getDate() - (day === 0 ? 6 : day - 1));
  return x;
}
function weekEnd(d) {
  const x = weekStart(d); x.setDate(x.getDate() + 6); x.setHours(23,59,59,999); return x;
}
function monthStart(d)    { return new Date(d.getFullYear(), d.getMonth(),   1,  0,0,0,0); }
function monthEnd(d)      { return new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999); }
function lastMonthStart(d){ return new Date(d.getFullYear(), d.getMonth()-1, 1,  0,0,0,0); }
function lastMonthEnd(d)  { return new Date(d.getFullYear(), d.getMonth(),   0, 23,59,59,999); }
function inRange(dateStr, a, b) {
  const d = new Date(dateStr + 'T00:00:00'); return d >= a && d <= b;
}

// Format a Date as YYYY-MM-DD in local time (avoids UTC drift from toISOString)
const toDateStr = d =>
  d.getFullYear() + '-' +
  String(d.getMonth() + 1).padStart(2, '0') + '-' +
  String(d.getDate()).padStart(2, '0');

// ── Formatters ────────────────────────────────────────────────
const f0    = n => '$' + Math.round(n||0).toLocaleString('en-US');
const f2    = n => '$' + (n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fDate = s => new Date(s+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, color = '#22c55e') {
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.background = color;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}
