export function formatNaira(value) {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(amount);
}

export function calculateAmounts(items, discount = 0, taxRate = 0, extra = 0) {
  const cleanItems = (Array.isArray(items) ? items : []).map(item => ({
    description: String(item.description ?? '').trim(),
    quantity: Math.max(0, Number(item.quantity) || 0),
    unitPrice: Math.max(0, Number(item.unitPrice) || 0)
  }));
  const subtotal = cleanItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const cleanDiscount = Math.min(subtotal, Math.max(0, Number(discount) || 0));
  const taxable = Math.max(0, subtotal - cleanDiscount);
  const cleanTaxRate = Math.min(100, Math.max(0, Number(taxRate) || 0));
  const tax = taxable * cleanTaxRate / 100;
  const cleanExtra = Math.max(0, Number(extra) || 0);
  return {
    items: cleanItems,
    subtotal,
    discount: cleanDiscount,
    taxRate: cleanTaxRate,
    tax,
    extra: cleanExtra,
    total: taxable + tax + cleanExtra
  };
}

export function addCalendarDays(isoDate, days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoDate))) throw new TypeError('Date must use YYYY-MM-DD format.');
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new TypeError('Invalid calendar date.');
  }
  date.setUTCDate(date.getUTCDate() + Number(days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function generateDocumentNumber(type, issueDate, documents = []) {
  const prefixByType = { invoice: 'INV', proforma: 'PFI', receipt: 'RCT' };
  const prefix = prefixByType[type];
  if (!prefix) throw new TypeError(`Unsupported document type: ${type}`);
  const year = String(issueDate).slice(0, 4);
  if (!/^\d{4}$/.test(year)) throw new TypeError('Issue date must begin with a four-digit year.');
  const sequence = (Array.isArray(documents) ? documents : [])
    .filter(doc => doc.type === type && String(doc.issueDate || '').startsWith(year))
    .map(doc => Number(String(doc.number || '').split('-').at(-1)) || 0);
  return `${prefix}-${year}-${String(Math.max(0, ...sequence) + 1).padStart(4, '0')}`;
}
