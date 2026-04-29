function updateInventoryOnSave() {
  const cfg = getPartsConfig();
  partsRows.forEach(function(r) {
    if (!r.presetId) return;
    if (!cfg[r.presetId]) cfg[r.presetId] = { price: 0, stock: 0 };
    cfg[r.presetId].stock = Math.max(0, (cfg[r.presetId].stock || 0) - 1);
  });
  savePartsConfig(cfg);
}

function renderPartsTab() {
  const cfg  = getPartsConfig();
  const list = document.getElementById('partsConfigList');
  if (!list) return;

  let wheelItems = '';
  for (let i = 0; i <= 99; i++) wheelItems += '<div class="swi">' + i + '</div>';

  let html = '';
  PRESET_PARTS.forEach(function(p) {
    const c     = cfg[p.id] || { price: 0, stock: 0 };
    const stock = Math.min(99, c.stock || 0);

    html += '<div style="display:flex;align-items:center;gap:12px;padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.06);">';
    html += '<div style="flex:1;">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">';
    html += '<div style="font-size:22px;">' + p.icon + '</div>';
    html += '<div style="font-size:15px;font-weight:700;">' + p.label + '</div>';
    html += '</div>';
    html += '<div class="input-wrap has-prefix"><span class="prefix">$</span>' +
            '<input type="number" inputmode="decimal" data-part="' + p.id + '" data-field="price" ' +
            'min="0" step="0.01" placeholder="0.00" value="' + (c.price||'') + '"></div></div>';
    html += '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;">';
    html += '<div style="font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1px;">Stock</div>';
    html += '<div class="sww"><div class="sw-line"></div>' +
            '<div class="sw" data-part="' + p.id + '" data-init="' + stock + '">' + wheelItems + '</div></div>';
    html += '</div></div>';
  });

  html += '<button id="addInventoryBtn" style="margin-top:18px;width:100%;padding:14px;border-radius:14px;cursor:pointer;' +
          'background:linear-gradient(135deg,rgba(249,115,22,0.18),rgba(249,115,22,0.07));' +
          'border:1px solid rgba(249,115,22,0.45);color:#f97316;font-size:15px;font-weight:700;">+ Add Inventory</button>';

  list.innerHTML = html;

  list.querySelectorAll('[data-field="price"]').forEach(function(inp) {
    inp.addEventListener('change', function() {
      const c2 = getPartsConfig();
      const id = inp.getAttribute('data-part');
      if (!c2[id]) c2[id] = { price: 0, stock: 0 };
      c2[id].price = parseFloat(inp.value) || 0;
      savePartsConfig(c2);
      toast('✓ Price saved');
    });
  });

  list.querySelectorAll('.sw').forEach(function(wheel) {
    const id    = wheel.getAttribute('data-part');
    const init  = parseInt(wheel.getAttribute('data-init')) || 0;
    const items = wheel.querySelectorAll('.swi');

    function styleItems(cur) {
      items.forEach(function(el, i) {
        const d = Math.abs(i - cur);
        if      (d === 0) { el.style.color = '#f97316'; el.style.fontSize = '22px'; el.style.fontWeight = '800'; }
        else if (d === 1) { el.style.color = 'rgba(255,255,255,0.5)'; el.style.fontSize = '16px'; el.style.fontWeight = '700'; }
        else if (d === 2) { el.style.color = 'rgba(255,255,255,0.2)'; el.style.fontSize = '13px'; el.style.fontWeight = '600'; }
        else              { el.style.color = 'rgba(255,255,255,0.07)'; el.style.fontSize = '11px'; el.style.fontWeight = '600'; }
      });
    }

    setTimeout(function() { wheel.scrollTop = init * 40; styleItems(init); }, 30);

    let saveTimer;
    wheel.addEventListener('scroll', function() {
      const cur = Math.round(wheel.scrollTop / 40);
      styleItems(cur);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function() {
        const c2 = getPartsConfig();
        if (!c2[id]) c2[id] = { price: 0, stock: 0 };
        c2[id].stock = cur;
        savePartsConfig(c2);
      }, 200);
    });
  });

  const addBtn = document.getElementById('addInventoryBtn');
  if (addBtn) addBtn.addEventListener('click', openAddInventory);
}

