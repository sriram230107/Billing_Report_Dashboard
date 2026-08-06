import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Item name is required." },
        { status: 400 }
      );
    }

    const item = await prisma.item.update({
      where: { id },
      data: {
        name: body.name,
        designNo: body.designNo || null,
        hsnCode: body.hsnCode || "500720",
        unit: body.unit || "Pcs",
        price: parseFloat(body.price) || 0.0,
        gstRate: parseFloat(body.gstRate) || 5.0,
        stock: parseFloat(body.stock) || 0.0,
        trackStock: body.trackStock !== undefined ? body.trackStock : false,
        minStock: parseFloat(body.minStock) || 0.0,
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Error updating item:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if the item is present on any invoice line items
    const invoiceCount = await prisma.invoiceItem.count({
      where: { itemId: id },
    });

    if (invoiceCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete item because it has historical sales records. Try updating its stock to 0 instead." },
        { status: 400 }
      );
    }

    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting item:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
