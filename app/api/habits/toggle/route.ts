import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/habits/toggle
// Body: { habit: "trening", date: "2026-04-11" }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { habit, date } = body as { habit: string; date: string };

    if (!habit || !date) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    const dateObj = new Date(date);
    // Normalizuj do UTC północy
    dateObj.setUTCHours(0, 0, 0, 0);

    // Sprawdź czy wpis istnieje
    const existing = await prisma.habit.findUnique({
      where: { habit_date: { habit, date: dateObj } },
    });

    if (existing) {
      // Usuń wpis (toggle off)
      await prisma.habit.delete({
        where: { habit_date: { habit, date: dateObj } },
      });
      return NextResponse.json({ completed: false });
    } else {
      // Utwórz wpis (toggle on)
      await prisma.habit.create({
        data: { habit, date: dateObj, completed: true },
      });
      return NextResponse.json({ completed: true });
    }
  } catch (error) {
    console.error("Habits toggle error:", error);
    return NextResponse.json({ error: "Błąd zapisu danych" }, { status: 500 });
  }
}