// ── Add Inventory Modal ───────────────────────────────────────
function openAddInventory() {
  const cfg  = getPartsConfig();
  const list = document.getElementById('inventoryAddList');
  if (!list) return;

  let wheelItems = '';
  for (let i = 0; i <= 50; i++) wheelItems += '<div class="swi">' + i + '</div>';

  let html = '';
  PRESET_PARTS.forEach(function(p) {
    const cur = (cfg[p.id] && cfg[p.id].stock) ? cfg[p.id].stock : 0;
    html += '<div style="display:flex;align-items:center;gap:14px;padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.06);">';
    html += '<div style="flex:1;">';
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;">';
    html += '<div style="font-size:22px;">' + p.icon + '</div>';
    html += '<div style="font-size:16px;font-weight:700;">' + p.label + '</div></div>';
    html += '<div style="font-size:12px;color:rgba(255,255,255,0.4);">Current: ' +
            '<span style="color:#4ade80;font-weight:700;">' + cur + '</span> → ' +
            '<span id="inv_future_' + p.id + '" style="color:#f97316;font-weight:700;">' + cur + '</span></div>';
    html += '</div>';
    html += '<div style="display:flex;flex-direction:column;align-items:center;gap:5px;">';
    html += '<div style="font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1px;">Add</div>';
    html += '<div class="sww"><div class="sw-line"></div>' +
            '<div class="sw inv-wheel" data-part="' + p.id + '" data-cur="' + cur + '">' + wheelItems + '</div></div>';
    html += '</div></div>';
  });
  list.innerHTML = html;

  list.querySelectorAll('.inv-wheel').forEach(function(wheel) {
    const id       = wheel.getAttribute('data-part');
    const curStock = parseInt(wheel.getAttribute('data-cur')) || 0;
    const items    = wheel.querySelectorAll('.swi');

    function styleItems(v) {
      items.forEach(function(el, i) {
        const d = Math.abs(i - v);
        if      (d === 0) { el.style.color = '#f97316'; el.style.fontSize = '22px'; el.style.fontWeight = '800'; }
        else if (d === 1) { el.style.color = 'rgba(255,255,255,0.5)'; el.style.fontSize = '16px'; el.style.fontWeight = '700'; }
        else if (d === 2) { el.style.color = 'rgba(255,255,255,0.2)'; el.style.fontSize = '13px'; el.style.fontWeight = '600'; }
        else              { el.style.color = 'rgba(255,255,255,0.07)'; el.style.fontSize = '11px'; el.style.fontWeight = '600'; }
      });
    }

    setTimeout(function() { wheel.scrollTop = 0; styleItems(0); }, 30);

    wheel.addEventListener('scroll', function() {
      const v = Math.round(wheel.scrollTop / 40);
      styleItems(v);
      const futureEl = document.getElementById('inv_future_' + id);
      if (futureEl) futureEl.textContent = curStock + v;
    });
  });

  const overlay = document.getElementById('inventoryOverlay');
  overlay.style.display = 'flex';
  overlay.addEventListener('click', function onBg(ev) {
    if (ev.target === overlay) { closeAddInventory(); overlay.removeEventListener('click', onBg); }
  });
}

function closeAddInventory() {
  document.getElementById('inventoryOverlay').style.display = 'none';
}

function confirmAddInventory() {
  const cfg = getPartsConfig();
  let anyAdded = false;
  document.querySelectorAll('.inv-wheel').forEach(function(wheel) {
    const id  = wheel.getAttribute('data-part');
    const qty = Math.round(wheel.scrollTop / 40);
    if (qty <= 0) return;
    if (!cfg[id]) cfg[id] = { price: 0, stock: 0 };
    cfg[id].stock = (cfg[id].stock || 0) + qty;
    anyAdded = true;
  });
  if (!anyAdded) { toast('Scroll a wheel to add units', '#f97316'); return; }
  savePartsConfig(cfg);
  closeAddInventory();
  renderPartsTab();
  toast('✓ Inventory updated!');
}
