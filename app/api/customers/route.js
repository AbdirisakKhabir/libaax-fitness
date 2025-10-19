import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status"); // 'active', 'expired', 'expiring'

    // Build where clause for filtering
    let where = {};

    // Search filter (name or phone)
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: search,
          },
        },
      ];
    }

    // Status filter
    if (status) {
      const today = new Date();

      switch (status) {
        case "active":
          where.isActive = true;
          where.expireDate = {
            gte: today,
          };
          break;

        case "expired":
          where.OR = [
            { isActive: false },
            {
              expireDate: {
                lt: today,
              },
            },
          ];
          break;

        case "expiring":
          const nextWeek = new Date();
          nextWeek.setDate(today.getDate() + 7);

          where.isActive = true;
          where.expireDate = {
            gte: today,
            lte: nextWeek,
          };
          break;

        default:
          break;
      }
    }

    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        image: true,
        registerDate: true,
        expireDate: true,
        fee: true,
        isActive: true,
        gender: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
        payments: {
          select: {
            id: true,
            paidAmount: true,
            date: true, // Changed from paymentDate to date
            discount: true,
            balance: true,
          },
          orderBy: {
            date: "desc", // Changed from paymentDate to date
          },
          take: 5, // Get last 5 payments
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
