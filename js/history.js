let selectedIds = new Set();
let calView    = false;
let calYear    = new Date().getFullYear();
let calMonth   = new Date().getMonth();
let calSelDate = null;

// ── Selection ─────────────────────────────────────────────────
function toggleSelect(id) {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  const card = document.querySelector(`.entry-item[data-id="${id}"]`);
  if (card) card.classList.toggle('selected', selectedIds.has(id));
  const chk = document.getElementById('chk_' + id);
  if (chk) {
    chk.textContent   = selectedIds.has(id) ? '✓' : '';
    chk.style.background  = selectedIds.has(id) ? '#f97316' : 'transparent';
    chk.style.borderColor = selectedIds.has(id) ? '#f97316' : 'rgba(255,255,255,0.25)';
  }
  updateSelectionUI();
}

function updateSelectionUI() {
  const bar    = document.getElementById('summarizeBar');
  const countEl= document.getElementById('summarizeCount');
  const selBtn = document.getElementById('selectAllBtn');
  bar.style.display = selectedIds.size > 0 ? 'block' : 'none';
  if (countEl) countEl.textContent = selectedIds.size;
  if (selBtn)  selBtn.textContent  = selectedIds.size > 0 ? 'Clear Selection' : 'Select All';
}

function toggleSelectAll() {
  const entries = load();
  if (selectedIds.size === entries.length) selectedIds.clear();
  else entries.forEach(e => selectedIds.add(e.id));
  renderHistory();
}

// ── Calendar ──────────────────────────────────────────────────
function setCalView(on) {
  calView = on;
  document.getElementById('calToggleBtn').textContent          = on ? '📋 List'  : '🗓 Calendar';
  document.getElementById('historyDateFilter').style.display   = on ? 'none'    : 'block';
  document.getElementById('historyList').style.display         = on ? 'none'    : 'block';
  document.getElementById('historyEmpty').style.display        = 'none';
  document.getElementById('calendarView').style.display        = on ? 'block'   : 'none';
}

