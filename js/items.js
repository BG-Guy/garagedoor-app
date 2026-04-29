// Default preset items — used only to seed localStorage on first run.
const ITEMS = [
  { id:'big-drums',       name:'Big Drums',                  desc:'Replaced heavy-duty oversized cable drums for high-cycle spring systems. Engineered for maximum durability and even cable distribution on larger door setups.' },
  { id:'small-drums',     name:'Small Drums',                desc:'Replaced standard residential cable drums for smooth, balanced lifting. Precision-wound to eliminate cable slack and extend the life of your springs.' },
  { id:'warranty',        name:'1 Year Warranty for Labor',  desc:'All work performed today is backed by a full 12-month labor warranty. Any issue related to our service will be corrected at no additional charge.' },
  { id:'cables',          name:'Cables',                     desc:'Replaced galvanized steel lift cables with high-tensile construction rated to handle your door\'s full weight across thousands of cycles without stretching or fraying.' },
  { id:'rollers',         name:'Rollers',                    desc:'Installed 13-ball nylon rollers for quiet, smooth door travel. Significantly reduces noise and friction on every cycle.' },
  { id:'premium-rollers', name:'Premium Rollers',            desc:'Upgraded to sealed ball-bearing nylon rollers rated for 100,000+ cycles — the quietest, most durable roller upgrade available for residential systems.' },
  { id:'hinge',           name:'Hinge Replacement',          desc:'Replaced worn or cracked hinges with commercial-grade galvanized steel. Restores proper panel articulation and protects tracks from uneven stress.' },
  { id:'opener',          name:'Opener',                     desc:'Installed a code-compliant garage door opener with auto-reverse safety sensors, rolling-code encryption, and smart-home connectivity ready to go.' },
  { id:'sensors',         name:'Sensors',                    desc:'Realigned and tested photoelectric safety sensors. Door now reliably detects any obstruction and reverses — fully compliant and safe for your family.' },
  { id:'springs',         name:'Springs',                    desc:'Replaced torsion springs with high-cycle units rated for 25,000+ cycles, precisely calibrated to your door weight for effortless, balanced operation.' },
  { id:'remote',          name:'Remote',                     desc:'Programmed a rolling-code remote transmitter for secure, reliable access. Compatible with all major opener brands — works every time.' },
  { id:'tune-up',         name:'Free Tune Up',               desc:'Complimentary full-system service: all moving parts lubricated, hardware tightened, cables and springs inspected, and all safety features tested.' },
  { id:'adjustments',     name:'Free Adjustments',           desc:'Travel limits and force sensitivity adjusted at no charge — door now opens, closes, and stops with precision every single time.' },
  { id:'drums-retension', name:'Drums Re-Tension',           desc:'Cable drums re-tensioned to eliminate uneven lifting and restore balanced travel on both sides. Eliminates drifting and protects the opener from overload.' },
  { id:'spring-retension',name:'Spring Re-Tension',          desc:'Torsion spring tension precisely adjusted to restore full door balance — reducing motor strain, extending opener life, and ensuring smooth daily operation.' },
  { id:'installation',    name:'Garage System Installation', desc:'Complete new garage door system installed: panels assembled, springs and cables rigged, opener mounted, sensors aligned, and all safety features verified and tested.' },
];

