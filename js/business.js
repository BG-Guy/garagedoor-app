// Business rules:
//   Cash & Check go directly to me from the customer.
//   CC goes to the company — company then owes me my full cut.
//   My commission = (revenue - parts) × 30%  (parts reduce the commission base).
//   Company reimburses parts cost on top of commission.
//   Tips via CC: company collects them and owes them back to me.
//   Tips via cash: already in my hand — not part of the settlement.
//   My due        = commission + parts + CC tips.
//   iOweCompany   = max(0, cash+check collected - my due).
//   companyOwesMe = max(0, my due - cash+check collected).
function agg(entries) {
  const a = entries.filter(e => !e.disputed).reduce((acc, e) => {
    acc.revenue += +e.totalPrice || 0;
    acc.cc      += +e.paidCC     || 0;
    acc.check   += +e.paidCheck  || 0;
    acc.cash    += +e.paidCash   || 0;
    acc.parts   += +e.totalParts || 0;
    acc.tip     += +e.tip        || 0;
    acc.ccTip   += (+e.paidCC > 0) ? (+e.tip || 0) : 0;
    acc.jobs    += 1;
    return acc;
  }, { revenue:0, cc:0, check:0, cash:0, parts:0, tip:0, ccTip:0, jobs:0 });

  a.myCommission  = (a.revenue - a.parts) * 0.30;
  const myDue     = a.myCommission + a.parts + a.ccTip;
  const iGot      = a.check + a.cash;
  a.iOweCompany   = Math.max(0, iGot - myDue);
  a.companyOwesMe = Math.max(0, myDue - iGot);
  return a;
}
