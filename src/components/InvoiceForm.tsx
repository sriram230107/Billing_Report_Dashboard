"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  Search, 
  FileText, 
  IndianRupee, 
  UserPlus, 
  Loader2, 
  AlertCircle, 
  X, 
  ArrowLeft 
} from "lucide-react";
import { INDIAN_STATES } from "./PartiesTab";
import { numberToIndianWords } from "@/lib/numberToWords";

interface InvoiceFormProps {
  editInvoiceId?: string | null;
  onBack: () => void;
  onSaveSuccess: () => void;
}

export default function InvoiceForm({ editInvoiceId, onBack, onSaveSuccess }: InvoiceFormProps) {
  const [profile, setProfile] = useState<any>(null);
  const [settings, setAppSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Customer Autocomplete States
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Quick Add Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerState, setNewCustomerState] = useState("33-Tamil Nadu");
  const [newCustomerGstin, setNewCustomerGstin] = useState("");
  const [newCustomerContact, setNewCustomerContact] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Item Database for lookup
  const [itemsDb, setItemsDb] = useState<any[]>([]);

  // Invoice Form Fields
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("33-Tamil Nadu");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerState, setCustomerState] = useState("33-Tamil Nadu");
  const [terms, setTerms] = useState("");
  const [bankDetailsText, setBankDetailsText] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [paymentMode, setPaymentMode] = useState("");
  const [amountPaid, setAmountPaid] = useState("0");

  // Line Items State
  const [lineItems, setLineItems] = useState<any[]>([
    { id: Math.random().toString(), itemId: "", name: "", designNo: "", hsnCode: "500720", quantity: 1, unit: "Pcs", price: 0, gstRate: 5, searchVal: "", showDropdown: false }
  ]);

  // Click Outside hooks for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch initial profile, settings, customers and items
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [profileRes, settingsRes, customersRes, itemsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/settings"),
        fetch("/api/customers"),
        fetch("/api/items")
      ]);

      const profileData = await profileRes.json();
      const settingsData = await settingsRes.json();
      const customersData = await customersRes.json();
      const itemsData = await itemsRes.json();

      setProfile(profileData);
      setAppSettings(settingsData);
      setCustomers(customersData);
      setItemsDb(itemsData);

      // Auto-fill bank details and default terms from profile
      if (profileData && profileData.id) {
        setTerms(profileData.terms || "");
        setPlaceOfSupply(profileData.state || "33-Tamil Nadu");
        const bankInfo = `${profileData.bankName} | Holder: ${profileData.bankHolderName} | A/C: ${profileData.bankAccountNo} | IFSC: ${profileData.bankIfsc} | Branch: ${profileData.bankBranch}`;
        setBankDetailsText(bankInfo);
      }

      // If we are editing, fetch the specific invoice data
      if (editInvoiceId) {
        const invoiceRes = await fetch(`/api/invoices/${editInvoiceId}`);
        const invoiceData = await invoiceRes.json();
        
        if (invoiceData && !invoiceData.error) {
          setInvoiceDate(new Date(invoiceData.invoiceDate).toISOString().split("T")[0]);
          setDueDate(invoiceData.dueDate ? new Date(invoiceData.dueDate).toISOString().split("T")[0] : "");
          setEwayBillNo(invoiceData.ewayBillNo || "");
          setPlaceOfSupply(invoiceData.placeOfSupply);
          setSelectedCustomerId(invoiceData.customerId || "");
          setCustomerName(invoiceData.customerName);
          setCustomerAddress(invoiceData.customerAddress);
          setCustomerContact(invoiceData.customerContact);
          setCustomerGstin(invoiceData.customerGstin || "");
          setCustomerState(invoiceData.customerState);
          setCustomerSearch(invoiceData.customerName);
          setTerms(invoiceData.terms);
          setBankDetailsText(invoiceData.bankDetails);
          setPaymentStatus(invoiceData.status);
          setPaymentMode(invoiceData.paymentMode || "");
          setAmountPaid(invoiceData.amountPaid.toString());

          // Populate line items (snapshotted, not overwritten by Item master)
          const mappedLines = invoiceData.items.map((line: any) => ({
            id: Math.random().toString(),
            itemId: line.itemId || "",
            name: line.name,
            designNo: line.designNo || "",
            hsnCode: line.hsnCode,
            quantity: line.quantity,
            unit: line.unit,
            price: line.price,
            gstRate: line.gstRate,
            searchVal: line.name,
            showDropdown: false
          }));
          setLineItems(mappedLines);
        }
      }
    } catch (e) {
      console.error("Error loading initial invoice data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [editInvoiceId]);

  // Handle customer search typing
  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomerSearch(val);
    setShowCustomerDropdown(true);

    if (!val) {
      setSelectedCustomerId("");
      setCustomerName("");
      setCustomerAddress("");
      setCustomerContact("");
      setCustomerGstin("");
      setCustomerState("33-Tamil Nadu");
    }
  };

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerAddress(customer.address);
    setCustomerContact(customer.contact);
    setCustomerGstin(customer.gstin || "");
    setCustomerState(customer.state);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  };

  // Add line item row
  const addRow = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        itemId: "",
        name: "",
        designNo: "",
        hsnCode: "500720",
        quantity: 1,
        unit: "Pcs",
        price: 0,
        gstRate: settings?.defaultGstRate || 5,
        searchVal: "",
        showDropdown: false
      }
    ]);
  };

  const deleteRow = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          return updated;
        }
        return item;
      })
    );
  };

  // Handle item search typing in table row
  const handleItemSearch = (id: string, query: string) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, searchVal: query, name: query, showDropdown: true };
        }
        return item;
      })
    );
  };

  const handleSelectItem = (rowId: string, dbItem: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id === rowId) {
          return {
            ...item,
            itemId: dbItem.id,
            name: dbItem.name,
            designNo: dbItem.designNo || "",
            hsnCode: dbItem.hsnCode,
            unit: dbItem.unit,
            price: dbItem.price,
            gstRate: dbItem.gstRate,
            searchVal: dbItem.name,
            showDropdown: false
          };
        }
        return item;
      })
    );
  };

  // Quick Add Customer Handler
  const handleQuickAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    try {
      setSavingCustomer(true);
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomerName,
          state: newCustomerState,
          gstin: newCustomerGstin.toUpperCase().trim() || null,
          contact: newCustomerContact,
          address: newCustomerAddress,
          balance: 0.0
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create customer");

      // Select newly added customer
      handleSelectCustomer(data);
      
      // Refresh customer list
      const customersRes = await fetch("/api/customers");
      const customersData = await customersRes.json();
      setCustomers(customersData);

      // Close modal
      setIsCustomerModalOpen(false);
      // Reset form
      setNewCustomerName("");
      setNewCustomerGstin("");
      setNewCustomerContact("");
      setNewCustomerAddress("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingCustomer(false);
    }
  };

  // Calculations
  const sellerState = profile?.state || "33-Tamil Nadu";
  const buyerState = customerState;
  
  // Rule: if state codes match, split CGST + SGST. Otherwise single IGST.
  const sellerStateCode = sellerState.split("-")[0];
  const buyerStateCode = buyerState.split("-")[0];
  const isIntraState = sellerStateCode === buyerStateCode;

  // Aggregate line values
  let subTotal = 0;
  let totalTax = 0;

  const calculatedLines = lineItems.map((line) => {
    const qty = parseFloat(line.quantity) || 0;
    const price = parseFloat(line.price) || 0;
    const gstRate = parseFloat(line.gstRate) || 0;

    const lineTaxable = qty * price;
    const lineGst = lineTaxable * (gstRate / 100);
    const lineTotal = lineTaxable + lineGst;

    subTotal += lineTaxable;
    totalTax += lineGst;

    return {
      ...line,
      taxable: parseFloat(lineTaxable.toFixed(2)),
      gstAmount: parseFloat(lineGst.toFixed(2)),
      total: parseFloat(lineTotal.toFixed(2))
    };
  });

  const rawGrandTotal = subTotal + totalTax;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = parseFloat((grandTotal - rawGrandTotal).toFixed(2));
  const totalQuantity = lineItems.reduce((acc, item) => acc + (parseFloat(item.quantity) || 0), 0);
  const grandTotalWords = numberToIndianWords(grandTotal);

  // Group by HSN code for the tax summary table
  const hsnSummary: Record<string, { taxable: number; rate: number; cgst: number; sgst: number; igst: number; totalTax: number }> = {};
  calculatedLines.forEach((line) => {
    const hsn = line.hsnCode || "500720";
    const rate = line.gstRate;
    if (!hsnSummary[hsn]) {
      hsnSummary[hsn] = { taxable: 0, rate, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    }
    hsnSummary[hsn].taxable += line.taxable;
    hsnSummary[hsn].totalTax += line.gstAmount;
    if (isIntraState) {
      hsnSummary[hsn].cgst += line.gstAmount / 2;
      hsnSummary[hsn].sgst += line.gstAmount / 2;
    } else {
      hsnSummary[hsn].igst += line.gstAmount;
    }
  });

  const submitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) {
      setError("Please select or add a Customer.");
      return;
    }
    if (lineItems.some((line) => !line.name)) {
      setError("All line items must have a product name.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        invoiceDate,
        dueDate: dueDate || null,
        ewayBillNo: settings?.enableEwayBill && grandTotal >= settings?.ewayThreshold ? ewayBillNo : null,
        placeOfSupply,
        customerId: selectedCustomerId || null,
        customerName,
        customerAddress,
        customerContact,
        customerGstin: customerGstin || null,
        customerState,
        terms,
        bankDetails: bankDetailsText,
        status: paymentStatus,
        paymentMode: paymentStatus === "Unpaid" ? null : paymentMode,
        paymentDate: paymentStatus === "Unpaid" ? null : new Date(),
        amountPaid: paymentStatus === "Paid" ? grandTotal : (paymentStatus === "Partially Paid" ? parseFloat(amountPaid) : 0),
        items: lineItems.map((line) => ({
          itemId: line.itemId || null,
          name: line.name,
          designNo: line.designNo || null,
          hsnCode: line.hsnCode,
          quantity: parseFloat(line.quantity),
          unit: line.unit,
          price: parseFloat(line.price),
          gstRate: parseFloat(line.gstRate)
        }))
      };

      const url = editInvoiceId ? `/api/invoices/${editInvoiceId}` : "/api/invoices";
      const method = editInvoiceId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save invoice");

      alert(`Invoice saved successfully!`);
      onSaveSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-2 text-slate-400">Loading invoice configuration...</span>
      </div>
    );
  }

  // Filtered Customer Autocomplete list
  const filteredCustomers = customerSearch
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.gstin && c.gstin.toLowerCase().includes(customerSearch.toLowerCase()))
      )
    : customers;

  return (
    <div className="space-y-6">
      {/* Header with Back */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              {editInvoiceId ? "Edit GST Invoice" : "Create New GST Tax Invoice"}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {editInvoiceId ? "Modify transaction and snapshot details" : "Auto-increments sequence and updates inventory/receivables"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={submitInvoice} className="space-y-6">
        {/* Row 1: Invoice Header / Metadata Fields */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Invoice Number</label>
            <input
              type="text"
              disabled
              value={editInvoiceId ? "Edit Saved Sequence" : "Auto-Generated [Safe Sequence]"}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-500 font-medium select-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Invoice Date *</label>
            <input
              type="date"
              required
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Due Date (Optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Place of Supply *</label>
            <select
              value={placeOfSupply}
              onChange={(e) => setPlaceOfSupply(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
            >
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Bill To Customer / Party details */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="text-sm font-bold text-slate-200 mb-4 uppercase tracking-wider">Bill To (Buyer Details)</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Search/Select Dropdown */}
            <div className="space-y-1 relative" ref={customerDropdownRef}>
              <label className="text-xs font-semibold text-slate-400">Select Customer *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Type to search customers..."
                    value={customerSearch}
                    onChange={handleCustomerSearchChange}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="flex items-center gap-1 bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-lg text-xs font-bold text-emerald-400 hover:bg-slate-900 active:scale-95 transition"
                >
                  <UserPlus className="h-4 w-4" /> Quick Add
                </button>
              </div>

              {/* Customer Autocomplete Dropdown List */}
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-900 animate-in fade-in duration-100">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full text-left p-3 text-xs hover:bg-emerald-600/10 transition flex items-center justify-between"
                    >
                      <div>
                        <strong className="text-slate-200">{c.name}</strong>
                        <span className="text-slate-500 text-[10px] block mt-0.5">{c.contact || "No number"}</span>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-300 rounded px-1.5 py-0.5">
                        {c.state}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Read-only Preview Fields populated on select */}
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Buyer State Code</label>
                <input
                  type="text"
                  disabled
                  value={customerState}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-400 font-medium select-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Buyer GSTIN</label>
                <input
                  type="text"
                  disabled
                  value={customerGstin || "URP (Unregistered)"}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-400 font-medium select-none"
                />
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-400">Buyer Address</label>
              <textarea
                disabled
                rows={1}
                value={customerAddress || "No address populated."}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-400 font-medium select-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Row 3: E-way Bill (Threshold-conditional) */}
        {settings?.enableEwayBill && grandTotal >= settings?.ewayThreshold && (
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-5 flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-200">
            <div className="space-y-1 max-w-md">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest block">E-way Bill Requirement</span>
              <p className="text-[10px] text-slate-400">
                This invoice total is <strong>{formatCurrency(grandTotal)}</strong>, which exceeds the E-way threshold of <strong>{formatCurrency(settings.ewayThreshold)}</strong>. An E-way bill number is mandatory.
              </p>
            </div>
            <div className="space-y-1 w-64 shrink-0">
              <label className="text-[10px] font-semibold text-amber-300">E-way Bill Number *</label>
              <input
                type="text"
                required
                maxLength={12}
                placeholder="12-digit Number"
                value={ewayBillNo}
                onChange={(e) => setEwayBillNo(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-lg bg-slate-950 border border-amber-900/60 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-700 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>
        )}

        {/* Row 4: Line Items Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Line Items (Goods)</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] divide-y divide-slate-800 text-left">
              <thead className="bg-slate-950/40 text-xs font-semibold text-slate-300 uppercase select-none">
                <tr>
                  <th className="px-3 py-3 w-10 text-center">S.No</th>
                  <th className="px-3 py-3 w-72">Item Name / Search</th>
                  <th className="px-3 py-3 w-28">Design No</th>
                  <th className="px-3 py-3 w-24">HSN/SAC</th>
                  <th className="px-3 py-3 w-20 text-right">Qty</th>
                  <th className="px-3 py-3 w-20">Unit</th>
                  <th className="px-3 py-3 w-28 text-right">Price/Unit</th>
                  <th className="px-3 py-3 w-20 text-right">GST %</th>
                  <th className="px-3 py-3 w-24 text-right">Taxable</th>
                  <th className="px-3 py-3 w-24 text-right">GST Amt</th>
                  <th className="px-3 py-3 w-28 text-right font-extrabold">Amount</th>
                  <th className="px-3 py-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs bg-slate-950/10">
                {calculatedLines.map((line, idx) => {
                  // Filter items database matching this line search val
                  const filteredDbItems = line.searchVal
                    ? itemsDb.filter((item) =>
                        item.name.toLowerCase().includes(line.searchVal.toLowerCase()) ||
                        (item.designNo && item.designNo.toLowerCase().includes(line.searchVal.toLowerCase()))
                      )
                    : itemsDb;

                  return (
                    <tr key={line.id} className="hover:bg-slate-900/10 transition align-top">
                      {/* S.No */}
                      <td className="px-3 py-3 text-center text-slate-500 font-bold leading-[34px]">{idx + 1}</td>
                      
                      {/* Item Autocomplete select */}
                      <td className="px-3 py-3 relative">
                        <input
                          type="text"
                          value={line.searchVal}
                          placeholder="Search / enter product..."
                          onChange={(e) => handleItemSearch(line.id, e.target.value)}
                          onFocus={() => updateLineItem(line.id, "showDropdown", true)}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition font-medium"
                        />
                        {/* Dropdown list */}
                        {line.showDropdown && filteredDbItems.length > 0 && (
                          <div className="absolute z-20 w-80 mt-1 bg-slate-950 border border-slate-800 rounded-lg shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-900">
                            {filteredDbItems.map((dbIt) => (
                              <button
                                key={dbIt.id}
                                type="button"
                                onClick={() => handleSelectItem(line.id, dbIt)}
                                className="w-full text-left p-3 hover:bg-emerald-600/10 transition flex items-center justify-between text-xs"
                              >
                                <div>
                                  <strong className="text-slate-200">{dbIt.name}</strong>
                                  {dbIt.designNo && <span className="text-slate-500 block text-[9px]">Design: {dbIt.designNo}</span>}
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-emerald-400 font-bold block">{formatCurrency(dbIt.price)}</span>
                                  <span className="text-[9px] text-slate-500">GST: {dbIt.gstRate}%</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Design No */}
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={line.designNo}
                          placeholder="Design"
                          onChange={(e) => updateLineItem(line.id, "designNo", e.target.value)}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none uppercase"
                        />
                      </td>

                      {/* HSN Code */}
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={line.hsnCode}
                          placeholder="500720"
                          onChange={(e) => updateLineItem(line.id, "hsnCode", e.target.value)}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={line.quantity}
                          onChange={(e) => updateLineItem(line.id, "quantity", e.target.value)}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-right text-slate-100 focus:outline-none"
                        />
                      </td>

                      {/* Unit */}
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={line.unit}
                          placeholder="Pcs"
                          onChange={(e) => updateLineItem(line.id, "unit", e.target.value)}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                        />
                      </td>

                      {/* Price/Unit */}
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={line.price}
                          onChange={(e) => updateLineItem(line.id, "price", e.target.value)}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-right text-slate-100 focus:outline-none"
                        />
                      </td>

                      {/* GST % */}
                      <td className="px-3 py-3">
                        <select
                          value={line.gstRate}
                          onChange={(e) => updateLineItem(line.id, "gstRate", e.target.value)}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-1 py-2 text-xs text-right text-slate-100 focus:outline-none"
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </td>

                      {/* Taxable (computed) */}
                      <td className="px-3 py-3 text-right leading-[34px] text-slate-400 font-semibold">{formatCurrency(line.taxable)}</td>

                      {/* GST Amt (computed) */}
                      <td className="px-3 py-3 text-right leading-[34px] text-slate-400 font-semibold">{formatCurrency(line.gstAmount)}</td>

                      {/* Line Total (computed) */}
                      <td className="px-3 py-3 text-right leading-[34px] text-white font-extrabold">{formatCurrency(line.total)}</td>

                      {/* Delete */}
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => deleteRow(line.id)}
                          disabled={lineItems.length === 1}
                          className="p-1.5 rounded text-red-500 hover:bg-red-950/20 transition active:scale-90 disabled:opacity-30 mt-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Row Button Footer */}
          <div className="p-4 bg-slate-950/30 border-t border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 active:scale-95 transition"
            >
              <Plus className="h-4 w-4 text-emerald-500" /> Add Item Line
            </button>
            <div className="text-xs text-slate-400 font-semibold">
              Total Quantity: <strong className="text-slate-200 font-black">{totalQuantity}</strong> {totalQuantity === 1 ? "unit" : "units"}
            </div>
          </div>
        </div>

        {/* Bottom Section: Totals, GST Breakdown & Settlement */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column: Tax Breakdowns & Payment Settlement */}
          <div className="space-y-6">
            {/* GST Breakdown grouping */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">HSN GST Tax Breakdown Summary</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full min-w-[360px] divide-y divide-slate-800 text-left text-xs bg-slate-950/30">
                  <thead className="bg-slate-900/50 text-[10px] text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="px-3 py-2">HSN/SAC</th>
                      <th className="px-3 py-2 text-right">Taxable (₹)</th>
                      {isIntraState ? (
                        <>
                          <th className="px-3 py-2 text-right">CGST</th>
                          <th className="px-3 py-2 text-right">SGST</th>
                        </>
                      ) : (
                        <th className="px-3 py-2 text-right">IGST</th>
                      )}
                      <th className="px-3 py-2 text-right">Total Tax (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {Object.entries(hsnSummary).map(([hsn, data]) => (
                      <tr key={hsn} className="hover:bg-slate-900/10">
                        <td className="px-3 py-2 text-slate-300 font-bold">{hsn}</td>
                        <td className="px-3 py-2 text-right text-slate-400">{formatCurrency(data.taxable)}</td>
                        {isIntraState ? (
                          <>
                            <td className="px-3 py-2 text-right text-slate-400">{formatCurrency(data.cgst)} <span className="text-[9px] text-slate-600 block">{data.rate / 2}%</span></td>
                            <td className="px-3 py-2 text-right text-slate-400">{formatCurrency(data.sgst)} <span className="text-[9px] text-slate-600 block">{data.rate / 2}%</span></td>
                          </>
                        ) : (
                          <td className="px-3 py-2 text-right text-slate-400">{formatCurrency(data.igst)} <span className="text-[9px] text-slate-600 block">{data.rate}%</span></td>
                        )}
                        <td className="px-3 py-2 text-right text-emerald-400 font-bold">{formatCurrency(data.totalTax)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Settlement workflow */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Payment Status Details</h3>
              
              <div className="grid gap-4 grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2 py-2 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Paid">Fully Paid</option>
                  </select>
                </div>

                {paymentStatus !== "Unpaid" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Payment Mode</label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2 py-2 text-xs text-slate-100 focus:outline-none"
                      >
                        <option value="">Select Mode</option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>

                    <div className="space-y-1 animate-in slide-in-from-left-2 duration-150">
                      <label className="text-xs font-semibold text-slate-400">
                        {paymentStatus === "Paid" ? "Amount Paid (Locked)" : "Amount Paid (₹)"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        disabled={paymentStatus === "Paid"}
                        value={paymentStatus === "Paid" ? grandTotal : amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none disabled:opacity-55"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Invoice Grand Totals & Signature Options */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Invoice Bill Summaries</h3>

            <div className="space-y-3 p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs">
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-400 font-semibold">Sub Total (Taxable Value)</span>
                <span className="text-slate-200 font-bold">{formatCurrency(subTotal)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-400 font-semibold">Total GST collected</span>
                <span className="text-slate-200 font-bold">{formatCurrency(totalTax)}</span>
              </div>
              
              {/* Round Off Line Item */}
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-400 font-semibold">Rupee Round Off</span>
                <span className={`font-bold ${roundOff > 0 ? "text-emerald-400" : roundOff < 0 ? "text-amber-400" : "text-slate-400"}`}>
                  {roundOff > 0 ? `+${formatCurrency(roundOff)}` : roundOff < 0 ? `-${formatCurrency(Math.abs(roundOff))}` : `₹0.00`}
                </span>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between pt-2">
                <span className="text-sm font-extrabold text-white">Grand Total (Rounded)</span>
                <span className="text-xl font-black text-emerald-400">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Word Representation */}
            <div className="p-3 bg-slate-950/20 border border-slate-800/60 rounded-xl text-xs space-y-1">
              <span className="text-slate-500 font-bold uppercase block text-[9px]">Grand Total in Words</span>
              <strong className="text-slate-300 italic">{grandTotalWords}</strong>
            </div>

            {/* Default Terms & Conditions Snapshot Edit */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Terms & Conditions (Editable for this Invoice)</label>
              <textarea
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submission Actions */}
        <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-slate-800 hover:border-slate-700 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800 active:scale-95 transition"
          >
            Cancel & Exit
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-sm font-black text-white active:scale-95 transition disabled:opacity-55 shadow-lg shadow-emerald-950/20"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save & Finalize Invoice
          </button>
        </div>
      </form>

      {/* Quick Add Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Register Customer</h3>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddCustomerSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. R.K. SILKS"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-xs text-slate-100 placeholder-slate-750 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">State *</label>
                  <select
                    value={newCustomerState}
                    onChange={(e) => setNewCustomerState(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-2 text-xs text-slate-100 focus:outline-none"
                  >
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Contact Number</label>
                  <input
                    type="text"
                    placeholder="Mobile"
                    value={newCustomerContact}
                    onChange={(e) => setNewCustomerContact(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-xs text-slate-100 placeholder-slate-750 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">GSTIN (Optional)</label>
                <input
                  type="text"
                  placeholder="15-digit GSTIN"
                  value={newCustomerGstin}
                  onChange={(e) => setNewCustomerGstin(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-xs text-slate-100 placeholder-slate-750 focus:outline-none uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Billing Address</label>
                <textarea
                  placeholder="Street details..."
                  rows={2}
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-xs text-slate-100 placeholder-slate-750 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white transition disabled:opacity-55 shadow-md shadow-emerald-950/20"
                >
                  {savingCustomer && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Register & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