function renderItemsTab() {
  const grid  = document.getElementById('itemsGrid');
  if (!grid) return;
  const items = getAllItems();

  if (!items.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px 20px;' +
                     'font-size:14px;color:rgba(255,255,255,0.3);">No items yet — add some in Settings.</div>';
    return;
  }

  grid.innerHTML = items.map(function(item) {
    return '<div class="item-card" data-item="' + item.id + '">' +
           '<div class="item-card-body"><div class="item-name">' + item.name + '</div></div>' +
           '<div class="item-card-actions">' +
           '<button class="item-action-btn" data-item-edit="' + item.id + '">Edit</button>' +
           '<button class="item-action-btn item-del" data-item-del="' + item.id + '">Delete</button>' +
           '</div></div>';
  }).join('');

  // Tap card body → copy description
  grid.querySelectorAll('.item-card-body').forEach(function(body) {
    body.addEventListener('click', function() {
      const id   = body.closest('.item-card').getAttribute('data-item');
      const item = getAllItems().find(function(i) { return i.id === id; });
      if (!item) return;
      navigator.clipboard.writeText(item.desc).then(
        function() {
          toast('✓ Copied: ' + item.name);
          const card = body.closest('.item-card');
          card.classList.add('item-card--flash');
          setTimeout(function() { card.classList.remove('item-card--flash'); }, 500);
        },
        function() { toast('Copy failed', '#f97316'); }
      );
    });
  });

  // Edit button → open edit modal
  grid.querySelectorAll('[data-item-edit]').forEach(function(btn) {
    btn.addEventListener('click', function(ev) {
      ev.stopPropagation();
      openItemEditModal(btn.getAttribute('data-item-edit'));
    });
  });

  // Delete button → confirm and remove
  grid.querySelectorAll('[data-item-del]').forEach(function(btn) {
    btn.addEventListener('click', function(ev) {
      ev.stopPropagation();
      const id = btn.getAttribute('data-item-del');
      if (confirm('Delete this item?')) {
        saveAllItems(getAllItems().filter(function(i) { return i.id !== id; }));
        renderItemsTab();
        toast('Item deleted', '#f87171');
      }
    });
  });
}

function openItemEditModal(id) {
  const items = getAllItems();
  const item  = items.find(function(i) { return i.id === id; });
  if (!item) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.65);' +
    'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);' +
    'display:flex;align-items:flex-end;justify-content:center;';
  overlay.innerHTML =
    '<div style="background:#111827;border-radius:24px 24px 0 0;padding:28px 24px 44px;' +
    'width:100%;max-width:480px;border-top:1px solid rgba(255,255,255,0.1);animation:slideUp 0.3s ease;">' +
    '<div style="width:40px;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;margin:0 auto 22px;"></div>' +
    '<div style="font-size:18px;font-weight:800;margin-bottom:20px;">Edit Item</div>' +
    '<label class="label-sm">Name</label>' +
    '<input type="text" id="editItemName" value="' + item.name.replace(/"/g,'&quot;') + '" style="margin-bottom:12px;">' +
    '<label class="label-sm">Description</label>' +
    '<textarea id="editItemDesc" rows="4" style="font-size:13px;line-height:1.6;margin-bottom:18px;">' +
    item.desc.replace(/</g,'&lt;') + '</textarea>' +
    '<div style="display:flex;gap:10px;">' +
    '<button id="editItemSave" class="btn-primary" style="flex:1;">✓ Save</button>' +
    '<button id="editItemCancel" class="btn-sm" style="flex:1;padding:16px;">Cancel</button>' +
    '</div></div>';

  document.body.appendChild(overlay);

  overlay.querySelector('#editItemSave').addEventListener('click', function() {
    const name = overlay.querySelector('#editItemName').value.trim();
    const desc = overlay.querySelector('#editItemDesc').value.trim();
    if (!name) { toast('Enter a name', '#f97316'); return; }
    if (!desc) { toast('Enter a description', '#f97316'); return; }
    const all  = getAllItems();
    const found = all.find(function(i) { return i.id === id; });
    if (found) { found.name = name; found.desc = desc; }
    saveAllItems(all);
    document.body.removeChild(overlay);
    renderItemsTab();
    toast('✓ Saved');
  });

  overlay.querySelector('#editItemCancel').addEventListener('click', function() {
    document.body.removeChild(overlay);
  });
  overlay.addEventListener('click', function(ev) {
    if (ev.target === overlay) document.body.removeChild(overlay);
  });
}
