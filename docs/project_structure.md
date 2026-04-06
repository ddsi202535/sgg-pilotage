# Spécification Technique : Architecture & Organisation des Fichiers

Ce document sert de guide d'orientation pour les développeurs intervenant sur le projet SGG Pilotage. Il détaille la structure des dossiers et le rôle de chaque composant technique.

---

## 1. Vue d'Ensemble de l'Arborescence

```text
sgg-pilotage/
├── docs/               # Documentation centralisée (MD & PDF)
├── public/             # Assets statiques du Frontend (Images, Favicon)
├── server/             # Code source du Backend (API Express)
│   ├── prisma/         # Schéma de base de données et Migrations
│   └── src/            # Logique métier du serveur (Routes, Middleware)
├── src/                # Code source du Frontend (React)
│   ├── assets/         # Styles CSS et images internes
│   ├── components/     # Composants UI réutilisables
│   ├── contexts/       # Gestion de l'état global (React Context)
│   ├── pages/          # Vues principales de l'application
│   └── services/       # Services de communication API
├── index.html          # Point d'entrée HTML (Vite)
├── package.json        # Dépendances et scripts Frontend
└── vite.config.js      # Configuration du moteur de build
```

---

## 2. Détail du Frontend (`/src`)

Le frontend est construit avec **React** et **Vite**.

-   **`main.jsx`** : Point d'entrée de l'application, initialise le rendu React.
-   **`App.jsx`** : Configuration des routes principales (React Router).
-   **`components/`** : 
    -   `layout/` : Éléments fixes (Sidebar, Navbar).
    -   `modals/` : Formulaires CRUD (ex: `ProjectModal.jsx`).
-   **`contexts/`** : 
    -   `DataContext.jsx` : Le "cœur" de la donnée. Gère les appels API globaux et synchronise l'UI.
    -   `AuthContext.jsx` : Gestion de la session utilisateur et des droits.
-   **`pages/`** : Chaque fichier correspond à une vue métier (Dashboard, Budget, BI, etc.).
-   **`services/api.js`** : Couche d'abstraction pour les appels HTTP (axios/fetch).

---

## 3. Détail du Backend (`/server`)

Le backend est une API **REST** propulsée par **Express** et **Prisma**.

-   **`server/prisma/`** :
    -   `schema.prisma` : Définition unique de la structure de données.
    -   `seed.js` : Script pour pré-remplir la base avec des données de test.
-   **`server/src/index.js`** : Point d'entrée du serveur, configure CORS, JSON et les routes.
-   **`server/src/routes/`** : Un fichier par domaine (projets, budgets, kpis, users).
-   **`server/src/middleware/auth.js`** : Protection des routes via JWT.
-   **`server/uploads/`** : Stockage physique des fichiers livrables déposés par les utilisateurs.

---

## 4. Commandes & Scripts NPM

Ces commandes sont essentielles pour la maintenance du projet.

### Pour le Backend (`/server`) :
-   `npm run dev` : Lance le serveur avec `node --watch` (rechargement auto).
-   `npx prisma migrate dev` : Applique les changements de schéma à la base de données.
-   `npm run db:seed` : Réinitialise les données de test (Attention : Efface la DB actuelle).
-   `npx prisma studio` : Interface visuelle pour explorer la base de données.

### Pour le Frontend (Racine) :
-   `npm run dev` : Lance l'environnement de développement Vite (Port 5173).
-   `npm run build` : Génère la version optimisée pour la production dans `/dist`.
-   `npm run lint` : Vérifie la qualité du code (ESLint).

---

## 5. Flux de Développement Recommandé

1.  **Changement de donnée** : Modifier `schema.prisma`.
2.  **Migration** : Lancer `prisma migrate dev`.
3.  **API** : Créer la route correspondante dans `server/src/routes/`.
4.  **Service** : Ajouter la fonction de call dans `src/services/api.js`.
5.  **UI** : Consommer la donnée via le `DataContext` et l'afficher dans les `pages`.

---

> [!TIP]
> Tous les nouveaux documents et tutoriels doivent être déposés dans le dossier `/docs` pour faciliter le transfert de compétences.
