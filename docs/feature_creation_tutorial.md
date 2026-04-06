# Tutoriel : Créer une nouvelle fonctionnalité (Step-by-Step)

Ce guide illustre comment ajouter un champ **"Priorité"** (Haute, Moyenne, Basse) à un projet. C'est l'exercice idéal pour comprendre le flux complet de l'application.

---

## Étape 1 : Mise à jour du Modèle de Données (Backend)
Ouvrez `server/prisma/schema.prisma` et ajoutez le champ au modèle `Project`.

```prisma
model Project {
  id        String   @id @default(uuid())
  name      String
  // ... autres champs
  priority  String   @default("Moyenne") // <-- Nouveau champ
}
```

---

## Étape 2 : Migration de la Base de Données
Appliquez les changements en générant une nouvelle migration.

```powershell
# Dans le dossier /server
npx prisma migrate dev --name add_project_priority
```
*Ceci met à jour la base de données PostgreSQL et régénère le Prisma Client.*

---

## Étape 3 : Mise à jour des Routes API (Backend)
Ouvrez `server/src/routes/projects.js`. Modifiez les points d'entrée POST et PUT pour accepter le nouveau champ.

```javascript
// Dans router.post('/', ...) et router.put('/:id', ...)
const { name, budget, priority, ... } = req.body;

const project = await prisma.project.update({
  where: { id: req.params.id },
  data: {
    name,
    priority, // <-- Ajouter ici
    // ...
  }
});
```

---

## Étape 4 : Intégration du Service Frontend
Ouvrez `src/services/api.js`. Si vous avez utilisé des objets destructurés, assurez-vous qu'ils incluent la nouvelle propriété.

*(Note : Dans notre architecture actuelle, les objets sont souvent passés tels quels, donc cette étape peut être transparente si l'objet `data` contient déjà la priorité).*

---

## Étape 5 : Mise à jour du State Management
Ouvrez `src/contexts/DataContext.jsx`. Assurez-vous que l'état initial des formulaires (si géré ici) ou les fonctions de transformation prennent en compte le champ.

```javascript
// Exemple dans DataContext si vous avez des valeurs par défaut
const EMPTY_PROJECT = {
  name: '',
  priority: 'Moyenne', // <-- Initialisation
  // ...
};
```

---

## Étape 6 : Mise à jour de l'Interface (UI)

### A. Formulaire de création/édition
Ouvrez `src/components/modals/ProjectModal.jsx`.
1. Ajoutez "Priorité" aux constantes.
2. Ajoutez le champ `<select>` dans le JSX.

```javascript
<label>Priorité</label>
<select value={form.priority} onChange={e => set('priority', e.target.value)}>
  <option value="Haute">Haute</option>
  <option value="Moyenne">Moyenne</option>
  <option value="Basse">Basse</option>
</select>
```

### B. Affichage sur la Fiche Projet
Ouvrez `src/pages/ProjectDetail.jsx` ou `Projects.jsx` pour afficher le badge de priorité.

```javascript
<span className={`badge ${project.priority === 'Haute' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
  {project.priority}
</span>
```

---

## ✅ Résumé du flux
1. **Schema** (Structure)
2. **Migration** (Persistence)
3. **Route API** (Transport)
4. **Context/Service** (Data Hub)
5. **Component** (Visualisation)

> [!TIP]
> Toujours tester le Backend avec un outil comme Postman ou Insomnia avant de coder l'interface Frontend pour isoler les erreurs.
