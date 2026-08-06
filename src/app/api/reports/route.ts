import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate") || "";
    const endDateStr = searchParams.get("endDate") || "";

    const dateFilter: any = {};
    if (startDateStr) dateFilter.gte = new Date(startDateStr);
    if (endDateStr) {
      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const hasDateFilter = startDateStr || endDateStr;
    const invoiceWhere = hasDateFilter ? { invoiceDate: dateFilter } : {};
    
    // We only calculate reports for active (non-cancelled) invoices
    const activeInvoiceWhere = {
      status: { not: "Cancelled" },
      ...(hasDateFilter ? { invoiceDate: dateFilter } : {}),
    };

    // 1. Fetch Invoices for Sales Summary
    const invoices = await prisma.invoice.findMany({
      where: activeInvoiceWhere,
      include: { items: true },
    });

    let totalSales = 0;
    let totalTaxCollected = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    invoices.forEach((inv) => {
      totalSales += inv.grandTotal;
      totalTaxCollected += inv.totalTax;
      totalPaid += inv.amountPaid;
      totalOutstanding += (inv.grandTotal - inv.amountPaid);
    });

    // 2. GST Summary Report (CGST, SGST, IGST breakdown)
    // We inspect each item on all active invoices and aggregate by tax rate and type
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    // Grouping by tax rates (e.g., 5%, 12%, 18%, 28%)
    const gstRateBreakdown: Record<number, { taxable: number; cgst: number; sgst: number; igst: number; totalTax: number }> = {};

    invoices.forEach((inv) => {
      const isIntraState = inv.placeOfSupply === inv.customerState || inv.placeOfSupply.split("-")[0] === "33"; // Fallback/default is Tamil Nadu
      
      inv.items.forEach((item) => {
        const taxable = item.quantity * item.price;
        const tax = item.gstAmount;
        const rate = item.gstRate;

        if (!gstRateBreakdown[rate]) {
          gstRateBreakdown[rate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
        }

        gstRateBreakdown[rate].taxable += taxable;
        gstRateBreakdown[rate].totalTax += tax;

        if (isIntraState) {
          const halfTax = tax / 2;
          gstRateBreakdown[rate].cgst += halfTax;
          gstRateBreakdown[rate].sgst += halfTax;
          totalCGST += halfTax;
          totalSGST += halfTax;
        } else {
          gstRateBreakdown[rate].igst += tax;
          totalIGST += tax;
        }
      });
    });

    const gstBreakdownList = Object.entries(gstRateBreakdown).map(([rate, vals]) => ({
      rate: parseFloat(rate),
      taxable: parseFloat(vals.taxable.toFixed(2)),
      cgst: parseFloat(vals.cgst.toFixed(2)),
      sgst: parseFloat(vals.sgst.toFixed(2)),
      igst: parseFloat(vals.igst.toFixed(2)),
      totalTax: parseFloat(vals.totalTax.toFixed(2)),
    }));

    // 3. Item-Wise Sales Summary
    const itemSales: Record<string, { itemId: string | null; name: string; designNo: string | null; quantity: number; salesTotal: number }> = {};

    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const key = item.itemId || item.name;
        if (!itemSales[key]) {
          itemSales[key] = {
            itemId: item.itemId,
            name: item.name,
            designNo: item.designNo,
            quantity: 0,
            salesTotal: 0,
          };
        }
        itemSales[key].quantity += item.quantity;
        itemSales[key].salesTotal += item.lineTotal;
      });
    });

    const itemSalesList = Object.values(itemSales).sort((a, b) => b.salesTotal - a.salesTotal);

    // 4. Customer-wise outstanding balances
    const customersWithBalance = await prisma.customer.findMany({
      where: {
        balance: { gt: 0 },
      },
      orderBy: { balance: "desc" },
    });

    // 5. Low Stock Alert
    const lowStockItems = await prisma.item.findMany({
      where: {
        trackStock: true,
        stock: { lte: prisma.item.fields.minStock },
      },
    });

    return NextResponse.json({
      summary: {
        totalSales: parseFloat(totalSales.toFixed(2)),
        totalTaxCollected: parseFloat(totalTaxCollected.toFixed(2)),
        totalPaid: parseFloat(totalPaid.toFixed(2)),
        totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
        cgst: parseFloat(totalCGST.toFixed(2)),
        sgst: parseFloat(totalSGST.toFixed(2)),
        igst: parseFloat(totalIGST.toFixed(2)),
      },
      gstBreakdown: gstBreakdownList,
      itemSales: itemSalesList,
      customerOutstanding: customersWithBalance,
      lowStockItems,
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
