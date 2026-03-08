import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating Workout (all fields optional for partial update)
const updateSchema = z.object({
  name: z.string(),
  exercises: z.string(),
  duration: z.number(),
  caloriesBurned: z.number(),
  date: z.string(),
}).partial();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.workout.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }
    return NextResponse.json({ data: item });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    const item = await prisma.workout.update({
      where: { id },
      data: parsed.data as any,
    });
    return NextResponse.json({ data: item });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }
    console.error('Error updating workouts:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.workout.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }
    console.error('Error deleting workouts:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}