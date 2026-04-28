// Business rules:
//   Cash & Check go directly to me from the customer.
//   CC goes to the company.
//   My commission = (revenue - parts) × 30%.
//   My due        = commission + parts reimbursement.
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
    acc.jobs    += 1;
    return acc;
  }, { revenue:0, cc:0, check:0, cash:0, parts:0, tip:0, jobs:0 });

  a.myCommission  = (a.revenue - a.parts) * 0.30;
  const myDue     = a.myCommission + a.parts;
  const iGot      = a.check + a.cash;
  a.iOweCompany   = Math.max(0, iGot - myDue);
  a.companyOwesMe = Math.max(0, myDue - iGot);
  return a;
}
