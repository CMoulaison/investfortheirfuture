(function(){
  const MOUNT_ID="oga-calculator",COMP_URL="/site/components/calculator.html";
  function qs(r,s){return r.querySelector(s)}
  function num(v,f=0){const n=parseFloat(String(v).replace(/,/g,"").trim());return Number.isFinite(n)?n:f}
  function money(n){const sign=n<0?"-":"";const v=Math.abs(n);return `${sign}$${v.toLocaleString(undefined,{maximumFractionDigits:2,minimumFractionDigits:2})}`}
  function fvWeekly(pmt,years,annRate,seed=0,cap=Infinity){
    const r=annRate/52; let bal=seed,contrib=seed; const weeks=Math.round(years*52);
    for(let i=1;i<=weeks;i++){const year=Math.floor((i-1)/52); const yMax=(year+1)*cap;
      if(contrib < yMax){bal+=pmt; contrib+=pmt;} bal*=(1+r);}
    return {fv:bal,contrib,growth:bal-contrib}
  }
  async function mount(){const host=document.getElementById(MOUNT_ID); if(!host) return;
    const res=await fetch(COMP_URL,{cache:"no-store"}); host.innerHTML=await res.text(); attach(host);}
  function attach(root){
    const w=qs(root,"#weekly"), r=qs(root,"#rate"), s=qs(root,"#seed"), c=qs(root,"#cap");
    const v18=qs(root,"#age18-value"), k18=qs(root,"#age18-contrib"), g18=qs(root,"#age18-growth");
    const v60=qs(root,"#age60-value"), k60=qs(root,"#age60-contrib"), g60=qs(root,"#age60-growth");
    const note=qs(root,"#summary-totals");
    function render(){
      const W=num(w.value,50), R=num(r.value,7)/100, S=s.checked?1000:0, CAP=c.checked?5000:1e12;
      const a=fvWeekly(W,18,R,S,CAP), b=fvWeekly(W,60,R,S,CAP);
      v18.textContent=money(a.fv); k18.textContent=money(a.contrib); g18.textContent=money(a.growth);
      v60.textContent=money(b.fv); k60.textContent=money(b.contrib); g60.textContent=money(b.growth);
      note.textContent=`Weekly deposits at ${num(r.value,7)}% (weekly compounding). Seed ${s.checked?"on":"off"}; cap ${c.checked?"on":"off"}. Growth is tax-deferred.`;
    }
    root.addEventListener("input",render); render();
    qs(root,"#btn-reset").addEventListener("click",e=>{e.preventDefault(); w.value="50"; r.value="7"; s.checked=false; c.checked=false; render();});
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",mount); else mount();
})();