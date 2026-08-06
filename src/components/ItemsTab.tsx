"use client";

import React, { useEffect, useState } from "react";
import { 
  Package, 
  Search, 
  Plus, 
  Tag, 
  FileSpreadsheet, 
  Edit3, 
  Trash2, 
  Loader2, 
  X, 
  AlertCircle, 
  Layers 
} from "lucide-react";

export const PRODUCT_UNITS = ["Pcs", "Mtr", "Kg", "Box", "Roll", "Set"];
export const GST_RATES = [0, 5, 12, 18, 28];

export default function ItemsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formId, setFormId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesignNo, setFormDesignNo] = useState("");
  const [formHsnCode, setFormHsnCode] = useState("500720");
  const [formUnit, setFormUnit] = useState("Pcs");
  const [formPrice, setFormPrice] = useState("");
  const [formGstRate, setFormGstRate] = useState("5");
  const [formStock, setFormStock] = useState("0");
  const [formTrackStock, setFormTrackStock] = useState(true);
  const [formMinStock, setFormMinStock] = useState("5");

  const fetchItems = async (searchQuery = "") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/items?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
        if (data.length > 0 && !selectedItem) {
          setSelectedItem(data[0]);
        }
      }
    } catch (e) {
      console.error("Error loading items:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchItems(search);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleOpenAdd = () => {
    setFormId(null);
    setFormName("");
    setFormDesignNo("");
    setFormHsnCode("500720");
    setFormUnit("Pcs");
    setFormPrice("");
    setFormGstRate("5");
    setFormStock("0");
    setFormTrackStock(true);
    setFormMinStock("5");
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setFormId(item.id);
    setFormName(item.name);
    setFormDesignNo(item.designNo || "");
    setFormHsnCode(item.hsnCode);
    setFormUnit(item.unit);
    setFormPrice(item.price.toString());
    setFormGstRate(item.gstRate.toString());
    setFormStock(item.stock.toString());
    setFormTrackStock(item.trackStock);
    setFormMinStock(item.minStock.toString());
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item? This action is permanent.")) return;

    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete item");

      alert("Item deleted successfully!");
      setSelectedItem(null);
      fetchItems(search);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError("Item Name is required.");
      return;
    }

    const parsedPrice = parseFloat(formPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Price must be a valid positive number.");
      return;
    }

    const parsedStock = parseFloat(formStock);
    if (formTrackStock && (isNaN(parsedStock) || parsedStock < 0)) {
      setError("Stock quantity must be a valid positive number.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        name: formName,
        designNo: formDesignNo || null,
        hsnCode: formHsnCode || "500720",
        unit: formUnit,
        price: parsedPrice,
        gstRate: parseFloat(formGstRate),
        stock: formTrackStock ? parsedStock : 0.0,
        trackStock: formTrackStock,
        minStock: formTrackStock ? (parseFloat(formMinStock) || 0.0) : 0.0,
      };

      const url = formId ? `/api/items/${formId}` : "/api/items";
      const method = formId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save item");

      setIsModalOpen(false);
      fetchItems(search);
      if (formId) {
        setSelectedItem(data);
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

  const isLowStock = (item: any) => {
    return item.trackStock && item.stock <= item.minStock;
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6">
      {/* Left Column: Search & Items List */}
      <div className="w-full md:w-80 flex flex-col border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden shadow-lg">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-500" /> Items/Products
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
              placeholder="Search by name, design, HSN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-slate-950/60 border border-slate-800 py-1.5 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {loading && items.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No items registered.
            </div>
          ) : (
            items.map((it) => (
              <button
                key={it.id}
                onClick={() => setSelectedItem(it)}
                className={`w-full text-left p-4 transition flex items-center justify-between ${
                  selectedItem?.id === it.id 
                    ? "bg-emerald-600/10 border-l-4 border-emerald-500" 
                    : "hover:bg-slate-800/30 border-l-4 border-transparent"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <h4 className="font-bold text-sm text-slate-200 truncate">{it.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    {it.designNo && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 rounded px-1.5 py-0.2 select-none uppercase">
                        {it.designNo}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{formatCurrency(it.price)}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {it.trackStock ? (
                    <>
                      <span className={`text-xs font-bold ${isLowStock(it) ? "text-red-400 font-extrabold" : "text-slate-300"}`}>
                        {it.stock} {it.unit}
                      </span>
                      <p className="text-[10px] text-slate-500">{isLowStock(it) ? "Low Stock" : "Stock"}</p>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-slate-500">N/A</span>
                      <p className="text-[10px] text-slate-600">Stock Off</p>
                    </>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Item Details */}
      <div className="flex-1 border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden shadow-lg flex flex-col">
        {selectedItem ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Item Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950/20 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white">{selectedItem.name}</h2>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-400">
                  <Tag className="h-3.5 w-3.5 text-slate-500" /> HSN: {selectedItem.hsnCode}
                  {selectedItem.designNo && (
                    <>
                      <span className="text-slate-700">|</span>
                      <span>Design: <strong className="text-slate-300 font-semibold">{selectedItem.designNo}</strong></span>
                    </>
                  )}
                  <span className="text-slate-700">|</span>
                  <span className="text-xs font-bold bg-slate-800 text-emerald-400 rounded px-2 py-0.5">
                    GST: {selectedItem.gstRate}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOpenEdit(selectedItem)}
                  className="flex items-center gap-1.5 text-xs font-bold rounded-lg border border-slate-800 hover:border-slate-700 px-3 py-1.5 text-slate-300 transition hover:bg-slate-800 active:scale-95"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Product
                </button>
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  className="flex items-center gap-1.5 text-xs font-bold rounded-lg border border-red-900/40 hover:border-red-900/60 px-3 py-1.5 text-red-400 transition hover:bg-red-950/30 active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Product
                </button>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 flex-1 overflow-y-auto grid gap-6 md:grid-cols-2">
              {/* Product Specifications */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Pricing details</h3>
                  <div className="mt-2 p-5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-4">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400 text-sm">Default Selling Price</span>
                      <strong className="text-white text-base">{formatCurrency(selectedItem.price)}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400 text-sm">Billing Unit</span>
                      <span className="text-slate-200 font-semibold">{selectedItem.unit}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-400 text-sm">Standard GST Rate</span>
                      <span className="text-emerald-400 font-extrabold">{selectedItem.gstRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory Stock Status */}
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Inventory & Stock</h3>
                <div className="mt-2 p-5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-4">
                  {selectedItem.trackStock ? (
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block">Available Stock Balance</span>
                      <span className={`text-3xl font-black ${isLowStock(selectedItem) ? "text-red-400" : "text-emerald-400"}`}>
                        {selectedItem.stock} <span className="text-base font-semibold text-slate-300">{selectedItem.unit}</span>
                      </span>
                      
                      <div className="mt-4 flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5" /> Safety Stock Limit:
                        </span>
                        <span className="text-sm font-bold text-slate-200">{selectedItem.minStock} {selectedItem.unit}</span>
                      </div>

                      {isLowStock(selectedItem) && (
                        <div className="mt-4 p-3 bg-red-950/20 border border-red-900/40 rounded-lg text-xs text-red-400 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 animate-bounce" />
                          <span>Warning: Stock is below or at safety threshold! Needs restocking soon.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500">
                      <Package className="h-10 w-10 mx-auto text-slate-700 stroke-[1.5] mb-2" />
                      <p className="text-sm">Stock tracking is disabled for this item.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
            <Package className="h-12 w-12 text-slate-700 stroke-[1.5] mb-2 animate-bounce" />
            <p className="text-sm">Select an item from the left sidebar to view specifications, or add a new product.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
              <h3 className="text-lg font-bold text-white">
                {formId ? "Edit Product Specifications" : "Register New Product"}
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
                <label className="text-xs font-semibold text-slate-300">Product/Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOFT SILK BUTT ALBUM FOLD"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Grid Design / HSN */}
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Design Number / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. D-1024"
                    value={formDesignNo}
                    onChange={(e) => setFormDesignNo(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">HSN/SAC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 500720"
                    value={formHsnCode}
                    onChange={(e) => setFormHsnCode(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Pricing, Unit, GST */}
              <div className="grid gap-4 grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Price/Unit (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Unit *</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                  >
                    {PRODUCT_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">GST Rate (%) *</label>
                  <select
                    value={formGstRate}
                    onChange={(e) => setFormGstRate(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                  >
                    {GST_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock Management Toggle */}
              <div className="py-2 flex items-center justify-between border-t border-b border-slate-800">
                <div>
                  <span className="text-sm font-semibold text-slate-200">Track Stock Inventory</span>
                  <p className="text-[10px] text-slate-400">Reduce stock levels when items are sold on invoices</p>
                </div>
                <input
                  type="checkbox"
                  checked={formTrackStock}
                  onChange={(e) => setFormTrackStock(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-800 focus:ring-emerald-500"
                />
              </div>

              {/* Stock and Threshold Grid (Only shown if tracking enabled) */}
              {formTrackStock && (
                <div className="grid gap-4 grid-cols-2 animate-in slide-in-from-top-2 duration-150">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Current Stock Quantity</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Low-Stock Alert Limit</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              )}

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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
