'use strict';

// ==========================================
// GRAM DAHELI YUVA SAMITI
// PAYMENT DETAILS PORTAL
// ==========================================

const PAYMENT_FUNCTION_URL =
  'https://cmhfmlvxgtwqzbhpjvdx.supabase.co/functions/v1/payment-details';

let accessPassword = '';
let reportData = null;
let activeTab = 'members';

const $ = id => document.getElementById(id);

const MONTHS = [
  'JAN','FEB','MAR','APR','MAY','JUN',
  'JUL','AUG','SEP','OCT','NOV','DEC'
];


// ==========================================
// COMMON HELPERS
// ==========================================

const money = n =>
  '₹' + (Number(n) || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2
  });

const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

const monthFromDate = value => {
  if (!value) return '';

  const [y, m] = String(value).split('-');

  return `${MONTHS[Number(m) - 1] || ''}-${y || ''}`;
};

const monthSort = value => {
  const [m, y] = String(value || '').split('-');
  return Number(y || 0) * 12 + MONTHS.indexOf(m);
};

const hasPaymentAmount = p =>
  !!p && (
    p.amountMode === undefined
      ? p.amount !== undefined &&
        p.amount !== null &&
        p.amount !== ''
      : p.amountMode === 'value'
  );

const hasLateFee = p =>
  !!p && (
    p.lateMode === undefined
      ? p.late !== undefined &&
        p.late !== null &&
        p.late !== ''
      : p.lateMode === 'value'
  );


// ==========================================
// PAYMENT TOTAL
// Late Fee included in accounting total
// ==========================================

const paymentAmount = p => {
  if (!p) return 0;

  const amount = hasPaymentAmount(p)
    ? Number(p.amount) || 0
    : 0;

  const late = hasLateFee(p)
    ? Number(p.late) || 0
    : 0;

  return amount + late;
};


// ==========================================
// LATE FEE ONLY
// ==========================================

const lateAmount = p => {
  if (!p || !hasLateFee(p)) return 0;

  return Number(p.late) || 0;
};


// ==========================================
// PAYMENT STATUS
// ==========================================

const statusText = status => ({
  advance: 'Advance Paid',
  late: 'With Late Payment',
  unpaid: 'Unpaid',
  on_join: 'Paid on Join',
  left: 'Left the Committee',
  left_committee: 'Left the Committee',
  paid: 'Paid',
  on_time: 'Paid'
}[String(status || '').toLowerCase()] || '—');


const statusClass = status => ({
  advance: 'advance',
  late: 'late',
  unpaid: 'unpaid',
  on_join: 'on-join',
  left: 'left',
  left_committee: 'left',
  paid: 'paid',
  on_time: 'paid'
}[String(status || '').toLowerCase()] || 'neutral');


// ==========================================
// PAYMENT CELL
// ZERO AMOUNT HIDDEN WHEN STATUS EXISTS
// ==========================================

const paymentCell = p => {

  if (!p) {
    return '<span class="empty-payment">—</span>';
  }

  const amountValue = hasPaymentAmount(p)
    ? Number(p.amount) || 0
    : 0;

  const status = statusText(p.status);
  const hasStatus = status !== '—';

  // Status ke saath ₹0 hide rahega.
  // Baaki amount pehle ki tarah dikhega.
  const amount = hasPaymentAmount(p) &&
    (amountValue !== 0 || !hasStatus)
    ? `<span class="amount-badge ${lateAmount(p) ? 'amount-with-late' : ''}">
         ${money(amountValue)}
       </span>`
    : '';

  const badge = hasStatus
    ? `<span class="status-badge ${statusClass(p.status)}">
         ${esc(status)}
       </span>`
    : '';

  const date = p.date
    ? `<small class="payment-date">${esc(p.date)}</small>`
    : '';

  if (!amount && !badge && !date) {
    return '<span class="empty-payment">—</span>';
  }

  return `${amount}${badge}${date}`;
};


// ==========================================
// FETCH DATA FROM SUPABASE
// ==========================================

