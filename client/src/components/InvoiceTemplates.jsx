import React from 'react';
import logoImg from '../assets/logo.png';

const InvoiceLayout = ({ invoice, settings = {} }) => {
  const clientInfo = invoice.clientDetailsSnapshot || invoice.client || {};
  const items = invoice.items || [];
  
  // Calculate average/effective tax rate
  const taxRateVal = invoice.subtotal > 0 ? (invoice.taxAmount / invoice.subtotal) * 100 : 0;
  
  // To match the screenshot, we want a fixed number of rows (e.g. 7 rows total)
  const totalRowsCount = Math.max(7, items.length);
  const rowIndexes = Array.from({ length: totalRowsCount }, (_, i) => i);
 
  // Safely get settings values with fallback empty strings
  const companyName = settings.name || 'Your Company Name';
  const companyStreet = settings.address?.street || 'Street Address';
  const companyCity = settings.address?.city || '';
  const companyState = settings.address?.state || '';
  const companyZip = settings.address?.zipCode || '';
  const companyCityStateZip = [companyCity, companyState, companyZip].filter(Boolean).join(', ') || 'City, State, Zip/Postal Code';
  const companyPhone = settings.phone || 'Phone';
  const companyEmail = settings.email || 'Email';
 
  // Format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };
 
  return (
    <div className="bg-white p-10 font-sans text-slate-800 shadow-lg w-full max-w-4xl mx-auto border border-slate-200 select-none min-w-[760px]">
      {/* Edge-to-edge Header */}
      <div className="bg-[#1b5e75] text-white p-6 -mx-10 -mt-10 mb-8 flex justify-between items-start">
        <div className="flex items-center gap-5">
          <div className="bg-white p-2 rounded-xl shadow-sm flex items-center justify-center w-28 h-16 shrink-0">
            <img src={logoImg} alt="Manshu Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-wider uppercase leading-none select-none">INVOICE</h1>
        </div>
        <div className="text-right text-xs space-y-1">
          <p className="font-bold text-sm">{companyName}</p>
          <p>{companyStreet}</p>
          <p>{companyCityStateZip}</p>
          <p>{companyPhone}</p>
          <p>{companyEmail}</p>
        </div>
      </div>

      {/* Metadata & Billed To details */}
      <div className="grid grid-cols-2 gap-8 text-xs mb-6">
        {/* Left: Invoice Metadata */}
        <div className="space-y-2">
          <p><span className="font-bold text-slate-900">Invoice No.</span> <span className="ml-4 font-semibold text-slate-700">{invoice.invoiceNumber || 'Draft'}</span></p>
          <p><span className="font-bold text-slate-900">Date of Issue</span> <span className="ml-3 text-slate-700">{formatDate(invoice.invoiceDate) || 'Enter Date Here'}</span></p>
          <p><span className="font-bold text-slate-900">Due Date</span> <span className="ml-9 text-slate-700">{formatDate(invoice.dueDate) || 'Enter Due Date Here'}</span></p>
        </div>

        {/* Right: Bill To details */}
        <div className="text-right space-y-1">
          <p className="font-bold text-slate-900 text-sm uppercase tracking-wide">Bill To</p>
          <p className="font-bold text-slate-850">{clientInfo.company || clientInfo.name || 'Client Company Name'}</p>
          <p className="text-slate-600">{clientInfo.address?.street || 'Address'}</p>
          <p className="text-slate-600">{clientInfo.phone || 'Phone'}</p>
          <p className="text-slate-600">{clientInfo.email || 'Email'}</p>
        </div>
      </div>

      {/* Horizontal thick black line */}
      <hr className="border-t-2 border-slate-800 my-4" />

      {/* Table */}
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="font-bold text-slate-900 border-b border-slate-800 uppercase tracking-wider text-[10px]">
            <th className="py-2 w-16">Item</th>
            <th className="py-2">Description</th>
            <th className="py-2 text-center w-28">No. of Slides</th>
            <th className="py-2 text-right w-24">Rate</th>
            <th className="py-2 text-right w-28">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rowIndexes.map((idx) => {
            const item = items[idx];
            if (item) {
              return (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="py-3 font-semibold text-slate-900 pl-1">{idx + 1}</td>
                  <td className="py-3 text-slate-700">
                    <p className="font-semibold text-slate-900">{item.itemName}</p>
                    {item.description && <p className="text-[10px] text-slate-400 mt-0.5 font-normal">{item.description}</p>}
                  </td>
                  <td className="py-3 text-center text-slate-750 font-semibold">{item.quantity}</td>
                  <td className="py-3 text-right text-slate-750">{invoice.currency || 'INR'} {item.rate?.toFixed(2)}</td>
                  <td className="py-3 text-right text-slate-900 font-semibold pr-1">{invoice.currency || 'INR'} {item.amount?.toFixed(2)}</td>
                </tr>
              );
            } else {
              // Alternating shaded grid rows
              const isEven = idx % 2 === 0;
              return (
                <tr key={idx} className="border-b border-slate-150 h-8">
                  <td colSpan="5" className={isEven ? "bg-slate-50/50" : ""}></td>
                </tr>
              );
            }
          })}
        </tbody>
      </table>

      {/* Table bottom double rule/thick border */}
      <hr className="border-t-2 border-slate-800 mt-1 mb-6" />

      {/* Calculations & Notes */}
      <div className="grid grid-cols-2 gap-8 text-xs">
        {/* Left: Terms */}
        <div className="space-y-2">
          <p className="font-bold text-slate-900 text-sm uppercase tracking-wider">Terms</p>
          <p className="text-slate-500 leading-relaxed whitespace-pre-wrap">{invoice.notes || settings.termsAndConditions || 'Thank you for your business!'}</p>
        </div>

        {/* Right: Totals */}
        <div className="space-y-2.5">
          <div className="flex justify-between text-slate-650">
            <span className="font-bold text-slate-900">Subtotal</span>
            <span>{invoice.currency || 'INR'} {invoice.subtotal?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-650">
            <span className="font-bold text-slate-900">Discount</span>
            <span>{invoice.currency || 'INR'} {invoice.discountAmount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-650">
            <span className="font-bold text-slate-900">Tax Rate</span>
            <span>{taxRateVal.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between text-slate-650">
            <span className="font-bold text-slate-900">Tax</span>
            <span>{invoice.currency || 'INR'} {invoice.taxAmount?.toFixed(2)}</span>
          </div>
          
          {/* Thick Divider line */}
          <hr className="border-t-2 border-purple-800/80 my-2" />

          {/* Highlighted Total box */}
          <div className="flex justify-between items-center py-2 bg-sky-100/60 border border-sky-200/40 rounded pl-3 pr-3">
            <span className="font-bold text-slate-900 text-sm">Total</span>
            <span className="font-extrabold text-base text-slate-950">{invoice.currency || 'INR'} {invoice.grandTotal?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Teal band */}
      <div className="bg-[#1b5e75] text-white text-center py-3.5 px-6 -mx-10 -mb-10 mt-12 text-xs font-semibold uppercase tracking-wider select-none">
        Thank you for your business!
      </div>
    </div>
  );
};

export const ClassicTemplate = ({ invoice, settings }) => <InvoiceLayout invoice={invoice} settings={settings} />;
export const ModernTemplate = ({ invoice, settings }) => <InvoiceLayout invoice={invoice} settings={settings} />;
export const CorporateTemplate = ({ invoice, settings }) => <InvoiceLayout invoice={invoice} settings={settings} />;
export const MinimalTemplate = ({ invoice, settings }) => <InvoiceLayout invoice={invoice} settings={settings} />;
