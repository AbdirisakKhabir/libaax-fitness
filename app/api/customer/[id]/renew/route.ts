import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RenewRequest {
  expireDate: string;
  paidAmount: number;
  userId: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params is now a Promise
) {
  try {
    // Await the params to get the actual values
    const { id } = await params;
    const customerId = parseInt(id);
    
    const { expireDate, paidAmount, userId }: RenewRequest = await request.json();

    if (!expireDate || !paidAmount || !userId) {
      return NextResponse.json(
        { error: "Expire date, paid amount, and user ID are required" },
        { status: 400 }
      );
    }

    // Validate customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Parse and validate expire date
    const newExpireDate = new Date(expireDate);
    if (isNaN(newExpireDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid expire date format" },
        { status: 400 }
      );
    }

    // Update customer expire date and set as active
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        expireDate: newExpireDate,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        customerId: customerId,
        userId: userId,
        paidAmount: paidAmount,
        discount: 0,
        balance: existingCustomer.balance,
        date: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      payment: payment,
      message: "Customer renewed successfully",
    });

  } catch (error) {
    console.error("Error renewing customer:", error);
    return NextResponse.json(
      { error: "Failed to renew customer" },
      { status: 500 }
    );
  }
}