import { prisma } from './prisma'
import { AppError } from './api-error'

const MANDATORY_PROVIDERS: Record<number, number[]> = {
  1: [1],
  2: [5],
  3: [1, 4],
}

const ROUND_ROBIN_POOLS: Record<number, number[]> = {
  1: [2, 3, 4],
  2: [6, 7, 8],
  3: [2, 3, 5, 6, 7, 8],
}

export async function distributeLead(leadId: number, serviceId: number) {
  const mandatory = MANDATORY_PROVIDERS[serviceId] ?? []
  const pool = ROUND_ROBIN_POOLS[serviceId] ?? []
  const slotsNeeded = 3 - mandatory.length

  return await prisma.$transaction(async (tx) => {
    const [state] = await tx.$queryRaw<{ pointer: number }[]>`
      SELECT pointer FROM "RoundRobinState" WHERE service_id = ${serviceId} FOR UPDATE
    `

    let pointer = state.pointer

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const monthlyUsage = await tx.leadAssignment.groupBy({
      by: ['provider_id'],
      where: {
        provider_id: { in: pool },
        assigned_at: { gte: monthStart, lt: monthEnd },
      },
      _count: { id: true },
    })

    const usageMap = new Map(monthlyUsage.map(u => [u.provider_id, u._count.id]))
    const poolProviders = await tx.provider.findMany({ where: { id: { in: pool } } })
    const providerMap = new Map(poolProviders.map(p => [p.id, p]))

    const roundRobinPicks: number[] = []
    let attempts = 0

    while (roundRobinPicks.length < slotsNeeded) {
      if (attempts > pool.length * 2) {
        throw new AppError('All providers in this service pool have reached their monthly quota', 422)
      }

      const candidateId = pool[pointer % pool.length]
      pointer = (pointer + 1) % pool.length

      const provider = providerMap.get(candidateId)
      if (!provider) { attempts++; continue }

      const usedThisMonth = usageMap.get(candidateId) ?? 0
      if (usedThisMonth < provider.monthly_quota) {
        roundRobinPicks.push(candidateId)
      }
      attempts++
    }

    await tx.roundRobinState.update({
      where: { service_id: serviceId },
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
