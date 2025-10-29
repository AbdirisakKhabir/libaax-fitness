import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'active', 'expired', 'expiring'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);

    let where = {};

    switch (type) {
      case 'active':
        where = {
          isActive: true,
          expireDate: { gte: today }
        };
        break;

      case 'expired':
        where = {
          OR: [
            { isActive: false },
            { expireDate: { lt: today } }
          ]
        };
        break;

      case 'expiring':
        where = {
          isActive: true,
          expireDate: {
            gte: today,
            lte: nextWeek
          }
        };
        break;

      default:
        // Return all customers if no specific type
        break;
    }

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
        orderBy: { registerDate: 'desc' },
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
      stats: {
        type,
        count: totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching customers by stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch customers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}