import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      customerId,
      userId,
      paidAmount,
      discount = 0,
      balance,
      date,
    } = body;

    // Validate required fields
    if (
      !customerId ||
      !userId ||
      paidAmount === undefined ||
      balance === undefined
    ) {
      return NextResponse.json(
        {
          error: "Customer ID, User ID, paid amount, and balance are required",
        },
        { status: 400 }
      );
    }

    // Create payment
    const newPayment = await prisma.payment.create({
      data: {
        customerId: parseInt(customerId),
        userId: parseInt(userId),
        paidAmount: parseFloat(paidAmount),
        discount: parseFloat(discount),
        balance: parseFloat(balance),
        date: date ? new Date(date) : new Date(),
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);

    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Customer or user not found" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
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
