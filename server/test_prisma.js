import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
  try {
    const r = await prisma.axeStrategique.findMany({
      include: { programmes: true }
    })
    console.log('Result count:', r.length)
  } catch (e) {
    console.error('ERROR:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}
test()
