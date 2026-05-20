import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.provider.createMany({
    data: [
      { id: 1, name: 'Alice Johnson', email: 'alice@prowider.com' },
      { id: 2, name: 'Bob Martinez',  email: 'bob@prowider.com' },
      { id: 3, name: 'Carol Chen',    email: 'carol@prowider.com' },
      { id: 4, name: 'David Kim',     email: 'david@prowider.com' },
      { id: 5, name: 'Eva Patel',     email: 'eva@prowider.com' },
      { id: 6, name: 'Frank Torres',  email: 'frank@prowider.com' },
      { id: 7, name: 'Grace Lee',     email: 'grace@prowider.com' },
      { id: 8, name: 'Henry Wilson',  email: 'henry@prowider.com' },
    ],
    skipDuplicates: true,
  })

  await prisma.service.createMany({
    data: [
      { id: 1, name: 'Moving Service' },
      { id: 2, name: 'Packing Service' },
      { id: 3, name: 'Storage Service' },
    ],
    skipDuplicates: true,
  })

  for (const service_id of [1, 2, 3]) {
    await prisma.roundRobinState.upsert({
      where: { service_id },
      update: {},
      create: { service_id, pointer: 0 },
    })
  }

  console.log('Seeded successfully')
}

main().then(() => prisma.$disconnect()).catch(console.error)
