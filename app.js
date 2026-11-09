import { formatNaira, calculateAmounts, addCalendarDays, generateDocumentNumber } from './core.js';
'use strict';

const STORAGE_KEY = 'invoice-gen-data-v2';
const DEFAULT_PROFILE = {businessName:'',registration:'',email:'',phone:'',address:'',bankName:'',accountName:'',accountNumber:'',signatureName:'',logoDataUrl:'',signatureDataUrl:''};
const THEMES = {
  corporate:{name:'Corporate',primary:'#183d57',accent:'#3f82a5'},
  minimal:{name:'Modern minimal',primary:'#176b70',accent:'#83bdb2'},
  executive:{name:'Executive',primary:'#272727',accent:'#c2a15d'},
  creative:{name:'Creative',primary:'#4542a2',accent:'#f0a04b'}
};
const TYPE_LABELS = {invoice:'Invoice',proforma:'Pro forma invoice',receipt:'Receipt'};
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
let state = loadState();
let activePreviewId = null;

function freshState(){ return {profile:{...DEFAULT_PROFILE},documents:[],clients:[],settings:{}}; }
function loadState(){
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return freshState();
    return {profile:{...DEFAULT_PROFILE,...(parsed.profile||{})},documents:Array.isArray(parsed.documents)?parsed.documents:[],clients:Array.isArray(parsed.clients)?parsed.clients:[],settings:parsed.settings||{}};
  } catch(error){ console.error('Could not read saved Invoice Gen data:',error); return freshState(); }
}
function persist(){
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); return true; }
  catch(error){ console.error('Could not save Invoice Gen data:',error); showNotice('Your browser could not save the data. Check available storage space.','error'); return false; }
}
function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function money(value){return formatNaira(value);}
function dateValue(date){const d=date instanceof Date?date:new Date(date+'T00:00:00');return Number.isNaN(d.getTime())?'':d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});}
function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function addDays(iso,days){return addCalendarDays(iso,days);}
function showNotice(message,type='success'){const el=$('#notice');el.textContent=message;el.className=`notice${type==='error'?' error':''}`;el.hidden=false;window.clearTimeout(showNotice.timer);showNotice.timer=window.setTimeout(()=>{el.hidden=true;},5000);}
function setView(name){
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
  $$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  const titles={home:['YOUR WORKSPACE','Overview'],create:['DOCUMENT BUILDER','Create document'],history:['YOUR RECORDS','Documents'],settings:['YOUR BUSINESS','Business profile']};
  $('#pageEyebrow').textContent=titles[name][0];$('#pageTitle').textContent=titles[name][1];$('#sidebar').classList.remove('open');
  if(name==='home')renderDashboard();if(name==='history')renderHistory();if(name==='settings')fillProfile();
  window.scrollTo({top:0,behavior:'smooth'});
}
function goTo(name){setView(name);}
function getItems(){return $$('.item-row').map(row=>({description:$('.item-description',row).value.trim(),quantity:Math.max(0,Number($('.item-quantity',row).value)||0),unitPrice:Math.max(0,Number($('.item-price',row).value)||0)}));}
function totals(){
  const f=$('#documentForm').elements;
  return calculateAmounts(getItems(),f.discount.value,f.taxRate.value,f.extraCharge.value);
}
function addItem(item={description:'',quantity:1,unitPrice:0}){
  const row=document.createElement('div');row.className='item-row';
  row.innerHTML=`<input class="item-description" maxlength="140" aria-label="Item description" placeholder="Goods or service" value="${esc(item.description)}"><input class="item-quantity" type="number" min="0.01" step="0.01" aria-label="Quantity" value="${Number(item.quantity)||1}"><input class="item-price" type="number" min="0" step="0.01" aria-label="Unit price" value="${Number(item.unitPrice)||0}"><span class="item-amount">${money((Number(item.quantity)||0)*(Number(item.unitPrice)||0))}</span><button class="remove-item" type="button" aria-label="Remove item">×</button>`;
  $('#itemsList').append(row);updateTotals();
}
function updateTotals(){
  const t=totals();$$('.item-row').forEach((row,i)=>$('.item-amount',row).textContent=money(t.items[i].quantity*t.items[i].unitPrice));
  const f=$('#documentForm').elements;const type=f.docType.value;const amount=type==='receipt'?(Number(f.amountPaid.value)||0):t.total;
  $('#totalsBox').innerHTML=`<div class="total-line"><span>Subtotal</span><b>${money(t.subtotal)}</b></div>${t.discount?`<div class="total-line"><span>Discount</span><b>− ${money(t.discount)}</b></div>`:''}${t.tax?`<div class="total-line"><span>Tax (${t.taxRate}%)</span><b>${money(t.tax)}</b></div>`:''}${t.extra?`<div class="total-line"><span>${esc(f.extraLabel.value||'Additional charge')}</span><b>${money(t.extra)}</b></div>`:''}<div class="total-line grand"><span>${type==='receipt'?'Amount received':'Total'}</span><b>${money(amount)}</b></div>`;
  $('#summaryTotal').textContent=money(amount);$('#summaryItems').textContent=type==='receipt'?'Payment':String(t.items.filter(x=>x.description).length);$('#summaryType').textContent=TYPE_LABELS[type].toUpperCase();$('#summaryTheme').textContent=THEMES[f.theme.value].name;
}
function updateTypeUI(){
  const f=$('#documentForm').elements;const type=f.docType.value;
  $$('.type-option').forEach(l=>l.classList.toggle('selected',$('input',l).checked));
  $('#itemsCard').hidden=type==='receipt';$('#paymentHeading').textContent=type==='receipt'?'Payment details':type==='proforma'?'Quotation dates':'Payment and dates';
  $('#paymentHelp').textContent=type==='receipt'?'Record the amount and method of payment.':type==='proforma'?'Set the issue date. The quotation is valid for 30 calendar days.':'Set the issue date and payment deadline.';
  $('#dueDateField').hidden=type!=='invoice';$('#paymentMethodField').hidden=type==='proforma';$('#amountPaidField').hidden=type!=='receipt';$('#paymentNoteField').hidden=type==='proforma';
  if(type==='receipt')f.amountPaid.required=true;else f.amountPaid.required=false;
  if(type==='invoice')f.dueDate.required=true;else f.dueDate.required=false;
  updateTotals();
}
function nextNumber(type,date){return generateDocumentNumber(type,date||todayISO(),state.documents);}
function formData(){const f=$('#documentForm').elements;const type=f.docType.value;const t=totals();const date=f.issueDate.value;
  if(!state.profile.businessName.trim())throw new Error('Add your sender or business name in Business profile before issuing a document.');
  if(!f.customerName.value.trim())throw new Error('Enter the customer or payer name.');
  if(type!=='receipt'&&!t.items.length)throw new Error('Add at least one item.');
  if(type!=='receipt'&&t.items.some(x=>!x.description||x.quantity<=0))throw new Error('Each item needs a description and a quantity greater than zero.');
  if(type==='receipt'&&(!(Number(f.amountPaid.value)>0)||!Number.isFinite(Number(f.amountPaid.value))))throw new Error('Enter an amount received greater than zero.');
  if(type==='invoice'&&f.dueDate.value&&f.dueDate.value<date)throw new Error('The due date cannot be earlier than the issue date.');
  const amount=type==='receipt'?Number(f.amountPaid.value):t.total;
  return {id:crypto.randomUUID?crypto.randomUUID():`doc-${Date.now()}-${Math.random().toString(16).slice(2)}`,type,number:nextNumber(type,date),issueDate:date,dueDate:type==='invoice'?f.dueDate.value:'',validUntil:type==='proforma'?addDays(date,30):'',customer:{name:f.customerName.value.trim(),email:f.customerEmail.value.trim(),phone:f.customerPhone.value.trim(),address:f.customerAddress.value.trim()},sender:{...state.profile},items:type==='receipt'?[]:t.items,subtotal:type==='receipt'?amount:t.subtotal,discount:type==='receipt'?0:t.discount,taxRate:type==='receipt'?0:t.taxRate,tax:type==='receipt'?0:t.tax,extra:type==='receipt'?0:t.extra,extraLabel:f.extraLabel.value.trim(),total:amount,amountPaid:type==='receipt'?amount:0,paymentMethod:f.paymentMethod.value.trim(),paymentNote:f.paymentNote.value.trim(),notes:f.notes.value.trim(),signatureName:f.signatureName.value.trim()||state.profile.signatureName,theme:f.theme.value,status:'active',createdAt:new Date().toISOString()};
}
function createPaper(doc){
  const theme=THEMES[doc.theme]||THEMES.corporate;const isReceipt=doc.type==='receipt';
  const sender=doc.sender||state.profile;const customer=doc.customer||{};
  const addressLines=(value)=>esc(value).replace(/\n/g,'<br>');
  const lineRows=(doc.items||[]).map(item=>`<tr><td>${esc(item.description)}</td><td>${Number(item.quantity).toLocaleString('en-NG')}</td><td>${money(item.unitPrice)}</td><td>${money(item.quantity*item.unitPrice)}</td></tr>`).join('');
  const paymentDetails=doc.type==='invoice'?`<div class="paper-payment"><h4>PAYMENT DETAILS</h4>${sender.bankName?`<p><b>Bank:</b> ${esc(sender.bankName)}</p>`:''}${sender.accountName?`<p><b>Account name:</b> ${esc(sender.accountName)}</p>`:''}${sender.accountNumber?`<p><b>Account number:</b> ${esc(sender.accountNumber)}</p>`:''}${doc.paymentMethod?`<p><b>Payment method:</b> ${esc(doc.paymentMethod)}</p>`:''}${doc.paymentNote?`<p>${esc(doc.paymentNote)}</p>`:''}</div>`:doc.type==='receipt'?`<div class="paper-payment"><h4>PAYMENT RECEIVED</h4><p><b>Amount:</b> ${money(doc.amountPaid)}</p>${doc.paymentMethod?`<p><b>Method:</b> ${esc(doc.paymentMethod)}</p>`:''}${doc.paymentNote?`<p><b>Payment note:</b> ${esc(doc.paymentNote)}</p>`:''}<p>This receipt records the payment details entered by the issuer.</p></div>`:'';
  const meta=doc.type==='proforma'?`<p><b>Reference:</b> ${esc(doc.number)}</p><p><b>Date:</b> ${dateValue(doc.issueDate)}</p><p><b>Valid until:</b> ${dateValue(doc.validUntil)}</p>`:doc.type==='invoice'?`<p><b>Invoice no:</b> ${esc(doc.number)}</p><p><b>Issue date:</b> ${dateValue(doc.issueDate)}</p><p><b>Due date:</b> ${dateValue(doc.dueDate)}</p>`:`<p><b>Receipt no:</b> ${esc(doc.number)}</p><p><b>Date:</b> ${dateValue(doc.issueDate)}</p>`;
  const title=TYPE_LABELS[doc.type].toUpperCase();
  return `<article class="paper ${isReceipt?'receipt':''}" style="--doc-primary:${theme.primary};--doc-accent:${theme.accent}"><header class="paper-header"><div class="paper-brand">${sender.logoDataUrl?`<img class="paper-logo" src="${esc(sender.logoDataUrl)}" alt="Business logo">`:''}<h2>${esc(sender.businessName||'Your business')}</h2>${sender.registration?`<p>Registration: ${esc(sender.registration)}</p>`:''}${sender.address?`<p>${addressLines(sender.address)}</p>`:''}${sender.phone?`<p>${esc(sender.phone)}</p>`:''}${sender.email?`<p>${esc(sender.email)}</p>`:''}</div><div class="paper-meta"><h1>${title}</h1>${meta}</div></header><section class="paper-parties"><div><div class="paper-label">${isReceipt?'RECEIVED FROM':'BILL TO'}</div><strong>${esc(customer.name||'')}</strong>${customer.address?`<p>${addressLines(customer.address)}</p>`:''}${customer.email?`<p>${esc(customer.email)}</p>`:''}${customer.phone?`<p>${esc(customer.phone)}</p>`:''}</div>${!isReceipt?`<div><div class="paper-label">ISSUED BY</div><strong>${esc(sender.businessName||'')}</strong><p>${esc(sender.email||'')}</p><p>${esc(sender.phone||'')}</p></div>`:''}</section>${!isReceipt?`<table class="paper-items"><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${lineRows}</tbody></table><div class="paper-totals"><div><span>Subtotal</span><b>${money(doc.subtotal)}</b></div>${doc.discount?`<div><span>Discount</span><b>− ${money(doc.discount)}</b></div>`:''}${doc.tax?`<div><span>Tax (${doc.taxRate}%)</span><b>${money(doc.tax)}</b></div>`:''}${doc.extra?`<div><span>${esc(doc.extraLabel||'Additional charge')}</span><b>${money(doc.extra)}</b></div>`:''}<div class="final"><span>TOTAL</span><b>${money(doc.total)}</b></div></div>`:`<div class="paper-totals"><div class="final"><span>AMOUNT RECEIVED</span><b>${money(doc.amountPaid)}</b></div></div>`}${paymentDetails}${doc.type==='proforma'?`<p class="paper-validity">This quotation is valid for 30 calendar days, until ${dateValue(doc.validUntil)}.</p>`:''}${doc.notes?`<p class="paper-note"><b>Note:</b> ${addressLines(doc.notes)}</p>`:''}${doc.signatureName||sender.signatureDataUrl?`<div class="paper-signature">${sender.signatureDataUrl?`<img class="paper-signature-image" src="${esc(sender.signatureDataUrl)}" alt="Authorised signature">`:''}${doc.signatureName&&!sender.signatureDataUrl?`<span style="font-family:cursive;font-size:17px">${esc(doc.signatureName)}</span>`:''}<br>Authorised signature</div>`:''}<footer class="paper-footer"><span>${esc(sender.businessName||'')}</span><span>${esc(doc.number)}</span></footer></article>`;
}
function openPreview(doc){activePreviewId=doc.id;$('#previewTitle').textContent=`${TYPE_LABELS[doc.type]} · ${doc.number}`;$('#documentPreview').innerHTML=createPaper(doc);const dialog=$('#previewDialog');if(!dialog.open)dialog.showModal();}
function closePreview(){const dialog=$('#previewDialog');if(dialog.open)dialog.close();activePreviewId=null;}
function renderDocumentTable(docs,container,emptyMessage){
  if(!docs.length){container.innerHTML=`<div class="empty-state"><b>No documents yet</b>${esc(emptyMessage)}</div>`;return;}
  const rows=[...docs].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).map(doc=>`<tr><td><b>${esc(doc.customer?.name||'')}</b><br><span class="doc-number">${esc(doc.number)}</span></td><td>${esc(TYPE_LABELS[doc.type]||doc.type)}</td><td>${dateValue(doc.issueDate)}</td><td><b>${money(doc.total)}</b></td><td><span class="status-pill ${doc.status==='void'?'void':''}">${doc.status==='void'?'Void':'Active'}</span></td><td><div class="table-actions"><button class="table-action" data-action="preview" data-id="${esc(doc.id)}">View</button>${doc.status!=='void'?`<button class="table-action" data-action="void" data-id="${esc(doc.id)}">Void</button>`:''}</div></td></tr>`).join('');
  container.innerHTML=`<table class="data-table"><thead><tr><th>Customer / reference</th><th>Type</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
}
function renderDashboard(){const docs=state.documents;$('#statAll').textContent=docs.length;$('#statInvoices').textContent=docs.filter(d=>d.type==='invoice').length;$('#statProforma').textContent=docs.filter(d=>d.type==='proforma').length;$('#statReceipts').textContent=docs.filter(d=>d.type==='receipt').length;renderDocumentTable(docs.slice(-5),$('#recentTable'),'Create your first invoice, pro forma invoice or receipt.');}
function renderHistory(){const query=$('#historySearch').value.trim().toLowerCase();const type=$('#historyType').value;const status=$('#historyStatus').value;const docs=state.documents.filter(d=>(type==='all'||d.type===type)&&(status==='all'||d.status===status)&&(!query||`${d.customer?.name||''} ${d.number||''}`.toLowerCase().includes(query)));renderDocumentTable(docs,$('#historyTable'),'Your issued documents will appear here.');}
function fillProfile(){const form=$('#profileForm');Object.entries(state.profile).forEach(([key,value])=>{if(form.elements[key])form.elements[key].value=value||'';});renderUploadPreviews();}
function saveProfile(event){event.preventDefault();const form=event.currentTarget;const next={...state.profile};['businessName','registration','email','phone','address','bankName','accountName','accountNumber','signatureName'].forEach(key=>next[key]=form.elements[key].value.trim());if(!next.businessName){showNotice('Enter a business or personal name.','error');return;}state.profile=next;if(persist()){$('#profileSaved').textContent='Saved';showNotice('Business profile saved.');}}
function confirmAction(title,message,callback){const dialog=$('#confirmDialog');$('#confirmTitle').textContent=title;$('#confirmMessage').textContent=message;const proceed=$('#confirmProceed');proceed.onclick=()=>{proceed.onclick=null;callback();};dialog.showModal();}
function handleTableAction(event){const button=event.target.closest('[data-action]');if(!button)return;const doc=state.documents.find(d=>d.id===button.dataset.id);if(!doc)return;if(button.dataset.action==='preview')openPreview(doc);if(button.dataset.action==='void')confirmAction('Void this document?',`This marks ${doc.number} as void in this browser's records. It does not cancel any payment or notify the customer.`,()=>{doc.status='void';doc.voidedAt=new Date().toISOString();persist();renderDashboard();renderHistory();showNotice(`${doc.number} marked as void.`);});}
function exportBackup(){const payload={application:'Invoice Gen',schemaVersion:2,exportedAt:new Date().toISOString(),data:state};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`invoice-gen-backup-${todayISO()}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function importBackup(file){if(!file)return;try{if(file.size>10*1024*1024)throw new Error('Backup file is larger than 10 MB.');const parsed=JSON.parse(await file.text());const data=parsed.data||parsed;if(!data||!data.profile||!Array.isArray(data.documents))throw new Error('This does not look like a valid Invoice Gen backup.');confirmAction('Replace local data?','Importing this backup will replace the business profile and documents currently stored in this browser.',()=>{state={profile:{...DEFAULT_PROFILE,...data.profile},documents:data.documents,clients:Array.isArray(data.clients)?data.clients:[],settings:data.settings||{}};if(persist()){fillProfile();renderDashboard();renderHistory();showNotice('Backup imported successfully.');}});}catch(error){showNotice(error.message||'Could not read this backup file.','error');}}
function clearAllData(){confirmAction('Clear all local data?','This permanently removes the business profile and all documents saved in this browser. Export a backup first if you need a copy.',()=>{state=freshState();persist();fillProfile();renderDashboard();renderHistory();showNotice('Local data cleared.');});}
function resetDocumentForm(){const form=$('#documentForm');form.reset();form.elements.issueDate.value=todayISO();form.elements.dueDate.value=addDays(todayISO(),14);form.elements.signatureName.value=state.profile.signatureName||'';$('#itemsList').innerHTML='';addItem();updateTypeUI();}
function submitDocument(event){event.preventDefault();try{const doc=formData();state.documents.push(doc);if(!persist())return;resetDocumentForm();goTo('home');showNotice(`${doc.number} saved. Review it before printing.`);openPreview(doc);}catch(error){showNotice(error.message||'Please check the document details.','error');}}
function printCurrent(){if(!activePreviewId)return;window.print();}
function shareDocument(channel){
  const doc=state.documents.find(item=>item.id===activePreviewId);if(!doc)return;
  const lines=[`${TYPE_LABELS[doc.type]} ${doc.number}`,`From: ${doc.sender?.businessName||''}`,`To: ${doc.customer?.name||''}`,`Amount: ${money(doc.total)}`,`Date: ${dateValue(doc.issueDate)}`];
  if(doc.dueDate)lines.push(`Due date: ${dateValue(doc.dueDate)}`);
  if(doc.validUntil)lines.push(`Valid until: ${dateValue(doc.validUntil)}`);
  lines.push('I have prepared the document. You can attach the PDF copy after saving it.');
  const message=lines.join('\n');
  if(channel==='whatsapp')window.open(`https://wa.me/?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');
  if(channel==='email'){const recipient=encodeURIComponent(doc.customer?.email||'');const subject=encodeURIComponent(`${TYPE_LABELS[doc.type]} ${doc.number}`);window.location.href=`mailto:${recipient}?subject=${subject}&body=${encodeURIComponent(message)}`;}
}

