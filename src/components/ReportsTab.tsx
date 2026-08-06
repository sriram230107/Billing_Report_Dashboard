"use client";

import React, { useEffect, useState } from "react";
import { 
  FileText, 
  Download, 
  Calendar, 
  IndianRupee, 
  TrendingUp, 
  Users, 
  Package, 
  Loader2, 
  Database,
  AlertTriangle
} from "lucide-react";

export default function ReportsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const res = await fetch(`/api/reports?${queryParams.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Error loading report metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

  // CSV/JSON Export Utilities
  const downloadJSONBackup = async () => {
    try {
      const [invoicesRes, customersRes, itemsRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/customers"),
        fetch("/api/items")
      ]);
      
      const invoices = await invoicesRes.json();
      const customers = await customersRes.json();
      const items = await itemsRes.json();

      const backupData = {
        exportedAt: new Date().toISOString(),
        invoices,
        customers,
        items
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ASP_Silks_Backup_${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to export JSON backup.");
    }
  };

  const convertToCSV = (headers: string[], rows: any[][]) => {
    const headerRow = headers.join(",");
    const dataRows = rows.map(row => 
      row.map(val => {
        if (val === null || val === undefined) return '""';
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(",")
    );
    return [headerRow, ...dataRows].join("\n");
  };

  const exportInvoicesCSV = () => {
    if (!data?.itemSales) return;
    
    // Let's fetch all invoices for full CSV rows
    fetch("/api/invoices")
      .then(res => res.json())
      .then(invoices => {
        if (!Array.isArray(invoices)) return;

        const headers = ["Invoice No", "Date", "Customer Name", "Customer GSTIN", "Place of Supply", "Subtotal (₹)", "GST Tax (₹)", "Round Off", "Grand Total (₹)", "Status", "Payment Mode"];
        const rows = invoices.map(inv => [
          inv.invoiceNo,
          new Date(inv.invoiceDate).toLocaleDateString("en-IN"),
          inv.customerName,
          inv.customerGstin || "Unregistered",
          inv.placeOfSupply,
          inv.subTotal,
          inv.totalTax,
          inv.roundOff,
          inv.grandTotal,
          inv.status,
          inv.paymentMode || "-"
        ]);

        const csvContent = convertToCSV(headers, rows);
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ASP_Silks_Sales_Report_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      });
  };

  const exportCustomersCSV = () => {
    fetch("/api/customers")
      .then(res => res.json())
      .then(customers => {
        if (!Array.isArray(customers)) return;

        const headers = ["Customer Name", "Contact", "GSTIN", "State Code", "Outstanding Ledger Balance (₹)", "Billing Address"];
        const rows = customers.map(c => [
          c.name,
          c.contact || "-",
          c.gstin || "Unregistered",
          c.state,
          c.balance,
          c.address || "-"
        ]);

        const csvContent = convertToCSV(headers, rows);
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ASP_Silks_Parties_Master_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-2 text-slate-400">Compiling financial ledgers...</span>
      </div>
    );
  }

  const summary = data?.summary || {
    totalSales: 0,
    totalTaxCollected: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    cgst: 0,
    sgst: 0,
    igst: 0
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Reports & Backups</h1>
          <p className="mt-1 text-slate-400">Analyze sales summaries, file tax declarations, and archive files.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadJSONBackup}
            className="flex items-center gap-2 rounded-lg border border-slate-800 hover:border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 transition active:scale-95 shadow"
          >
            <Database className="h-4 w-4 text-slate-400" /> Full DB JSON Backup
          </button>
        </div>
      </div>

      {/* Date Filters Card */}
      <div className="flex gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/40 w-fit">
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2 text-xs">
          <Calendar className="h-3.5 w-3.5 text-slate-500 mr-2 shrink-0" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent border-none py-1.5 focus:outline-none text-slate-200"
          />
        </div>
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2 text-xs">
          <Calendar className="h-3.5 w-3.5 text-slate-500 mr-2 shrink-0" />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent border-none py-1.5 focus:outline-none text-slate-200"
          />
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-5">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Gross Turnover</span>
          <h3 className="text-2xl font-black text-white mt-1">{formatCurrency(summary.totalSales)}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Sum of taxable + tax charges</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-5">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Realized Cashflow</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(summary.totalPaid)}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Paid value by buyers</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-5">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Accounts Receivable</span>
          <h3 className="text-2xl font-black text-amber-500 mt-1">{formatCurrency(summary.totalOutstanding)}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Outstanding amounts remaining</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-5">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">GST Liability</span>
          <h3 className="text-2xl font-black text-purple-400 mt-1">{formatCurrency(summary.totalTaxCollected)}</h3>
          <div className="flex gap-2 text-[8px] text-slate-500 mt-1.5 font-semibold">
            <span>C: {formatCurrency(summary.cgst)}</span>
            <span>S: {formatCurrency(summary.sgst)}</span>
            <span>I: {formatCurrency(summary.igst)}</span>
          </div>
        </div>
      </div>

      {/* Grid: GST filing table vs Itemized Sales Volume */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* GST Rate breakdown table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-500" /> GST Tax Filing Summary (GSTR-1 Ready)
            </h2>
            <button
              onClick={exportInvoicesCSV}
              className="flex items-center gap-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 text-[10px] font-bold text-slate-300 px-2 py-1 transition active:scale-95"
            >
              <Download className="h-3 w-3" /> GSTR CSV
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs divide-y divide-slate-800 bg-slate-950/20">
              <thead className="bg-slate-900/60 text-[10px] text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2">Tax Rate</th>
                  <th className="px-3 py-2 text-right">Taxable Value</th>
                  <th className="px-3 py-2 text-right">CGST</th>
                  <th className="px-3 py-2 text-right">SGST</th>
                  <th className="px-3 py-2 text-right">IGST</th>
                  <th className="px-3 py-2 text-right font-bold">Total Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.gstBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500">No GST collections recorded in this period.</td>
                  </tr>
                ) : (
                  data.gstBreakdown.map((row: any) => (
                    <tr key={row.rate} className="hover:bg-slate-900/10">
                      <td className="px-3 py-2.5 text-slate-200 font-extrabold">{row.rate}%</td>
                      <td className="px-3 py-2.5 text-right text-slate-400">{formatCurrency(row.taxable)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-400">{formatCurrency(row.cgst)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-400">{formatCurrency(row.sgst)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-400">{formatCurrency(row.igst)}</td>
                      <td className="px-3 py-2.5 text-right text-emerald-400 font-bold">{formatCurrency(row.totalTax)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Item-wise sales report */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-500" /> Item-wise Sales Volumes
            </h2>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800 max-h-[300px] overflow-y-auto pr-1">
            <table className="w-full text-left text-xs divide-y divide-slate-800 bg-slate-950/20">
              <thead className="bg-slate-900/60 text-[10px] text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2">Item Name</th>
                  <th className="px-3 py-2 text-center">Design No</th>
                  <th className="px-3 py-2 text-right">Qty Sold</th>
                  <th className="px-3 py-2 text-right">Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.itemSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-500">No products sold in this period.</td>
                  </tr>
                ) : (
                  data.itemSales.map((row: any, idx: number) => (
                    <tr key={row.name + idx} className="hover:bg-slate-900/10">
                      <td className="px-3 py-2.5 text-slate-200 font-medium">{row.name}</td>
                      <td className="px-3 py-2.5 text-center text-slate-550 uppercase">{row.designNo || "-"}</td>
                      <td className="px-3 py-2.5 text-right text-slate-300 font-bold">{row.quantity}</td>
                      <td className="px-3 py-2.5 text-right text-emerald-400 font-black">{formatCurrency(row.salesTotal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CSV Archive Export Block */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg">
        <h2 className="text-base font-bold text-white mb-4">Export Master Archival Files</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <button
            onClick={exportInvoicesCSV}
            className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition active:scale-95 group"
          >
            <div className="text-left">
              <strong className="text-slate-200 text-xs block font-bold">Sales Ledger CSV</strong>
              <span className="text-[9px] text-slate-500">All historical billing details</span>
            </div>
            <Download className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition shrink-0 ml-3" />
          </button>

          <button
            onClick={exportCustomersCSV}
            className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition active:scale-95 group"
          >
            <div className="text-left">
              <strong className="text-slate-200 text-xs block font-bold">Customer Master CSV</strong>
              <span className="text-[9px] text-slate-500">All buyer registration logs</span>
            </div>
            <Download className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition shrink-0 ml-3" />
          </button>

          <button
            onClick={() => {
              // Export items database
              const headers = ["Product Name", "Design No", "HSN Code", "Unit", "Selling Price (₹)", "GST Rate (%)", "Stock Balance", "Track Stock", "Safety Limit"];
              
              fetch("/api/items")
                .then(res => res.json())
                .then(items => {
                  if (!Array.isArray(items)) return;

                  const formattedRows = items.map(it => [
                    it.name,
                    it.designNo || "-",
                    it.hsnCode,
                    it.unit,
                    it.price,
                    it.gstRate,
                    it.stock,
                    it.trackStock ? "Yes" : "No",
                    it.minStock
                  ]);

                  const csvContent = convertToCSV(headers, formattedRows);
                  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `ASP_Silks_Inventory_Master_${new Date().toISOString().split("T")[0]}.csv`;
                  link.click();
                  URL.revokeObjectURL(url);
                });
            }}
            className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition active:scale-95 group"
          >
            <div className="text-left">
              <strong className="text-slate-200 text-xs block font-bold">Inventory Master CSV</strong>
              <span className="text-[9px] text-slate-500">All registered items & prices</span>
            </div>
            <Download className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition shrink-0 ml-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
