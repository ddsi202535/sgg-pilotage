const pkg = require('@prisma/client')
const { PrismaClient } = pkg
const prisma = new PrismaClient()

async function test() {
  try {
    const r = await prisma.axeStrategique.findMany({ include: { programmes: true } })
    console.log('Result count axes:', r.length)

    const p = await prisma.project.findFirst()
    if (!p) { console.log('No project found'); return }

    console.log('Testing create ObjectifStrategique for project:', p.id)
    const o = await prisma.objectifStrategique.create({
      data: {
        label: 'Test Objective ' + Date.now(),
        projectId: p.id
      }
    })
    console.log('SUCCESS Objectif:', o.id)
  } catch (e) {
    console.error('ERROR:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}
test()