function readImageFile(file){
  return new Promise((resolve,reject)=>{
    if(!file)return resolve('');
    const allowed=['image/png','image/jpeg','image/webp'];
    if(!allowed.includes(file.type))return reject(new Error('Choose a PNG, JPG or WebP image.'));
    if(file.size>500*1024)return reject(new Error('Image must be 500 KB or smaller.'));
    const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Could not read the selected image.'));reader.readAsDataURL(file);
  });
}
function renderUploadPreviews(){
  $('#logoPreview').innerHTML=state.profile.logoDataUrl?`<img src="${esc(state.profile.logoDataUrl)}" alt="Uploaded business logo">`:'No logo uploaded';
  $('#signaturePreview').innerHTML=state.profile.signatureDataUrl?`<img src="${esc(state.profile.signatureDataUrl)}" alt="Uploaded signature">`:'No signature uploaded';
}
async function handleProfileImage(inputId,fieldName){
  const input=$(`#${inputId}`);const file=input.files[0];if(!file)return;
  try{state.profile[fieldName]=await readImageFile(file);if(persist()){renderUploadPreviews();showNotice(fieldName==='logoDataUrl'?'Business logo saved.':'Signature image saved.');}}
  catch(error){showNotice(error.message,'error');}finally{input.value='';}
}
function removeProfileImage(fieldName){state.profile[fieldName]='';if(persist()){renderUploadPreviews();showNotice('Image removed from business profile.');}}

