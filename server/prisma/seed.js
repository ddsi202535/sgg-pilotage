import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.comment.deleteMany()
  await prisma.deliverable.deleteMany()
  await prisma.milestone.deleteMany()
  await prisma.phase.deleteMany()
  await prisma.risk.deleteMany()
  await prisma.project.deleteMany()
  await prisma.budgetMonth.deleteMany()
  await prisma.budget.deleteMany()
  await prisma.kPI.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const passwordHash = await bcrypt.hash('admin123', 10)

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@sgg.gov.ma',
        password: passwordHash,
        name: 'Administrateur SGG',
        profileId: 'SGG',
        profileName: 'SGG',
        permissions: ['view_all', 'edit_all', 'validate', 'export', 'admin']
      }
    }),
    prisma.user.create({
      data: {
        email: 'resp@sgg.gov.ma',
        password: passwordHash,
        name: 'Responsable Programme',
        profileId: 'RESPONSABLE_PROGRAMME',
        profileName: 'Responsable de Programme',
        permissions: ['view_programme', 'edit_programme', 'validate_reporting']
      }
    }),
    prisma.user.create({
      data: {
        email: 'chef@sgg.gov.ma',
        password: passwordHash,
        name: 'Chef de Projet',
        profileId: 'CHEF_PROJET',
        profileName: 'Chef de Projet',
        permissions: ['view_project', 'edit_project', 'upload_deliverables']
      }
    }),
    prisma.user.create({
      data: {
        email: 'audit@sgg.gov.ma',
        password: passwordHash,
        name: 'Auditeur',
        profileId: 'AUDIT',
        profileName: 'Inspection/Audit/IGF',
        permissions: ['view_all_readonly', 'extract_reports']
      }
    })
  ])
  console.log(`✅ ${users.length} users created`)

  // Create projects with phases, milestones, deliverables
  const project1 = await prisma.project.create({
    data: {
      code: 'P001',
      name: 'Digitalisation des procédures administratives',
      type: 'informatique',
      programme: "Modernisation de l'administration",
      status: 'en_cours',
      physicalProgress: 65,
      financialProgress: 58,
      budget: 15000000,
      consumed: 8700000,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2025-12-31'),
      directorate: 'DT',
      manager: 'Ahmed Bennani',
      sourceBudget: 'INVEST',
      description: "Mise en place d'une plateforme de dématérialisation des procédures",
      phases: {
        create: [
          { name: 'Conception', status: 'done', progress: 100, sortOrder: 1 },
          { name: 'Développement', status: 'in_progress', progress: 70, sortOrder: 2 },
          { name: 'Tests', status: 'pending', progress: 0, sortOrder: 3 },
          { name: 'Déploiement', status: 'pending', progress: 0, sortOrder: 4 }
        ]
      },
      milestones: {
        create: [
          { name: 'Cahier des charges', date: new Date('2024-03-01'), status: 'done' },
          { name: 'Prototype', date: new Date('2024-06-30'), status: 'done' },
          { name: 'Version Bêta', date: new Date('2024-12-15'), status: 'in_progress' },
          { name: 'Livraison finale', date: new Date('2025-06-30'), status: 'pending' }
        ]
      },
      deliverables: {
        create: [
          { name: 'Cahier des charges' },
          { name: 'Spécifications techniques' },
          { name: 'Manuel utilisateur' }
        ]
      }
    }
  })

  const project2 = await prisma.project.create({
    data: {
      code: 'P002',
      name: 'Réforme du cadre juridique',
      type: 'juridique',
      programme: 'Modernisation législative',
      status: 'en_cours',
      physicalProgress: 40,
      financialProgress: 35,
      budget: 5000000,
      consumed: 1750000,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-08-31'),
      directorate: 'DAJ',
      manager: 'Fatima Zahra Alaoui',
      sourceBudget: 'MDD',
      description: 'Élaboration et adoption de nouveaux textes juridiques',
      phases: {
        create: [
          { name: 'Étude comparative', status: 'done', progress: 100, sortOrder: 1 },
          { name: 'Rédaction avant-projet', status: 'in_progress', progress: 60, sortOrder: 2 },
          { name: 'Consultation', status: 'pending', progress: 0, sortOrder: 3 },
          { name: 'Adoption', status: 'pending', progress: 0, sortOrder: 4 }
        ]
      },
      milestones: {
        create: [
          { name: "Rapport d'étude", date: new Date('2024-05-31'), status: 'done' },
          { name: 'Avant-projet', date: new Date('2024-10-31'), status: 'in_progress' },
          { name: 'Validation gouvernementale', date: new Date('2025-03-31'), status: 'pending' }
        ]
      },
      deliverables: {
        create: [
          { name: "Rapport d'étude" },
          { name: 'Avant-projet de loi' },
          { name: 'Note explicative' }
        ]
      }
    }
  })

  const project3 = await prisma.project.create({
    data: {
      code: 'P003',
      name: 'Campagne de communication gouvernementale',
      type: 'communication',
      programme: 'Communication publique',
      status: 'en_cours',
      physicalProgress: 80,
      financialProgress: 75,
      budget: 8000000,
      consumed: 6000000,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-12-31'),
      directorate: 'DICOM',
      manager: 'Karim Tazi',
      sourceBudget: 'FONDS ANRT',
      description: 'Campagne multi-supports de sensibilisation',
      phases: {
        create: [
          { name: 'Stratégie', status: 'done', progress: 100, sortOrder: 1 },
          { name: 'Production', status: 'done', progress: 90, sortOrder: 2 },
          { name: 'Diffusion', status: 'in_progress', progress: 60, sortOrder: 3 },
          { name: 'Évaluation', status: 'pending', progress: 0, sortOrder: 4 }
        ]
      },
      milestones: {
        create: [
          { name: 'Plan média', date: new Date('2024-03-15'), status: 'done' },
          { name: 'Production contenus', date: new Date('2024-06-30'), status: 'done' },
          { name: 'Lancement campagne', date: new Date('2024-09-01'), status: 'done' }
        ]
      },
      deliverables: {
        create: [
          { name: 'Charte graphique' },
          { name: 'Spots vidéo' },
          { name: 'Affiches' },
          { name: "Rapport d'impact" }
        ]
      }
    }
  })

  const project4 = await prisma.project.create({
    data: {
      code: 'P004',
      name: 'Équipement des administrations régionales',
      type: 'equipement',
      programme: 'Infrastructure numérique',
      status: 'planification',
      physicalProgress: 10,
      financialProgress: 5,
      budget: 25000000,
      consumed: 1250000,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2026-08-31'),
      directorate: 'DLOG',
      manager: 'Mohammed Amine Iraqi',
      sourceBudget: 'DIO',
      description: 'Équipement en matériel informatique des directions régionales',
      phases: {
        create: [
          { name: 'Audit existant', status: 'done', progress: 100, sortOrder: 1 },
          { name: "Appel d'offres", status: 'in_progress', progress: 50, sortOrder: 2 },
          { name: 'Livraison', status: 'pending', progress: 0, sortOrder: 3 },
          { name: 'Installation', status: 'pending', progress: 0, sortOrder: 4 }
        ]
      },
      milestones: {
        create: [
          { name: "Rapport d'audit", date: new Date('2024-08-31'), status: 'done' },
          { name: 'Attribution marché', date: new Date('2025-01-31'), status: 'pending' }
        ]
      },
      deliverables: {
        create: [
          { name: "Rapport d'audit" },
          { name: "Dossier d'appel d'offres" }
        ]
      }
    }
  })

  const project5 = await prisma.project.create({
    data: {
      code: 'P005',
      name: 'Formation des cadres SGG',
      type: 'organisationnel',
      programme: 'Développement des compétences',
      status: 'en_cours',
      physicalProgress: 55,
      financialProgress: 50,
      budget: 3000000,
      consumed: 1500000,
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-31'),
      directorate: 'DRH',
      manager: 'Salma Benkirane',
      sourceBudget: 'PNUD',
      description: 'Programme de formation continue des cadres',
      phases: {
        create: [
          { name: 'Identification besoins', status: 'done', progress: 100, sortOrder: 1 },
          { name: 'Planification', status: 'done', progress: 80, sortOrder: 2 },
          { name: 'Réalisation formations', status: 'in_progress', progress: 40, sortOrder: 3 },
          { name: 'Évaluation', status: 'pending', progress: 0, sortOrder: 4 }
        ]
      },
      milestones: {
        create: [
          { name: 'Catalogue formations', date: new Date('2024-05-31'), status: 'done' },
          { name: '50% sessions réalisées', date: new Date('2024-09-30'), status: 'in_progress' }
        ]
      },
      deliverables: {
        create: [
          { name: 'Plan de formation' },
          { name: 'Supports pédagogiques' },
          { name: 'Attestations' }
        ]
      }
    }
  })
  console.log('✅ 5 projects created with phases, milestones, deliverables')

  // Create risks
  await prisma.risk.createMany({
    data: [
      {
        code: 'R001',
        title: 'Retard de développement technique',
        description: "Complexité technique sous-estimée pour l'intégration avec les systèmes existants",
        projectId: project1.id,
        programme: "Modernisation de l'administration",
        category: 'technique',
        probability: 4, impact: 4, level: 'élevé',
        owner: 'Ahmed Bennani',
        mitigation: "Renforcer l'équipe de développement avec des experts externes",
        mitigationProgress: 60, status: 'actif'
      },
      {
        code: 'R002',
        title: 'Opposition syndicale à la réforme',
        description: 'Résistance potentielle des organisations syndicales face aux changements proposés',
        projectId: project2.id,
        programme: 'Modernisation législative',
        category: 'social',
        probability: 3, impact: 5, level: 'élevé',
        owner: 'Fatima Zahra Alaoui',
        mitigation: 'Organiser des concertations préalables avec les partenaires sociaux',
        mitigationProgress: 40, status: 'actif'
      },
      {
        code: 'R003',
        title: 'Dépassement budgétaire',
        description: "Risque de dépassement du budget alloué en raison de l'inflation des coûts IT",
        projectId: project1.id,
        programme: "Modernisation de l'administration",
        category: 'financier',
        probability: 3, impact: 3, level: 'moyen',
        owner: 'Ahmed Bennani',
        mitigation: 'Négocier des contrats cadres avec les fournisseurs',
        mitigationProgress: 80, status: 'actif'
      },
      {
        code: 'R004',
        title: 'Délais de livraison fournisseurs',
        description: "Retards potentiels de livraison des équipements en raison des tensions sur la chaîne d'approvisionnement",
        projectId: project4.id,
        programme: 'Infrastructure numérique',
        category: 'logistique',
        probability: 4, impact: 3, level: 'moyen',
        owner: 'Mohammed Amine Iraqi',
        mitigation: 'Prévoir des clauses pénalités et identifier des fournisseurs alternatifs',
        mitigationProgress: 30, status: 'actif'
      },
      {
        code: 'R005',
        title: 'Non-conformité réglementaire',
        description: 'Évolution de la réglementation pendant le projet pouvant rendre certaines solutions obsolètes',
        projectId: project1.id,
        programme: "Modernisation de l'administration",
        category: 'réglementaire',
        probability: 2, impact: 4, level: 'moyen',
        owner: 'Ahmed Bennani',
        mitigation: 'Veille réglementaire active et architecture modulaire',
        mitigationProgress: 50, status: 'actif'
      }
    ]
  })
  console.log('✅ 5 risks created')

  // Create budgets
  await prisma.budget.createMany({
    data: [
      { name: "Modernisation de l'administration", budget: 15000000, engaged: 8700000, spent: 7200000, source: 'INVEST' },
      { name: 'Modernisation législative', budget: 5000000, engaged: 1750000, spent: 1400000, source: 'MDD' },
      { name: 'Communication publique', budget: 8000000, engaged: 6000000, spent: 5100000, source: 'FONDS ANRT' },
      { name: 'Infrastructure numérique', budget: 25000000, engaged: 1250000, spent: 900000, source: 'DIO' },
      { name: 'Développement des compétences', budget: 3000000, engaged: 1500000, spent: 900000, source: 'PNUD' }
    ]
  })

  await prisma.budgetMonth.createMany({
    data: [
      { month: 'Jan', year: 2024, budget: 4000000, spent: 3200000 },
      { month: 'Fév', year: 2024, budget: 4500000, spent: 3800000 },
      { month: 'Mar', year: 2024, budget: 5000000, spent: 4100000 },
      { month: 'Avr', year: 2024, budget: 4800000, spent: 3900000 },
      { month: 'Mai', year: 2024, budget: 5200000, spent: 4200000 },
      { month: 'Juin', year: 2024, budget: 5500000, spent: 4500000 },
      { month: 'Juil', year: 2024, budget: 4000000, spent: 3100000 },
      { month: 'Août', year: 2024, budget: 3500000, spent: 2800000 },
      { month: 'Sep', year: 2024, budget: 5000000, spent: 4000000 },
      { month: 'Oct', year: 2024, budget: 5500000, spent: 0 },
      { month: 'Nov', year: 2024, budget: 5000000, spent: 0 },
      { month: 'Déc', year: 2024, budget: 4000000, spent: 0 }
    ]
  })
  console.log('✅ Budget data created')

  // Create KPIs
  await prisma.kPI.createMany({
    data: [
      { code: 'K001', name: "Taux d'exécution budgétaire", value: 72, unit: '%', target: 80, trend: 'up' },
      { code: 'K002', name: "Taux d'avancement physique moyen", value: 58, unit: '%', target: 65, trend: 'up' },
      { code: 'K003', name: 'Nombre de projets en retard', value: 2, unit: '', target: 0, trend: 'down' },
      { code: 'K004', name: 'Taux de couverture des risques', value: 100, unit: '%', target: 100, trend: 'stable' },
      { code: 'K005', name: 'Satisfaction des parties prenantes', value: 78, unit: '%', target: 85, trend: 'up' },
      { code: 'K006', name: 'Délai moyen de réalisation', value: 85, unit: 'jours', target: 90, trend: 'up' }
    ]
  })
  console.log('✅ 6 KPIs created')

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
