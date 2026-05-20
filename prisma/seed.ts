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

  await prisma.roundRobinState.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, pointer: 0 },
  })

  console.log('Seeded successfully')
}

main().then(() => prisma.$disconnect()).catch(console.error)
