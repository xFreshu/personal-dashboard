import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/habits?year=2026&month=4
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // ostatni dzień miesiąca

    const habits = await prisma.habit.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        habit: true,
        date: true,
        completed: true,
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ habits });
  } catch (error) {
    console.error("Habits GET error:", error);
    return NextResponse.json({ error: "Błąd pobierania danych" }, { status: 500 });
  }
}
