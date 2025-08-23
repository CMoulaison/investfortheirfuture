
(function(){
  function fmt(n){ return n.toLocaleString(undefined, {style:'currency', currency:'USD'}); }
  const form = document.getElementById('oga-calc-form');
  if(!form) return;

  const weeklyEl = form.querySelector('#weekly');
  const rateEl = form.querySelector('#rate');
  const startAgeEls = form.querySelectorAll('input[name="startAge"]');

  const v18 = form.querySelector('#age18-value');
  const c18 = form.querySelector('#age18-contrib');
  const g18 = form.querySelector('#age18-growth');

  const v60 = form.querySelector('#age60-value');
  const c60 = form.querySelector('#age60-contrib');
  const g60 = form.querySelector('#age60-growth');

  const summary = form.querySelector('#summary-totals');
  const btnReset = form.querySelector('#btn-reset');
  const btnCsv = form.querySelector('#btn-csv');

  function compute(weekly, startAge, annualRate){
    // weekly contributions, weekly compounding
    const weeksPerYear = 52;
    const r = (annualRate/100)/weeksPerYear;
    const fromBirth = startAge === 0;
    const weeks18 = (18 - (fromBirth?0:1)) * weeksPerYear;
    const weeks60 = (60 - (fromBirth?0:1)) * weeksPerYear;

    function series(weeks){
      let value = 0, contrib = 0;
      for(let i=0;i<weeks;i++){
        value = value * (1+r) + weekly; // end-of-week deposit
        contrib += weekly;
      }
      return { value, contrib, growth: value - contrib };
    }

    return { a18: series(weeks18), a60: series(weeks60) };
  }

  function update(){
    const weekly = parseFloat(weeklyEl.value || '0');
    const rate = parseFloat(rateEl.value || '0');
    const startAge = Array.from(startAgeEls).find(r => r.checked)?.value === '1' ? 1 : 0;

    const out = compute(weekly, startAge, rate);
    v18.textContent = fmt(out.a18.value);
    c18.textContent = fmt(out.a18.contrib);
    g18.textContent = fmt(out.a18.growth);
    v60.textContent = fmt(out.a60.value);
    c60.textContent = fmt(out.a60.contrib);
    g60.textContent = fmt(out.a60.growth);
    summary.textContent = `Totals assume weekly compounding and end‑of‑week deposits. Growth in OGAs is tax‑deferred.`;
  }

  function toCSV(){
    const weekly = parseFloat(weeklyEl.value || '0');
    const rate = parseFloat(rateEl.value || '0');
    const startAge = Array.from(startAgeEls).find(r => r.checked)?.value === '1' ? 1 : 0;
    const weeksPerYear = 52;
    const r = (rate/100)/weeksPerYear;
    const start = startAge===0?0:1;
    let value = 0, contrib = 0;
    let rows = [["Age","Year","Contributions","Value","Growth"]];
    for(let age=start; age<=60; age++){
      for(let w=0; w<weeksPerYear; w++){
        value = value*(1+r) + weekly;
        contrib += weekly;
      }
      rows.push([age, (new Date().getFullYear()+age-start), contrib.toFixed(2), value.toFixed(2), (value-contrib).toFixed(2)]);
    }
    const csv = rows.map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "oga-projection.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  weeklyEl.addEventListener('input', update);
  rateEl.addEventListener('input', update);
  startAgeEls.forEach(r => r.addEventListener('change', update));
  btnReset.addEventListener('click', ()=>{
    weeklyEl.value = 50; rateEl.value = 7; startAgeEls[0].checked = true; update();
  });
  btnCsv.addEventListener('click', toCSV);
  update();
})();
