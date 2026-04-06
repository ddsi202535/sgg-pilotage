# Guide de Maintenance & Résolution de Problèmes : SGG Pilotage

Ce document fournit des solutions concrètes aux incidents techniques fréquents et décrit les procédures de maintenance préventive pour l'application.

---

## 🛠️ 1. Opérations de Routine

### Réinitialisation de la Base de Données (Seed)
⚠️ **Attention** : Cette action supprime toutes les données actuelles pour restaurer les données d'usine présentées lors de la recette.
1.  Ouvrez un terminal dans le dossier `/server`.
2.  Exécutez : `npm run db:seed`.
3.  Vérifiez que le terminal affiche le succès de la création des utilisateurs et projets.

### Mise à jour du Schéma (Prisma)
Lorsque vous modifiez le fichier `schema.prisma` :
1.  `npx prisma generate` (pour mettre à jour les types TypeScript/JS).
2.  `npx prisma migrate dev --name <description>` (pour appliquer physiquement les changements en base).

---

## 🔍 2. Diagnostic & Surveillance

### Vérification de l'API
Accédez à l'URL suivante dans votre navigateur pour vérifier que le backend répond correctement :
`http://localhost:3001/api/health`
- **Résultat attendu** : `{"status": "ok", "timestamp": "..."}`.

### Inspection des Données (Prisma Studio)
Pour explorer, modifier ou supprimer des données sans passer par l'interface UI :
1.  Dossier `/server`.
2.  Commande : `npx prisma studio`.
3.  Une interface web s'ouvrira sur le port 5555.

---

## 🚒 3. Résolution d'Incidents (FAQ)

### Erreur : "Request failed with status code 403 / 401"
- **Cause** : Votre session JWT a expiré ou le token est corrompu.
- **Solution** : Déconnectez-vous et reconnectez-vous. Si le problème persiste, videz le `localStorage` du navigateur.

### Erreur : "CORS Policy blocked the request"
- **Cause** : Le domaine frontend n'est pas autorisé par le serveur.
- **Solution** : Vérifiez la variable `origin` dans `server/src/index.js`. Assurez-vous que le port du frontend correspond à ceux listés (5173, 5174, etc.).

### Erreur : "Permission Denied" (Upload de fichiers)
- **Cause** : Le processus Node.js n'a pas les droits d'écriture sur le dossier `server/uploads`.
- **Solution** : Donnez les droits de lecture/écriture récursifs sur le dossier `/uploads` (`chmod -R 777` sur Linux ou vérifiez les propriétés sur Windows).

### Erreur : "Port 3001 already in use"
- **Cause** : Un autre service de développement est déjà lancé.
- **Solution** : Tuez le processus existant (`npx kill-port 3001`) ou changez le port dans le fichier `.env`.

---

## 💾 4. Sauvegarde & Backup

### Dump de la Base PostgreSQL
Il est recommandé d'effectuer un dump hebdomadaire :
`pg_dump -U [user] -d sgg_pilotage > backup_date.sql`

### Sauvegarde des Livrables
Copiez l'intégralité du dossier `server/uploads` sur un support externe ou un stockage réseau sécurisé. C'est ici que résident tous les documents officiels déposés par les utilisateurs.

---

> [!WARNING]
> En cas d'erreur bloquante non listée ici, vérifiez systématiquement les **logs du serveur** via la console de démarrage. Les erreurs Prisma y sont détaillées explicitement.
