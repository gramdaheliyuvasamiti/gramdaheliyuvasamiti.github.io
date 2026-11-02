'use strict';

// Public frontend: no service-role key and no database write permissions here.
const PAYMENT_FUNCTION_URL = 'https://cmhfmlvxgtwqzbhpjvdx.supabase.co/functions/v1/payment-details';
let accessPassword = '';
let reportData = null;
let activeTab = 'members';
const $ = id => document.getElementById(id);
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const money = n => '₹' + (Number(n)||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const monthFromDate = value => { if(!value) return ''; const [y,m]=String(value).split('-'); return `${MONTHS[Number(m)-1]||''}-${y||''}`; };
const monthSort = value => { const [m,y]=String(value||'').split('-'); return Number(y||0)*12+MONTHS.indexOf(m); };
const paymentAmount = p => {
  if(!p) return 0;
  const hasAmount = p.amountMode === undefined ? p.amount !== undefined && p.amount !== null && p.amount !== '' : p.amountMode === 'value';
  const hasLate = p.lateMode === undefined ? p.late !== undefined && p.late !== null && p.late !== '' : p.lateMode === 'value';
  return (hasAmount ? Number(p.amount)||0 : 0) + (hasLate ? Number(p.late)||0 : 0);
};
const lateAmount = p => {
  if(!p) return 0;
  const hasLate = p.lateMode === undefined ? p.late !== undefined && p.late !== null && p.late !== '' && Number(p.late)!==0 : p.lateMode === 'value';
  return hasLate ? Number(p.late)||0 : 0;
};
const statusText = status => ({advance:'Advance Paid',late:'With Late Payment',unpaid:'Unpaid',on_join:'Paid on Join',left:'Left the Committee',left_committee:'Left the Committee',paid:'Paid','on_time':'Paid'}[String(status||'').toLowerCase()] || '—');

async function fetchReport(password) {
  const response = await fetch(PAYMENT_FUNCTION_URL, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({password})
  });
  const result = await response.json().catch(()=>({error:'Server response समझ नहीं आया।'}));
  if(!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
}

$('loginForm').addEventListener('submit', async event => {
  event.preventDefault();
  const password = $('memberPassword').value;
  if(!password) return;
  $('loginBtn').disabled = true; $('loginBtn').textContent = 'Loading…'; $('loginMessage').textContent = 'रिकॉर्ड सुरक्षित रूप से लोड हो रहे हैं…';
  try {
    accessPassword = password;
    reportData = await fetchReport(accessPassword);
    $('loginPanel').hidden = true; $('portal').hidden = false;
    $('lastUpdated').textContent = `Last refreshed: ${new Date(reportData.generatedAt).toLocaleString('en-IN')}`;
    populateYearFilter(); renderAll();
    $('loginMessage').textContent = '';
  } catch(error) {
    accessPassword = '';
    $('loginMessage').textContent = error.message || 'Login नहीं हुआ।';
  } finally { $('loginBtn').disabled = false; $('loginBtn').textContent = 'View Payment Details'; }
});

$('refreshBtn').addEventListener('click', async () => {
  if(!accessPassword) return;
  $('statusText').textContent = 'Refreshing…';
  try { reportData = await fetchReport(accessPassword); populateYearFilter($('yearFilter').value); renderAll(); $('statusText').textContent='Live data refreshed'; $('lastUpdated').textContent=`Last refreshed: ${new Date(reportData.generatedAt).toLocaleString('en-IN')}`; }
  catch(error) { $('statusText').textContent=error.message || 'Refresh failed'; }
});
$('logoutBtn').addEventListener('click', () => { accessPassword='';reportData=null;$('memberPassword').value='';$('portal').hidden=true;$('loginPanel').hidden=false;$('loginMessage').textContent='आप logout हो गए हैं।'; });
$('printBtn').addEventListener('click',()=>window.print());
$('yearFilter').addEventListener('change',()=>{populateMonthFilter();renderAll();});
$('monthFilter').addEventListener('change',renderAll);

document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>showTab(button.dataset.tab)));
document.querySelectorAll('[data-export]').forEach(button=>button.addEventListener('click',()=>exportTable(button.dataset.export)));
function showTab(tab){activeTab=tab;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelectorAll('.tab-panel').forEach(p=>{const yes=p.id===`tab-${tab}`;p.hidden=!yes;p.classList.toggle('active',yes);});}
function populateYearFilter(selected){const years=(reportData.years||[]).map(x=>String(x.year));$('yearFilter').innerHTML=years.map(y=>`<option value="${esc(y)}">${esc(y)}</option>`).join('');if(selected&&years.includes(String(selected)))$('yearFilter').value=String(selected);else if(years.includes('2026'))$('yearFilter').value='2026';populateMonthFilter();}
function populateMonthFilter(){const y=getYear();const row=(reportData.years||[]).find(x=>String(x.year)===y);const months=row?.months||[];$('monthFilter').innerHTML='<option value="ALL">All Months</option>'+months.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('');}
function getYear(){return String($('yearFilter').value||'');}
function getMonth(){return $('monthFilter').value||'ALL';}
function currentYear(){return (reportData.years||[]).find(x=>String(x.year)===getYear())||{year:getYear(),months:[],members:[],expenses:[],balances:[],summary:{}};}
function filteredMonth(month){return getMonth()==='ALL'||getMonth()===month;}
function renderAll(){renderMembers();renderExpenses();renderDonations();renderBills();renderSummary();}
function renderMembers(){const x=currentYear(),months=x.months.filter(filteredMonth);const head=$('memberTable').querySelector('thead'),body=$('memberTable').querySelector('tbody'),foot=$('memberTable').querySelector('tfoot');head.innerHTML='<tr><th>S.No.</th><th>Member ID</th><th>Member Name</th>'+months.map(m=>`<th>${esc(m)}</th>`).join('')+'<th>Late Fee (₹)</th></tr>';
 let totals=Object.fromEntries(months.map(m=>[m,0])),lateTotal=0;
 body.innerHTML=(x.members||[]).map((m,i)=>{let cells=months.map(mo=>{const p=m.payments?.[mo]||{},amt=paymentAmount(p),late=lateAmount(p);totals[mo]+=amt;lateTotal+=late;const status=statusText(p.status);return `<td>${amt?`<b>${money(amt)}</b>`:'—'}${status!=='—'?`<small class="muted-cell"><br>${esc(status)}</small>`:''}${p.date?`<small class="muted-cell"><br>${esc(p.date)}</small>`:''}</td>`;}).join('');const allLate=Object.entries(m.payments||{}).filter(([mo])=>String(mo).endsWith('-'+getYear())).reduce((s,[,p])=>s+lateAmount(p),0);return `<tr><td>${i+1}</td><td>${esc(m.id)}</td><td>${esc(m.name)}</td>${cells}<td class="money">${money(allLate)}</td></tr>`;}).join('')||`<tr><td colspan="${months.length+4}" class="muted-cell">No member records</td></tr>`;
 foot.innerHTML=`<tr><td colspan="3">TOTAL COLLECTION</td>${months.map(m=>`<td>${money(totals[m])}</td>`).join('')}<td>${money(lateTotal)}</td></tr>`;
}
function renderExpenses(){const rows=(currentYear().expenses||[]).filter(e=>filteredMonth(e.month));const body=$('expenseTable').querySelector('tbody');body.innerHTML=rows.map((e,i)=>`<tr><td>${i+1}</td><td>${esc(e.month||'')}</td><td>${esc(e.bill||'')}</td><td>${esc(e.date||'')}</td><td>${esc(e.detail||'')}</td><td class="money">${money(e.amount)}</td></tr>`).join('')||'<tr><td colspan="6" class="muted-cell">No expense entries</td></tr>';const total=rows.reduce((s,e)=>s+(Number(e.amount)||0),0);$('expenseTable').querySelector('tfoot').innerHTML=`<tr><td colspan="5">Total Expense</td><td class="money">${money(total)}</td></tr>`;}
function renderDonations(){const rows=(reportData.donations||[]).filter(e=>String(e.date||'').startsWith(getYear()+'-')&&filteredMonth(monthFromDate(e.date)));const body=$('donationTable').querySelector('tbody');body.innerHTML=rows.map((e,i)=>`<tr><td>${i+1}</td><td>${esc(e.date||'')}</td><td>${esc(monthFromDate(e.date))}</td><td>${esc(e.receipt||'')}</td><td>${esc(e.name||'')}</td><td>${esc(e.purpose||'')}</td><td class="money">${money(e.amount)}</td></tr>`).join('')||'<tr><td colspan="7" class="muted-cell">No donation entries</td></tr>';const total=rows.reduce((s,e)=>s+(Number(e.amount)||0),0);$('donationTable').querySelector('tfoot').innerHTML=`<tr><td colspan="6">Total Donation</td><td class="money">${money(total)}</td></tr>`;}
function renderBills(){const rows=(reportData.bills||[]).filter(e=>String(e.date||'').startsWith(getYear()+'-')&&filteredMonth(monthFromDate(e.date)));const body=$('billTable').querySelector('tbody');body.innerHTML=rows.map((b,i)=>{const items=b.items||[];const amount=items.reduce((s,it)=>s+(Number(it.amount)||0),0);const detail=items.map(it=>[it.category,it.work,it.purpose,`Qty ${it.unit??''}`,`Rate ${money(it.rate)}`].filter(Boolean).join(' · ')).join(' | ');return `<tr><td>${i+1}</td><td>${esc(b.no||'')}</td><td>${esc(b.date||'')}</td><td>${esc(b.title||'')}</td><td>${esc(detail||`${items.length} item(s)`)}</td><td class="money">${money(amount)}</td></tr>`;}).join('')||'<tr><td colspan="6" class="muted-cell">No bill records</td></tr>';const total=rows.reduce((s,b)=>s+(b.items||[]).reduce((a,it)=>a+(Number(it.amount)||0),0),0);$('billTable').querySelector('tfoot').innerHTML=`<tr><td colspan="5">Total Bill Amount</td><td class="money">${money(total)}</td></tr>`;}
function renderSummary(){const x=currentYear(),s=x.summary||{};const cards=[['Opening Balance',s.opening],['Member Collection',s.memberCollection],['Total Expense',s.expense],['Donation Collection',s.donation],['Closing Balance',s.closing]];$('summaryCards').innerHTML=cards.map(([label,value])=>`<div class="summary-card"><span>${label}</span><strong>${money(value)}</strong></div>`).join('');const rows=(x.balances||[]).filter(r=>filteredMonth(r.month));$('balanceTable').querySelector('tbody').innerHTML=rows.map(r=>`<tr><td>${esc(r.month)}</td><td class="money">${money(r.opening)}</td><td class="money">${money(r.collection)}</td><td class="money">${money(r.legacyDonation)}</td><td class="money">${money(r.expense)}</td><td class="money"><b>${money(r.closing)}</b></td></tr>`).join('')||'<tr><td colspan="6" class="muted-cell">No monthly balance rows</td></tr>';}
function exportTable(id){const table=$(id);if(!table)return;const lines=[...table.querySelectorAll('tr')].map(tr=>[...tr.children].map(td=>'"'+td.innerText.replace(/"/g,'""').replace(/\s*\n\s*/g,' ').trim()+'"').join(','));const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${id}-${getYear()}.csv`;a.click();URL.revokeObjectURL(url);}
