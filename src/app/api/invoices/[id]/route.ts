import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { numberToIndianWords } from "@/lib/numberToWords";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    const oldInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!oldInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Server-side calculations for the new state
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

    const parsedAmountPaid = status === "Paid" ? grandTotal : (parseFloat(amountPaid) || 0.0);
    const finalStatus = status === "Paid" ? "Paid" : (parsedAmountPaid > 0 && parsedAmountPaid < grandTotal ? "Partially Paid" : status || "Unpaid");

    // Perform update in database transaction to ensure data integrity
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      const settings = await tx.settings.findUnique({ where: { id: 1 } });

      // 1. REVERSE OLD STOCKS (if inventory was tracked and old invoice wasn't Cancelled)
      if (settings?.trackInventory && oldInvoice.status !== "Cancelled") {
        for (const oldItem of oldInvoice.items) {
          if (oldItem.itemId) {
            const dbItem = await tx.item.findUnique({ where: { id: oldItem.itemId } });
            if (dbItem && dbItem.trackStock) {
              await tx.item.update({
                where: { id: oldItem.itemId },
                data: {
                  stock: {
                    increment: oldItem.quantity, // Give stock back
                  },
                },
              });
            }
          }
        }
      }

      // 2. REVERSE OLD CUSTOMER OUTSTANDING BALANCE (if old invoice wasn't Cancelled)
      if (oldInvoice.customerId && oldInvoice.status !== "Cancelled") {
        const oldOutstanding = oldInvoice.grandTotal - oldInvoice.amountPaid;
        if (oldOutstanding !== 0) {
          await tx.customer.update({
            where: { id: oldInvoice.customerId },
            data: {
              balance: {
                decrement: oldOutstanding, // Subtract old outstanding
              },
            },
          });
        }
      }

      // 3. DELETE OLD INVOICE ITEMS
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // 4. APPLY NEW STOCKS (if inventory tracking is enabled and status is not Cancelled)
      if (settings?.trackInventory && finalStatus !== "Cancelled") {
        for (const newItem of invoiceItemsData) {
          if (newItem.itemId) {
            const dbItem = await tx.item.findUnique({ where: { id: newItem.itemId } });
            if (dbItem && dbItem.trackStock) {
              await tx.item.update({
                where: { id: newItem.itemId },
                data: {
                  stock: {
                    decrement: newItem.quantity, // Subtract new stock
                  },
                },
              });
            }
          }
        }
      }

      // 5. APPLY NEW CUSTOMER OUTSTANDING BALANCE (if customerId is set and status is not Cancelled)
      if (customerId && finalStatus !== "Cancelled") {
        const newOutstanding = grandTotal - parsedAmountPaid;
        if (newOutstanding !== 0) {
          await tx.customer.update({
            where: { id: customerId },
            data: {
              balance: {
                increment: newOutstanding, // Add new outstanding
              },
            },
          });
        }
      }

      // 6. UPDATE INVOICE
      const invoice = await tx.invoice.update({
        where: { id },
        data: {
          invoiceDate: new Date(invoiceDate || oldInvoice.invoiceDate),
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
          terms: body.terms || oldInvoice.terms,
          bankDetails: body.bankDetails || oldInvoice.bankDetails,
          items: {
            create: invoiceItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      return invoice;
    });

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const oldInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!oldInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (oldInvoice.status === "Cancelled") {
      return NextResponse.json({ error: "Invoice is already cancelled." }, { status: 400 });
    }

    const cancelledInvoice = await prisma.$transaction(async (tx) => {
      const settings = await tx.settings.findUnique({ where: { id: 1 } });

      // 1. REVERSE INVENTORY STOCKS (if inventory tracking is enabled)
      if (settings?.trackInventory) {
        for (const item of oldInvoice.items) {
          if (item.itemId) {
            const dbItem = await tx.item.findUnique({ where: { id: item.itemId } });
            if (dbItem && dbItem.trackStock) {
              await tx.item.update({
                where: { id: item.itemId },
                data: {
                  stock: {
                    increment: item.quantity, // Restore stock
                  },
                },
              });
            }
          }
        }
      }

      // 2. REVERSE CUSTOMER OUTSTANDING BALANCE
      if (oldInvoice.customerId) {
        const outstanding = oldInvoice.grandTotal - oldInvoice.amountPaid;
        if (outstanding !== 0) {
          await tx.customer.update({
            where: { id: oldInvoice.customerId },
            data: {
              balance: {
                decrement: outstanding, // Remove outstanding balance
              },
            },
          });
        }
      }

      // 3. MARK INVOICE AS CANCELLED AND EMPTY PAYMENTS
      const invoice = await tx.invoice.update({
        where: { id },
        data: {
          status: "Cancelled",
          amountPaid: 0.0,
          paymentMode: null,
          paymentDate: null,
        },
      });

      return invoice;
    });

    return NextResponse.json(cancelledInvoice);
  } catch (error: any) {
    console.error("Error cancelling invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
