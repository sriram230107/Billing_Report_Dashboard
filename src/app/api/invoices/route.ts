import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { numberToIndianWords } from "@/lib/numberToWords";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId") || "";
    const status = searchParams.get("status") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.invoiceDate.lte = end;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { invoiceDate: "desc" },
      include: {
        items: true,
      },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      invoiceDate,
      dueDate,
      ewayBillNo,
      placeOfSupply,
      customerId,
      customerName,
      customerAddress,
      customerContact,
      customerGstin,
      customerState,
      items,
      status,
      paymentMode,
      paymentDate,
      amountPaid,
    } = body;

    if (!customerName || !customerState || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Customer details and at least one item are required." },
        { status: 400 }
      );
    }

    // Server-side calculations
    let subTotal = 0;
    let totalTax = 0;
    
    const invoiceItemsData = items.map((item: any) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      const gstRate = parseFloat(item.gstRate) || 0;
      
      const lineTaxable = quantity * price;
      const lineGst = lineTaxable * (gstRate / 100);
      const lineTotal = lineTaxable + lineGst;
      
      subTotal += lineTaxable;
      totalTax += lineGst;

      return {
        itemId: item.itemId || null,
        name: item.name,
        designNo: item.designNo || null,
        hsnCode: item.hsnCode || "500720",
        quantity,
        unit: item.unit || "Pcs",
        price,
        gstRate,
        gstAmount: parseFloat(lineGst.toFixed(2)),
        lineTotal: parseFloat(lineTotal.toFixed(2)),
      };
    });

    const rawTotal = subTotal + totalTax;
    const grandTotal = Math.round(rawTotal);
    const roundOff = parseFloat((grandTotal - rawTotal).toFixed(2));
    const grandTotalWords = numberToIndianWords(grandTotal);

    // Concurrency-safe Invoice Number Generation
    let retries = 3;
    let finalInvoiceNo = "";
    let savedInvoice: any = null;

    const parsedAmountPaid = status === "Paid" ? grandTotal : (parseFloat(amountPaid) || 0.0);
    const finalStatus = status === "Paid" ? "Paid" : (parsedAmountPaid > 0 && parsedAmountPaid < grandTotal ? "Partially Paid" : status || "Unpaid");

    while (retries > 0) {
      try {
        // Run database transaction to generate number, write invoice, update inventory and customer ledger
        savedInvoice = await prisma.$transaction(async (tx) => {
          // 1. Fetch current prefix and start number settings
          const settings = await tx.settings.findUnique({ where: { id: 1 } });
          const prefix = settings?.invoicePrefix ?? "INV-2026-";
          const startNo = settings?.invoiceStartNo ?? 1;

          // 2. Fetch maximum invoice number matching the prefix
          const lastInvoices = await tx.invoice.findMany({
            where: {
              invoiceNo: {
                startsWith: prefix,
              },
            },
            orderBy: {
              invoiceNo: "desc",
            },
            take: 1,
          });

          let nextNum = startNo;
          if (lastInvoices.length > 0) {
            const lastNoStr = lastInvoices[0].invoiceNo.replace(prefix, "");
            const lastNoVal = parseInt(lastNoStr);
            if (!isNaN(lastNoVal)) {
              nextNum = lastNoVal + 1;
            }
          }

          finalInvoiceNo = `${prefix}${String(nextNum).padStart(4, "0")}`;

          // 3. Create Invoice Record
          const invoice = await tx.invoice.create({
            data: {
              invoiceNo: finalInvoiceNo,
              invoiceDate: new Date(invoiceDate || new Date()),
              dueDate: dueDate ? new Date(dueDate) : null,
              ewayBillNo: ewayBillNo || null,
              placeOfSupply,
              status: finalStatus,
              paymentMode: paymentMode || null,
              paymentDate: paymentDate ? new Date(paymentDate) : null,
              amountPaid: parsedAmountPaid,
              subTotal: parseFloat(subTotal.toFixed(2)),
              totalTax: parseFloat(totalTax.toFixed(2)),
              roundOff,
              grandTotal,
              grandTotalWords,
              customerId: customerId || null,
              customerName,
              customerAddress,
              customerContact,
              customerGstin: customerGstin || null,
              customerState,
              terms: body.terms || "",
              bankDetails: body.bankDetails || "",
              items: {
                create: invoiceItemsData,
              },
            },
          });

          // 4. Update Inventory Stocks (if tracking is enabled in Settings)
          if (settings?.trackInventory) {
            for (const item of invoiceItemsData) {
              if (item.itemId) {
                const dbItem = await tx.item.findUnique({ where: { id: item.itemId } });
                if (dbItem && dbItem.trackStock) {
                  await tx.item.update({
                    where: { id: item.itemId },
                    data: {
                      stock: {
                        decrement: item.quantity,
                      },
                    },
                  });
                }
              }
            }
          }

          // 5. Update Customer running balance if this is a registered customer
          if (customerId) {
            const outstanding = grandTotal - parsedAmountPaid;
            if (outstanding !== 0) {
              await tx.customer.update({
                where: { id: customerId },
                data: {
                  balance: {
                    increment: outstanding,
                  },
                },
              });
            }
          }

          return invoice;
        });

        // Break loop if transaction completes successfully
        break;
      } catch (err: any) {
        // Check for Prisma Unique Constraint violation on invoiceNo (SQLite code SQLITE_CONSTRAINT_UNIQUE)
        const isUniqueConstraintViolation = err.message?.includes("Unique constraint") || err.code === "P2002";
        if (isUniqueConstraintViolation) {
          retries--;
          console.warn(`Unique constraint hit on ${finalInvoiceNo}, retrying... Retries left: ${retries}`);
          if (retries === 0) {
            throw new Error(`Failed to generate a unique invoice number after 3 retries. Please try again.`);
          }
        } else {
          // If it is another database error, throw immediately
          throw err;
        }
      }
    }

    return NextResponse.json(savedInvoice);
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
