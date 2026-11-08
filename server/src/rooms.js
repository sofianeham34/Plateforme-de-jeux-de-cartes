// Gestion des salles : salon d'attente, bots, déroulement des parties et chat.
// Le serveur est la seule source de vérité : les clients envoient des
// intentions ("je joue telle carte") et reçoivent une vue filtrée de la partie
// (chaque joueur ne voit que sa propre main).
import { GAMES } from "./games/index.js";
import { recordResult } from "./db.js";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const BOT_NAMES = ["Ada", "Turing", "Hopper", "Lovelace", "Knuth", "Dijkstra", "Ritchie", "Liskov", "Hamilton"];

export class RoomManager {
  constructor({ io, db, rng = Math.random, delays = {} }) {
    this.io = io;
    this.db = db;
    this.rng = rng;
    this.delays = { advance: 1800, bot: 900, lobbyGrace: 20_000, gameGrace: 45_000, ...delays };
    this.rooms = new Map();
    this.userRoom = new Map(); // userId -> code de la salle
    this.botCounter = 0;
  }

  // ----- Salon ---------------------------------------------------------------

  listOpenRooms() {
    return [...this.rooms.values()]
      .filter((r) => r.status === "lobby" && r.players.length < r.maxPlayers)
      .map((r) => ({
        code: r.code,
        gameId: r.gameId,
        host: r.players.find((p) => p.id === r.hostId)?.name,
        players: r.players.length,
        maxPlayers: r.maxPlayers,
      }));
  }

  create(user, { gameId, maxPlayers }) {
    const game = GAMES[gameId];
    if (!game) return { error: "Jeu inconnu." };
    const max = Number(maxPlayers);
    if (!Number.isInteger(max) || max < game.minPlayers || max > game.maxPlayers) {
      return { error: `Entre ${game.minPlayers} et ${game.maxPlayers} joueurs pour ce jeu.` };
    }
    this.leave(user);
    const room = {
      code: this.newCode(),
      gameId,
      maxPlayers: max,
      hostId: playerId(user),
      status: "lobby",
      players: [],
      state: null,
      chat: [],
      timer: null,
      graceTimers: new Map(),
    };
    this.rooms.set(room.code, room);
    this.addHuman(room, user);
    this.broadcastLobby();
    return { code: room.code };
  }

  join(user, code) {
    const room = this.rooms.get(String(code ?? "").toUpperCase());
    if (!room) return { error: "Cette salle n'existe pas." };
    const pid = playerId(user);
    const existing = room.players.find((p) => p.id === pid);

    if (existing) {
      // Retour d'un joueur (rechargement de page, reconnexion…).
      clearTimeout(room.graceTimers.get(pid));
      room.graceTimers.delete(pid);
      existing.connected = true;
      if (existing.abandoned) {
        existing.isBot = false;
        existing.abandoned = false;
        this.systemMessage(room, `${existing.name} reprend sa place`);
      }
    } else {
      if (room.status !== "lobby") return { error: "La partie a déjà commencé." };
      if (room.players.length >= room.maxPlayers) return { error: "La salle est pleine." };
      this.leave(user);
      this.addHuman(room, user);
      this.broadcastLobby();
    }
    this.userRoom.set(user.id, room.code);
    this.broadcast(room);
    return { code: room.code };
  }

  leave(user) {
    const code = this.userRoom.get(user.id);
    const room = code && this.rooms.get(code);
    this.userRoom.delete(user.id);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId(user));
    if (!player) return;

