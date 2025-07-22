
function calculate() {
  const weekly = parseFloat(document.getElementById('weekly').value);
  const age = parseInt(document.getElementById('age').value);
  const yearsTo18 = 18 - age;
  const yearsTo30 = 30 - age;
  const annualRate = 0.07;
  const weeklyToAnnual = weekly * 52;

  function futureValue(PMT, r, n) {
    return PMT * ((Math.pow(1 + r, n) - 1) / r);
  }

  const fv18 = futureValue(weeklyToAnnual, annualRate, yearsTo18);
  const fv30 = futureValue(weeklyToAnnual, annualRate, yearsTo30);

  document.getElementById('results').innerHTML = 
    `<p>At age 18: $${fv18.toFixed(2)}</p>
     <p>At age 30: $${fv30.toFixed(2)}</p>`;
}
