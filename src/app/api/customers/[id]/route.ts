import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.name || !body.state) {
      return NextResponse.json(
        { error: "Customer Name and State are required." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        address: body.address || "",
        contact: body.contact || "",
        gstin: body.gstin || null,
        state: body.state,
        balance: parseFloat(body.balance) || 0.0,
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if the customer has associated invoices
    const invoiceCount = await prisma.invoice.count({
      where: { customerId: id },
    });

    if (invoiceCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete customer because they have active billing invoices. Try voiding their invoices first." },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
