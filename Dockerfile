# ---- Build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_API_URL injecté au build (variable Coolify de type "Build")
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Runtime : nginx statique ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Modèle rendu par envsubst au démarrage (voir nginx.conf.template).
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# Origine de l'API, utilisée pour servir les aperçus de partage aux robots
# sociaux. Valeur de repli pour que le conteneur démarre même si la variable
# n'est pas fournie : à surcharger en production (variable Coolify "Runtime").
ENV API_ORIGIN=http://localhost:3000
EXPOSE 80
