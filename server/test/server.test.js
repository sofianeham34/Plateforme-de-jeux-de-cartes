// Tests d'intégration : API REST + parcours complet d'une salle via Socket.IO.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { io as connect } from "socket.io-client";
import { createApp } from "../src/index.js";

let ctx;
let baseUrl;
const sockets = [];

before(async () => {
  ctx = createApp({ dbFile: ":memory:", delays: { advance: 5, bot: 5 } });
  await new Promise((resolve) => ctx.server.listen(0, resolve));
  baseUrl = `http://localhost:${ctx.server.address().port}`;
});

after(() => {
  sockets.forEach((s) => s.disconnect());
  ctx.io.close();
  ctx.server.close();
});

const post = (path, body) =>
  fetch(baseUrl + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

async function register(username) {
  const res = await post("/api/register", { username, password: "secret123" });
  return res.json();
}

function socketFor(token) {
  const socket = connect(baseUrl, { auth: { token }, transports: ["websocket"] });
  sockets.push(socket);
  return socket;
}

const emit = (socket, event, payload) => new Promise((resolve) => socket.emit(event, payload, resolve));

test("inscription, connexion et rejet des identifiants invalides", async () => {
  const { token, user } = await register("alice");
  assert.ok(token);
  assert.equal(user.username, "alice");

  assert.equal((await post("/api/register", { username: "ALICE", password: "secret123" })).status, 400);
  assert.equal((await post("/api/register", { username: "a", password: "secret123" })).status, 400);
  assert.equal((await post("/api/login", { username: "alice", password: "mauvais" })).status, 401);
  // Tentative d'injection SQL : doit simplement échouer.
  assert.equal((await post("/api/login", { username: "alice' --", password: "x" })).status, 401);

  const login = await (await post("/api/login", { username: "alice", password: "secret123" })).json();
  const me = await (await fetch(`${baseUrl}/api/me`, { headers: { authorization: `Bearer ${login.token}` } })).json();
  assert.equal(me.user.username, "alice");
});

test("un socket sans session valide est refusé", async () => {
  const socket = socketFor("faux-token");
  const err = await new Promise((resolve) => socket.on("connect_error", resolve));
  assert.equal(err.message, "unauthorized");
});

test("partie complète de 8 américain contre un bot, résultat enregistré", async () => {
  const { token } = await register("bob");
  const socket = socketFor(token);
  const states = [];
  socket.on("room:state", (s) => states.push(s));

  const { code } = await emit(socket, "room:create", { gameId: "huitamericain", maxPlayers: 2 });
  assert.match(code, /^[A-Z0-9]{4}$/);
  assert.deepEqual(await emit(socket, "room:start", { code }), { error: "Il faut au moins 2 joueurs." });
  assert.deepEqual(await emit(socket, "room:addBot", { code }), { ok: true });
  assert.deepEqual(await emit(socket, "room:start", { code }), { ok: true });

  // Bob joue comme un bot simple : première carte jouable, sinon il pioche.
  const finished = await new Promise((resolve) => {
    socket.on("room:state", async (state) => {
      if (state.status === "finished") return resolve(state);
      const { game } = state;
      if (!game?.canPlay) return;
      const card = game.hand.find((c) => c.playable);
      const action = card ? { type: "play", cardId: card.id, suit: "coeur" } : { type: "draw" };
      await emit(socket, "game:action", { code, action });
    });
    emit(socket, "room:join", { code });
  });

  assert.equal(finished.game.winners.length, 1);
  const board = await (await fetch(`${baseUrl}/api/leaderboard`)).json();
  const bob = board.find((p) => p.username === "bob");
  assert.equal(bob.played, 1);
});

test("la main d'un adversaire n'est jamais envoyée au client", async () => {
  const a = await register("carol");
  const b = await register("dave");
  const sa = socketFor(a.token);
  const sb = socketFor(b.token);
  const { code } = await emit(sa, "room:create", { gameId: "bataille", maxPlayers: 2 });
  await emit(sb, "room:join", { code });

  const stateB = new Promise((resolve) => sb.on("room:state", (s) => s.game && resolve(s)));
  await emit(sa, "room:start", { code });
  const { game } = await stateB;
  assert.equal(game.hand.length, 26);
  assert.ok(game.players.every((p) => p.hand === undefined));
  assert.deepEqual(await emit(sb, "room:start", { code }), { error: "Seul l'hôte peut faire ça." });
});