function toggleCalendarView() {
  if (!calView) {
    calYear = new Date().getFullYear(); calMonth = new Date().getMonth(); calSelDate = null;
    setCalView(true); renderCalendar();
  } else {
    setCalView(false); renderHistory();
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

  const cells = [];
  for (let i = firstDow-1; i >= 0; i--) cells.push({ day: prevLast-i, mine: false, ds: null });
  for (let d = 1; d <= daysInMo; d++) {
    const m  = String(calMonth+1).padStart(2,'0');
    const dd = String(d).padStart(2,'0');
    cells.push({ day: d, mine: true, ds: calYear+'-'+m+'-'+dd });
  }
  const rem = (7 - cells.length % 7) % 7;
  for (let i = 1; i <= rem; i++) cells.push({ day: i, mine: false, ds: null });

  let gridHtml = '<div class="cal-grid" style="margin-bottom:4px;">';
  ['Mo','Tu','We','Th','Fr','Sa','Su'].forEach(h => { gridHtml += '<div class="cal-hdr">' + h + '</div>'; });
  gridHtml += '</div><div class="cal-grid" id="calGrid">';
  cells.forEach(c => {
    if (!c.mine) { gridHtml += '<div class="cal-day other-month">' + c.day + '</div>'; return; }
    const jobs = dayMap[c.ds] || [];
    let cls = 'cal-day' + (jobs.length ? ' has-jobs' : '') + (c.ds===today ? ' today' : '') + (c.ds===calSelDate ? ' selected' : '');
    const dot = jobs.length ? '<span class="cal-dot">' + (jobs.length>1?jobs.length:'●') + '</span>' : '';
    gridHtml += '<div class="' + cls + '" data-date="' + c.ds + '"><span>' + c.day + '</span>' + dot + '</div>';
  });
  gridHtml += '</div>';

  let html = '<div class="card" style="margin-bottom:10px;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">';
  html += '<button id="calPrev" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:36px;height:36px;border-radius:10px;font-size:22px;cursor:pointer;line-height:1;">‹</button>';
  html += '<div style="font-size:17px;font-weight:800;">' + MONTH_NAMES[calMonth] + ' ' + calYear + '</div>';
  html += '<button id="calNext" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:36px;height:36px;border-radius:10px;font-size:22px;cursor:pointer;line-height:1;">›</button>';
  html += '</div>' + gridHtml + '</div>';

  if (calSelDate && dayMap[calSelDate]) {
    const jobs = dayMap[calSelDate];
    html += '<div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.45);margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">';
    html += fDate(calSelDate) + ' — ' + jobs.length + ' job' + (jobs.length>1?'s':'') + '</div>';
    jobs.forEach(function(e) {
      const comm = ((+e.totalPrice||0)-(+e.totalParts||0))*0.30;
      let badges = '';
      if (e.paidCC>0)    badges += '<span class="badge" style="background:rgba(147,197,253,0.15);color:#93c5fd;">💳 '+f0(e.paidCC)+'</span>';
      if (e.paidCheck>0) badges += '<span class="badge" style="background:rgba(253,224,71,0.15);color:#fde047;">📝 '+f0(e.paidCheck)+'</span>';
      if (e.paidCash>0)  badges += '<span class="badge" style="background:rgba(74,222,128,0.15);color:#4ade80;">💵 '+f0(e.paidCash)+'</span>';
      html += '<div class="entry-item" style="cursor:default;">';
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">';
      html += '<div style="font-size:15px;font-weight:700;">'+(e.description||'Job Entry')+'</div>';
      html += '<div style="text-align:right;flex-shrink:0;margin-left:12px;"><div style="font-size:20px;font-weight:800;color:#f97316;">'+f0(e.totalPrice)+'</div>';
      html += '<div style="font-size:12px;font-weight:600;color:#4ade80;">Commission: '+f0(comm)+'</div></div></div>';
      if (badges) html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">'+badges+'</div>';
      if (e.totalParts>0) html += '<div style="font-size:12px;color:#f87171;margin-bottom:4px;">Parts: '+f0(e.totalParts)+'</div>';
      html += '<div style="display:flex;justify-content:flex-end;margin-top:6px;"><button class="btn-sm" data-edit="'+e.id+'">Edit</button></div></div>';
    });
  }

  container.innerHTML = html;
  document.getElementById('calPrev').addEventListener('click', function() {
    calMonth--; if (calMonth<0){calMonth=11;calYear--;} calSelDate=null; renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', function() {
    calMonth++; if (calMonth>11){calMonth=0;calYear++;} calSelDate=null; renderCalendar();
  });
  document.getElementById('calGrid').addEventListener('click', function(ev) {
    const cell = ev.target.closest('[data-date]');
    if (!cell) return;
    calSelDate = calSelDate === cell.getAttribute('data-date') ? null : cell.getAttribute('data-date');
    renderCalendar();
  });
  container.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => editJob(btn.getAttribute('data-edit')));
  });
}

// ── History list ──────────────────────────────────────────────
function setHistoryRange(mode) {
  const now = new Date();
  let from = '', to = '';

  if (mode === 'week') {
    from = toDateStr(weekStart(now));
    to   = toDateStr(weekEnd(now));
  } else if (mode === 'lastweek') {
    const s = weekStart(now);
    s.setDate(s.getDate() - 7);           // last Monday
    const e = new Date(s);
    e.setDate(s.getDate() + 6);           // last Sunday
    from = toDateStr(s);
    to   = toDateStr(e);
  } else if (mode === 'month') {
    from = toDateStr(monthStart(now));
    to   = toDateStr(monthEnd(now));
  } else if (mode === 'lastmonth') {
    from = toDateStr(lastMonthStart(now));
    to   = toDateStr(lastMonthEnd(now));
  }

  document.getElementById('hFrom').value = from;
  document.getElementById('hTo').value   = to;
  renderHistory();
}

