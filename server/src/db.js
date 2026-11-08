import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function openDatabase(file) {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password   TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS results (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      game    TEXT NOT NULL,
      wins    INTEGER NOT NULL DEFAULT 0,
      losses  INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, game)
    );
  `);
  return db;
}

export function recordResult(db, userId, game, won) {
  db.prepare(
    `INSERT INTO results (user_id, game, wins, losses) VALUES (?, ?, ?, ?)
     ON CONFLICT (user_id, game) DO UPDATE SET wins = wins + excluded.wins, losses = losses + excluded.losses`
  ).run(userId, game, won ? 1 : 0, won ? 0 : 1);
}

export function leaderboard(db) {
  const rows = db
    .prepare(
      `SELECT u.username, r.game, r.wins, r.losses
       FROM results r JOIN users u ON u.id = r.user_id`
    )
    .all();

  const players = new Map();
  for (const { username, game, wins, losses } of rows) {
    if (!players.has(username)) players.set(username, { username, games: {}, wins: 0, played: 0 });
    const p = players.get(username);
    p.games[game] = { wins, losses };
    p.wins += wins;
    p.played += wins + losses;
  }
  return [...players.values()]
    .map((p) => ({ ...p, winRate: p.played ? Math.round((100 * p.wins) / p.played) : 0 }))
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
}
