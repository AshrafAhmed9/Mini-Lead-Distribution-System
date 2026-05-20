export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { distributeLead } from '@/lib/lead-distributor'
import { WebhookLeadSchema } from '@/lib/validators'
import { handleError, apiError } from '@/lib/api-error'
import { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = WebhookLeadSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

    const { event_id, phone, service_id, customer_name, city, description } = parsed.data

    const existing = await prisma.webhookEvent.findUnique({ where: { event_id } })
    if (existing) {
      return NextResponse.json({ message: 'Event already processed', event_id }, { status: 200 })
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.webhookEvent.create({ data: { event_id, payload: body } })
      return tx.lead.create({ data: { phone, service_id, customer_name, city, description } })
    })

    await distributeLead(result.id, result.service_id)

    const fullLead = await prisma.lead.findUnique({
      where: { id: result.id },
      include: { assignments: { include: { provider: true } }, service: true },
    })

    return NextResponse.json({ message: 'Lead created and distributed', lead: fullLead }, { status: 201 })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return apiError('Duplicate lead for this phone and service', 409)
    }
    return handleError(e)
  }
}
