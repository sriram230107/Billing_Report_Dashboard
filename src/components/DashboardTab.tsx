"use client";

import React, { useEffect, useState } from "react";
import { 
  IndianRupee, 
  TrendingUp, 
  Users, 
  Package, 
  AlertTriangle, 
  Plus, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Loader2 
} from "lucide-react";

interface DashboardTabProps {
  setActiveTab: (tab: string) => void;
  setDraftInvoice: (invoice: any) => void;
  setIsEditingInvoice: (val: boolean) => void;
}

export default function DashboardTab({ 
  setActiveTab, 
  setDraftInvoice, 
  setIsEditingInvoice 
}: DashboardTabProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reports");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-2 text-slate-400">Loading shop intelligence...</span>
      </div>
    );
  }

  const summary = data?.summary || {
    totalSales: 0,
    totalTaxCollected: 0,
    totalPaid: 0,
    totalOutstanding: 0,
  };

  const lowStockCount = data?.lowStockItems?.length || 0;
  const outstandingCount = data?.customerOutstanding?.length || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            ASP SILKS <span className="text-emerald-500 font-medium text-lg">Billing Hub</span>
          </h1>
          <p className="mt-1 text-slate-400">
            Welcome back! Here is a summary of your textile trading performance.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setDraftInvoice(null);
              setIsEditingInvoice(false);
              setActiveTab("create-invoice");
            }}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-95 shadow-md shadow-emerald-900/20"
          >
            <Plus className="h-4 w-4" /> Create Invoice
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Sales */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total Sales</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white">{formatCurrency(summary.totalSales)}</h3>
            <p className="mt-1 text-xs text-slate-500">Active non-cancelled transactions</p>
          </div>
        </div>

        {/* Card 2: Received Payments */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total Received</span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white">{formatCurrency(summary.totalPaid)}</h3>
            <p className="mt-1 text-xs text-slate-500">Collected in cash, UPI, bank</p>
          </div>
        </div>

        {/* Card 3: Outstanding Receivables */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total Outstanding</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white">{formatCurrency(summary.totalOutstanding)}</h3>
            <p className="mt-1 text-xs text-slate-500">{outstandingCount} parties with pending balances</p>
          </div>
        </div>

        {/* Card 4: Tax Collected */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">GST Collected</span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-500">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white">{formatCurrency(summary.totalTaxCollected)}</h3>
            <p className="mt-1 text-xs text-slate-500">CGST + SGST + IGST liability</p>
          </div>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Outstanding Parties & Low Stock */}
        <div className="space-y-6 lg:col-span-2">
          {/* Low Stock Alerts */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${lowStockCount > 0 ? "text-amber-500 animate-pulse" : "text-slate-400"}`} />
                <h2 className="text-lg font-bold text-white">Low-Stock Warnings</h2>
              </div>
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300 font-semibold">
                {lowStockCount} items
              </span>
            </div>
            
            {lowStockCount === 0 ? (
              <p className="mt-4 text-sm text-slate-400">All inventory levels are above their safe thresholds.</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 bg-slate-950/30">
                  <thead className="bg-slate-900/60">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-300">Item Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-300">Design No</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-300">Available</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-300">Min Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {data.lowStockItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-900/20">
                        <td className="px-4 py-2 text-slate-200 font-medium">{item.name}</td>
                        <td className="px-4 py-2 text-slate-400">{item.designNo || "-"}</td>
                        <td className="px-4 py-2 text-right text-amber-400 font-semibold">{item.stock} {item.unit}</td>
                        <td className="px-4 py-2 text-right text-slate-500">{item.minStock} {item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4">Quick Operations</h2>
            <div className="grid gap-4 grid-cols-3">
              <button
                onClick={() => setActiveTab("parties")}
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800/40 hover:border-slate-700 transition active:scale-95 group text-center"
              >
                <div className="rounded-full bg-emerald-500/10 p-2.5 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition">
                  <Users className="h-5 w-5" />
                </div>
                <span className="mt-2 text-sm font-semibold text-slate-200">Customer List</span>
              </button>

              <button
                onClick={() => setActiveTab("items")}
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800/40 hover:border-slate-700 transition active:scale-95 group text-center"
              >
                <div className="rounded-full bg-blue-500/10 p-2.5 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition">
                  <Package className="h-5 w-5" />
                </div>
                <span className="mt-2 text-sm font-semibold text-slate-200">Product List</span>
              </button>

              <button
                onClick={() => setActiveTab("reports")}
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800/40 hover:border-slate-700 transition active:scale-95 group text-center"
              >
                <div className="rounded-full bg-purple-500/10 p-2.5 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="mt-2 text-sm font-semibold text-slate-200">GST Reports</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Outstanding Balances */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-white">Outstanding Receivables</h2>
            </div>
          </div>

          {outstandingCount === 0 ? (
            <p className="text-sm text-slate-400">All party accounts are fully cleared.</p>
          ) : (
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {data.customerOutstanding.map((customer: any) => (
                <div 
                  key={customer.id} 
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/30 hover:border-slate-700 transition"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-200 truncate">{customer.name}</h4>
                    <p className="text-xs text-slate-400 truncate">{customer.contact || "No contact info"}</p>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-sm font-extrabold text-amber-400">
                      {formatCurrency(customer.balance)}
                    </span>
                    <p className="text-[10px] text-slate-500">Unpaid Balance</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
