import { prisma } from './prisma'
import { AppError } from './api-error'

const MANDATORY_PROVIDERS: Record<number, number[]> = {
  1: [1],
  2: [5],
  3: [1, 4],
}

const PROVIDER_IDS = [1, 2, 3, 4, 5]

export async function distributeLead(leadId: number, serviceId: number) {
  const mandatory = MANDATORY_PROVIDERS[serviceId] ?? []
  const slotsNeeded = 3 - mandatory.length

  return await prisma.$transaction(async (tx) => {
    // Lock the round-robin pointer — serializes concurrent distributions
    const [state] = await tx.$queryRaw<{ pointer: number }[]>`
      SELECT pointer FROM "RoundRobinState" WHERE id = 1 FOR UPDATE
    `

    let pointer = state.pointer

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const monthlyUsage = await tx.leadAssignment.groupBy({
      by: ['provider_id'],
      where: { assigned_at: { gte: monthStart, lt: monthEnd } },
      _count: { id: true },
    })

    const usageMap = new Map(monthlyUsage.map(u => [u.provider_id, u._count.id]))
    const allProviders = await tx.provider.findMany()
    const providerMap = new Map(allProviders.map(p => [p.id, p]))

    const roundRobinPicks: number[] = []
    let attempts = 0

    while (roundRobinPicks.length < slotsNeeded) {
      if (attempts > PROVIDER_IDS.length * 2) {
        throw new AppError('All providers have reached their monthly quota', 422)
      }

      const candidateId = PROVIDER_IDS[pointer % PROVIDER_IDS.length]
      pointer = (pointer + 1) % PROVIDER_IDS.length

      const provider = providerMap.get(candidateId)
      if (!provider) { attempts++; continue }

      const usedThisMonth = usageMap.get(candidateId) ?? 0
      const isMandatory = mandatory.includes(candidateId)
      const atQuota = usedThisMonth >= provider.monthly_quota

      if (!isMandatory && !atQuota) {
        roundRobinPicks.push(candidateId)
      }
      attempts++
    }

    await tx.roundRobinState.update({
      where: { id: 1 },
      data: { pointer },
    })

    const assignments = [
      ...mandatory.map(id => ({ lead_id: leadId, provider_id: id, is_mandatory: true })),
      ...roundRobinPicks.map(id => ({ lead_id: leadId, provider_id: id, is_mandatory: false })),
    ]

    await tx.leadAssignment.createMany({ data: assignments })
    return assignments
  })
}
