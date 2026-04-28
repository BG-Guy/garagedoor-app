let lastRawNote = '';

function parseJobText(raw) {
  const result = {
    date:'', description:'', totalPrice:0,
    paidCC:0, paidCheck:0, paidCash:0, totalParts:0, tip:0,
    pills:[], payMethod:'',
  };
  result.date = new Date().toISOString().slice(0,10);

  const sepRx    = /\*{3,}|[-–—]{2,}/;
  const halves   = raw.split(sepRx);
  const header   = halves[0] || '';
  const jobBlock = (halves[1] || '').trim();

  const dateM = raw.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (dateM) {
    let y = dateM[3]; if (y.length === 2) y = '20' + y;
    result.date = `${y}-${dateM[1].padStart(2,'0')}-${dateM[2].padStart(2,'0')}`;
    result.pills.push({ label: `📅 ${dateM[1]}/${dateM[2]}/${dateM[3]}`, ok: true });
  }

  const jobLines = jobBlock.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of jobLines) {
    if (/^t\s*price/i.test(line)) {
      const numM = line.match(/(\d[\d,]*(?:\.\d+)?)\s*\$?/);
      if (numM) { result.totalPrice = parseFloat(numM[1].replace(/,/g,'')); result.pills.push({ label:`💰 $${result.totalPrice}`, ok:true }); }
      const payM = line.match(/(?::\s*[\d.,]+\$?\s*|\s)(cc|credit\s*card|check|cash)\s*$/i);
      if (payM) result.payMethod = normalPay(payM[1]);
      continue;
    }
    if (/^paid\s*by\s*:/i.test(line)) {
      const valM = line.match(/:\s*(.+)/);
      if (valM) result.payMethod = normalPay(valM[1].trim());
      continue;
    }
    if (/^t\s*parts?/i.test(line)) {
      const numM = line.replace(/^t\s*parts?\s*/i,'').match(/(\d[\d,]*(?:\.\d+)?)/);
      if (numM) { result.totalParts = parseFloat(numM[1].replace(/,/g,'')); result.pills.push({ label:`🔩 Parts $${result.totalParts}`, ok:true }); }
      continue;
    }
    if (/^t\s*tip/i.test(line)) {
      const numM = line.replace(/^t\s*tip\s*/i,'').match(/(\d[\d,]*(?:\.\d+)?)/);
      if (numM) { result.tip = parseFloat(numM[1].replace(/,/g,'')); result.pills.push({ label:`🎁 Tip $${result.tip}`, ok:true }); }
      continue;
    }
    if (/^\s*(cc|credit\s*card|check|cash)\s*$/i.test(line)) { result.payMethod = normalPay(line.trim()); continue; }
    if (!result.description) result.description = line;
  }

  if (!result.description) {
    const hd = header.match(/Occu\s*:\s*(.+)/i) || header.match(/Desc\s*:\s*(.+)/i) || header.match(/Service\s*:\s*(.+)/i);
    if (hd) result.description = hd[1].trim();
  }

  const pm = result.payMethod;
  if      (pm === 'cc')    { result.paidCC    = result.totalPrice; result.pills.push({ label:'💳 CC',    ok:true }); }
  else if (pm === 'check') { result.paidCheck = result.totalPrice; result.pills.push({ label:'📝 Check', ok:true }); }
  else if (pm === 'cash')  { result.paidCash  = result.totalPrice; result.pills.push({ label:'💵 Cash',  ok:true }); }
  else                     { result.pills.push({ label:'⚠️ Payment not found — select below', ok:false }); }

  if (!result.totalPrice)  result.pills.push({ label:'⚠️ Price not found',  ok:false });
  if (!result.description) result.pills.push({ label:'⚠️ No description',   ok:false });
  return result;
}

function normalPay(s) {
  s = (s||'').toLowerCase().trim();
  if (s === 'cc' || s.includes('credit')) return 'cc';
  if (s.includes('check'))               return 'check';
  if (s.includes('cash'))                return 'cash';
  return '';
}

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
  if (p.date)        document.getElementById('entryDate').value  = p.date;
  if (p.description) document.getElementById('entryDesc').value  = p.description;
  document.getElementById('totalPrice').value = p.totalPrice || '';
  document.getElementById('paidCC').value     = p.paidCC     || '';
  document.getElementById('paidCheck').value  = p.paidCheck  || '';
  document.getElementById('paidCash').value   = p.paidCash   || '';
  document.getElementById('totalParts').value = p.totalParts || '';
  document.getElementById('entryTip').value   = p.tip        || '';
  recalcPaySum();

  document.getElementById('parsePills').innerHTML = (p.pills||[]).map(pl => `
    <span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:50px;
      font-size:11px;font-weight:700;
      background:${pl.ok?'rgba(74,222,128,0.12)':'rgba(248,113,113,0.12)'};
      border:1px solid ${pl.ok?'rgba(74,222,128,0.35)':'rgba(248,113,113,0.35)'};
      color:${pl.ok?'#4ade80':'#f87171'};">${pl.label}</span>`).join('');

  document.getElementById('entryForm').scrollIntoView({ behavior:'smooth', block:'start' });
  toast('✓ Form filled — review and save!');
}
