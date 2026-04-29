function updateBanner() {
  const now     = new Date();
  const entries = load();
  const week    = entries.filter(e => inRange(e.date, weekStart(now), weekEnd(now)));
  const w       = agg(week);

  const highest = week.length ? Math.max(...week.map(e => +e.totalPrice || 0)) : 0;
  const avg     = w.jobs > 0 ? w.revenue / w.jobs : 0;

  document.getElementById('wRevenue').textContent     = f0(w.revenue);
  document.getElementById('wCommission').textContent  = f0(w.myCommission);
  document.getElementById('wCommParts').textContent   = f0(w.commPlusParts);
  document.getElementById('wJobs').textContent        = w.jobs;
  document.getElementById('wAvg').textContent         = f0(avg);
  document.getElementById('wHighest').textContent     = f0(highest);
  document.getElementById('wParts').textContent       = f0(w.parts);
  document.getElementById('wCC').textContent          = f0(w.cc);
  document.getElementById('wCheck').textContent       = f0(w.check);
  document.getElementById('wCash').textContent        = f0(w.cash);
  document.getElementById('wCompanyOwes').textContent = f0(w.companyOwesMe);
  document.getElementById('wIOwe').textContent        = f0(w.iOweCompany);

  const net = w.companyOwesMe - w.iOweCompany;
  const hdr = document.getElementById('hdrBalance');
  hdr.textContent = (net >= 0 ? '+' : '-') + f2(Math.abs(net));
  hdr.style.color = net >= 0 ? '#4ade80' : '#f87171';
}