async function fetchReport(password) {

  const response = await fetch(PAYMENT_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  });

  const result = await response.json().catch(
    () => ({ error: 'Server response समझ नहीं आया।' })
  );

  if (!response.ok) {
    throw new Error(
      result.error || `Request failed (${response.status})`
    );
  }

  return result;
}


// ==========================================
// LOGIN
// ==========================================

$('loginForm').addEventListener('submit', async event => {

  event.preventDefault();

  const password = $('memberPassword').value;

  if (!password) return;

  $('loginBtn').disabled = true;
  $('loginBtn').textContent = 'Loading…';

  $('loginMessage').textContent =
    'रिकॉर्ड सुरक्षित रूप से लोड हो रहे हैं…';

  try {

    accessPassword = password;

    reportData = await fetchReport(accessPassword);

    $('loginPanel').hidden = true;
    $('portal').hidden = false;

    $('lastUpdated').textContent =
      `Last refreshed: ${new Date(reportData.generatedAt).toLocaleString('en-IN')}`;

    populateYearFilter();

    renderAll();

    $('loginMessage').textContent = '';

  } catch (error) {

    accessPassword = '';

    $('loginMessage').textContent =
      error.message || 'Login नहीं हुआ।';

  } finally {

    $('loginBtn').disabled = false;

    $('loginBtn').textContent =
      'View Payment Details';
  }

});


// ==========================================
// REFRESH
// ==========================================

$('refreshBtn').addEventListener('click', async () => {

  if (!accessPassword) return;

  $('statusText').textContent = 'Refreshing…';

  try {

    reportData = await fetchReport(accessPassword);

    populateYearFilter($('yearFilter').value);

    renderAll();

    $('statusText').textContent =
      'Live data refreshed';

    $('lastUpdated').textContent =
      `Last refreshed: ${new Date(reportData.generatedAt).toLocaleString('en-IN')}`;

  } catch (error) {

    $('statusText').textContent =
      error.message || 'Refresh failed';
  }

});


// ==========================================
// LOGOUT
// ==========================================

$('logoutBtn').addEventListener('click', () => {

  accessPassword = '';
  reportData = null;

  $('memberPassword').value = '';

  $('portal').hidden = true;
  $('loginPanel').hidden = false;

  $('loginMessage').textContent =
    'आप logout हो गए हैं।';

});


// ==========================================
// PRINT
// ==========================================

$('printBtn').addEventListener('click', () => {
  window.print();
});


// ==========================================
// FILTER EVENTS
// ==========================================

$('yearFilter').addEventListener('change', () => {

  populateMonthFilter();

  renderAll();

});

$('monthFilter').addEventListener('change', renderAll);


// ==========================================
// TAB EVENTS
// ==========================================

document.querySelectorAll('.tab[data-tab]').forEach(button => {

  button.addEventListener('click', () => {

    showTab(button.dataset.tab);

  });

});


// ==========================================
// CSV EXPORT EVENTS
// ==========================================

document.querySelectorAll('[data-export]').forEach(button => {

  button.addEventListener('click', () => {

    exportTable(button.dataset.export);

  });

});


// ==========================================
// SHOW TAB
// ==========================================

function showTab(tab) {

  activeTab = tab;

  document.querySelectorAll('.tab[data-tab]').forEach(button => {

    button.classList.toggle(
      'active',
      button.dataset.tab === tab
    );

  });

  document.querySelectorAll('.tab-panel').forEach(panel => {

    const visible = panel.id === `tab-${tab}`;

    panel.hidden = !visible;

    panel.classList.toggle('active', visible);

  });

}


// ==========================================
// YEAR FILTER
// ==========================================

function populateYearFilter(selected) {

  const years = (reportData.years || [])
    .map(x => String(x.year));

  $('yearFilter').innerHTML = years.map(y => `
    <option value="${esc(y)}">${esc(y)}</option>
  `).join('');

  if (selected && years.includes(String(selected))) {

    $('yearFilter').value = String(selected);

  } else if (years.includes('2026')) {

    $('yearFilter').value = '2026';

  } else if (years.length) {

    $('yearFilter').value = years[0];

  }

  populateMonthFilter();

}


