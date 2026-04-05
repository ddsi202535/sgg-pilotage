import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function resetLOLF() {
  try {
    // 1. Create Axes
    const am = await prisma.axeStrategique.create({
      data: { code: 'AXE-MOD', label: "Axe 1: Modernisation de l'Administration", sortOrder: 1 }
    })
    const aml = await prisma.axeStrategique.create({
      data: { code: 'AXE-LEG', label: 'Axe 2: Appui et Sécurisation Législative', sortOrder: 2 }
    })

    // 2. Create Programmes Budgetaires
    const pb140 = await prisma.programmeBudgetaire.create({
      data: { code: '140', label: 'Programme 140: Appui et soutien des missions', axeId: am.id, budget: 15000000 }
    })
    const pb121 = await prisma.programmeBudgetaire.create({
      data: { code: '121', label: 'Programme 121: Gestion et coordination de l\'activité législative et réglementaire du gouvernement', axeId: aml.id, budget: 25000000 }
    })

    // 3. Link existing projects (from the seed) to PB
    const projects = await prisma.project.findMany()
    for (const p of projects) {
        // Link arbitrarily just to give them PBs
        if (p.code === 'P001' || p.code === 'P005') {
            await prisma.project.update({ where: { id: p.id }, data: { programmeId: pb140.id } })
        } else {
            await prisma.project.update({ where: { id: p.id }, data: { programmeId: pb121.id } })
        }
    }
    
    console.log('✅ LOLF hierarchy successfully linked to seeded projects')
  } catch (e) {
    console.error('ERROR:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}
resetLOLF()
