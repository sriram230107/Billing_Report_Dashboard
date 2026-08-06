"use client";

import React, { useEffect, useState } from "react";
import { 
  Settings as SettingsIcon, 
  Building, 
  CreditCard, 
  FileText, 
  Upload, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  QrCode 
} from "lucide-react";
import { INDIAN_STATES } from "./PartiesTab";

export default function SettingsTab() {
  const [profile, setProfile] = useState<any>({
    name: "", address: "", phone: "", email: "", gstin: "", state: "33-Tamil Nadu",
    bankName: "", bankBranch: "", bankAccountNo: "", bankIfsc: "", bankHolderName: "",
    logo: "", upiId: "", terms: ""
  });
  
  const [appSettings, setAppSettings] = useState<any>({
    invoicePrefix: "INV-2026-",
    invoiceStartNo: 1,
    defaultGstRate: 5,
    enableEwayBill: true,
    ewayThreshold: 50000,
    trackInventory: false
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, settingsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/settings")
      ]);
      const profileData = await profileRes.json();
      const settingsData = await settingsRes.json();
      
      if (profileData && profileData.id) setProfile(profileData);
      if (settingsData && settingsData.id) setAppSettings(settingsData);
    } catch (e) {
      console.error("Error loading settings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setAppSettings((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Logo image must be smaller than 2MB." });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile((prev: any) => ({ ...prev, logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name || !profile.gstin || !profile.state) {
      setMessage({ type: "error", text: "Business Name, GSTIN, and State are required." });
      return;
    }

    // GSTIN Validation (Standard India GST: 15 digits)
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(profile.gstin.toUpperCase().trim())) {
      setMessage({ type: "error", text: "Invalid Business GSTIN format. Example: 33BVNPP6530P1ZW" });
      return;
    }

    try {
      setSavingProfile(true);
      setMessage(null);

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!res.ok) throw new Error("Failed to save profile settings");
      const updated = await res.json();
      setProfile(updated);
      setMessage({ type: "success", text: "Business profile details updated successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const saveAppSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setMessage(null);

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appSettings),
      });

      if (!res.ok) throw new Error("Failed to save app configuration settings");
      const updated = await res.json();
      setAppSettings(updated);
      setMessage({ type: "success", text: "Application preference settings saved successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-2 text-slate-400">Loading configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">System Settings</h1>
        <p className="mt-1 text-slate-400">Configure your business profile, invoicing preferences, and data standards.</p>
      </div>

      {message && (
        <div className={`p-4 border rounded-lg text-sm flex items-center gap-3 animate-in fade-in duration-200 ${
          message.type === "success" 
            ? "bg-emerald-950/20 border-emerald-950/40 text-emerald-400" 
            : "bg-red-950/20 border-red-950/40 text-red-400"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Columns (Col Span 2): Business Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex items-center gap-2">
              <Building className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-white">Business Profile (Invoice Header Details)</h2>
            </div>
            
            <form onSubmit={saveProfile} className="p-6 space-y-6">
              {/* Logo / Basic Identity Row */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800/60">
                <div className="relative group w-24 h-24 rounded-xl border border-slate-700 bg-slate-950 flex flex-col items-center justify-center overflow-hidden shrink-0">
                  {profile.logo ? (
                    <>
                      <img src={profile.logo} alt="Business logo" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setProfile((prev: any) => ({ ...prev, logo: "" }))}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-red-400 transition"
                      >
                        Remove Logo
                      </button>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center p-3 text-center text-slate-500 hover:text-slate-300 transition">
                      <Upload className="h-6 w-6 mb-1" />
                      <span className="text-[10px] font-semibold">Upload Logo</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  )}
                </div>

                <div className="flex-1 w-full grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Business / Trade Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={profile.name}
                      onChange={handleProfileChange}
                      placeholder="e.g. ASP SILKS"
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">GSTIN *</label>
                    <input
                      type="text"
                      name="gstin"
                      required
                      value={profile.gstin}
                      onChange={handleProfileChange}
                      placeholder="15-digit GSTIN"
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 2: State / Contact Info */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Seller GST State *</label>
                  <select
                    name="state"
                    value={profile.state}
                    onChange={handleProfileChange}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                  >
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Phone Numbers *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={profile.phone}
                    onChange={handleProfileChange}
                    placeholder="e.g. 9876543210, 0422-xxx"
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Email Address (Optional)</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email || ""}
                    onChange={handleProfileChange}
                    placeholder="e.g. sales@aspsilks.com"
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Business Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Business Address *</label>
                <textarea
                  name="address"
                  required
                  rows={2}
                  value={profile.address}
                  onChange={handleProfileChange}
                  placeholder="Full business shop address for invoices..."
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition resize-none"
                />
              </div>

              {/* Bank Details section */}
              <div className="space-y-4 pt-4 border-t border-slate-800/60">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-slate-400" /> Settling Bank Accounts
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      value={profile.bankName}
                      onChange={handleProfileChange}
                      placeholder="e.g. State Bank of India"
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Branch Name</label>
                    <input
                      type="text"
                      name="bankBranch"
                      value={profile.bankBranch}
                      onChange={handleProfileChange}
                      placeholder="e.g. Coimbatore Main"
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Account Number</label>
                    <input
                      type="text"
                      name="bankAccountNo"
                      value={profile.bankAccountNo}
                      onChange={handleProfileChange}
                      placeholder="Account No"
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">IFSC Code</label>
                    <input
                      type="text"
                      name="bankIfsc"
                      value={profile.bankIfsc}
                      onChange={handleProfileChange}
                      placeholder="IFSC Code"
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition uppercase"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-400">Account Holder Name</label>
                    <input
                      type="text"
                      name="bankHolderName"
                      value={profile.bankHolderName}
                      onChange={handleProfileChange}
                      placeholder="e.g. ASP SILKS"
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* UPI ID & Default Terms */}
              <div className="space-y-4 pt-4 border-t border-slate-800/60">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" /> Default Terms & QR Payments
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">UPI VPA Address (For invoice QR codes)</label>
                    <div className="relative">
                      <QrCode className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
                      <input
                        type="text"
                        name="upiId"
                        value={profile.upiId || ""}
                        onChange={handleProfileChange}
                        placeholder="e.g. aspsilks@sbi"
                        className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Invoice Terms & Conditions (Default)</label>
                    <textarea
                      name="terms"
                      rows={3}
                      value={profile.terms}
                      onChange={handleProfileChange}
                      placeholder="Terms and conditions printed on invoices..."
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex justify-end border-t border-slate-800">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-55 shadow-lg shadow-emerald-950/20"
                >
                  {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Business Profile
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (Col Span 1): App settings & preferences */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-white">Invoicing & App Configuration</h2>
            </div>
            
            <form onSubmit={saveAppSettings} className="p-6 space-y-5">
              {/* Prefix & Start No */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Invoice Prefix</label>
                <input
                  type="text"
                  name="invoicePrefix"
                  value={appSettings.invoicePrefix}
                  onChange={handleSettingsChange}
                  placeholder="e.g. INV-2026-"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Invoice Start Sequence Number</label>
                <input
                  type="number"
                  name="invoiceStartNo"
                  value={appSettings.invoiceStartNo}
                  onChange={handleSettingsChange}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Default GST */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Default Store GST Rate (%)</label>
                <select
                  name="defaultGstRate"
                  value={appSettings.defaultGstRate}
                  onChange={handleSettingsChange}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5% (Silks/Handloom default)</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>

              {/* E-way Bill settings */}
              <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-bold text-slate-200 block">Enable E-way Bill Field</span>
                    <span className="text-[10px] text-slate-500">Enable when invoice reaches threshold limit</span>
                  </div>
                  <input
                    type="checkbox"
                    name="enableEwayBill"
                    checked={appSettings.enableEwayBill}
                    onChange={handleSettingsChange}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-800 focus:ring-emerald-500"
                  />
                </div>
                {appSettings.enableEwayBill && (
                  <div className="space-y-1 pt-1.5 border-t border-slate-900">
                    <label className="text-[10px] font-semibold text-slate-400 block">E-way Bill Threshold Amount (₹)</label>
                    <input
                      type="number"
                      name="ewayThreshold"
                      value={appSettings.ewayThreshold}
                      onChange={handleSettingsChange}
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                )}
              </div>

              {/* Stock Inventory Tracking toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl">
                <div className="min-w-0 pr-2">
                  <span className="text-xs font-bold text-slate-200 block">Track Inventory Stocks</span>
                  <span className="text-[10px] text-slate-500">Auto-reduce stock values on new bills</span>
                </div>
                <input
                  type="checkbox"
                  name="trackInventory"
                  checked={appSettings.trackInventory}
                  onChange={handleSettingsChange}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-800 focus:ring-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex justify-end border-t border-slate-800">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-55 shadow-lg shadow-emerald-950/20"
                >
                  {savingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Configurations
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
