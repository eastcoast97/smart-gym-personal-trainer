import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating Workout
const createSchema = z.object({
  name: z.string(),
  exercises: z.string(),
  duration: z.number(),
  caloriesBurned: z.number(),
  date: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const search = searchParams.get('search') ?? '';
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search } },
      ],
    } : {};

    const [items, total] = await Promise.all([
      prisma.workout.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.workout.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    const item = await prisma.workout.create({ data: parsed.data as any });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    console.error('Error creating workouts:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}