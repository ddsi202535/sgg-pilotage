import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
  try {
    // Find a project first
    const p = await prisma.project.findFirst()
    if (!p) { console.log('No project found'); return }

    console.log('Testing create ObjectifStrategique for project:', p.id)
    const o = await prisma.objectifStrategique.create({
      data: {
        label: 'Test Objective ' + Date.now(),
        projectId: p.id
      }
    })
    console.log('SUCCESS:', o.id)
  } catch (e) {
    console.error('ERROR:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}
test()
