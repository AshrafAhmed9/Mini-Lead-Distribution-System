export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { distributeLead } from '@/lib/lead-distributor'
import { CreateLeadSchema } from '@/lib/validators'
import { handleError, apiError } from '@/lib/api-error'
import { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = CreateLeadSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

    const { phone, service_id, customer_name, city, description } = parsed.data

    const lead = await prisma.lead.create({
      data: { phone, service_id, customer_name, city, description },
    })

    await distributeLead(lead.id, lead.service_id)

    const fullLead = await prisma.lead.findUnique({
      where: { id: lead.id },
      include: { assignments: { include: { provider: true } }, service: true },
    })

    return NextResponse.json(fullLead, { status: 201 })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return apiError('A request for this service already exists for this phone number', 409)
    }
    return handleError(e)
  }
}

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      include: { assignments: { include: { provider: true } }, service: true },
      orderBy: { created_at: 'desc' },
      take: 50,
    })
    return NextResponse.json(leads)
  } catch (e) {
    return handleError(e)
  }
}