function renderHistory() {
  if (calView) { setCalView(true); renderCalendar(); return; }

  const hFrom  = document.getElementById('hFrom').value;
  const hTo    = document.getElementById('hTo').value;
  let   entries = load().sort((a,b) => new Date(b.date) - new Date(a.date));

  if (hFrom || hTo) {
    const start = hFrom ? new Date(hFrom+'T00:00:00') : new Date(0);
    const end   = hTo   ? new Date(hTo+'T23:59:59')   : new Date(9999,0,1);
    entries = entries.filter(e => inRange(e.date, start, end));
  }

  const search = (document.getElementById('historySearch').value||'').trim().toLowerCase();
  if (search) entries = entries.filter(e => (e.description||'').toLowerCase().includes(search));

  const titleEl = document.getElementById('historyTitle');
  if (titleEl) {
    if (hFrom && hTo) titleEl.textContent = fDate(hFrom) + ' – ' + fDate(hTo);
    else if (hFrom)   titleEl.textContent = 'From ' + fDate(hFrom);
    else if (hTo)     titleEl.textContent = 'Until ' + fDate(hTo);
    else              titleEl.textContent = 'All Entries';
  }

  const list  = document.getElementById('historyList');
  const empty = document.getElementById('historyEmpty');
  if (!entries.length) { list.innerHTML = ''; empty.style.display = 'block'; updateSelectionUI(); return; }
  empty.style.display = 'none';

  list.innerHTML = entries.map(e => {
    const sel  = selectedIds.has(e.id);
    const comm = ((+e.totalPrice||0)-(+e.totalParts||0))*0.30;
    const badges = [];
    if (e.paidCC>0)    badges.push(`<span class="badge" style="background:rgba(147,197,253,0.15);color:#93c5fd;">💳 ${f0(e.paidCC)}</span>`);
    if (e.paidCheck>0) badges.push(`<span class="badge" style="background:rgba(253,224,71,0.15);color:#fde047;">📝 ${f0(e.paidCheck)}</span>`);
    if (e.paidCash>0)  badges.push(`<span class="badge" style="background:rgba(74,222,128,0.15);color:#4ade80;">💵 ${f0(e.paidCash)}</span>`);
    if ((+e.tip||0)>0) badges.push(`<span class="badge" style="background:rgba(74,222,128,0.12);color:#86efac;">🎁 Tip ${f0(e.tip)}</span>`);

    const myDue  = comm + (+e.totalParts||0);
    const iGot   = (+e.paidCheck||0) + (+e.paidCash||0);
    const iOwe   = Math.max(0, iGot - myDue);
    const coOwes = Math.max(0, myDue - iGot);
    const settle = [];
    if (coOwes > 0) settle.push(`<span style="color:#4ade80;">Co. owes me: ${f0(coOwes)}</span>`);
    if (iOwe   > 0) settle.push(`<span style="color:#f87171;">I owe co.: ${f0(iOwe)}</span>`);

    return `
      <div class="entry-item${sel?' selected':''}${e.disputed?' disputed':''}" data-id="${e.id}" onclick="toggleSelect('${e.id}')">
        <div id="chk_${e.id}" style="position:absolute;top:14px;right:14px;width:22px;height:22px;border-radius:50%;
            border:2px solid ${sel?'#f97316':'rgba(255,255,255,0.25)'};background:${sel?'#f97316':'transparent'};
            display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;">${sel?'✓':''}</div>
        ${e.disputed?`<div style="display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:8px;
            background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.3);
            font-size:11px;font-weight:700;color:#f87171;margin-bottom:8px;">
            ⚠️ DISPUTED — excluded from balance</div>`:''}
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;padding-right:32px;">
          <div>
            <div style="font-size:12px;color:rgba(255,255,255,0.38);">${fDate(e.date)}</div>
            <div style="font-size:15px;font-weight:700;margin-top:2px;">${e.description||'Job Entry'}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;margin-left:12px;">
            <div style="font-size:22px;font-weight:800;color:#f97316;">${f0(e.totalPrice)}</div>
            <div style="font-size:12px;font-weight:600;color:#4ade80;">Commission: ${f0(comm)}</div>
          </div>
        </div>
        ${badges.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">${badges.join('')}</div>`:''}
        ${e.totalParts>0?`<div style="font-size:12px;color:#f87171;margin-bottom:6px;">Parts: ${f0(e.totalParts)}</div>`:''}
        ${settle.length?`<div style="font-size:12px;margin-bottom:6px;">${settle.join(' &nbsp;·&nbsp; ')}</div>`:''}
        ${e.ticketText?`
        <div style="margin-top:8px;">
          <button onclick="event.stopPropagation();var p=this.nextElementSibling;p.style.display=p.style.display==='none'?'block':'none';this.textContent=p.style.display==='block'?'🎫 Ticket ▲':'🎫 Ticket ▼';"
            style="background:none;border:none;color:rgba(249,115,22,0.6);font-size:11px;font-weight:700;cursor:pointer;padding:0;">🎫 Ticket ▼</button>
          <div style="display:none;margin-top:8px;">
            <pre style="font-family:-apple-system,BlinkMacSystemFont,monospace;font-size:11px;line-height:1.8;color:rgba(255,255,255,0.6);
              white-space:pre-wrap;background:rgba(0,0,0,0.2);border-radius:8px;padding:10px;border:0;margin:0 0 6px;">${e.ticketText.replace(/</g,'&lt;')}</pre>
            <button class="btn-sm" data-copy-ticket="${e.id}" style="font-size:11px;padding:5px 12px;color:#f97316;border-color:rgba(249,115,22,0.3);background:rgba(249,115,22,0.1);">📋 Copy</button>
          </div>
        </div>`:''}
        ${(!e.ticketText&&e.rawNote)?`
        <div style="margin-top:8px;">
          <button onclick="event.stopPropagation();var p=this.nextElementSibling;p.style.display=p.style.display==='none'?'block':'none';this.textContent=p.style.display==='block'?'📋 Note ▲':'📋 Note ▼';"
            style="background:none;border:none;color:rgba(255,255,255,0.3);font-size:11px;font-weight:600;cursor:pointer;padding:0;">📋 Note ▼</button>
          <pre style="display:none;margin-top:8px;font-family:-apple-system,BlinkMacSystemFont,monospace;font-size:11px;line-height:1.7;color:rgba(255,255,255,0.5);
            white-space:pre-wrap;background:rgba(0,0,0,0.2);border-radius:8px;padding:10px;border:0;">${e.rawNote.replace(/</g,'&lt;')}</pre>
        </div>`:''}
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:6px;flex-wrap:wrap;">
          ${e.rawNote?`<button class="btn-sm" onclick="event.stopPropagation();copyNote('${e.id}')">📋 Copy Note</button>`:''}
          <button class="btn-sm${e.disputed?' danger':''}" onclick="event.stopPropagation();toggleDisputed('${e.id}')" style="${e.disputed?'':'color:rgba(255,255,255,0.45);'}">
            ${e.disputed?'✓ Disputed':'⚠️ Dispute'}
          </button>
          <button class="btn-sm" onclick="event.stopPropagation();editJob('${e.id}')">Edit</button>
          <button class="btn-sm danger" onclick="event.stopPropagation();deleteOne('${e.id}')">Delete</button>
        </div>
      </div>`;
  }).join('');

  updateSelectionUI();
  list.querySelectorAll('[data-copy-ticket]').forEach(function(btn) {
    btn.addEventListener('click', function(ev) {
      ev.stopPropagation();
      const entry = load().find(ex => ex.id === btn.getAttribute('data-copy-ticket'));
      if (entry && entry.ticketText) {
        navigator.clipboard.writeText(entry.ticketText).then(
          () => toast('✓ Ticket copied!'), () => toast('Copy failed', '#f97316')
        );
      }
    });
  });
}

// ── Summary modal ─────────────────────────────────────────────
function summarizeSelected() {
  const entries = load().filter(e => selectedIds.has(e.id));
  if (!entries.length) { toast('Select at least one job', '#f97316'); return; }
  const t = entries.reduce((a,e) => {
    a.price+=+e.totalPrice||0; a.parts+=+e.totalParts||0; a.cc+=+e.paidCC||0;
    a.cash+=+e.paidCash||0; a.check+=+e.paidCheck||0; a.tip+=+e.tip||0; return a;
  }, {price:0,parts:0,cc:0,cash:0,check:0,tip:0});
  const myDue  = (t.price-t.parts)*0.30 + t.parts;
  const iGot   = t.check + t.cash;
  const text   = [
    `T jobs:          ${entries.length}`,
    `T price:         ${f2(t.price)}`,
    `T parts:         ${f2(t.parts)}`,
    `Paid by cc:      ${f2(t.cc)}`,
    `Paid by cash:    ${f2(t.cash)}`,
    `Paid by check:   ${f2(t.check)}`,
    `T tip:           ${f2(t.tip)}`,
    `Owe the company: ${f2(Math.max(0,iGot-myDue))}`,
    `Company owe me:  ${f2(Math.max(0,myDue-iGot))}`,
  ].join('\n');
  document.getElementById('summaryText').textContent    = text;
  document.getElementById('summarySubtitle').textContent = `${entries.length} job${entries.length>1?'s':''} selected`;
  const overlay = document.getElementById('summaryOverlay');
  overlay.style.display = 'flex';
  overlay.addEventListener('click', function onBg(ev) {
    if (ev.target===overlay) { closeSummaryModal(); overlay.removeEventListener('click',onBg); }
  });
}

function closeSummaryModal()  { document.getElementById('summaryOverlay').style.display = 'none'; }
function copySummaryText() {
  navigator.clipboard.writeText(document.getElementById('summaryText').textContent.trim()).then(
    () => toast('✓ Copied!'), () => toast('Copy failed — select text manually', '#f97316')
  );
}

function deleteOne(id) {
  if (confirm('Delete this entry?')) { removeEntry(id); updateBanner(); renderHistory(); toast('Entry deleted','#ef4444'); }
}

function toggleDisputed(id) {
  const entries = load();
  const entry   = entries.find(e => e.id === id);
  if (!entry) return;
  entry.disputed = !entry.disputed;
  save(entries);
  updateBanner();
  renderHistory();
  toast(entry.disputed ? '⚠️ Marked as disputed' : '✓ Dispute removed', entry.disputed ? '#f87171' : '#22c55e');
}

function copyNote(id) {
  const e = load().find(e => e.id === id);
  if (!e || !e.rawNote) { toast('No original note saved','#f97316'); return; }
  navigator.clipboard.writeText(e.rawNote).then(() => toast('✓ Note copied!'), () => toast('Copy failed','#f97316'));
}

function confirmClearAll() {
  if (confirm('Delete ALL entries? This cannot be undone.')) {
    localStorage.removeItem(KEY); updateBanner(); renderHistory(); toast('All entries cleared','#ef4444');
  }
}

function exportCSV() {
  const entries = load().sort((a,b) => new Date(a.date)-new Date(b.date));
  if (!entries.length) { toast('No data to export','#f97316'); return; }
  const hdr  = ['Date','Description','Total Price','Paid CC','Paid Check','Paid Cash','Total Parts','My Commission (30%)','Company Owes Me','I Owe Company'];
  const rows = entries.map(e => {
    const price=+e.totalPrice||0, parts=+e.totalParts||0, check=+e.paidCheck||0, cash=+e.paidCash||0;
    const comm=((price-parts)*0.30), myDue=comm+parts, iGot=check+cash;
    return [e.date,'"'+(e.description||'').replace(/"/g,'""')+'"',price,e.paidCC||0,check,cash,parts,
      comm.toFixed(2), Math.max(0,myDue-iGot).toFixed(2), Math.max(0,iGot-myDue).toFixed(2)];
  });
  const csv = [hdr.join(','),...rows.map(r=>r.join(','))].join('\n');
  const a   = Object.assign(document.createElement('a'),{
    href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),
    download:'garagepro_'+new Date().toISOString().slice(0,10)+'.csv'
  });
  a.click(); URL.revokeObjectURL(a.href);
  toast('✓ CSV exported!');
}
