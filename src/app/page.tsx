"use client";

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  TrendingUp, 
  Settings as SettingsIcon,
  Menu,
  X
} from "lucide-react";

// Tab Imports
import DashboardTab from "@/components/DashboardTab";
import InvoicesTab from "@/components/InvoicesTab";
import PartiesTab from "@/components/PartiesTab";
import ItemsTab from "@/components/ItemsTab";
import ReportsTab from "@/components/ReportsTab";
import SettingsTab from "@/components/SettingsTab";
import InvoiceForm from "@/components/InvoiceForm";
import InvoicePrint from "@/components/InvoicePrint";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // States for Invoice Drafts and edits
  const [draftInvoice, setDraftInvoice] = useState<any>(null);
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [printInvoiceId, setPrintInvoiceId] = useState<string | null>(null);

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "invoices", label: "Invoices History", icon: FileText },
    { id: "parties", label: "Customer Master", icon: Users },
    { id: "items", label: "Item Inventory", icon: Package },
    { id: "reports", label: "GST Reports", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  // If in Print Preview Mode, render the print layout standalone and hide sidebars
  if (printInvoiceId) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 print:p-0 print:bg-white">
        <InvoicePrint
          invoiceId={printInvoiceId}
          onBack={() => setPrintInvoiceId(null)}
        />
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardTab
            setActiveTab={setActiveTab}
            setDraftInvoice={setDraftInvoice}
            setIsEditingInvoice={setIsEditingInvoice}
          />
        );
      case "invoices":
        return (
          <InvoicesTab
            setActiveTab={setActiveTab}
            setDraftInvoice={setDraftInvoice}
            setIsEditingInvoice={setIsEditingInvoice}
            setPrintInvoiceId={setPrintInvoiceId}
          />
        );
      case "create-invoice":
        return (
          <InvoiceForm
            editInvoiceId={isEditingInvoice && draftInvoice ? draftInvoice.id : null}
            onBack={() => setActiveTab("invoices")}
            onSaveSuccess={() => setActiveTab("invoices")}
          />
        );
      case "parties":
        return <PartiesTab />;
      case "items":
        return <ItemsTab />;
      case "reports":
        return <ReportsTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <DashboardTab setActiveTab={setActiveTab} setDraftInvoice={setDraftInvoice} setIsEditingInvoice={setIsEditingInvoice} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0b0f19] text-slate-100 overflow-hidden font-sans select-none">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-slate-800 bg-[#070b13] shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-900 bg-slate-950/20">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-emerald-600 font-extrabold text-white text-base shadow-lg shadow-emerald-950/30">
            A
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-wide uppercase leading-tight">ASP SILKS</h2>
            <span className="text-[10px] text-slate-500 font-bold block uppercase mt-0.5">Billing Suite</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === "invoices" && activeTab === "create-invoice");
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition active:scale-[0.98] ${
                  isActive
                    ? "bg-emerald-600/10 border-l-4 border-emerald-500 text-white font-extrabold"
                    : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200 border-l-4 border-transparent"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-emerald-500" : "text-slate-500"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/10 text-center">
          <p className="text-[9px] font-bold text-slate-600 tracking-wider">GST COMPLIANT (VYAPAR CLONE)</p>
          <p className="text-[8px] text-slate-700 mt-0.5">v1.2.0 • Local Database Mode</p>
        </div>
      </aside>

      {/* Mobile Drawer Navigation overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden bg-black/60 backdrop-blur-sm">
          <aside className="w-64 bg-[#070b13] border-r border-slate-800 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-600 font-extrabold text-white text-xs">
                  A
                </div>
                <strong className="text-white text-xs uppercase font-extrabold">ASP SILKS</strong>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.id === "invoices" && activeTab === "create-invoice");
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? "bg-emerald-600/10 border-l-4 border-emerald-500 text-white font-extrabold"
                        : "text-slate-400 hover:bg-slate-900 border-l-4 border-transparent"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-emerald-500" : "text-slate-500"}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header bar */}
        <header className="flex md:hidden items-center justify-between bg-[#070b13] border-b border-slate-800 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded bg-emerald-600 font-extrabold text-white text-xs">
              A
            </div>
            <span className="font-extrabold text-xs uppercase text-slate-200">ASP SILKS</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white transition active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Scrollable Tab Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {renderActiveTab()}
        </main>
      </div>

    </div>
  );
}
