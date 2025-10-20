import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RenewRequest {
  expireDate: string;
  paidAmount: number | string;
  userId: number | string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to get the actual values
    const { id } = await params;
    const customerId = parseInt(id, 10);

    // Parse request body
    const { expireDate, paidAmount, userId }: RenewRequest = await request.json();

    // Convert to numeric values
    const numericUserId = parseInt(userId as string, 10);
    const numericPaidAmount = parseFloat(paidAmount as string);

    // Validate required fields
    if (!expireDate || isNaN(numericPaidAmount) || isNaN(numericUserId)) {
      return NextResponse.json(
        { error: "Expire date, paid amount, and user ID are required and must be valid" },
        { status: 400 }
      );
    }

    // Validate that customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Parse expire date
    const newExpireDate = new Date(expireDate);
    if (isNaN(newExpireDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid expire date format" },
        { status: 400 }
      );
    }

    // Update customer record
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        expireDate: newExpireDate,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Create new payment record
    const payment = await prisma.payment.create({
      data: {
        customerId: customerId,
        userId: numericUserId,
        paidAmount: numericPaidAmount,
        discount: 0,
        balance: existingCustomer.balance,
        date: new Date(),
      },
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Customer renewed successfully",
      customer: updatedCustomer,
      payment: payment,
    });

  } catch (error) {
    console.error("Error renewing customer:", error);
    return NextResponse.json(
      { error: "Failed to renew customer" },
      { status: 500 }
    );
  }
}
