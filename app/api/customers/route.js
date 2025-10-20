import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50"); // default 50 per page

    const skip = (page - 1) * limit;

    let where = {};

    // Search by name or phone
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    // Status filter
    if (status) {
      const today = new Date();
      switch (status) {
        case "active":
          where.isActive = true;
          where.expireDate = { gte: today };
          break;

        case "expired":
          where.OR = [{ isActive: false }, { expireDate: { lt: today } }];
          break;

        case "expiring":
          const nextWeek = new Date();
          nextWeek.setDate(today.getDate() + 7);
          where.isActive = true;
          where.expireDate = { gte: today, lte: nextWeek };
          break;

        default:
          break;
      }
    }

    // Run both queries in parallel for speed
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
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
              date: true,
              discount: true,
              balance: true,
            },
            orderBy: { date: "desc" },
            take: 5,
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      data: customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
