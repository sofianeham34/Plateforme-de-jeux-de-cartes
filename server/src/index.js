import express from "express";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import { openDatabase, leaderboard } from "./db.js";
import { createAuth } from "./auth.js";
import { RoomManager } from "./rooms.js";
import { GAMES } from "./games/index.js";

const root = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3001);
const DB_FILE = process.env.DB_FILE ?? join(root, "..", "data", "ace-arena.db");
const CLIENT_DIST = join(root, "..", "..", "client", "dist");

export function createApp({ dbFile = DB_FILE, delays } = {}) {
  const db = openDatabase(dbFile);
  const auth = createAuth(db);
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    // En développement, le client Vite tourne sur un autre port.
    cors: { origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" },
  });
  const rooms = new RoomManager({ io, db, delays });

  app.use(express.json({ limit: "10kb" }));

  // ----- API REST ------------------------------------------------------------

  const bearer = (req) => req.get("authorization")?.replace(/^Bearer /, "");

  app.post("/api/register", async (req, res) => {
    const result = await auth.register(req.body?.username, req.body?.password);
    res.status(result.error ? 400 : 201).json(result);
  });

  app.post("/api/login", async (req, res) => {
    const result = await auth.login(req.body?.username, req.body?.password);
    res.status(result.error ? 401 : 200).json(result);
  });

  app.post("/api/logout", (req, res) => {
    auth.logout(bearer(req));
    res.status(204).end();
  });

  app.get("/api/me", (req, res) => {
    const user = auth.userFromToken(bearer(req));
    if (!user) return res.status(401).json({ error: "Session expirée." });
    res.json({ user });
  });

  app.get("/api/leaderboard", (_req, res) => res.json(leaderboard(db)));

  app.get("/api/games", (_req, res) =>
    res.json(Object.values(GAMES).map(({ id, name, minPlayers, maxPlayers }) => ({ id, name, minPlayers, maxPlayers })))
  );

  // En production, le serveur sert aussi le client compilé.
  if (existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST));
    app.get(/^(?!\/(api|socket\.io)\/).*/, (_req, res) => res.sendFile(join(CLIENT_DIST, "index.html")));
  }

  // ----- Temps réel ----------------------------------------------------------

  io.use((socket, next) => {
    const user = auth.userFromToken(socket.handshake.auth?.token);
    if (!user) return next(new Error("unauthorized"));
    socket.data.user = user;
    next();
  });

  io.on("connection", (socket) => {
    const { user } = socket.data;
    // Un "canal" par utilisateur : plusieurs onglets reçoivent le même état.
    socket.join(`user:${user.id}`);

    // Toutes les actions répondent via un callback (ack) : { ok } ou { error }.
    const handle = (event, fn) =>
      socket.on(event, (payload, ack) => {
        let result;
        try {
          result = fn(payload ?? {});
        } catch (err) {
          console.error(`[${event}]`, err);
          result = { error: "Erreur interne du serveur." };
        }
        if (typeof ack === "function") ack(result ?? { ok: true });
      });

    handle("lobby:subscribe", () => {
      socket.join("lobby");
      socket.emit("lobby:rooms", rooms.listOpenRooms());
    });
    handle("lobby:unsubscribe", () => socket.leave("lobby"));
    handle("room:create", (p) => rooms.create(user, p));
    handle("room:join", (p) => rooms.join(user, p.code));
    handle("room:leave", () => rooms.leave(user));
    handle("room:addBot", (p) => rooms.addBot(user, p.code));
    handle("room:removeBot", (p) => rooms.removeBot(user, p.code, p.botId));
    handle("room:start", (p) => rooms.start(user, p.code));
    handle("game:action", (p) => rooms.act(user, p.code, p.action));
    handle("chat:send", (p) => rooms.chat(user, p.code, p.text));

    socket.on("disconnect", async () => {
      const remaining = await io.in(`user:${user.id}`).fetchSockets();
      if (remaining.length === 0) rooms.disconnected(user);
    });
  });

  return { app, server, io, db, rooms };
}

// Lancement direct (et non import depuis les tests).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { server } = createApp();
  server.listen(PORT, () => console.log(`Ace Arena — serveur prêt sur http://localhost:${PORT}`));
}
