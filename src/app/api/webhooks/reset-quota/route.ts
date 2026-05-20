import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ResetQuotaSchema } from '@/lib/validators'
import { handleError, apiError } from '@/lib/api-error'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = ResetQuotaSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

    const { event_id, provider_id } = parsed.data

    const existing = await prisma.webhookEvent.findUnique({ where: { event_id } })
    if (existing) {
      return NextResponse.json({ message: 'Reset already processed', event_id }, { status: 200 })
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    await prisma.$transaction(async (tx) => {
      await tx.webhookEvent.create({ data: { event_id, payload: body } })
      await tx.leadAssignment.deleteMany({
        where: {
          ...(provider_id ? { provider_id } : {}),
          assigned_at: { gte: monthStart, lt: monthEnd },
        },
      })
    })

    return NextResponse.json({
      message: provider_id ? `Quota reset for Provider ${provider_id}` : 'Quota reset for all providers',
      event_id,
    })
  } catch (e) {
    return handleError(e)
  }
}
