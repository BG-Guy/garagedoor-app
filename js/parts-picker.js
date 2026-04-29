let partsRows   = [];
let partsNextId = 0;

function togglePresetPart(presetId) {
  const idx = partsRows.findIndex(r => r.presetId === presetId);
  if (idx >= 0) {
    partsRows.splice(idx, 1);
  } else {
    const p     = PRESET_PARTS.find(p => p.id === presetId);
    const cfg   = getPartsConfig();
    const price = (cfg[presetId] && cfg[presetId].price) ? cfg[presetId].price : 0;
    partsRows.push({ rowId: partsNextId++, presetId, label: p.icon + ' ' + p.label, price, qty: 1 });
  }
  renderPartsPicker();
}

function addCustomPartRow() {
  partsRows.push({ rowId: partsNextId++, presetId: null, label: '', price: 0, qty: 1 });
  renderPartsPicker();
}

function removePartRow(rowId) {
  partsRows = partsRows.filter(r => r.rowId !== rowId);
  renderPartsPicker();
}

function syncPartField(rowId, field, val) {
  const row = partsRows.find(r => r.rowId === rowId);
  if (row) row[field] = field === 'price' ? (parseFloat(val) || 0) : val;
  recalcParts();
}

function syncPartQty(rowId, qty) {
  const row = partsRows.find(r => r.rowId === rowId);
  if (row) { row.qty = qty; recalcParts(); }
}

function recalcParts() {
  const total = partsRows.reduce((s, r) => s + (+r.price || 0) * (+r.qty || 1), 0);
  document.getElementById('totalParts').value = total.toFixed(2) || '';
}

// Shared wheel styler (same logic as parts tab)
function styleWheelItems(items, cur) {
  items.forEach(function(el, i) {
    const d = Math.abs(i - cur);
    if      (d === 0) { el.style.color = '#f97316'; el.style.fontSize = '22px'; el.style.fontWeight = '800'; }
    else if (d === 1) { el.style.color = 'rgba(255,255,255,0.5)'; el.style.fontSize = '16px'; el.style.fontWeight = '700'; }
    else if (d === 2) { el.style.color = 'rgba(255,255,255,0.2)'; el.style.fontSize = '13px'; el.style.fontWeight = '600'; }
    else              { el.style.color = 'rgba(255,255,255,0.07)'; el.style.fontSize = '11px'; el.style.fontWeight = '600'; }
  });
}

function renderPartsPicker() {
  const section  = document.getElementById('partsPickerSection');
  if (!section) return;
  const selected = new Set(partsRows.filter(r => r.presetId).map(r => r.presetId));

  // Preset chips
  let html = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">';
  PRESET_PARTS.forEach(function(p) {
    const on = selected.has(p.id);
    html += '<button type="button" data-preset="' + p.id + '" style="' +
      'padding:8px 12px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s;' +
      (on ? 'background:#f97316;border:none;color:#fff;'
          : 'background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);color:rgba(255,255,255,0.65);') +
      '">' + p.icon + ' ' + p.label + '</button>';
  });
  html += '</div>';

  // Selected / custom rows
  if (partsRows.length > 0) {
    // Wheel items 1–9 for quantity
    let qtyItems = '';
    for (let i = 1; i <= 9; i++) qtyItems += '<div class="swi">' + i + '</div>';

    html += '<div id="partsRowList">';
    partsRows.forEach(function(r) {
      const qty = r.qty || 1;
      html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;" data-row-id="' + r.rowId + '">';

      if (r.presetId) {
        // Label + qty wheel
        html += '<div style="flex:1;min-width:0;">';
        html += '<div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.8);margin-bottom:4px;">' + r.label + '</div>';
        html += '</div>';
        html += '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex-shrink:0;">';
        html += '<div style="font-size:9px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.8px;">Qty</div>';
        html += '<div class="sww" style="width:50px;"><div class="sw-line"></div>' +
                '<div class="sw qty-wheel" data-row-id="' + r.rowId + '" data-init="' + qty + '">' +
                qtyItems + '</div></div>';
        html += '</div>';
      } else {
        html += '<input type="text" data-field="label" placeholder="Part name…" style="flex:1;" value="' + (r.label||'') + '">';
      }

      html += '<div class="input-wrap has-prefix" style="width:84px;flex-shrink:0;">' +
              '<span class="prefix">$</span>' +
              '<input type="number" inputmode="decimal" data-field="price" min="0" step="0.01" placeholder="0" value="' + (r.price||'') + '">' +
              '</div>';
      html += '<button type="button" data-remove="' + r.rowId + '" style="' +
              'background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);' +
              'color:#f87171;border-radius:8px;padding:7px 10px;cursor:pointer;font-size:13px;flex-shrink:0;">✕</button>';
      html += '</div>';
    });
    html += '</div>';

    const total = partsRows.reduce((s, r) => s + (+r.price || 0) * (+r.qty || 1), 0);
    html += '<div style="font-size:13px;font-weight:700;color:#f87171;text-align:right;margin-top:2px;">Total Parts: ' + f2(total) + '</div>';
  }

  html += '<button type="button" id="addPartBtn" style="' +
          'margin-top:10px;width:100%;padding:9px;border-radius:10px;' +
          'background:rgba(255,255,255,0.05);border:1px dashed rgba(255,255,255,0.18);' +
          'color:rgba(255,255,255,0.45);font-size:13px;cursor:pointer;">+ Add custom part</button>';

  section.innerHTML = html;

  // Chip listeners
  section.querySelectorAll('[data-preset]').forEach(function(btn) {
    btn.addEventListener('click', function() { togglePresetPart(btn.dataset.preset); });
  });

  // Qty scroll wheels
  section.querySelectorAll('.qty-wheel').forEach(function(wheel) {
    const rowId = parseInt(wheel.getAttribute('data-row-id'));
    const init  = parseInt(wheel.getAttribute('data-init')) || 1;
    const items = wheel.querySelectorAll('.swi');

    setTimeout(function() {
      wheel.scrollTop = (init - 1) * 40;
      styleWheelItems(items, init - 1);
    }, 30);

    wheel.addEventListener('scroll', function() {
      const idx = Math.round(wheel.scrollTop / 40);
      styleWheelItems(items, idx);
      syncPartQty(rowId, idx + 1);
    });
  });

  // Remove buttons
  section.querySelectorAll('[data-remove]').forEach(function(btn) {
    btn.addEventListener('click', function() { removePartRow(+btn.dataset.remove); });
  });

  // Field inputs (price, custom label)
  section.querySelectorAll('[data-field]').forEach(function(inp) {
    const rowEl = inp.closest('[data-row-id]');
    if (!rowEl) return;
    inp.addEventListener('input', function() { syncPartField(+rowEl.dataset.rowId, inp.dataset.field, inp.value); });
  });

  const addBtn = section.querySelector('#addPartBtn');
  if (addBtn) addBtn.addEventListener('click', addCustomPartRow);

  recalcParts();
}

function resetPartsPicker() {
  partsRows = [];
  renderPartsPicker();
}

function partsListText() {
  return partsRows.filter(r => r.label).map(r => {
    const qty  = r.qty || 1;
    const name = r.label.replace(/[^\x00-\x7F]/g, '').trim().toLowerCase();
    return qty > 1 ? qty + ' ' + name : name;
  }).join(', ');
}
