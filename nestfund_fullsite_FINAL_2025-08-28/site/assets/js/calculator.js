// NestFund calculator: quick projections for elements with [data-calc]
(function(){
  function fv(pmtMonthly, annualRate, months){
    const r = annualRate/12;
    if(r===0) return pmtMonthly*months;
    return pmtMonthly*((Math.pow(1+r, months)-1)/r);
  }
  function render(){
    document.querySelectorAll('[data-calc]').forEach(function(el){
      const m = parseFloat(el.getAttribute('data-monthly')||'100');
      const years = parseInt(el.getAttribute('data-years')||'18',10);
      const rate = parseFloat(el.getAttribute('data-rate')||'0.07');
      const val = fv(m, rate, years*12);
      el.textContent = '$'+Math.round(val).toLocaleString();
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',render);
  else render();
})();
