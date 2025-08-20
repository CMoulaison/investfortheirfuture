
(function(){
  const qs=(r,s)=>r.querySelector(s), qsa=(r,s)=>Array.from(r.querySelectorAll(s));
  const toNumber=(v,f=0)=>{const n=parseFloat(String(v).replace(/,/g,"").trim());return Number.isFinite(n)?n:f}
  const fmt=n=>{const sign=n<0?"-":"";const v=Math.abs(n);return `${sign}$${v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}
  const weeks=y=>Math.round(y*52);
  const fvWeekly=(pmt,years,annRate)=>{const r=annRate/52;const n=weeks(years);if(r===0){const fv0=pmt*n;return {fv:fv0,contrib:fv0,growth:0,periods:n}}const fv=pmt*((Math.pow(1+r,n)-1)/r);const contrib=pmt*n;return {fv,contrib,growth:fv-contrib,periods:n}};
  const yearsUntil=(target,start)=>Math.max(0,target-start);
  function attach(root){
    const form=qs(root,"#oga-calc-form");
    const out={a18:qs(root,"#age18-value"),a18c:qs(root,"#age18-contrib"),a18g:qs(root,"#age18-growth"),a60:qs(root,"#age60-value"),a60c:qs(root,"#age60-contrib"),a60g:qs(root,"#age60-growth"),sum:qs(root,"#summary-totals")};
    function state(){return{weekly:toNumber(qs(form,"#weekly").value,50),startAge:parseInt(qs(form,"input[name='startAge']:checked").value,10),rate:toNumber(qs(form,"#rate").value,7)}}
    function render(){const s=state();const r18=fvWeekly(s.weekly,yearsUntil(18,s.startAge),s.rate/100);const r60=fvWeekly(s.weekly,yearsUntil(60,s.startAge),s.rate/100);out.a18.textContent=fmt(r18.fv);out.a18c.textContent=fmt(r18.contrib);out.a18g.textContent=fmt(r18.growth);out.a60.textContent=fmt(r60.fv);out.a60c.textContent=fmt(r60.contrib);out.a60g.textContent=fmt(r60.growth);out.sum.textContent=`Based on weekly deposits, start age ${s.startAge}, and ${s.rate}% annual return with weekly compounding. Growth is tax deferred.`}
    form.addEventListener("input",render);
    qs(form,"#btn-reset").addEventListener("click",()=>{qs(form,"#weekly").value=50;qs(form,"#rate").value=7;qsa(form,"input[name='startAge']")[0].checked=true;render()});
    qs(form,"#btn-copy").addEventListener("click",async()=>{await navigator.clipboard.writeText(location.href)});
    qs(form,"#btn-csv").addEventListener("click",()=>{const s=state();const r18=fvWeekly(s.weekly,yearsUntil(18,s.startAge),s.rate/100);const r60=fvWeekly(s.weekly,yearsUntil(60,s.startAge),s.rate/100);const rows=[["Weekly",s.weekly],["StartAge",s.startAge],["Return",s.rate],[],["Age","Years","Contrib","Value","Growth"],["18",yearsUntil(18,s.startAge),r18.contrib.toFixed(2),r18.fv.toFixed(2),r18.growth.toFixed(2)],["60",yearsUntil(60,s.startAge),r60.contrib.toFixed(2),r60.fv.toFixed(2),r60.growth.toFixed(2)]];const csv=rows.map(r=>r.join(",")).join("\r\n");const blob=new Blob([csv],{type:"text/csv"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="nestfund_oga_calculator.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),0)});
    render();
  }
  async function mount(){const host=document.getElementById("oga-calculator");if(!host)return;const res=await fetch("/site/components/calculator.html",{cache:"no-store"});host.innerHTML=await res.text();attach(host)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
