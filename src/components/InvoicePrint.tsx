"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";

interface InvoicePrintProps {
  invoiceId: string;
  onBack: () => void;
}

export default function InvoicePrint({ invoiceId, onBack }: InvoicePrintProps) {
  const [invoice, setInvoice] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [invoiceRes, profileRes] = await Promise.all([
          fetch(`/api/invoices/${invoiceId}`),
          fetch("/api/profile")
        ]);
        const invoiceData = await invoiceRes.json();
        const profileData = await profileRes.json();
        
        setInvoice(invoiceData);
        setProfile(profileData);
      } catch (e) {
        console.error("Error loading invoice for print:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center no-print">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-2 text-slate-400">Loading high-fidelity print template...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center text-slate-400 no-print">
        <p>Invoice not found.</p>
        <button onClick={onBack} className="mt-4 text-emerald-500 hover:underline">Go Back</button>
      </div>
    );
  }

  // Calculate tax breakdown
  const sellerState = profile?.state || "33-Tamil Nadu";
  const sellerStateCode = sellerState.split("-")[0];
  const buyerStateCode = invoice.customerState.split("-")[0];
  const isIntraState = sellerStateCode === buyerStateCode;

  // Group items by HSN for tax summary
  const hsnSummary: Record<string, { taxable: number; rate: number; cgst: number; sgst: number; igst: number; totalTax: number }> = {};
  invoice.items.forEach((item: any) => {
    const hsn = item.hsnCode || "500720";
    const rate = item.gstRate;
    const taxable = item.quantity * item.price;
    const tax = item.gstAmount;

    if (!hsnSummary[hsn]) {
      hsnSummary[hsn] = { taxable: 0, rate, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    }
    hsnSummary[hsn].taxable += taxable;
    hsnSummary[hsn].totalTax += tax;
    if (isIntraState) {
      hsnSummary[hsn].cgst += tax / 2;
      hsnSummary[hsn].sgst += tax / 2;
    } else {
      hsnSummary[hsn].igst += tax;
    }
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Control Banner - Hides on Print */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/40 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Print Preview</h1>
            <p className="text-xs text-slate-400">Review layout before generating hard-copy A4 or saving to PDF.</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition active:scale-95 shadow-md shadow-emerald-950/25 animate-pulse hover:animate-none"
        >
          <Printer className="h-4 w-4" /> Print Invoice
        </button>
      </div>

      {/* A4 Invoice Paper Container */}
      <div className="mx-auto w-[210mm] min-h-[297mm] bg-white text-black p-8 font-sans border border-slate-300 rounded shadow-2xl overflow-hidden print-invoice-container print:shadow-none print:border-none print:p-0">
        
        {/* Border Box to encase the entire invoice */}
        <div className="border-2 border-black flex flex-col h-full">
          
          {/* Section 1: Header / Document Title */}
          <div className="text-center py-2 border-b-2 border-black bg-slate-100 font-black text-sm tracking-wider uppercase">
            Tax Invoice
          </div>

          {/* Section 2: Seller vs Invoice Details Split */}
          <div className="grid grid-cols-2 border-b-2 border-black divide-x-2 divide-black">
            {/* Left Box: Seller (ASP SILKS) */}
            <div className="p-3 space-y-1">
              <div className="flex items-center gap-3">
                {profile?.logo && (
                  <img src={profile.logo} alt="Company logo" className="h-10 w-10 object-contain shrink-0" />
                )}
                <div>
                  <h3 className="font-extrabold text-base tracking-tight uppercase">{profile?.name || "ASP SILKS"}</h3>
                  <span className="text-[10px] text-slate-600 font-semibold block">Textile Merchants & Exporters</span>
                </div>
              </div>
              <p className="text-[10px] whitespace-pre-line text-slate-700 font-medium leading-relaxed mt-2">{profile?.address}</p>
              <div className="text-[10px] text-slate-800 space-y-0.5 pt-1">
                <p><strong>GSTIN:</strong> {profile?.gstin}</p>
                <p><strong>State:</strong> {profile?.state}</p>
                <p><strong>Contact:</strong> {profile?.phone}</p>
                {profile?.email && <p><strong>Email:</strong> {profile.email}</p>}
              </div>
            </div>

            {/* Right Box: Invoice Details */}
            <div className="p-3 grid grid-cols-2 gap-y-2 text-[10px] text-slate-800">
              <div className="border-b border-r border-slate-300 pb-1 pr-1">
                <span className="text-[8px] text-slate-500 block uppercase font-bold">Invoice Number</span>
                <strong className="text-sm font-extrabold">{invoice.invoiceNo}</strong>
              </div>
              <div className="border-b border-slate-300 pb-1 pl-1">
                <span className="text-[8px] text-slate-500 block uppercase font-bold">Invoice Date</span>
                <strong>{new Date(invoice.invoiceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
              </div>
              <div className="border-b border-r border-slate-300 pb-1 pr-1">
                <span className="text-[8px] text-slate-500 block uppercase font-bold">Place of Supply</span>
                <strong>{invoice.placeOfSupply}</strong>
              </div>
              <div className="border-b border-slate-300 pb-1 pl-1">
                <span className="text-[8px] text-slate-500 block uppercase font-bold">Due Date</span>
                <strong>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}</strong>
              </div>
              
              {invoice.ewayBillNo && (
                <div className="col-span-2 border-b border-slate-300 pb-1">
                  <span className="text-[8px] text-slate-500 block uppercase font-bold">E-Way Bill Number</span>
                  <strong className="text-xs font-black">{invoice.ewayBillNo}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Bill To Customer */}
          <div className="p-3 border-b-2 border-black bg-slate-50/50">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Details of Buyer (Bill To)</span>
            <div className="mt-1 flex flex-col md:flex-row justify-between">
              <div>
                <h4 className="font-extrabold text-sm uppercase">{invoice.customerName}</h4>
                <p className="text-[10px] text-slate-700 whitespace-pre-line leading-relaxed mt-1">{invoice.customerAddress}</p>
              </div>
              <div className="text-[10px] text-slate-800 space-y-0.5 mt-2 md:mt-0 text-left md:text-right">
                <p><strong>GSTIN:</strong> {invoice.customerGstin || "URP (Unregistered)"}</p>
                <p><strong>State:</strong> {invoice.customerState}</p>
                <p><strong>Contact:</strong> {invoice.customerContact}</p>
              </div>
            </div>
          </div>

          {/* Section 4: Main Items Table */}
          <div className="flex-1 min-h-[300px]">
            <table className="w-full text-left text-[10px] print-table border-collapse">
              <thead>
                <tr className="bg-slate-100 uppercase font-black text-slate-800 border-b border-black text-[9px] h-8">
                  <th className="px-2 py-1 text-center w-8 border-r border-black">S.No</th>
                  <th className="px-3 py-1 border-r border-black">Description of Goods</th>
                  <th className="px-2 py-1 border-r border-black text-center w-20">Design No</th>
                  <th className="px-2 py-1 border-r border-black text-center w-16">HSN/SAC</th>
                  <th className="px-2 py-1 border-r border-black text-right w-12">Qty</th>
                  <th className="px-2 py-1 border-r border-black text-center w-12">Unit</th>
                  <th className="px-2 py-1 border-r border-black text-right w-20">Rate</th>
                  <th className="px-2 py-1 border-r border-black text-right w-12">GST %</th>
                  <th className="px-2 py-1 text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {invoice.items.map((item: any, index: number) => (
                  <tr key={item.id} className="h-8">
                    <td className="px-2 py-1 text-center border-r border-black font-semibold">{index + 1}</td>
                    <td className="px-3 py-1 border-r border-black font-bold uppercase">{item.name}</td>
                    <td className="px-2 py-1 border-r border-black text-center uppercase">{item.designNo || "-"}</td>
                    <td className="px-2 py-1 border-r border-black text-center font-mono">{item.hsnCode}</td>
                    <td className="px-2 py-1 border-r border-black text-right font-medium">{item.quantity}</td>
                    <td className="px-2 py-1 border-r border-black text-center">{item.unit}</td>
                    <td className="px-2 py-1 border-r border-black text-right font-medium">{formatCurrency(item.price)}</td>
                    <td className="px-2 py-1 border-r border-black text-right font-medium">{item.gstRate}%</td>
                    <td className="px-2 py-1 text-right font-bold">{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
                {/* Empty rows to push the content down and give A4 structured feel */}
                {Array.from({ length: Math.max(0, 8 - invoice.items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-8 select-none">
                    <td className="border-r border-black">&nbsp;</td>
                    <td className="border-r border-black">&nbsp;</td>
                    <td className="border-r border-black">&nbsp;</td>
                    <td className="border-r border-black">&nbsp;</td>
                    <td className="border-r border-black">&nbsp;</td>
                    <td className="border-r border-black">&nbsp;</td>
                    <td className="border-r border-black">&nbsp;</td>
                    <td className="border-r border-black">&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 5: Totals & Sub-totals */}
          <div className="grid grid-cols-5 border-t-2 border-black divide-x divide-black text-[10px] text-slate-800">
            {/* Amount In Words (Col span 3) */}
            <div className="col-span-3 p-3 flex flex-col justify-between">
              <div>
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">Total Amount in Words</span>
                <strong className="text-[11px] font-black italic block mt-1 capitalize leading-relaxed">
                  {invoice.grandTotalWords}
                </strong>
              </div>
            </div>

            {/* Calculations Detail (Col span 2) */}
            <div className="col-span-2 divide-y divide-slate-300 font-bold">
              <div className="flex justify-between px-3 py-1.5">
                <span className="text-slate-500 font-medium">Sub Total (Taxable)</span>
                <span>{formatCurrency(invoice.subTotal)}</span>
              </div>
              <div className="flex justify-between px-3 py-1.5">
                <span className="text-slate-500 font-medium">Total Tax (GST)</span>
                <span>{formatCurrency(invoice.totalTax)}</span>
              </div>
              {invoice.roundOff !== 0 && (
                <div className="flex justify-between px-3 py-1.5">
                  <span className="text-slate-500 font-medium">Round Off</span>
                  <span className={invoice.roundOff > 0 ? "text-emerald-700" : "text-slate-800"}>
                    {invoice.roundOff > 0 ? `+${formatCurrency(invoice.roundOff)}` : `-${formatCurrency(Math.abs(invoice.roundOff))}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between px-3 py-2 bg-slate-100 text-sm font-black text-black">
                <span>Grand Total</span>
                <span className="text-base">{formatCurrency(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Section 6: GST Breakdown Table */}
          <div className="border-t-2 border-black">
            <div className="bg-slate-50 px-3 py-1 font-extrabold text-[9px] uppercase border-b border-black select-none tracking-wider">
              Tax Breakup Grouped by HSN Code
            </div>
            <table className="w-full text-[9px] print-table border-collapse text-left">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-black text-slate-700">
                  <th className="px-3 py-1 border-r border-black">HSN/SAC</th>
                  <th className="px-3 py-1 border-r border-black text-right">Taxable Value</th>
                  {isIntraState ? (
                    <>
                      <th className="px-3 py-1 border-r border-black text-right">CGST Rate</th>
                      <th className="px-3 py-1 border-r border-black text-right">CGST Amount</th>
                      <th className="px-3 py-1 border-r border-black text-right">SGST Rate</th>
                      <th className="px-3 py-1 border-r border-black text-right">SGST Amount</th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-1 border-r border-black text-right">IGST Rate</th>
                      <th className="px-3 py-1 border-r border-black text-right">IGST Amount</th>
                    </>
                  )}
                  <th className="px-3 py-1 text-right">Total Tax Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {Object.entries(hsnSummary).map(([hsn, data]: any) => (
                  <tr key={hsn}>
                    <td className="px-3 py-1.5 border-r border-black font-semibold">{hsn}</td>
                    <td className="px-3 py-1.5 border-r border-black text-right">{formatCurrency(data.taxable)}</td>
                    {isIntraState ? (
                      <>
                        <td className="px-3 py-1.5 border-r border-black text-right">{data.rate / 2}%</td>
                        <td className="px-3 py-1.5 border-r border-black text-right">{formatCurrency(data.cgst)}</td>
                        <td className="px-3 py-1.5 border-r border-black text-right">{data.rate / 2}%</td>
                        <td className="px-3 py-1.5 border-r border-black text-right">{formatCurrency(data.sgst)}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-1.5 border-r border-black text-right">{data.rate}%</td>
                        <td className="px-3 py-1.5 border-r border-black text-right">{formatCurrency(data.igst)}</td>
                      </>
                    )}
                    <td className="px-3 py-1.5 text-right font-bold">{formatCurrency(data.totalTax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 7: Footer (Bank, Terms, Signatory Split) */}
          <div className="grid grid-cols-3 border-t-2 border-black divide-x-2 divide-black text-[9px] text-slate-800 border-collapse h-32">
            {/* Left footer: Bank Settlings */}
            <div className="p-3 space-y-1">
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Seller Bank Settlings</span>
              <div className="space-y-0.5 text-slate-700 leading-tight">
                <p><strong>Bank:</strong> {profile?.bankName}</p>
                <p><strong>Branch:</strong> {profile?.bankBranch}</p>
                <p><strong>Account Name:</strong> {profile?.bankHolderName}</p>
                <p><strong>A/C No:</strong> {profile?.bankAccountNo}</p>
                <p><strong>IFSC:</strong> {profile?.bankIfsc}</p>
              </div>
            </div>

            {/* Middle footer: Terms & Conditions */}
            <div className="p-3 space-y-1">
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Terms & Conditions</span>
              <p className="text-[8px] leading-tight text-slate-600 whitespace-pre-line mt-1">
                {invoice.terms || "Goods once sold cannot be returned. Please check specifications before checkout."}
              </p>
            </div>

            {/* Right footer: Signatory */}
            <div className="p-3 flex flex-col justify-between items-center text-center">
              <div>
                <span className="text-[8px] text-slate-500 font-semibold block">For Trade Business</span>
                <strong className="text-[10px] font-black uppercase text-slate-900 block mt-0.5">{profile?.name || "ASP SILKS"}</strong>
              </div>
              <div className="border-t border-slate-400 w-36 pt-1 text-[8px] text-slate-500">
                Authorized Signatory
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
