import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleError } from '@/lib/api-error'

export async function GET() {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const providers = await prisma.provider.findMany({
      include: {
        assignments: {
          where: { assigned_at: { gte: monthStart, lt: monthEnd } },
          select: { id: true, is_mandatory: true },
        },
      },
      orderBy: { id: 'asc' },
    })

    const result = providers.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      monthly_quota: p.monthly_quota,
      used_this_month: p.assignments.length,
      remaining: Math.max(0, p.monthly_quota - p.assignments.length),
    }))

    return NextResponse.json(result)
  } catch (e) {
    return handleError(e)
  }
}