// ==========================================
// MONTH FILTER
// ==========================================

function populateMonthFilter() {

  const y = getYear();

  const row = (reportData.years || []).find(
    x => String(x.year) === y
  );

  const months = row?.months || [];

  const oldValue = getMonth();

  $('monthFilter').innerHTML =
    '<option value="ALL">All Months</option>' +
    months.map(m => `
      <option value="${esc(m)}">${esc(m)}</option>
    `).join('');

  if (months.includes(oldValue)) {
    $('monthFilter').value = oldValue;
  }

}


function getYear() {
  return String($('yearFilter').value || '');
}


function getMonth() {
  return $('monthFilter').value || 'ALL';
}


function currentYear() {

  return (reportData.years || []).find(
    x => String(x.year) === getYear()
  ) || {
    year: getYear(),
    months: [],
    members: [],
    expenses: [],
    balances: [],
    summary: {}
  };

}


function filteredMonth(month) {

  return getMonth() === 'ALL' ||
    getMonth() === month;

}


// ==========================================
// RENDER ALL SECTIONS
// ==========================================

function renderAll() {

  renderMembers();

  renderExpenses();

  renderDonations();

  renderRent();

  renderBills();

  renderSummary();

}


// ==========================================
// 1. MEMBER COLLECTION
// ==========================================

function renderMembers() {

  const x = currentYear();

  const months = (x.months || [])
    .filter(filteredMonth);

  const head = $('memberTable').querySelector('thead');

  const body = $('memberTable').querySelector('tbody');

  const foot = $('memberTable').querySelector('tfoot');


  head.innerHTML = `
    <tr>
      <th>S.No.</th>
      <th>Member ID</th>
      <th>Member Name</th>
      ${months.map(m => `<th>${esc(m)}</th>`).join('')}
      <th>Late Fee (₹)</th>
    </tr>
  `;


  const totals = Object.fromEntries(
    months.map(m => [m, 0])
  );

  let lateTotal = 0;

  const members = x.members || [];


  body.innerHTML = members.map((m, i) => {

    const cells = months.map(mo => {

      const p = m.payments?.[mo] || {};

      // Monthly total follows Accounting Register:
      // Payment Amount + Late Fee.
      totals[mo] += paymentAmount(p);

      return `<td>${paymentCell(p)}</td>`;

    }).join('');


    // Late Fee total respects selected year AND month filter.
    const allLate = Object.entries(m.payments || {})
      .filter(([mo]) =>
        String(mo).endsWith('-' + getYear()) &&
        filteredMonth(mo)
      )
      .reduce((sum, [, p]) => sum + lateAmount(p), 0);

    lateTotal += allLate;


    return `
      <tr>

        <td>${i + 1}</td>

        <td>${esc(m.id)}</td>

        <td class="member-name">${esc(m.name)}</td>

        ${cells}

        <td class="money">
          <span class="late-fee-badge">
            ${money(allLate)}
          </span>
        </td>

      </tr>
    `;

  }).join('') || `
    <tr>
      <td colspan="${months.length + 4}" class="muted-cell">
        No member records
      </td>
    </tr>
  `;


  // TABLE TOTAL

  foot.innerHTML = `
    <tr>

      <td colspan="3">TOTAL COLLECTION</td>

      ${months.map(m => `
        <td>${money(totals[m])}</td>
      `).join('')}

      <td>${money(lateTotal)}</td>

    </tr>
  `;


  // MOBILE MEMBER CARDS

  const mobile = $('memberMobileCards');

  if (mobile) {

    mobile.innerHTML = members.map((m, i) => {

      const payments = months.map(mo => {

        const p = m.payments?.[mo] || {};

        return `
          <div class="mobile-payment">

            <span class="mobile-month">
              ${esc(mo)}
            </span>

            <div class="mobile-payment-value">
              ${paymentCell(p)}
            </div>

          </div>
        `;

      }).join('');


      const allLate = Object.entries(m.payments || {})
        .filter(([mo]) =>
          String(mo).endsWith('-' + getYear()) &&
          filteredMonth(mo)
        )
        .reduce((sum, [, p]) => sum + lateAmount(p), 0);


      return `
        <article class="member-mobile-card">

          <div class="member-card-head">

            <span class="member-card-number">
              ${i + 1}
            </span>

            <div class="member-card-identity">

              <strong>${esc(m.name)}</strong>

              <small>${esc(m.id)}</small>

            </div>

            <span class="late-fee-badge">
              Late ${money(allLate)}
            </span>

          </div>

          <div class="member-card-payments">

            ${payments || '<span class="muted-cell">No monthly records</span>'}

          </div>

        </article>
      `;

    }).join('') || `
      <p class="muted-cell">No member records</p>
    `;

  }


  renderMemberFinancialSummary();

}


