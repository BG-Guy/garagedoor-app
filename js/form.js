let editingId = null;

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
  resetPartsPicker();
  document.getElementById('generatedTicket').style.display = 'none';
  recalcPaySum();
}

document.getElementById('entryForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const ticket    = generateTicketText();
  const partsList = partsRows.map(r => ({ label: r.label, price: r.price }));

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
    partsList,
    ticketText:  ticket,
  };

  if (editingId) {
    save(load().map(ex => ex.id === editingId ? entry : ex));
    toast('✓ Job updated & ticket copied!');
  } else {
    addEntry(entry);
    updateInventoryOnSave();
    toast('✓ Job saved & ticket copied!');
  }

  navigator.clipboard.writeText(ticket).catch(() => {});
  resetForm();
  updateBanner();
});
