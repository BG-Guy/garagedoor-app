function switchTab(t) {
  ['new','dashboard','history','parts'].forEach(id => {
    document.getElementById('tab-' + id).classList.toggle('active', id === t);
    document.getElementById('nav-' + id).classList.toggle('active', id === t);
  });
  if (t === 'dashboard') renderDashboard();
  if (t === 'history')   renderHistory();
  if (t === 'parts')     renderPartsTab();
}
