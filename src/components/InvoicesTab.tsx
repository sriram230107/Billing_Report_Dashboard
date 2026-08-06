"use client";

import React, { useEffect, useState } from "react";
import { 
  FileText, 
  Search, 
  Plus, 
  Calendar, 
  Printer, 
  Edit3, 
  Copy, 
  XCircle, 
  Loader2, 
  CheckCircle2, 
  IndianRupee, 
  ArrowRight,
  ChevronDown
} from "lucide-react";

interface InvoicesTabProps {
  setActiveTab: (tab: string) => void;
  setDraftInvoice: (invoice: any) => void;
  setIsEditingInvoice: (val: boolean) => void;
  setPrintInvoiceId: (id: string) => void;
}

export default function InvoicesTab({ 
  setActiveTab, 
  setDraftInvoice, 
  setIsEditingInvoice, 
  setPrintInvoiceId 
}: InvoicesTabProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Payment Quick Update States
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<any>(null);
  const [quickStatus, setQuickStatus] = useState("Paid");
  const [quickMode, setQuickMode] = useState("UPI");
  const [quickAmountPaid, setQuickAmountPaid] = useState("");
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.append("status", statusFilter);
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const res = await fetch(`/api/invoices?${queryParams.toString()}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        // Client-side search filters for name and invoice number
        const filtered = data.filter((inv) =>
          inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
          inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
          (inv.ewayBillNo && inv.ewayBillNo.includes(search))
        );
        setInvoices(filtered);
      }
    } catch (e) {
      console.error("Error loading invoices:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, startDate, endDate, search]);

  const handleVoid = async (id: string) => {
    if (!confirm("Are you sure you want to void/cancel this invoice? This reverses stock reductions and customer balances, and cannot be undone.")) return;

    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to void invoice");

      alert("Invoice cancelled/voided successfully!");
      fetchInvoices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDuplicate = async (invoice: any) => {
    if (!confirm("Do you want to create a duplicate draft of this invoice? This will import all line items into the creator form.")) return;

    // Set the items to draft (generating new IDs) and navigation
    const duplicatedItems = invoice.items.map((line: any) => ({
      itemId: line.itemId || "",
      name: line.name,
      designNo: line.designNo || "",
      hsnCode: line.hsnCode,
      quantity: line.quantity,
      unit: line.unit,
      price: line.price,
      gstRate: line.gstRate
    }));

    setDraftInvoice({
      ...invoice,
      id: null,
      invoiceNo: "",
      items: duplicatedItems,
      ewayBillNo: "",
      invoiceDate: new Date().toISOString().split("T")[0]
    });
    setIsEditingInvoice(false);
    setActiveTab("create-invoice");
  };

  const handleOpenPaymentPopup = (invoice: any) => {
    setActivePaymentInvoice(invoice);
    setQuickStatus(invoice.status === "Cancelled" ? "Unpaid" : invoice.status);
    setQuickMode(invoice.paymentMode || "UPI");
    setQuickAmountPaid(invoice.amountPaid.toString());
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentInvoice) return;

    try {
      setUpdatingPayment(true);
      const grandTotal = activePaymentInvoice.grandTotal;
      const amount = quickStatus === "Paid" ? grandTotal : (quickStatus === "Partially Paid" ? parseFloat(quickAmountPaid) : 0);

      const payload = {
        ...activePaymentInvoice,
        status: quickStatus,
        paymentMode: quickStatus === "Unpaid" ? null : quickMode,
        paymentDate: quickStatus === "Unpaid" ? null : new Date(),
        amountPaid: amount,
      };

      const res = await fetch(`/api/invoices/${activePaymentInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update payment status");

      setActivePaymentInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingPayment(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400">Paid</span>;
      case "Partially Paid":
        return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-400">Partial</span>;
      case "Cancelled":
        return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-slate-800 px-2 py-0.5 text-slate-500">Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-red-500/10 px-2 py-0.5 text-red-400">Unpaid</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Invoice History</h1>
          <p className="mt-1 text-slate-400">Search, track payments, duplicate, edit, or print GST invoices.</p>
        </div>
        <button
          onClick={() => {
            setDraftInvoice(null);
            setIsEditingInvoice(false);
            setActiveTab("create-invoice");
          }}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition active:scale-95 shadow-md shadow-emerald-950/20"
        >
          <Plus className="h-4 w-4" /> New Invoice
        </button>
      </div>

      {/* Filter Row */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 p-4 rounded-xl border border-slate-800 bg-slate-900/40">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by invoice no, customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 py-1.5 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="">All Statuses</option>
            <option value="Paid">Fully Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Dates */}
        <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2">
          <Calendar className="h-3.5 w-3.5 text-slate-500 mr-2" />
          <input
            type="date"
            placeholder="Start"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-transparent border-none py-1 text-xs text-slate-300 focus:outline-none"
          />
        </div>

        <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2">
          <Calendar className="h-3.5 w-3.5 text-slate-500 mr-2" />
          <input
            type="date"
            placeholder="End"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-transparent border-none py-1 text-xs text-slate-300 focus:outline-none"
          />
        </div>
      </div>

      {/* Invoice List Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-xs divide-y divide-slate-800">
            <thead className="bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase select-none">
              <tr>
                <th className="px-4 py-3">Invoice No</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Amount Paid</th>
                <th className="px-4 py-3 text-right">Grand Total</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/5">
              {loading && invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mx-auto" />
                    <span className="mt-2 block">Loading invoices...</span>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No matching invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-900/20">
                    {/* Invoice No */}
                    <td className="px-4 py-4 font-extrabold text-slate-200">{inv.invoiceNo}</td>
                    
                    {/* Date */}
                    <td className="px-4 py-4 text-slate-400">
                      {new Date(inv.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-4">
                      <div>
                        <strong className="text-slate-200 font-bold block">{inv.customerName}</strong>
                        <span className="text-[10px] text-slate-500">{inv.customerState}</span>
                      </div>
                    </td>

                    {/* Status Badge (interactive click to update status) */}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => inv.status !== "Cancelled" && handleOpenPaymentPopup(inv)}
                        className={`group relative flex items-center justify-center gap-1 mx-auto ${inv.status !== "Cancelled" ? "cursor-pointer hover:opacity-85" : "cursor-default"}`}
                      >
                        {getStatusBadge(inv.status)}
                        {inv.status !== "Cancelled" && (
                          <ChevronDown className="h-3 w-3 text-slate-500 group-hover:text-slate-300 transition shrink-0" />
                        )}
                      </button>
                    </td>

                    {/* Paid */}
                    <td className="px-4 py-4 text-right font-semibold text-slate-300">
                      {formatCurrency(inv.amountPaid)}
                    </td>

                    {/* Total */}
                    <td className="px-4 py-4 text-right font-black text-slate-100">
                      {formatCurrency(inv.grandTotal)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        {/* Print */}
                        <button
                          onClick={() => setPrintInvoiceId(inv.id)}
                          title="Print / View Invoice"
                          className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/35 transition active:scale-90"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        
                        {/* Edit (Disable if cancelled) */}
                        <button
                          onClick={() => {
                            setDraftInvoice(inv);
                            setIsEditingInvoice(true);
                            setActiveTab("create-invoice");
                          }}
                          disabled={inv.status === "Cancelled"}
                          title="Edit Invoice"
                          className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-blue-400 hover:border-blue-500/35 transition active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(inv)}
                          title="Duplicate Invoice"
                          className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-purple-400 hover:border-purple-500/35 transition active:scale-90"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>

                        {/* Void (Only if active) */}
                        <button
                          onClick={() => handleVoid(inv.id)}
                          disabled={inv.status === "Cancelled"}
                          title="Void / Cancel Invoice"
                          className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-500 hover:text-red-500 hover:border-red-500/35 transition active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Quick Update Modal */}
      {activePaymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
              <div>
                <h3 className="text-sm font-bold text-white uppercase">Update Payment</h3>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{activePaymentInvoice.invoiceNo}</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePaymentInvoice(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePayment} className="p-6 space-y-4">
              {/* Grand Total Indicator */}
              <div className="p-3 bg-slate-950 rounded-lg flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Total Amount:</span>
                <strong className="text-sm font-black text-emerald-400">{formatCurrency(activePaymentInvoice.grandTotal)}</strong>
              </div>

              {/* Status Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Payment Status</label>
                <select
                  value={quickStatus}
                  onChange={(e) => setQuickStatus(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="Paid">Fully Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              {/* Mode & Amount */}
              {quickStatus !== "Unpaid" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Payment Method</label>
                    <select
                      value={quickMode}
                      onChange={(e) => setQuickMode(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">
                      {quickStatus === "Paid" ? "Amount Paid (Locked)" : "Amount Paid (₹)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={quickStatus === "Paid"}
                      value={quickStatus === "Paid" ? activePaymentInvoice.grandTotal : quickAmountPaid}
                      onChange={(e) => setQuickAmountPaid(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none disabled:opacity-55"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActivePaymentInvoice(null)}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPayment}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white transition disabled:opacity-55 shadow-md shadow-emerald-950/20"
                >
                  {updatingPayment && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
