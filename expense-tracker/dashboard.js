// Dashboard logic (expenses, income, savings, loans) using localStorage
(function(){
  // Redirect to login if not logged in
  if(!localStorage.getItem('loggedIn') || !localStorage.getItem('user')){
    window.location.href = 'index.html';
    return;
  }

  // load user
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  document.getElementById('welcomeUser').innerText = 'Hi, ' + (user.name || 'User');

  // Logout
  document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('loggedIn');
    window.location.href = 'index.html';
  };

  // Initialize data structure if not present
  const defaultData = {
    income: [],
    expenses: [],
    savings: [],
    loans: [], // each loan: {type:'given'|'taken', person, date, price, checked}
    categories: { income: ['Salary'], expenses: ['Food','Transport','Shopping'], savings: [], loans: [] }
  };
  const dataKey = 'expenseData_v1';
  let data = JSON.parse(localStorage.getItem(dataKey) || 'null') || defaultData;

  // Utility functions
  function saveData(){ localStorage.setItem(dataKey, JSON.stringify(data)); updateStats(); }
  function formatINR(n){ return '₹' + Number(n||0).toLocaleString('en-IN', {maximumFractionDigits:2}); }

  function calcTotal(type){
    if(type === 'loans'){
      return data.loans.reduce((s,it)=>s + (parseFloat(it.price)||0),0);
    }
    return data[type].reduce((s,it)=>s + (parseFloat(it.price)||0),0);
  }

  function updateStats(){
    const income = calcTotal('income');
    const expenses = calcTotal('expenses');
    const savings = calcTotal('savings');
    const loans = calcTotal('loans');
    document.getElementById('totalIncome').innerText = formatINR(income);
    document.getElementById('totalExpenses').innerText = formatINR(expenses);
    document.getElementById('totalSavings').innerText = formatINR(savings);
    document.getElementById('netWorth').innerText = formatINR(savings + income - expenses + loans);
    document.getElementById('currentMoney').innerText = formatINR(income - expenses + loans);
  }

  // Section controller
  window.openSection = function(section){
    const container = document.getElementById('sectionContent');
    if(section === 'overview'){
      container.innerHTML = '<div class="card"><h3>Overview</h3><p class="note">Use the left menu to add expenses, income, savings and loans. All data is saved locally in the browser.</p></div>';
    }

    if(section === 'expenses'){
      container.innerHTML = buildExpenseHTML();
      attachExpenseHandlers();
    }

    if(section === 'income'){
      container.innerHTML = buildIncomeHTML();
      attachIncomeHandlers();
    }

    if(section === 'savings'){
      container.innerHTML = buildSavingsHTML();
      attachSavingsHandlers();
    }

    if(section === 'loan'){
      container.innerHTML = buildLoanHTML();
      attachLoanHandlers();
    }
  };

  // --- HTML builders ---
  function todayStr(){ return new Date().toISOString().split('T')[0]; }

  function buildCategoryOptions(kind){
    const opts = data.categories[kind] || [];
    return opts.map(o => `<option value="${o}">${o}</option>`).join('');
  }

  function buildExpenseHTML(){
    return `
      <div class="card">
        <h3>Expenses</h3>
        <div class="controls">
          <form id="expenseForm">
            <input class="input" type="date" id="expDate" value="${todayStr()}" required>
            <input class="input" type="number" step="0.01" id="expPrice" placeholder="Price (₹)" required>
            <select id="expCategory" class="input">${buildCategoryOptions('expenses')}</select>
            <input class="input" id="newExpCategory" placeholder="Add category & press ➕">
            <input class="input" id="expDesc" placeholder="Description (optional)">
            <button class="btn" type="submit">Add Expense</button>
          </form>
        </div>

        <div class="controls">
          <label>Sort by:
            <select id="expSort" class="input">
              <option value="date_desc">Newest</option>
              <option value="date_asc">Oldest</option>
              <option value="price_desc">Price high→low</option>
              <option value="price_asc">Price low→high</option>
              <option value="category">Category</option>
            </select>
          </label>
        </div>

        <div id="expTotal" class="note">Total Expenses: ${formatINR(calcTotal('expenses'))}</div>
        <div id="expList" class="list"></div>
      </div>
    `;
  }

  function buildIncomeHTML(){
    return `
      <div class="card">
        <h3>Income</h3>
        <form id="incomeForm">
          <input class="input" type="date" id="incDate" value="${todayStr()}" required>
          <input class="input" type="number" step="0.01" id="incPrice" placeholder="Price (₹)" required>
          <select id="incCategory" class="input">${buildCategoryOptions('income')}</select>
          <input class="input" id="newIncCategory" placeholder="Add category & press ➕">
          <input class="input" id="incDesc" placeholder="Description (optional)">
          <button class="btn" type="submit">Add Income</button>
        </form>

        <div class="controls">
          <label>Sort:
            <select id="incSort" class="input">
              <option value="date_desc">Newest</option>
              <option value="date_asc">Oldest</option>
              <option value="price_desc">Price high→low</option>
              <option value="price_asc">Price low→high</option>
            </select>
          </label>
        </div>

        <div id="incTotal" class="note">Total Income: ${formatINR(calcTotal('income'))}</div>
        <div id="incList" class="list"></div>
      </div>
    `;
  }

  function buildSavingsHTML(){
    return `
      <div class="card">
        <h3>Savings</h3>
        <form id="savingsForm">
          <input class="input" type="date" id="savDate" value="${todayStr()}" required>
          <input class="input" type="number" step="0.01" id="savPrice" placeholder="Price (₹)" required>
          <select id="savMode" class="input">
            <option value="add">Add to Net Worth</option>
            <option value="minus">Subtract from Net Worth</option>
          </select>
          <input class="input" id="savDesc" placeholder="Description (optional)">
          <button class="btn" type="submit">Save</button>
        </form>

        <div class="controls">
          <label>Sort:
            <select id="savSort" class="input">
              <option value="date_desc">Newest</option>
              <option value="date_asc">Oldest</option>
              <option value="price_desc">Price high→low</option>
              <option value="price_asc">Price low→high</option>
            </select>
          </label>
        </div>

        <div id="savTotal" class="note">Total Savings: ${formatINR(calcTotal('savings'))}</div>
        <div id="savList" class="list"></div>
      </div>
    `;
  }

  function buildLoanHTML(){
    return `
      <div class="card">
        <h3>Loans (Given / Taken)</h3>

        <div style="display:flex;gap:8px;margin-bottom:10px">
          <button id="loanGivenBtn" class="btn">Given</button>
          <button id="loanTakenBtn" class="btn" style="background:#94a3b8">Taken</button>
        </div>

        <form id="loanForm">
          <input class="input" type="date" id="loanDate" value="${todayStr()}" required>
          <input class="input" id="loanPerson" placeholder="Person" required>
          <input class="input" type="number" step="0.01" id="loanPrice" placeholder="Price (₹)" required>
          <label><input type="checkbox" id="loanChecked"> Mark as settled</label>
          <input class="input" id="loanDesc" placeholder="Description (optional)">
          <input class="input" id="newLoanCategory" placeholder="(optional) add loan tag not required">
          <button class="btn" type="submit">Add Loan</button>
        </form>

        <div class="controls">
          <label>Filter:
            <select id="loanFilter" class="input">
              <option value="all">All</option>
              <option value="given">Given</option>
              <option value="taken">Taken</option>
              <option value="settled">Settled</option>
              <option value="unsettled">Unsettled</option>
            </select>
          </label>
        </div>

        <div id="loanTotal" class="note">Total Loans: ${formatINR(calcTotal('loans'))}</div>
        <div id="loanList" class="list"></div>
      </div>
    `;
  }

  // --- Rendering lists ---
  function renderList(type, listElId, sortBy){
    const el = document.getElementById(listElId);
    if(!el) return;
    let arr = JSON.parse(JSON.stringify(data[type] || [])); // clone

    // sorting rules
    if(sortBy){
      if(sortBy === 'price_desc') arr.sort((a,b)=>b.price - a.price);
      else if(sortBy === 'price_asc') arr.sort((a,b)=>a.price - b.price);
      else if(sortBy === 'date_desc') arr.sort((a,b)=>new Date(b.date) - new Date(a.date));
      else if(sortBy === 'date_asc') arr.sort((a,b)=>new Date(a.date) - new Date(b.date));
      else if(sortBy === 'category') arr.sort((a,b)=> (a.category||'').localeCompare(b.category||''));
    }

    if(arr.length === 0){ el.innerHTML = '<small class="note">No records yet.</small>'; return; }

    el.innerHTML = arr.map((it, idx) => {
      if(type === 'loans'){
        return `
          <div class="list-item">
            <div class="item-left">
              <div>
                <div><strong>${it.type.toUpperCase()}</strong> — ${it.person} <span class="tag">${it.date}</span></div>
                <div class="note">${it.desc || ''}</div>
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:700">${formatINR(it.price)}</div>
              <div><label><input type="checkbox" data-loan-idx="${idx}" class="loan-check" ${it.checked ? 'checked' : ''}> settled</label></div>
              <div><button class="btn" data-loan-del="${idx}" style="margin-top:8px;background:#ef4444">Delete</button></div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="list-item">
            <div class="item-left">
              <div>
                <div><strong>${it.category || '-'}</strong> <span class="tag">${it.date}</span></div>
                <div class="note">${it.desc || ''}</div>
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:700">${formatINR(it.price)}</div>
              <div><button class="btn" data-del="${idx}" style="margin-top:8px;background:#ef4444">Delete</button></div>
            </div>
          </div>
        `;
      }
    }).join('');
  }

  // --- Handlers for each section ---
  function attachExpenseHandlers(){
    const form = document.getElementById('expenseForm');
    const list = document.getElementById('expList');
    const sortSel = document.getElementById('expSort');
    const newCatInput = document.getElementById('newExpCategory');

    // add new category when Enter or when user types and blurs
    newCatInput.addEventListener('keypress', (e)=> {
      if(e.key === 'Enter'){ e.preventDefault(); addCategory('expenses', newCatInput.value.trim()); newCatInput.value=''; rebuildExpenseCategory(); }
    });

    form.onsubmit = (e) => {
      e.preventDefault();
      const item = {
        date: document.getElementById('expDate').value,
        price: parseFloat(document.getElementById('expPrice').value) || 0,
        category: document.getElementById('expCategory').value || '',
        desc: document.getElementById('expDesc').value || ''
      };
      data.expenses.push(item);
      saveData();
      form.reset();
      document.getElementById('expDate').value = todayStr();
      document.getElementById('expCategory').value = data.categories.expenses[0] || '';
      document.getElementById('expTotal').innerText = 'Total Expenses: ' + formatINR(calcTotal('expenses'));
      renderList('expenses','expList', sortSel.value);
    };

    sortSel.onchange = ()=> renderList('expenses','expList', sortSel.value);

    // delete handler (event delegation)
    list.onclick = (ev) => {
      const del = ev.target.closest('[data-del]');
      if(del){
        const idx = parseInt(del.getAttribute('data-del'),10);
        data.expenses.splice(idx,1);
        saveData();
        renderList('expenses','expList', sortSel.value);
        document.getElementById('expTotal').innerText = 'Total Expenses: ' + formatINR(calcTotal('expenses'));
      }
    };

    // initial render
    rebuildExpenseCategory();
    renderList('expenses','expList', sortSel.value);
  }

  function rebuildExpenseCategory(){
    const sel = document.getElementById('expCategory');
    if(!sel) return;
    sel.innerHTML = buildCategoryOptions('expenses');
  }

  function attachIncomeHandlers(){
    const form = document.getElementById('incomeForm');
    const list = document.getElementById('incList');
    const sortSel = document.getElementById('incSort');
    const newCatInput = document.getElementById('newIncCategory');

    newCatInput.addEventListener('keypress', (e)=> {
      if(e.key === 'Enter'){ e.preventDefault(); addCategory('income', newCatInput.value.trim()); newCatInput.value=''; rebuildIncomeCategory(); }
    });

    form.onsubmit = (e) => {
      e.preventDefault();
      const item = {
        date: document.getElementById('incDate').value,
        price: parseFloat(document.getElementById('incPrice').value) || 0,
        category: document.getElementById('incCategory').value || '',
        desc: document.getElementById('incDesc').value || ''
      };
      data.income.push(item);
      saveData();
      form.reset();
      document.getElementById('incDate').value = todayStr();
      document.getElementById('incCategory').value = data.categories.income[0] || '';
      document.getElementById('incTotal').innerText = 'Total Income: ' + formatINR(calcTotal('income'));
      renderList('income','incList', sortSel.value);
    };

    sortSel.onchange = ()=> renderList('income','incList', sortSel.value);

    list.onclick = (ev) => {
      const del = ev.target.closest('[data-del]');
      if(del){
        const idx = parseInt(del.getAttribute('data-del'),10);
        data.income.splice(idx,1);
        saveData();
        renderList('income','incList', sortSel.value);
        document.getElementById('incTotal').innerText = 'Total Income: ' + formatINR(calcTotal('income'));
      }
    };

    rebuildIncomeCategory();
    renderList('income','incList', sortSel.value);
  }

  function rebuildIncomeCategory(){
    const sel = document.getElementById('incCategory');
    if(!sel) return;
    sel.innerHTML = buildCategoryOptions('income');
  }

  function attachSavingsHandlers(){
    const form = document.getElementById('savingsForm');
    const list = document.getElementById('savList');
    const sortSel = document.getElementById('savSort');

    form.onsubmit = (e) => {
      e.preventDefault();
      const price = parseFloat(document.getElementById('savPrice').value) || 0;
      const mode = document.getElementById('savMode').value;
      const storedPrice = mode === 'minus' ? -Math.abs(price) : Math.abs(price);
      const item = {
        date: document.getElementById('savDate').value,
        price: storedPrice,
        desc: document.getElementById('savDesc').value || ''
      };
      data.savings.push(item);
      saveData();
      form.reset();
      document.getElementById('savDate').value = todayStr();
      document.getElementById('savTotal').innerText = 'Total Savings: ' + formatINR(calcTotal('savings'));
      renderList('savings','savList', sortSel.value);
    };

    sortSel.onchange = ()=> renderList('savings','savList', sortSel.value);

    list.onclick = (ev) => {
      const del = ev.target.closest('[data-del]');
      if(del){
        const idx = parseInt(del.getAttribute('data-del'),10);
        data.savings.splice(idx,1);
        saveData();
        renderList('savings','savList', sortSel.value);
        document.getElementById('savTotal').innerText = 'Total Savings: ' + formatINR(calcTotal('savings'));
      }
    };

    renderList('savings','savList', sortSel.value);
  }

  function attachLoanHandlers(){
    const loanForm = document.getElementById('loanForm');
    const loanList = document.getElementById('loanList');
    const loanFilter = document.getElementById('loanFilter');
    const givenBtn = document.getElementById('loanGivenBtn');
    const takenBtn = document.getElementById('loanTakenBtn');
    let currentType = 'given';

    function refreshLoanList(){
      // apply filter
      const filter = loanFilter.value;
      let arr = data.loans.map((d,i)=> ({...d, __idx:i}));
      if(filter === 'given') arr = arr.filter(a=>a.type==='given');
      else if(filter === 'taken') arr = arr.filter(a=>a.type==='taken');
      else if(filter === 'settled') arr = arr.filter(a=>a.checked);
      else if(filter === 'unsettled') arr = arr.filter(a=>!a.checked);

      if(arr.length === 0){ loanList.innerHTML = '<small class="note">No loans yet.</small>'; return; }

      loanList.innerHTML = arr.map(it => `
        <div class="list-item">
          <div>
            <div><strong>${it.type.toUpperCase()}</strong> — ${it.person} <span class="tag">${it.date}</span></div>
            <div class="note">${it.desc || ''}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700">${formatINR(it.price)}</div>
            <div style="margin-top:8px">
              <label><input type="checkbox" data-loan-idx="${it.__idx}" class="loan-check" ${it.checked ? 'checked' : ''}> settled</label>
            </div>
            <div><button class="btn" data-loan-del="${it.__idx}" style="margin-top:8px;background:#ef4444">Delete</button></div>
          </div>
        </div>
      `).join('');
    }

    givenBtn.onclick = () => { currentType = 'given'; givenBtn.style.opacity=1; takenBtn.style.opacity=0.7; };
    takenBtn.onclick = () => { currentType = 'taken'; takenBtn.style.opacity=1; givenBtn.style.opacity=0.7; };

    loanForm.onsubmit = (e) => {
      e.preventDefault();
      const item = {
        type: currentType,
        date: document.getElementById('loanDate').value,
        person: document.getElementById('loanPerson').value || '',
        price: parseFloat(document.getElementById('loanPrice').value) || 0,
        checked: document.getElementById('loanChecked').checked,
        desc: document.getElementById('loanDesc').value || ''
      };
      data.loans.push(item);
      saveData();
      loanForm.reset();
      refreshLoanList();
      document.getElementById('loanTotal').innerText = 'Total Loans: ' + formatINR(calcTotal('loans'));
    };

    loanList.onclick = (ev) => {
      const del = ev.target.closest('[data-loan-del]');
      if(del){
        const idx = parseInt(del.getAttribute('data-loan-del'),10);
        data.loans.splice(idx,1);
        saveData();
        refreshLoanList();
        document.getElementById('loanTotal').innerText = 'Total Loans: ' + formatINR(calcTotal('loans'));
      }
      const chk = ev.target.closest('.loan-check');
      if(chk){
        const idx = parseInt(chk.getAttribute('data-loan-idx'),10);
        data.loans[idx].checked = chk.checked;
        saveData();
      }
    };

    loanFilter.onchange = refreshLoanList;

    // initial render
    refreshLoanList();
  }

  // add category helper
  function addCategory(kind, name){
    if(!name) return;
    data.categories[kind] = data.categories[kind] || [];
    if(!data.categories[kind].includes(name)) data.categories[kind].push(name);
    saveData();
  }

  // initial section and stats
  updateStats();
  window.openSection('overview');

  // expose saveData for later use if needed
  window._expenseData = { data, saveData };

})();
