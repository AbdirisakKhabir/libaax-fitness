import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { startDate, endDate, customerName, phone } = await req.json();

    // Validate date range
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date

    // Build where clause
    const where: any = {
      date: {
        gte: start,
        lte: end,
      },
    };

    // Add customer filters if provided
    if (customerName || phone) {
      where.customer = {};
      if (customerName) {
        where.customer.name = {
          contains: customerName,
          
        };
      }
      if (phone) {
        where.customer.phone = {
          contains: phone
        };
      }
    }

    // Fetch payments with customer and user details
    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            image: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate totals
    const totals = {
      totalPaid: payments.reduce((sum, payment) => sum + payment.paidAmount, 0),
      totalDiscount: payments.reduce((sum, payment) => sum + payment.discount, 0),
      totalBalance: payments.reduce((sum, payment) => sum + payment.balance, 0),
      totalPayments: payments.length,
      totalCustomers: new Set(payments.map(p => p.customerId)).size,
    };

    return NextResponse.json({
      payments,
      totals,
      period: {
        startDate: start,
        endDate: end,
      },
    });
  } catch (error) {
    console.error("Error fetching payments report:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments report" + (error instanceof Error ? `: ${error.message}` : '') },
      { status: 500 }
    );
  }
}