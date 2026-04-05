/**
 * Seed script — Programmes budgétaires SGG
 * Run: node seed-programmes.mjs
 */
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('--- Seed Programmes Budgétaires ---')

  // Create Programme 140
  const prog140 = await prisma.programmeBudgetaire.upsert({
    where: { code: '140' },
    update: {},
    create: {
      code: '140',
      label: 'Administration Générale et Coordination Gouvernementale',
      description: 'Coordination de l\'action gouvernementale, gestion administrative et institutionnelle du Secrétariat Général du Gouvernement.',
      budget: 0
    }
  })
  console.log('✅ Programme 140:', prog140.label)

  // Create Programme 120
  const prog120 = await prisma.programmeBudgetaire.upsert({
    where: { code: '120' },
    update: {},
    create: {
      code: '120',
      label: 'Réforme Législative, Juridique et Digitale',
      description: 'Modernisation du cadre juridique, réforme réglementaire et transformation digitale des services gouvernementaux.',
      budget: 0
    }
  })
  console.log('✅ Programme 120:', prog120.label)

  // Assign all existing projects to Programme 140
  const updated = await prisma.project.updateMany({
    where: { programmeId: null },
    data: {
      programmeId: prog140.id,
      programme: prog140.label
    }
  })
  console.log(`✅ ${updated.count} projet(s) affecté(s) au Programme 140`)

  console.log('--- Seed terminé ---')
}

main()
  .catch(e => { console.error('Seed error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
