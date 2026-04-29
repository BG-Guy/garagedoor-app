// ── Settlement formula ───────────────────────────────────────
//
//  1. CC fee       = paidCC × 4%          (processor takes 4% of card payments)
//  2. Net revenue  = T price − CC fee
//  3. Commission   = (net revenue − parts) × 30%
//  4. CC tip       = tip when paid by CC (company collects & owes back to me)
//  5. Cash tip     = mine already, not in settlement
//  6. My due       = commission + parts + CC tip
//  7. I collected  = cash + check  (goes directly to me)
//  8. I owe co.    = max(0, collected − my due)
//  9. Co. owes me  = max(0, my due  − collected)
//
function agg(entries) {
  const a = entries.filter(e => !e.disputed).reduce((acc, e) => {
    const cc    = +e.paidCC     || 0;
    acc.revenue += +e.totalPrice || 0;
    acc.cc      += cc;
    acc.check   += +e.paidCheck  || 0;
    acc.cash    += +e.paidCash   || 0;
    acc.parts   += +e.totalParts || 0;
    acc.tip     += +e.tip        || 0;
    acc.ccFee   += cc * 0.04;
    acc.ccTip   += cc > 0 ? (+e.tip || 0) : 0;
    acc.jobs    += 1;
    return acc;
  }, { revenue:0, cc:0, check:0, cash:0, parts:0, tip:0, ccFee:0, ccTip:0, jobs:0 });

  a.netRevenue    = a.revenue - a.ccFee;
  a.myCommission  = (a.netRevenue - a.parts) * 0.30;
  a.commPlusParts = a.myCommission + a.parts;
  const myDue     = a.commPlusParts + a.ccTip;
  const iGot      = a.check + a.cash;
  a.iOweCompany   = Math.max(0, iGot - myDue);
  a.companyOwesMe = Math.max(0, myDue - iGot);
  return a;
}
