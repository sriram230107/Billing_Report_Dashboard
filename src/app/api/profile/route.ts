import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const profile = await prisma.businessProfile.findUnique({
      where: { id: 1 },
    });
    return NextResponse.json(profile || {});
  } catch (error: any) {
    console.error("Error fetching business profile:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Ensure all fields map correctly
    const profile = await prisma.businessProfile.upsert({
      where: { id: 1 },
      update: {
        name: body.name || "",
        address: body.address || "",
        phone: body.phone || "",
        email: body.email || null,
        gstin: body.gstin || "",
        state: body.state || "",
        bankName: body.bankName || "",
        bankBranch: body.bankBranch || "",
        bankAccountNo: body.bankAccountNo || "",
        bankIfsc: body.bankIfsc || "",
        bankHolderName: body.bankHolderName || "",
        logo: body.logo || null,
        upiId: body.upiId || null,
        terms: body.terms || "",
      },
      create: {
        id: 1,
        name: body.name || "",
        address: body.address || "",
        phone: body.phone || "",
        email: body.email || null,
        gstin: body.gstin || "",
        state: body.state || "",
        bankName: body.bankName || "",
        bankBranch: body.bankBranch || "",
        bankAccountNo: body.bankAccountNo || "",
        bankIfsc: body.bankIfsc || "",
        bankHolderName: body.bankHolderName || "",
        logo: body.logo || null,
        upiId: body.upiId || null,
        terms: body.terms || "",
      },
    });

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("Error saving business profile:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
