import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 1 },
    });
    return NextResponse.json(settings || {});
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        invoicePrefix: body.invoicePrefix ?? "INV-2026-",
        invoiceStartNo: parseInt(body.invoiceStartNo) || 1,
        defaultGstRate: parseFloat(body.defaultGstRate) || 5.0,
        enableEwayBill: body.enableEwayBill !== undefined ? body.enableEwayBill : true,
        ewayThreshold: parseFloat(body.ewayThreshold) || 50000.0,
        trackInventory: body.trackInventory !== undefined ? body.trackInventory : false,
      },
      create: {
        id: 1,
        invoicePrefix: body.invoicePrefix ?? "INV-2026-",
        invoiceStartNo: parseInt(body.invoiceStartNo) || 1,
        defaultGstRate: parseFloat(body.defaultGstRate) || 5.0,
        enableEwayBill: body.enableEwayBill !== undefined ? body.enableEwayBill : true,
        ewayThreshold: parseFloat(body.ewayThreshold) || 50000.0,
        trackInventory: body.trackInventory !== undefined ? body.trackInventory : false,
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
