function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}
function save(entries) { localStorage.setItem(KEY, JSON.stringify(entries)); }
function addEntry(e)   { const a = load(); a.push(e); save(a); }
function removeEntry(id) { save(load().filter(e => e.id !== id)); }

function getPartsConfig() {
  try { return JSON.parse(localStorage.getItem(PARTS_CFG_KEY)) || {}; }
  catch { return {}; }
}
function savePartsConfig(cfg) { localStorage.setItem(PARTS_CFG_KEY, JSON.stringify(cfg)); }

const ALL_ITEMS_KEY = 'gp_all_items';

// Returns all items (preset defaults merged with user edits/additions).
// On first call, populates from the ITEMS constant defined in items.js.
function getAllItems() {
  try {
    const stored = JSON.parse(localStorage.getItem(ALL_ITEMS_KEY));
    if (stored && stored.length > 0) return stored;
  } catch {}
  // First run: seed from preset defaults
  const defaults = ITEMS.map(function(i) {
    return { id: i.id, name: i.name, desc: i.desc };
  });
  saveAllItems(defaults);
  return defaults;
}

function saveAllItems(items) {
  localStorage.setItem(ALL_ITEMS_KEY, JSON.stringify(items));
}
