
// NestFund OGA Calculator (vanilla JS)
(function () {
  const MOUNT_ID = "oga-calculator";
  const COMPONENT_URL = "/site/components/calculator.html";
  const qs = (root, sel) => root.querySelector(sel);
  const qsa = (root, sel) => Array.from(root.querySelectorAll(sel));

  function toNumber(value, fallback = 0) {
    const n = parseFloat(String(value).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : fallback;
  }
  function fmtCurrency(n) {
    const sign = n < 0 ? "-" : "";
    const val = Math.abs(n);
    return `${sign}$${val.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
  }
  function weeksForYears(years) { return Math.round(years * 52); }
  function fvWeekly(pmtWeekly, years, annualRate) {
    const r = annualRate / 52;
    const n = weeksForYears(years);
    if (r === 0) {
      const fv0 = pmtWeekly * n;
      return { fv: fv0, contrib: fv0, growth: 0, periods: n };
    }
    const fv = pmtWeekly * ((Math.pow(1 + r, n) - 1) / r);
    const contrib = pmtWeekly * n;
    const growth = fv - contrib;
    return { fv, contrib, growth, periods: n };
  }
  const yearsUntil = (targetAge, startAge) => Math.max(0, targetAge - startAge);

  function attachHandlers(root) {
    const form = qs(root, "form#oga-calc-form");
    const output = {
      age18Value: qs(root, "#age18-value"),
      age18Contrib: qs(root, "#age18-contrib"),
      age18Growth: qs(root, "#age18-growth"),
      age60Value: qs(root, "#age60-value"),
      age60Contrib: qs(root, "#age60-contrib"),
      age60Growth: qs(root, "#age60-growth"),
      summaryTotals: qs(root, "#summary-totals")
    };
    const btns = {
      reset: qs(root, "#btn-reset"),
      copy: qs(root, "#btn-copy"),
      csv: qs(root, "#btn-csv"),
    };

    function getState() {
      const weekly = toNumber(qs(form, "#weekly").value, 0);
      const startAge = parseInt(qs(form, "input[name='startAge']:checked").value, 10);
      const rate = toNumber(qs(form, "#rate").value, 7);
      return { weekly, startAge, rate };
    }
    function render() {
      const { weekly, startAge, rate } = getState();
      const annRate = rate / 100;
      const r18 = fvWeekly(weekly, yearsUntil(18, startAge), annRate);
      const r60 = fvWeekly(weekly, yearsUntil(60, startAge), annRate);
      output.age18Value.textContent = fmtCurrency(r18.fv);
      output.age18Contrib.textContent = fmtCurrency(r18.contrib);
      output.age18Growth.textContent = fmtCurrency(r18.growth);
      output.age60Value.textContent = fmtCurrency(r60.fv);
      output.age60Contrib.textContent = fmtCurrency(r60.contrib);
      output.age60Growth.textContent = fmtCurrency(r60.growth);
      output.summaryTotals.textContent = `Weekly deposits, start age ${startAge}, and a ${rate}% annual return with weekly compounding. Growth is tax‑deferred; taxes apply at withdrawal.`;
    }

    form.addEventListener("input", render);
    btns.reset.addEventListener("click", (e) => { e.preventDefault(); qs(form, "#weekly").value = 50; qs(form, "#rate").value = 7; qsa(form, "input[name='startAge']")[0].checked = true; render(); });
    btns.copy.addEventListener("click", async (e) => { e.preventDefault(); try { await navigator.clipboard.writeText(location.href); btns.copy.textContent = "Copied"; setTimeout(() => btns.copy.textContent = "Copy link", 1200);} catch { btns.copy.textContent = "Copy failed"; setTimeout(() => btns.copy.textContent = "Copy link", 1200);} });
    btns.csv.addEventListener("click", (e) => {
      e.preventDefault();
      const { weekly, startAge, rate } = getState();
      const annRate = rate / 100;
      const r18 = fvWeekly(weekly, yearsUntil(18, startAge), annRate);
      const r60 = fvWeekly(weekly, yearsUntil(60, startAge), annRate);
      const rows = [
        ["NestFund OGA Calculator"],
        ["Weekly Contribution", weekly],
        ["Start Age", startAge],
        ["Annual Return (%)", rate],
        [],
        ["Target Age","Years","Total Contributions","Projected Value","Growth"],
        ["18", yearsUntil(18, startAge), r18.contrib.toFixed(2), r18.fv.toFixed(2), r18.growth.toFixed(2)],
        ["60", yearsUntil(60, startAge), r60.contrib.toFixed(2), r60.fv.toFixed(2), r60.growth.toFixed(2)],
        [],
        ["Notes","Growth is tax‑deferred. Taxes apply at withdrawal."]
      ];
      const csv = rows.map(r => r.map(cell => {
        const s = String(cell ?? "");
        return (s.includes(",") || s.includes('"')) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(",")).join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "nestfund_oga_calculator.csv";
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
    });

    render();
  }

  async function mount() {
    const host = document.getElementById(MOUNT_ID);
    if (!host) return;
    try {
      const res = await fetch(COMPONENT_URL, { cache: "no-store" });
      host.innerHTML = await res.text();
      attachHandlers(host);
    } catch (err) {
      host.innerHTML = "<p>Calculator failed to load. Please refresh.</p>";
      console.error(err);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
