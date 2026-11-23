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

    const items = Array.isArray(b.items)
      ? b.items
      : (b.items ? [b.items] : []);

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
        <td class="no-print">
          <button
            type="button"
            class="btn small secondary"
            onclick="viewBill(${i})">
            View Bill
          </button>
        </td>
      </tr>
    `;

  }).join('') || `
    <tr>
      <td colspan="7" class="muted-cell">No bill records</td>
    </tr>
  `;

  const total = rows.reduce((sum, b) =>
    sum + (Array.isArray(b.items) ? b.items : []).reduce(
      (amount, item) => amount + (Number(item.amount) || 0),
      0
    ), 0
  );

  $('billTable').querySelector('tfoot').innerHTML = `
    <tr>
      <td colspan="5">Total Bill Amount</td>
      <td class="money">${money(total)}</td>
      <td class="no-print"></td>
    </tr>
  `;
}


// ==========================================
// READ-ONLY FULL BILL VIEW
// ==========================================

function billBrandingData() {
  return reportData?.branding ||
    reportData?.documentBranding ||
    reportData?.portalSettings ||
    {};
}


function billAttachmentMarkup(bill) {

  const items = Array.isArray(bill.items)
    ? bill.items
    : (bill.items ? [bill.items] : []);

  let out = '';

  items.forEach((item, index) => {

    const files = [
      ...(Array.isArray(item.attachments) ? item.attachments : []),
      ...(index === 0 && Array.isArray(bill.attachments)
        ? bill.attachments
        : [])
    ];

    files.forEach(file => {

      if (!file || !file.data) return;

      const type = String(file.type || '').toLowerCase();
      const name = esc(file.name || 'Bill Attachment');
      const src = String(file.data);

      if (
        type.startsWith('image/') ||
        /^data:image\//i.test(src) ||
        (/^https?:\/\//i.test(src) &&
          /\.(png|jpe?g|webp|gif)(?:\?|$)/i.test(src))
      ) {

        out += `
          <figure class="bill-view-attachment">
            <figcaption>Item ${index + 1} — ${name}</figcaption>
            <img src="${esc(src)}" alt="${name}">
          </figure>
        `;

      } else if (
        type.includes('pdf') ||
        /^data:application\/pdf/i.test(src) ||
        /\.pdf(?:\?|$)/i.test(src)
      ) {

        out += `
          <figure class="bill-view-attachment bill-view-pdf">
            <figcaption>Item ${index + 1} — ${name}</figcaption>
            <iframe src="${esc(src)}" title="${name}"></iframe>
            <a href="${esc(src)}" target="_blank" rel="noopener">
              Open PDF attachment
            </a>
          </figure>
        `;

      } else {

        out += `
          <p class="bill-view-file">
            Item ${index + 1} —
            <a href="${esc(src)}" target="_blank" rel="noopener">
              ${name}
            </a>
          </p>
        `;

      }

    });

  });

  return out;
}


// ==========================================
// BILL SIGNATURES AND STAMP
// ==========================================

function billApprovalMarkup() {

  const brand = billBrandingData();

  const roles = [
    ['prepared', 'PREPARED BY'],
    ['verified', 'VERIFIED BY'],
    ['approved', 'APPROVED BY']
  ];

  const signatures = roles.map(([key, label]) => {

    const name =
      brand[key + 'Name'] ||
      brand[key + '_by'] ||
      '';

    const post = brand[key + 'Post'] || '';

    const sign =
      brand[key + 'Sign'] ||
      brand[key + '_sign_url'] ||
      '';

    return `
      <div class="bill-view-signer">
        <b>${label}</b>
        ${sign ? `<img src="${esc(sign)}" alt="${label}">` : ''}
        <span>${esc(name)}</span>
        <small>${esc(post)}</small>
      </div>
    `;

  }).join('');

  const stamp = brand.stamp || brand.stamp_url || '';

  return `
    <div class="bill-view-approval">
      ${signatures}

      <div class="bill-view-stamp">
        ${stamp
          ? `<img src="${esc(stamp)}" alt="Official Stamp">`
          : ''}
        <b>OFFICIAL STAMP</b>
      </div>
    </div>
  `;
}


// ==========================================
// COMPLETE BILL DOCUMENT
// ==========================================

function billDocumentMarkup(bill) {

  const items = Array.isArray(bill.items)
    ? bill.items
    : (bill.items ? [bill.items] : []);

  const total = items.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );

  const brand = billBrandingData();

  const letterhead =
    brand.letterhead ||
    brand.letterhead_url ||
    '';

  const rows = items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(item.category || '')}</td>
      <td>${esc(item.work || '')}</td>
      <td>${esc(item.purpose || '')}</td>
      <td>${esc(item.unit || '')}</td>
      <td>${money(item.rate)}</td>
      <td>${money(item.amount)}</td>
    </tr>
  `).join('');

  return `
    <article class="bill-view-paper"
      ${letterhead
        ? `style="--bill-letterhead:url('${esc(letterhead)}')"`
        : ''}>

      <div class="bill-view-letterhead"></div>

      <div class="bill-view-paper-body">

        <h1>ग्राम दहेली युवा समिति</h1>

        <h2>${esc(bill.title || 'BILL')}</h2>

        <div class="bill-view-meta">
          <span>
            <b>Bill Number:</b> ${esc(bill.no || '')}
          </span>

          <span>
            <b>Date:</b> ${esc(bill.date || '')}
          </span>
        </div>

        <table class="bill-view-items">

          <thead>
            <tr>
              <th>S.No.</th>
              <th>Category</th>
              <th>Material / Work Details</th>
              <th>Use / Purpose</th>
              <th>Unit</th>
              <th>Rate / Unit (₹)</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>

          <tbody>
            ${rows || `
              <tr>
                <td colspan="7">No item details available</td>
              </tr>
            `}
          </tbody>

          <tfoot>
            <tr>
              <td colspan="6">Total Bill Amount</td>
              <td>${money(total)}</td>
            </tr>
          </tfoot>

        </table>

        ${billApprovalMarkup()}

        ${billAttachmentMarkup(bill)}

      </div>
    </article>
  `;
}


// ==========================================
// OPEN BILL — VIEW ONLY
// ==========================================

function viewBill(index) {

  const rows = (reportData.bills || []).filter(e =>
    String(e.date || '').startsWith(getYear() + '-') &&
    filteredMonth(monthFromDate(e.date))
  );

  const bill = rows[index];

  if (!bill) return;

  activeBillForView = bill;

  $('billViewContent').innerHTML =
    billDocumentMarkup(bill);

  $('billViewModal').hidden = false;

  document.body.classList.add('bill-view-open');

  $('billViewCloseBtn').focus();
}


// ==========================================
// CLOSE BILL
// ==========================================

function closeBillView() {

  $('billViewModal').hidden = true;

  document.body.classList.remove('bill-view-open');

  activeBillForView = null;
}


// ==========================================
// BILL VIEW BUTTON EVENTS
// ==========================================

$('billViewCloseBtn')?.addEventListener(
  'click',
  closeBillView
);


$('billViewModal')?.addEventListener('click', event => {

  if (event.target === $('billViewModal')) {
    closeBillView();
  }

});


$('billViewPrintBtn')?.addEventListener('click', () => {

  if (!activeBillForView) return;

  document.body.classList.add('bill-view-printing');

  window.print();

  document.body.classList.remove('bill-view-printing');

});


document.addEventListener('keydown', event => {

  if (
    event.key === 'Escape' &&
    !$('billViewModal')?.hidden
  ) {
    closeBillView();
  }

});
