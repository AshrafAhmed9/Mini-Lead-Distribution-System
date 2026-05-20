import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleError } from '@/lib/api-error'

export async function GET() {
  try {
    const state = await prisma.roundRobinState.findUnique({ where: { id: 1 } })
    return NextResponse.json(state)
  } catch (e) {
    return handleError(e)
  }
}
