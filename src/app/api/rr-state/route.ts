export const dynamic = 'force-dynamic'


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleError } from '@/lib/api-error'

export async function GET() {
  try {
    const states = await prisma.roundRobinState.findMany({ orderBy: { service_id: 'asc' } })
    return NextResponse.json(states)
  } catch (e) {
    return handleError(e)
  }
}
