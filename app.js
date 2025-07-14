/* app.js - patch for focus select and form reset */
(() => {
  const BASIC_LIMIT_LOW = 3000000;
  const BASIC_LIMIT_HIGH = 2500000;
  const EXTRA_LIMIT_LOW = 3000000;
  const EXTRA_LIMIT_HIGH = 2000000;
  const RATES = { credit:0.15, check:0.3, cash:0.3, market:0.5, transport:0.8, culture:0.4 };

  const form = document.getElementById('calcForm');
  const calcBtn = document.getElementById('calcBtn');
  const resultSection = document.getElementById('result');
  const resultBottomAd = document.getElementById('result-bottom-ad');
  const basicDedEl = document.getElementById('basicDed');
  const extraDedEl = document.getElementById('extraDed');
  const totalDedEl = document.getElementById('totalDed');
  const tbody = document.querySelector('#breakdownTable tbody');
  const formatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });

  // Reset form on load to avoid persisted values
  window.addEventListener('load', () => {
    form.reset();
    hideResults();
  });

  // 숫자를 콤마 형식으로 변환
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // 콤마가 포함된 문자열을 숫자로 변환
  function parseNumber(str) {
    if (!str) return 0;
    const cleaned = str.replace(/[^\d]/g, '');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
  }

  // 입력 필드에 콤마 포맷 적용
  function formatCurrencyInput(input) {
    const value = parseNumber(input.value);
    if (value === 0) {
      input.value = '';
    } else {
      input.value = formatNumber(value);
    }
  }

  // 모든 currency-input 필드에 이벤트 리스너 추가
  const currencyInputs = document.querySelectorAll('.currency-input');
  currencyInputs.forEach(input => {
    // 입력 중 실시간 포맷팅
    input.addEventListener('input', (e) => {
      formatCurrencyInput(e.target);
    });

    // 포커스 시 전체 선택
    input.addEventListener('focus', (e) => {
      e.target.select();
    });

    // 포커스 아웃 시 포맷팅
    input.addEventListener('blur', (e) => {
      formatCurrencyInput(e.target);
    });
  });

  function getVal(id){
    const element = document.getElementById(id);
    const value = parseNumber(element.value);
    return value < 0 ? 0 : value;
  }

  function format(n){ return `${formatter.format(n)}원`; }

  function hideResults(){
    resultSection.classList.add('hidden');
    resultSection.classList.remove('visible');
    resultBottomAd.classList.add('hidden');
    resultBottomAd.classList.remove('visible');
  }
  
  function showResults(){
    resultSection.classList.remove('hidden');
    void resultSection.offsetWidth;
    resultSection.classList.add('visible');
    
    resultBottomAd.classList.remove('hidden');
    void resultBottomAd.offsetWidth;
    resultBottomAd.classList.add('visible');
  }

  function consume(spend, rem){
    if(rem.val >= spend){ rem.val -= spend; return 0; }
    const eligible = spend - rem.val; rem.val = 0; return eligible;
  }

  function calculate(){
    const salary = getVal('totalSalary');
    if(!salary){ alert('총급여액을 입력하세요'); return; }
    const credit = getVal('creditGen');
    const check = getVal('checkGen');
    const cash  = getVal('cashGen');
    const market = getVal('marketSpend');
    const transport = getVal('transportSpend');
    const culture = getVal('cultureSpend');

    const remaining = { val: salary * 0.25 };
    const eligibleCredit = consume(credit, remaining);
    const eligibleCheck  = consume(check, remaining);
    const eligibleCash   = consume(cash, remaining);

    const eligibleMarket = market;
    const eligibleTransport = transport;
    const eligibleCulture = culture;

    let basicDed = eligibleCredit*RATES.credit + eligibleCheck*RATES.check + eligibleCash*RATES.cash;
    let extraDed = eligibleMarket*RATES.market + eligibleTransport*RATES.transport + eligibleCulture*RATES.culture;

    const low = salary <= 70000000;
    basicDed = Math.min(basicDed, low ? BASIC_LIMIT_LOW : BASIC_LIMIT_HIGH);
    extraDed = Math.min(extraDed, low ? EXTRA_LIMIT_LOW : EXTRA_LIMIT_HIGH);

    basicDedEl.textContent = format(basicDed);
    extraDedEl.textContent = format(extraDed);
    totalDedEl.textContent = format(basicDed + extraDed);

    tbody.innerHTML = '';
    const data = [
      {lbl:'신용카드 일반', spend:credit, elig:eligibleCredit, rate:RATES.credit},
      {lbl:'체크카드 일반', spend:check, elig:eligibleCheck, rate:RATES.check},
      {lbl:'현금영수증 일반', spend:cash, elig:eligibleCash, rate:RATES.cash},
      {lbl:'전통시장', spend:market, elig:eligibleMarket, rate:RATES.market},
      {lbl:'대중교통', spend:transport, elig:eligibleTransport, rate:RATES.transport},
      {lbl:'문화비', spend:culture, elig:eligibleCulture, rate:RATES.culture},
    ];
    data.forEach(d=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td class="py-6">${d.lbl}</td><td class="py-6 text-right">${format(d.spend)}</td><td class="py-6 text-right">${format(d.elig)}</td><td class="py-6 text-right">${format(d.elig*d.rate)}</td>`;
      tbody.appendChild(tr);
    });

    showResults();
  }

  calcBtn.addEventListener('click', calculate);
  form.addEventListener('input', hideResults);
})();
