"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  FileText, 
  Edit3, 
  Trash2, 
  Loader2, 
  X, 
  AlertCircle 
} from "lucide-react";

export const INDIAN_STATES = [
  "33-Tamil Nadu",
  "29-Karnataka",
  "37-Andhra Pradesh",
  "36-Telangana",
  "32-Kerala",
  "27-Maharashtra",
  "24-Gujarat",
  "09-Uttar Pradesh",
  "19-West Bengal",
  "07-Delhi",
  "08-Rajasthan",
  "03-Punjab",
  "10-Bihar",
  "23-Madhya Pradesh",
  "18-Assam",
  "22-Chhattisgarh",
  "30-Goa",
  "06-Haryana",
  "02-Himachal Pradesh",
  "01-Jammu & Kashmir",
  "20-Jharkhand",
  "21-Odisha",
  "34-Puducherry",
  "11-Sikkim",
  "05-Uttarakhand"
];

export default function PartiesTab() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formId, setFormId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formGstin, setFormGstin] = useState("");
  const [formState, setFormState] = useState("33-Tamil Nadu");
  const [formBalance, setFormBalance] = useState("0");

  const fetchCustomers = async (searchQuery = "") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setCustomers(data);
        if (data.length > 0 && !selectedCustomer) {
          setSelectedCustomer(data[0]);
        }
      }
    } catch (e) {
      console.error("Error loading customers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers(search);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleOpenAdd = () => {
    setFormId(null);
    setFormName("");
    setFormAddress("");
    setFormContact("");
    setFormGstin("");
    setFormState("33-Tamil Nadu");
    setFormBalance("0");
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: any) => {
    setFormId(customer.id);
    setFormName(customer.name);
    setFormAddress(customer.address);
    setFormContact(customer.contact);
    setFormGstin(customer.gstin || "");
    setFormState(customer.state);
    setFormBalance(customer.balance.toString());
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete customer");

      alert("Customer deleted successfully!");
      setSelectedCustomer(null);
      fetchCustomers(search);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError("Name is required.");
      return;
    }

    // GSTIN Validation (Standard India GST: 15 digits)
    if (formGstin.trim()) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(formGstin.toUpperCase().trim())) {
        setError("Invalid GSTIN format. Example: 33BVNPP6530P1ZW");
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        name: formName,
        address: formAddress,
        contact: formContact,
        gstin: formGstin.toUpperCase().trim() || null,
        state: formState,
        balance: parseFloat(formBalance) || 0.0,
      };

      const url = formId ? `/api/customers/${formId}` : "/api/customers";
      const method = formId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save customer");

      setIsModalOpen(false);
      fetchCustomers(search);
      if (formId) {
        setSelectedCustomer(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6">
      {/* Left Column: Search & Customer List */}
      <div className="w-full md:w-80 flex flex-col border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden shadow-lg">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" /> Parties
            </h2>
            <button
              onClick={handleOpenAdd}
              className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-500 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search customers, GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-slate-950/60 border border-slate-800 py-1.5 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {loading && customers.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No customers found.
            </div>
          ) : (
            customers.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className={`w-full text-left p-4 transition flex items-center justify-between ${
                  selectedCustomer?.id === c.id 
                    ? "bg-emerald-600/10 border-l-4 border-emerald-500" 
                    : "hover:bg-slate-800/30 border-l-4 border-transparent"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <h4 className="font-bold text-sm text-slate-200 truncate">{c.name}</h4>
                  <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3 text-slate-500" /> {c.contact || "-"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-bold ${c.balance > 0 ? "text-amber-400" : "text-slate-400"}`}>
                    {formatCurrency(c.balance)}
                  </span>
                  <p className="text-[10px] text-slate-500">Outstanding</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Customer Details & Ledger */}
      <div className="flex-1 border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden shadow-lg flex flex-col">
        {selectedCustomer ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Customer Details Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950/20 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white">{selectedCustomer.name}</h2>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-400">
                  <Phone className="h-3.5 w-3.5 text-slate-500" /> {selectedCustomer.contact || "No Contact Number"}
                  <span className="text-slate-700">|</span>
                  <span className="text-xs font-semibold bg-slate-800 text-slate-300 rounded px-2 py-0.5 uppercase">
                    GSTIN: {selectedCustomer.gstin || "URP (Unregistered)"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOpenEdit(selectedCustomer)}
                  className="flex items-center gap-1.5 text-xs font-bold rounded-lg border border-slate-800 hover:border-slate-700 px-3 py-1.5 text-slate-300 transition hover:bg-slate-800 active:scale-95"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(selectedCustomer.id)}
                  className="flex items-center gap-1.5 text-xs font-bold rounded-lg border border-red-900/40 hover:border-red-900/60 px-3 py-1.5 text-red-400 transition hover:bg-red-950/30 active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 flex-1 overflow-y-auto grid gap-6 md:grid-cols-2">
              {/* Left Column info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Address Details</h3>
                  <div className="mt-2 flex items-start gap-2.5 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                    <MapPin className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-200 whitespace-pre-line">{selectedCustomer.address || "No address provided."}</p>
                      <p className="text-sm text-emerald-400 mt-2 font-semibold">State Code: {selectedCustomer.state}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column balance details */}
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Financial Snapshot</h3>
                <div className="mt-2 p-5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-4">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold block">Outstanding Ledger Balance</span>
                    <span className={`text-3xl font-black ${selectedCustomer.balance > 0 ? "text-amber-400" : "text-emerald-500"}`}>
                      {formatCurrency(selectedCustomer.balance)}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedCustomer.balance > 0 
                        ? "Party has outstanding amount to be cleared." 
                        : "Account is fully settled."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
            <Users className="h-12 w-12 text-slate-700 stroke-[1.5] mb-2 animate-bounce" />
            <p className="text-sm">Select a customer from the left sidebar to view details, or add a new customer.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
              <h3 className="text-lg font-bold text-white">
                {formId ? "Edit Customer Details" : "Register New Customer"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. R.K. SILKS"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Grid Contact / State */}
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Contact Number</label>
                  <input
                    type="text"
                    placeholder="Mobile / Phone"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Place of Supply State *</label>
                  <select
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                  >
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Billing Address</label>
                <textarea
                  placeholder="Full Address (Multi-line)"
                  rows={3}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition resize-none"
                />
              </div>

              {/* GSTIN / Running Balance */}
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="15-digit GSTIN"
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Opening Outstanding (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formBalance}
                    disabled={formId !== null} // Disable for edits (changes must go through invoice workflow)
                    onChange={(e) => setFormBalance(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition disabled:opacity-55"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-800 hover:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-55 shadow-md shadow-emerald-950/20"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