// ==========================================
// MEMBER FINANCIAL SUMMARY
// ==========================================

function renderMemberFinancialSummary() {

  const el = $('memberFinancialSummary');

  if (!el) return;

  const x = currentYear();

  const s = x.summary || {};

  const cards = [
    ['Opening Balance', s.opening],
    ['Member Collection', s.memberCollection],
    ['Total Donations', s.donation],
    ['Rent Collection', s.rent ?? s.rentCollection],
    ['Total Expenses', s.expense],
    ['Closing Balance', s.closing]
  ];

  const rows = (x.balances || [])
    .filter(r => filteredMonth(r.month));


  el.innerHTML = `

    <section class="member-financial-summary">

      <div class="section-title">

        <div>

          <h3>Financial Summary · ${esc(getYear())}</h3>

          <p>Member Collection ke neeche poore saal ka financial overview</p>

        </div>

      </div>


      <div class="member-financial-grid">

        ${cards.map(([label, value]) => `

          <div class="member-financial-card">

            <span>${label}</span>

            <strong>${money(value)}</strong>

          </div>

        `).join('')}

      </div>


      <h4 class="subheading">
        Month-wise Opening & Closing Balance
      </h4>


      <div class="table-wrap">

        <table class="member-balance-table">

          <thead>

            <tr>

              <th>Month</th>

              <th>Opening Balance (₹)</th>

              <th>Member Collection (₹)</th>

              <th>Donation (₹)</th>

              <th>Expense (₹)</th>

              <th>Closing Balance (₹)</th>

            </tr>

          </thead>


          <tbody>

            ${rows.map(r => `

              <tr>

                <td>${esc(r.month)}</td>

                <td>${money(r.opening)}</td>

                <td>${money(r.collection)}</td>

                <td>${money(r.legacyDonation ?? r.donation)}</td>

                <td>${money(r.expense)}</td>

                <td><b>${money(r.closing)}</b></td>

              </tr>

            `).join('') || `
              <tr>
                <td colspan="6">No monthly balance rows</td>
              </tr>
            `}

          </tbody>

        </table>

      </div>


      <p class="footnote warning">

        यह विवरण ग्राम दहेली युवा समिति के आधिकारिक लेखा-जोखा एवं उपलब्ध वित्तीय अभिलेखों पर आधारित है।
        समिति के वित्तीय रिकॉर्ड में पारदर्शिता बनाए रखने तथा सदस्यों को सही जानकारी उपलब्ध कराने के उद्देश्य से इसे प्रस्तुत किया गया है।

      </p>

    </section>

  `;

}


// ==========================================
// 2. EXPENSE DETAILS
// ==========================================

