function switchTab(t) {
  ['new','dashboard','history','settings','items'].forEach(id => {
    document.getElementById('tab-' + id).classList.toggle('active', id === t);
    document.getElementById('nav-' + id).classList.toggle('active', id === t);
  });
  if (t === 'dashboard') renderDashboard();
  if (t === 'history')   renderHistory();
  if (t === 'settings')  renderSettingsTab();
  if (t === 'items')     renderItemsTab();
}
