import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const items = await prisma.item.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query } },
              { designNo: { contains: query } },
              { hsnCode: { contains: query } },
            ],
          }
        : undefined,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("Error fetching items:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Item name is required." },
        { status: 400 }
      );
    }

    const item = await prisma.item.create({
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
    console.error("Error creating item:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
