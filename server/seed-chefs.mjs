import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('chef123', 10)
  
  const chefs = [
    { name: 'Fatima Zahra Alaoui', email: 'fatima.alaoui@sgg.gov.ma' },
    { name: 'Mourad ELKORCHI', email: 'mourad.elkorchi@sgg.gov.ma' },
    { name: 'Driss BENALI', email: 'driss.benali@sgg.gov.ma' }
  ]

  console.log('Seeding Chef de Projet users...')
  
  for (const c of chefs) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        name: c.name,
        password,
        profileId: 'CHEF_PROJET',
        profileName: 'Chef de Projet',
        permissions: ['view_project', 'edit_project', 'upload_deliverables', 'export_own']
      }
    })
    console.log(`Created/Updated: ${user.name}`)

    // Update existing projects that match this manager name
    const updatedCount = await prisma.project.updateMany({
      where: { manager: { contains: c.name, mode: 'insensitive' } },
      data: { managerId: user.id }
    })
    console.log(`Linked ${updatedCount.count} project(s) to ${user.name}`)
  }

  // Create a Responsable de Programme for testing
  const respPass = await bcrypt.hash('resp123', 10)
  const resp = await prisma.user.upsert({
    where: { email: 'responsable140@sgg.gov.ma' },
    update: {},
    create: {
      email: 'responsable140@sgg.gov.ma',
      name: 'Youssef TAHERI',
      password: respPass,
      profileId: 'RESPONSABLE_PROGRAMME',
      profileName: 'Responsable de Programme',
      permissions: ['view_programme', 'edit_programme', 'validate_reporting', 'export', 'view_strategic', 'manage_chefs']
    }
  })
  console.log(`Created Responsable: ${resp.name}`)

  // Link to Programme 140
  await prisma.programmeBudgetaire.updateMany({
    where: { code: '140' },
    data: { responsableId: resp.id }
  })
  console.log('Linked Youssef TAHERI to Programme 140')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
