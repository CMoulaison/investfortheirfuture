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

  // Future value of weekly contributions (ordinary annuity, weekly compounding)
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

  function yearsUntil(targetAge, startAge) { return Math.max(0, targetAge - startAge); }

  function readStateFromURL() {
    const url = new URL(window.location.href);
    const weekly = toNumber(url.searchParams.get("weekly"), 50);
    const startAge = parseInt(url.searchParams.get("startAge") || "0", 10);
    const rate = toNumber(url.searchParams.get("rate"), 7);
    return { weekly, startAge: startAge === 1 ? 1 : 0, rate };
  }

  function writeStateToURL(state, replace = false) {
    const url = new URL(window.location.href);
    url.searchParams.set("weekly", String(state.weekly));
    url.searchParams.set("startAge", String(state.startAge));
    url.searchParams.set("rate", String(state.rate));
    const newUrl = url.toString();
    if (replace) history.replaceState(null, "", newUrl);
    else history.pushState(null, "", newUrl);
    return newUrl;
  }

  function attachHandlers(root) {
    const form = qs(root, "form#oga-calc-form");
    const inputs = {
      weekly: qs(form, "#weekly"),
      rate: qs(form, "#rate"),
    };
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
      const weekly = toNumber(inputs.weekly.value, 0);
      const startAge = parseInt(qs(form, "input[name='startAge']:checked").value, 10);
      const rate = toNumber(inputs.rate.value, 7);
      return { weekly, startAge, rate };
    }

    function setState(state, updateURL = true) {
      inputs.weekly.value = String(state.weekly);
      qsa(form, "input[name='startAge']").forEach(r => r.checked = (parseInt(r.value, 10) === state.startAge));
      inputs.rate.value = String(state.rate);
      if (updateURL) writeStateToURL(state, true);
      render();
    }

    function render() {
      const { weekly, startAge, rate } = getState();
      const annRate = rate / 100;

      const years18 = yearsUntil(18, startAge);
      const years60 = yearsUntil(60, startAge);

      const r18 = fvWeekly(weekly, years18, annRate);
      const r60 = fvWeekly(weekly, years60, annRate);

      output.age18Value.textContent = fmtCurrency(r18.fv);
      output.age18Contrib.textContent = fmtCurrency(r18.contrib);
      output.age18Growth.textContent = fmtCurrency(r18.growth);

      output.age60Value.textContent = fmtCurrency(r60.fv);
      output.age60Contrib.textContent = fmtCurrency(r60.contrib);
      output.age60Growth.textContent = fmtCurrency(r60.growth);

      output.summaryTotals.textContent =
        `Totals shown are based on weekly deposits, start age ${startAge}, and a ${rate}% annual return with weekly compounding. Growth is tax-deferred. Taxes apply at withdrawal.`;
    }

    // Listeners
    form.addEventListener("input", () => {
      writeStateToURL(getState(), true);
      render();
    });

    btns.reset.addEventListener("click", (e) => {
      e.preventDefault();
      setState({ weekly: 50, startAge: 0, rate: 7 });
    });

    btns.copy.addEventListener("click", async (e) => {
      e.preventDefault();
      const url = writeStateToURL(getState(), true);
      try {
        await navigator.clipboard.writeText(url);
        btns.copy.textContent = "Copied";
      } catch {
        btns.copy.textContent = "Copy failed";
      }
      setTimeout(() => btns.copy.textContent = "Copy link", 1200);
    });

    btns.csv.addEventListener("click", (e) => {
      e.preventDefault();
      downloadCSV();
    });

    function downloadCSV() {
      const { weekly, startAge, rate } = getState();
      const annRate = rate / 100;
      const years18 = yearsUntil(18, startAge);
      const years60 = yearsUntil(60, startAge);

      const r18 = fvWeekly(weekly, years18, annRate);
      const r60 = fvWeekly(weekly, years60, annRate);

      const rows = [
        ["NestFund OGA Calculator"],
        ["Weekly Contribution", weekly],
        ["Start Age", startAge],
        ["Annual Return (%)", rate],
        [],
        ["Target Age","Years","Total Contributions","Projected Value","Growth"],
        ["18", years18, r18.contrib.toFixed(2), r18.fv.toFixed(2), r18.growth.toFixed(2)],
        ["60", years60, r60.contrib.toFixed(2), r60.fv.toFixed(2), r60.growth.toFixed(2)],
        [],
        ["Notes","Growth is tax-deferred. Taxes apply at withdrawal."]
      ];

      const csv = rows.map(r => r.map(cell => {
        const s = String(cell ?? "");
        if (s.includes(",") || s.includes("\"")) return `"${s.replace(/"/g, '""')}"`;
        return s;
      }).join(",")).join("\r\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nestfund_oga_calculator.csv";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
    }

    // Initial render
    setState(readStateFromURL(), false);
  }

  async function mount() {
    const host = document.getElementById(MOUNT_ID);
    if (!host) return;
    try {
      const res = await fetch(COMPONENT_URL, { cache: "no-store" });
      const html = await res.text();
      host.innerHTML = html;
      attachHandlers(host);
    } catch (err) {
      host.innerHTML = "<p>Calculator failed to load. Please refresh.</p>";
      console.error(err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
