# Image unique : le serveur Node sert l'API, Socket.IO et le client compilé.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3001 DB_FILE=/data/ace-arena.db
COPY package.json package-lock.json ./
COPY server/package.json server/
RUN npm ci --omit=dev -w server
COPY server server
COPY --from=build /app/client/dist client/dist
VOLUME /data
EXPOSE 3001
CMD ["npm", "start"]
