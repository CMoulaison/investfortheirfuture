(function(){
  const MOUNT_ID="oga-calculator",COMP_URL="/site/components/calculator.html";
  function qs(r,s){return r.querySelector(s)}
  function num(v,f=0){const n=parseFloat(String(v).replace(/,/g,"").trim());return Number.isFinite(n)?n:f}
  function money(n){const sign=n<0?"-":"";const v=Math.abs(n);return `${sign}$${v.toLocaleString(undefined,{maximumFractionDigits:2,minimumFractionDigits:2})}`}
  function weeks(y){return Math.round(y*52)}
  function fvWeekly(pmt,years,annRate,seed=0,yearCap=null){
    const r=annRate/52; const n=weeks(years); let bal=seed,contrib=seed;
    for(let i=1;i<=n;i++){const y=Math.floor((i-1)/52); const maxToDate=yearCap===null?Infinity:(y+1)*yearCap; if((contrib-seed)<maxToDate){bal+=pmt;contrib+=pmt;} bal*=(1+r);}
    return {fv:bal,contrib,growth:bal-contrib,periods:n};
  }
  async function mount(){const host=document.getElementById(MOUNT_ID); if(!host) return; try{const res=await fetch(COMP_URL,{cache:"no-store"}); host.innerHTML=await res.text(); attach(host);}catch(e){host.innerHTML="<p>Calculator failed to load.</p>";}}
  function attach(root){
    const form=qs(root,"#oga-calc-form");
    const wEl=qs(form,"#weekly"), rEl=qs(form,"#rate"), seed=qs(form,"#seed"), cap=qs(form,"#cap");
    const a18=qs(root,"#age18-value"), c18=qs(root,"#age18-contrib"), g18=qs(root,"#age18-growth");
    const a60=qs(root,"#age60-value"), c60=qs(root,"#age60-contrib"), g60=qs(root,"#age60-growth");
    const note=qs(root,"#summary-totals");
    function render(){
      const w=num(wEl.value,50), r=num(rEl.value,7)/100, s=seed.checked?1000:0, yearly=cap.checked?5000:null;
      const r18=fvWeekly(w,18,r,s,yearly), r60=fvWeekly(w,60,r,s,yearly);
      a18.textContent=money(r18.fv); c18.textContent=money(r18.contrib); g18.textContent=money(r18.growth);
      a60.textContent=money(r60.fv); c60.textContent=money(r60.contrib); g60.textContent=money(r60.growth);
      note.textContent=`Weekly deposits at ${num(rEl.value)}% (weekly compounding). Seed ${seed.checked?"on":"off"}; cap ${cap.checked?"on":"off"}. Growth is tax-deferred.`;
    }
    form.addEventListener("input",render); render();
    qs(root,"#btn-reset").addEventListener("click",e=>{e.preventDefault(); wEl.value="50"; rEl.value="7"; seed.checked=false; cap.checked=false; render();});
    qs(root,"#btn-copy").addEventListener("click",async e=>{e.preventDefault(); try{await navigator.clipboard.writeText(location.href); e.target.textContent="Copied"; setTimeout(()=>e.target.textContent="Copy link",1200);}catch{e.target.textContent="Copy failed"; setTimeout(()=>e.target.textContent="Copy link",1200);}});
    qs(root,"#btn-csv").addEventListener("click",e=>{
      e.preventDefault();
      const w=num(wEl.value,50), r=num(rEl.value,7)/100, s=seed.checked?1000:0, yearly=cap.checked?5000:null;
      const r18=fvWeekly(w,18,r,s,yearly), r60=fvWeekly(w,60,r,s,yearly);
      const rows=[["NestFund OGA Calculator"],
      ["Weekly Contribution",w],["Annual Return (%)",num(rEl.value,7)],["$1,000 Seed",seed.checked?"Yes":"No"],["$5,000/yr Cap",cap.checked?"Yes":"No"],[],
      ["Target Age","Years","Total Contributions","Projected Value","Growth"],
      ["18",18,r18.contrib.toFixed(2),r18.fv.toFixed(2),r18.growth.toFixed(2)],
      ["60",60,r60.contrib.toFixed(2),r60.fv.toFixed(2),r60.growth.toFixed(2)],
      [],["Notes","Growth is tax-deferred. Taxes apply at withdrawal."]];
      const csv=rows.map(r=>r.map(s=>{s=String(s); return (',' in s or '"' in s)? '"'+s.replace(/"/g,'""')+'"':s}).join(",")).join("\r\n");
      const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="nestfund_oga_calculator.csv"; document.body.appendChild(a); a.click(); setTimeout(()=>{document.body.removeChild(a); URL.revokeObjectURL(url);},0);
    });
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",mount); else mount();
})();