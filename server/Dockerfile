# Dockerfile pour le Backend (Express + Prisma)
FROM node:20-alpine

WORKDIR /app

# Installation des dépendances pour Prisma (OpenSSL)
RUN apk add --no-cache openssl

# Copie des fichiers de configuration
COPY package*.json ./
COPY prisma ./prisma/

# Installation des dépendances et génération du client Prisma
RUN npm install
RUN npx prisma generate

# Copie du code source
COPY src ./src/

# Création du dossier d'uploads si absent
RUN mkdir -p uploads/livrables

# Port interne
EXPOSE 3001

# Commande de démarrage : migration deploy (prod) puis serveur
CMD npx prisma migrate deploy && node src/index.js