    if (room.status === "playing") {
      // Un bot prend la relève pour ne pas bloquer les autres joueurs.
      player.isBot = true;
      player.abandoned = true;
      this.systemMessage(room, `${player.name} a quitté la partie, un bot prend la relève`);
      this.schedule(room);
    } else {
      room.players = room.players.filter((p) => p !== player);
      this.systemMessage(room, `${player.name} a quitté la salle`);
    }
    this.afterPlayersChanged(room);
  }

  // Appelé quand le dernier onglet d'un utilisateur se déconnecte.
  disconnected(user) {
    const room = this.rooms.get(this.userRoom.get(user.id));
    const player = room?.players.find((p) => p.id === playerId(user));
    if (!player) return;
    player.connected = false;
    this.broadcast(room);
    const grace = room.status === "playing" ? this.delays.gameGrace : this.delays.lobbyGrace;
    room.graceTimers.set(
      player.id,
      setTimeout(() => {
        room.graceTimers.delete(player.id);
        if (!player.connected) this.leave(user);
      }, grace).unref()
    );
  }

  addBot(user, code) {
    const room = this.ownedLobby(user, code);
    if (room.error) return room;
    if (room.players.length >= room.maxPlayers) return { error: "La salle est pleine." };
    const used = new Set(room.players.map((p) => p.name));
    const name = BOT_NAMES.find((n) => !used.has(`${n} (bot)`)) ?? `Bot ${this.botCounter}`;
    room.players.push({ id: `bot-${++this.botCounter}`, name: `${name} (bot)`, isBot: true, connected: true });
    this.afterPlayersChanged(room);
    return { ok: true };
  }

  removeBot(user, code, botId) {
    const room = this.ownedLobby(user, code);
    if (room.error) return room;
    room.players = room.players.filter((p) => !(p.isBot && p.id === botId));
    this.afterPlayersChanged(room);
    return { ok: true };
  }

  start(user, code) {
    const room = this.ownedLobby(user, code, { allowFinished: true });
    if (room.error) return room;
    const game = GAMES[room.gameId];
    if (room.players.length < game.minPlayers) return { error: `Il faut au moins ${game.minPlayers} joueurs.` };

    room.players = room.players.filter((p) => !p.abandoned);
    room.state = game.create(room.players, this.rng);
    room.status = "playing";
    room.resultsRecorded = false;
    this.systemMessage(room, `C'est parti : ${game.name}`);
    this.broadcastLobby();
    this.broadcast(room);
    this.schedule(room);
    return { ok: true };
  }

  // ----- Partie --------------------------------------------------------------

  act(user, code, action) {
    const room = this.rooms.get(code);
    if (!room || room.status !== "playing") return { error: "Aucune partie en cours." };
    const pid = playerId(user);
    if (!room.players.some((p) => p.id === pid && !p.isBot)) return { error: "Vous ne jouez pas dans cette partie." };
    const error = GAMES[room.gameId].act(room.state, pid, action, this.rng);
    if (error) return { error };
    this.afterMove(room);
    return { ok: true };
  }

  chat(user, code, text) {
    const room = this.rooms.get(code);
    if (!room?.players.some((p) => p.id === playerId(user))) return { error: "Vous n'êtes pas dans cette salle." };
    const clean = String(text ?? "").trim().slice(0, 300);
    if (!clean) return { error: "Message vide." };
    this.pushChat(room, { author: user.username, text: clean });
    this.broadcast(room);
    return { ok: true };
  }

  afterMove(room) {
    if (room.state.finished && !room.resultsRecorded) {
      room.resultsRecorded = true;
      room.status = "finished";
      for (const p of room.players) {
        if (p.userId) recordResult(this.db, p.userId, room.gameId, room.state.winners.includes(p.id));
      }
      const names = room.state.winners.map((id) => this.nameOf(room, id)).join(", ");
      this.systemMessage(room, `Fin de la partie — victoire de ${names} !`);
    }
    this.broadcast(room);
    if (!room.state.finished) this.schedule(room);
  }

  // Programme la prochaine étape automatique : transition temporisée
  // (révélation des cartes…) ou coup d'un bot.
  schedule(room) {
    if (room.timer || room.status !== "playing") return;
    const game = GAMES[room.gameId];
    const run = (delay, fn) => {
      room.timer = setTimeout(() => {
        room.timer = null;
        if (!this.rooms.has(room.code) || room.status !== "playing") return;
        fn();
        this.afterMove(room);
      }, delay);
    };

    if (game.needsAdvance(room.state)) {
      run(this.delays.advance, () => game.advance(room.state, this.rng));
      return;
    }
    // Tous les bots qui peuvent jouer maintenant le font ensemble (les jeux à
    // choix simultané n'attendent pas chaque bot l'un après l'autre).
    const bots = room.players.filter((p) => p.isBot && game.canAct(room.state, p.id));
    if (bots.length > 0) {
      run(this.delays.bot, () => {
        for (const bot of bots) {
          if (!game.canAct(room.state, bot.id)) continue;
          game.act(room.state, bot.id, game.botAction(room.state, bot.id, this.rng), this.rng);
        }
      });
    }
  }

  // ----- Diffusion -----------------------------------------------------------

  broadcast(room) {
    for (const p of room.players) {
      if (p.userId && !p.abandoned) this.io.to(`user:${p.userId}`).emit("room:state", this.viewFor(room, p.id));
    }
  }

  broadcastLobby() {
    this.io.to("lobby").emit("lobby:rooms", this.listOpenRooms());
  }

  viewFor(room, pid) {
    const game = GAMES[room.gameId];
    return {
      code: room.code,
      gameId: room.gameId,
      gameName: game.name,
      minPlayers: game.minPlayers,
      status: room.status,
      hostId: room.hostId,
      maxPlayers: room.maxPlayers,
      you: pid,
      players: room.players.map(({ id, name, isBot, connected }) => ({ id, name, isBot, connected })),
      chat: room.chat,
      game: room.state ? game.view(room.state, pid) : null,
    };
  }

  // ----- Utilitaires ---------------------------------------------------------

  addHuman(room, user) {
    room.players.push({ id: playerId(user), userId: user.id, name: user.username, isBot: false, connected: true });
    this.userRoom.set(user.id, room.code);
    this.systemMessage(room, `${user.username} a rejoint la salle`);
  }

  afterPlayersChanged(room) {
    const humans = room.players.filter((p) => p.userId && !p.abandoned);
    if (humans.length === 0) {
      clearTimeout(room.timer);
      room.graceTimers.forEach(clearTimeout);
      this.rooms.delete(room.code);
    } else if (!humans.some((p) => p.id === room.hostId)) {
      room.hostId = humans[0].id;
      this.systemMessage(room, `${humans[0].name} est maintenant l'hôte`);
    }
    this.broadcast(room);
    this.broadcastLobby();
  }

  ownedLobby(user, code, { allowFinished = false } = {}) {
    const room = this.rooms.get(code);
    if (!room) return { error: "Cette salle n'existe pas." };
    if (room.hostId !== playerId(user)) return { error: "Seul l'hôte peut faire ça." };
    if (room.status === "playing" || (room.status === "finished" && !allowFinished)) {
      return { error: "La partie a déjà commencé." };
    }
    return room;
  }

  systemMessage(room, text) {
    this.pushChat(room, { system: true, text });
  }

  pushChat(room, message) {
    room.chat.push({ ...message, at: Date.now() });
    room.chat = room.chat.slice(-50);
  }

  nameOf(room, pid) {
    return room.players.find((p) => p.id === pid)?.name ?? "?";
  }

  newCode() {
    let code;
    do {
      code = Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
    } while (this.rooms.has(code));
    return code;
  }
}

export const playerId = (user) => `u${user.id}`;
