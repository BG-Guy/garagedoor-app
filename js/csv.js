// ── CSV cell encoder ──────────────────────────────────────────
// Wraps in quotes if value contains comma, newline, or quote.
function csvCell(v) {
  const s = String(v == null ? '' : v);
  if (s.includes(',') || s.includes('\n') || s.includes('\r') || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// ── RFC 4180 CSV parser ───────────────────────────────────────
// Handles quoted fields with commas, newlines, and escaped quotes.
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false, i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"' && text[i+1] === '"') { field += '"'; i += 2; }   // escaped "
      else if (ch === '"')                 { inQ = false; i++; }        // end of quoted field
      else                                 { field += ch; i++; }
      continue;
    }
    if (ch === '"')  { inQ = true; i++; continue; }
    if (ch === ',')  { row.push(field); field = ''; i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += ch; i++;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ── Export ────────────────────────────────────────────────────
function exportCSV() {
  const entries = load().sort((a,b) => new Date(a.date) - new Date(b.date));
  if (!entries.length) { toast('No data to export', '#f97316'); return; }

  const hdr = [
    'ID','Date','Description',
    'Total Price','Paid CC','Paid Check','Paid Cash','Total Parts','Tip',
    'My Commission','Company Owes Me','I Owe Company',
    'Disputed','Raw Note','Ticket Text',
  ];

  const rows = entries.map(e => {
    const cc    = +e.paidCC     || 0;
    const price = +e.totalPrice || 0;
    const parts = +e.totalParts || 0;
    const check = +e.paidCheck  || 0;
    const cash  = +e.paidCash   || 0;
    const comm  = (price - parts) * 0.30;
    const tipCC = cc > 0 ? (+e.tip || 0) : 0;
    const myDue = comm + parts + tipCC;
    const iGot  = check + cash;
    return [
      csvCell(e.id),
      csvCell(e.date),
      csvCell(e.description || ''),
      price, cc, check, cash, parts, +e.tip || 0,
      comm.toFixed(2),
      Math.max(0, myDue - iGot).toFixed(2),
      Math.max(0, iGot - myDue).toFixed(2),
      e.disputed ? '1' : '0',
      csvCell(e.rawNote    || ''),
      csvCell(e.ticketText || ''),
    ];
  });

  const csv = [hdr.join(','), ...rows.map(r => r.join(','))].join('\n');
  const a   = Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })),
    download: 'garagepro_' + new Date().toISOString().slice(0,10) + '.csv',
  });
  a.click();
  URL.revokeObjectURL(a.href);
  toast('✓ CSV exported!');
}

// ── Import ────────────────────────────────────────────────────
function importCSV() {
  const input    = document.createElement('input');
  input.type     = 'file';
  input.accept   = '.csv';
  input.onchange = function(ev) {
    const file = ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload  = function(re) {
      try {
        // Strip BOM if present
        const text = re.target.result.replace(/^﻿/, '');
        const rows = parseCSV(text);
        if (rows.length < 2) { toast('No rows found in CSV', '#f97316'); return; }

        // Build column index map from header row
        const hdrs = rows[0].map(h => h.trim().toLowerCase());
        const col  = name => hdrs.indexOf(name);

        const existing   = load();
        const existingIds = new Set(existing.map(e => e.id));
        let added = 0, skipped = 0;
        const toAdd = [];

        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row.length || (row.length === 1 && !row[0])) continue;

          const id = (col('id') >= 0 && row[col('id')]) ? row[col('id')] : Date.now() + '_' + r;
          if (existingIds.has(id)) { skipped++; continue; }

          const date = col('date') >= 0 ? row[col('date')] : '';
          if (!date) { skipped++; continue; }

          toAdd.push({
            id,
            date,
            description: col('description') >= 0 ? row[col('description')] : '',
            totalPrice:  parseFloat(row[col('total price')]) || 0,
            paidCC:      parseFloat(row[col('paid cc')])     || 0,
            paidCheck:   parseFloat(row[col('paid check')])  || 0,
            paidCash:    parseFloat(row[col('paid cash')])   || 0,
            totalParts:  parseFloat(row[col('total parts')]) || 0,
            tip:         parseFloat(col('tip') >= 0 ? row[col('tip')] : '0') || 0,
            disputed:    col('disputed') >= 0 && row[col('disputed')] === '1',
            rawNote:     col('raw note')    >= 0 ? row[col('raw note')]    : '',
            ticketText:  col('ticket text') >= 0 ? row[col('ticket text')] : '',
            partsList:   [],
          });
          existingIds.add(id);
          added++;
        }

        save([...existing, ...toAdd]);
        updateBanner();
        renderHistory();
        toast('✓ Imported ' + added + ' entries' + (skipped ? ', ' + skipped + ' skipped' : ''));
      } catch (err) {
        toast('Failed to parse CSV', '#f97316');
        console.error(err);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };
  input.click();
}
