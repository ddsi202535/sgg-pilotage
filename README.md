# SGG Pilotage — Système de Pilotage Stratégique LOLF

Application full-stack de pilotage et de suivi des performances budgétaires et opérationnelles du Secrétariat Général du Gouvernement (SGG), alignée sur la hiérarchie **LOLF**.

## 🚀 Fonctionnalités Clés

- **Hiérarchie LOLF Complète** : Suivi structuré par Axe Stratégique → Programme Budgétaire (121, 140) → Projet → Objectif → Indicateur (KPI).
- **Tableau de Bord BI Dynamique** : Indicateurs de performance calculés en temps réel (Exécution physique, Consommation budgétaire, Score LdF).
- **Moteur d'Alertes Intelligent** : Détection automatique des retards, dépassements de seuils et sous-performances avec notifications.
- **Gestion de Projets Avancée** : Diagrammes de Gantt, gestion des jalons, phases et livrables (avec upload de fichiers).
- **Suivi Budgétaire** : Vision consolidée des engagements et mandatements par programme et par projet.
- **Espace Collaboratif** : Commentaires et suivi d'activité sur chaque fiche projet.

## 🛠 Tech Stack

- **Frontend** : React 18, Vite, Tailwind CSS, Lucide Icons, Recharts.
- **Backend** : Node.js, Express, Prisma ORM.
- **Base de données** : PostgreSQL.
- **Authentification** : JWT (JSON Web Tokens) avec gestion des profils (Admin, SGG, Responsable, Chef de Projet).

## 📦 Installation

### 1. Prérequis
- Node.js (v18+)
- PostgreSQL

### 2. Installation du Backend
```bash
cd server
npm install
# Configurez votre .env (DATABASE_URL)
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 3. Installation du Frontend
```bash
# À la racine
npm install
npm run dev
```

## 🔑 Comptes de Test
- **Admin** : `hlotf2@sgg.gov.ma` / `azerty`
- **Audit** : `audit@sgg.gov.ma` / `azerty`