// Navigation and primary actions
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>goTo(button.dataset.view)));
$$('[data-go]').forEach(button=>button.addEventListener('click',()=>goTo(button.dataset.go)));
$('#menuToggle').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#addItem').addEventListener('click',()=>addItem());
$('#itemsList').addEventListener('click',event=>{const button=event.target.closest('.remove-item');if(!button)return;const rows=$$('.item-row');if(rows.length===1){$('.item-description',rows[0]).value='';$('.item-quantity',rows[0]).value='1';$('.item-price',rows[0]).value='0';}else button.closest('.item-row').remove();updateTotals();});
$('#documentForm').addEventListener('input',updateTotals);
$('#documentForm').addEventListener('change',event=>{if(event.target.name==='docType')updateTypeUI();if(event.target.name==='theme')updateTotals();});
$('#documentForm').addEventListener('submit',submitDocument);
$('#profileForm').addEventListener('submit',saveProfile);
$('#logoUpload').addEventListener('change',()=>handleProfileImage('logoUpload','logoDataUrl'));
$('#signatureUpload').addEventListener('change',()=>handleProfileImage('signatureUpload','signatureDataUrl'));
$('#clearLogo').addEventListener('click',()=>removeProfileImage('logoDataUrl'));
$('#clearSignature').addEventListener('click',()=>removeProfileImage('signatureDataUrl'));
$('#historySearch').addEventListener('input',renderHistory);$('#historyType').addEventListener('change',renderHistory);$('#historyStatus').addEventListener('change',renderHistory);
$('#recentTable').addEventListener('click',handleTableAction);$('#historyTable').addEventListener('click',handleTableAction);
$('#printDocument').addEventListener('click',printCurrent);$('#shareWhatsApp').addEventListener('click',()=>shareDocument('whatsapp'));$('#emailDocument').addEventListener('click',()=>shareDocument('email'));$('#closePreview').addEventListener('click',closePreview);
$('#previewDialog').addEventListener('click',event=>{if(event.target===$('#previewDialog'))closePreview();});
$('#exportBackup').addEventListener('click',exportBackup);$('#importBackup').addEventListener('change',event=>{importBackup(event.target.files[0]);event.target.value='';});$('#clearData').addEventListener('click',clearAllData);

// PWA service worker is optional for local development and is served from the project root in deployment.
if('serviceWorker' in navigator && location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(error=>console.warn('Offline caching could not be enabled:',error)));

resetDocumentForm();renderDashboard();