function renderExpenses() {

  const rows = (currentYear().expenses || [])
    .filter(e => filteredMonth(e.month));

  const body = $('expenseTable').querySelector('tbody');


  body.innerHTML = rows.map((e, i) => `

    <tr>

      <td>${i + 1}</td>

      <td>${esc(e.month || '')}</td>

      <td>${esc(e.bill || '')}</td>

      <td>${esc(e.date || '')}</td>

      <td>${esc(e.detail || '')}</td>

      <td class="money">${money(e.amount)}</td>

    </tr>

  `).join('') || `
    <tr>
      <td colspan="6" class="muted-cell">
        No expense entries
      </td>
    </tr>
  `;


  const total = rows.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );


  $('expenseTable').querySelector('tfoot').innerHTML = `

    <tr>

      <td colspan="5">Total Expense</td>

      <td class="money">${money(total)}</td>

    </tr>

  `;

}


// ==========================================
// 3. DONATION DETAILS
// ==========================================

function renderDonations() {

  const rows = (reportData.donations || []).filter(e =>

    String(e.date || '').startsWith(getYear() + '-') &&

    filteredMonth(monthFromDate(e.date))

  );


  const body = $('donationTable').querySelector('tbody');


  body.innerHTML = rows.map((e, i) => `

    <tr>

      <td>${i + 1}</td>

      <td>${esc(e.date || '')}</td>

      <td>${esc(monthFromDate(e.date))}</td>

      <td>${esc(e.receipt || '')}</td>

      <td>${esc(e.name || '')}</td>

      <td>${esc(e.purpose || '')}</td>

      <td class="money">${money(e.amount)}</td>

    </tr>

  `).join('') || `
    <tr>
      <td colspan="7" class="muted-cell">
        No donation entries
      </td>
    </tr>
  `;


  const total = rows.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );


  $('donationTable').querySelector('tfoot').innerHTML = `

    <tr>

      <td colspan="6">Total Donation</td>

      <td class="money">${money(total)}</td>

    </tr>

  `;

}


// ==========================================
// 4. RENT COLLECTION
// ==========================================

function renderRent() {

  const table = $('rentTable');

  if (!table) return;

  const x = currentYear();

  // Supports rent records returned with the selected year
  // or at the top level of the API response.
  const source = [
    ...(Array.isArray(x.rents) ? x.rents : []),
    ...(Array.isArray(x.rentCollections) ? x.rentCollections : []),
    ...(Array.isArray(reportData.rents) ? reportData.rents : []),
    ...(Array.isArray(reportData.rentCollections) ? reportData.rentCollections : [])
  ];

  const unique = new Map();

  source.forEach((record, index) => {
    const key = record.id || `${record.no || ''}-${record.date || ''}-${index}`;
    unique.set(key, record);
  });

  const records = [...unique.values()].filter(record => {

    const month = record.month || monthFromDate(record.date);

    return String(record.date || '').startsWith(getYear() + '-') &&
      filteredMonth(month);

  }).sort((a, b) =>
    String(a.date || '').localeCompare(String(b.date || ''))
  );


  const rows = [];

  records.forEach(record => {

    const items = record.items || [];

    items.forEach(item => {

      rows.push({
        no: record.no || '',
        date: record.date || '',
        month: record.month || monthFromDate(record.date),
        consumer: item.consumer || '',
        material: item.material || '',
        purpose: item.purpose || '',
        qty: item.qty ?? '',
        rate: item.rate ?? '',
        amount: item.amount ?? (
          (Number(item.qty) || 0) *
          (Number(item.rate) || 0)
        )
      });

    });

  });


  table.querySelector('tbody').innerHTML = rows.map((r, i) => `

    <tr>

      <td>${i + 1}</td>

      <td>${esc(r.no)}</td>

      <td>${esc(r.date)}</td>

      <td>${esc(r.month)}</td>

      <td>${esc(r.consumer)}</td>

      <td>${esc(r.material)}</td>

      <td>${esc(r.purpose)}</td>

      <td>${esc(r.qty)}</td>

      <td class="money">${money(r.rate)}</td>

      <td class="money">${money(r.amount)}</td>

    </tr>

  `).join('') || `
    <tr>
      <td colspan="10" class="muted-cell">
        No rent collection entries
      </td>
    </tr>
  `;


  const total = rows.reduce(
    (sum, r) => sum + (Number(r.amount) || 0),
    0
  );


  table.querySelector('tfoot').innerHTML = `

    <tr>

      <td colspan="9">Total Rent Collection</td>

      <td class="money">${money(total)}</td>

    </tr>

  `;

}


