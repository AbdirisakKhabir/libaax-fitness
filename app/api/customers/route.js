// app/api/customers/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const gender = searchParams.get("gender");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    let where = {};

    if (search) {
      // ✅ FIXED: Remove 'mode' parameter - use raw SQL for case-insensitive search
      where.OR = [
        {
          name: {
            contains: search,
            // Remove: mode: "insensitive"
          },
        },
        {
          phone: {
            contains: search,
          },
        },
      ];
    }

    if (status && status !== "all") {
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
          where.expireDate = {
            gte: today,
            lte: nextWeek,
          };
          break;
        default:
          break;
      }
    }

    // Add gender filter
    if (gender && gender !== "all") {
      where.gender = gender;
    }

    // Get customers with pagination
    const [customers, totalCount] = await Promise.all([
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
          _count: {
            select: {
              payments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch customers",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
