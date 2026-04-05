import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const axes = await prisma.axeStrategique.findMany({ include: { programmes: true } })
  const pbs = await prisma.programmeBudgetaire.findMany({ include: { projects: true } })
  const objs = await prisma.objectifStrategique.findMany({ include: { cibles: { include: { mesures: true } } } })
  
  console.log('--- DATA ---')
  console.log('Axes:', JSON.stringify(axes, null, 2))
  console.log('PBs:', JSON.stringify(pbs, null, 2))
  console.log('Objectives:', JSON.stringify(objs, null, 2))
  
  await prisma.$disconnect()
}

main().catch(console.error)
