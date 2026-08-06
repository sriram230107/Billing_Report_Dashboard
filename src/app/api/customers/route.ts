import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const customers = await prisma.customer.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query } },
              { gstin: { contains: query } },
              { contact: { contains: query } },
            ],
          }
        : undefined,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.state) {
      return NextResponse.json(
        { error: "Customer Name and State are required." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
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
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
