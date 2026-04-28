function generateTicketText() {
  const price = parseFloat(document.getElementById('totalPrice').value) || 0;
  const cc    = parseFloat(document.getElementById('paidCC').value)     || 0;
  const check = parseFloat(document.getElementById('paidCheck').value)  || 0;
  const cash  = parseFloat(document.getElementById('paidCash').value)   || 0;
  const parts = parseFloat(document.getElementById('totalParts').value) || 0;
  const tip   = parseFloat(document.getElementById('entryTip').value)   || 0;

  const ft    = n => Math.round(n || 0) + '$';
  const lines = [];

  // Full unedited note verbatim — nothing stripped or split
  if (lastRawNote) {
    lines.push(lastRawNote.trim());
    lines.push('');
  }

  lines.push('-------');
  lines.push('');
  lines.push('T price: ' + ft(price));

  if (parts > 0) {
    let partsLine = 'T parts: ' + ft(parts);
    if (partsRows.length > 0) {
      const counts = {};
      partsRows.filter(r => r.label).forEach(r => {
        const clean = r.label.replace(/[^\x00-\x7F]/g, '').trim().toLowerCase();
        if (clean) counts[clean] = (counts[clean] || 0) + 1;
      });
      const partStr = Object.entries(counts)
        .map(([name, n]) => n > 1 ? n + ' ' + name : name).join(', ');
      if (partStr) partsLine += ' ' + partStr;
    }
    lines.push(partsLine);
  }

  if (tip > 0) lines.push('T tip: ' + ft(tip));

  const methods = [];
  if (cc)    methods.push('cc');
  if (check) methods.push('check');
  if (cash)  methods.push('cash');
  lines.push('paid by: ' + (methods.join(', ') || 'n/a'));

  return lines.join('\n');
}

function generateTicket() {
  const text = generateTicketText();
  document.getElementById('ticketText').textContent = text;
  document.getElementById('generatedTicket').style.display = 'block';
  document.getElementById('generatedTicket').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copyGeneratedTicket() {
  navigator.clipboard.writeText(generateTicketText()).then(
    () => toast('✓ Ticket copied!'),
    () => toast('Copy failed', '#f97316')
  );
}
