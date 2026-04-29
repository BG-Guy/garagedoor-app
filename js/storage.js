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

const ITEM_DESCS_KEY    = 'gp_item_descs';
const CUSTOM_ITEMS_KEY  = 'gp_custom_items';

function getItemDescs() {
  try { return JSON.parse(localStorage.getItem(ITEM_DESCS_KEY)) || {}; }
  catch { return {}; }
}
function saveItemDescs(d) { localStorage.setItem(ITEM_DESCS_KEY, JSON.stringify(d)); }

function getCustomItems() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_ITEMS_KEY)) || []; }
  catch { return []; }
}
function saveCustomItems(items) { localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(items)); }