// ==========================================
// 5. BILL DETAILS
// ==========================================

function renderBills() {

  const rows = (reportData.bills || []).filter(e =>

    String(e.date || '').startsWith(getYear() + '-') &&

    filteredMonth(monthFromDate(e.date))

  );


  const body = $('billTable').querySelector('tbody');


  body.innerHTML = rows.map((b, i) => {

    const items = b.items || [];

    const amount = items.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );


    const detail = items.map(item => [

      item.category,

      item.work,

      item.purpose,

      `Qty ${item.unit ?? ''}`,

      `Rate ${money(item.rate)}`

    ].filter(Boolean).join(' · ')).join(' | ');


    return `

      <tr>

        <td>${i + 1}</td>

        <td>${esc(b.no || '')}</td>

        <td>${esc(b.date || '')}</td>

        <td>${esc(b.title || '')}</td>

        <td>${esc(detail || `${items.length} item(s)`)}</td>

        <td class="money">${money(amount)}</td>

      </tr>

    `;

  }).join('') || `
    <tr>
      <td colspan="6" class="muted-cell">
        No bill records
      </td>
    </tr>
  `;


  const total = rows.reduce(
    (sum, b) => sum + (b.items || []).reduce(
      (amount, item) => amount + (Number(item.amount) || 0),
      0
    ),
    0
  );


  $('billTable').querySelector('tfoot').innerHTML = `

    <tr>

      <td colspan="5">Total Bill Amount</td>

      <td class="money">${money(total)}</td>

    </tr>

  `;

}


// ==========================================
// 6. FINANCIAL SUMMARY TAB
// ==========================================

function renderSummary() {

  const x = currentYear();

  const s = x.summary || {};


  const cards = [

    ['Opening Balance', s.opening],

    ['Member Collection', s.memberCollection],

    ['Total Donations', s.donation],

    ['Rent Collection', s.rent ?? s.rentCollection],

    ['Total Expenses', s.expense],

    ['Closing Balance', s.closing]

  ];


  $('summaryCards').innerHTML = cards.map(
    ([label, value]) => `

      <div class="summary-card">

        <span>${label}</span>

        <strong>${money(value)}</strong>

      </div>

    `
  ).join('');


  const rows = (x.balances || [])
    .filter(r => filteredMonth(r.month));


  $('balanceTable').querySelector('tbody').innerHTML =

    rows.map(r => `

      <tr>

        <td>${esc(r.month)}</td>

        <td class="money">${money(r.opening)}</td>

        <td class="money">${money(r.collection)}</td>

        <td class="money">${money(r.legacyDonation ?? r.donation)}</td>

        <td class="money">${money(r.expense)}</td>

        <td class="money"><b>${money(r.closing)}</b></td>

      </tr>

    `).join('') || `
      <tr>
        <td colspan="6" class="muted-cell">
          No monthly balance rows
        </td>
      </tr>
    `;

}


// ==========================================
// CSV EXPORT
// ==========================================

function exportTable(id) {

  const table = $(id);

  if (!table) return;


  const lines = [...table.querySelectorAll('tr')].map(tr =>

    [...tr.children].map(td =>

      '"' + td.innerText
        .replace(/"/g, '""')
        .replace(/\s*\n\s*/g, ' ')
        .trim() + '"'

    ).join(',')

  );


  const blob = new Blob(
    ['\ufeff' + lines.join('\r\n')],
    { type: 'text/csv;charset=utf-8;' }
  );


  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');

  a.href = url;

  a.download = `${id}-${getYear()}.csv`;

  document.body.appendChild(a);

  a.click();

  a.remove();

  URL.revokeObjectURL(url);

}
