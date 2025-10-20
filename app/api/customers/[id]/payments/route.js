// app/api/customers/[id]/payments/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    // ✅ AWAIT the params first
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const skip = (page - 1) * limit;

    // ✅ Convert customerId to number
    const customerId = parseInt(id);

    // ✅ Validate that it's a valid number
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    const payments = await prisma.payment.findMany({
      where: { customerId: customerId },
      select: {
        id: true,
        paidAmount: true,
        date: true,
        discount: true,
        balance: true,
      },
      orderBy: { date: "desc" },
      skip,
      take: limit,
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
