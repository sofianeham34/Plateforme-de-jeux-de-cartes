import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;

// Mot de passe stocké sous la forme "sel:hash" (scrypt, sel aléatoire par compte).
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = await scryptAsync(password, salt, 64);
  return timingSafeEqual(expected, actual);
}

export function validateCredentials(username, password) {
  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    return "Le pseudo doit faire 3 à 20 caractères (lettres, chiffres, - ou _).";
  }
  if (typeof password !== "string" || password.length < 6 || password.length > 100) {
    return "Le mot de passe doit faire au moins 6 caractères.";
  }
  return null;
}

export function createAuth(db) {
  const findUserByName = db.prepare("SELECT * FROM users WHERE username = ?");
  const insertUser = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
  const insertSession = db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)");
  const findSession = db.prepare(
    "SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?"
  );
  const deleteSession = db.prepare("DELETE FROM sessions WHERE token = ?");

  function openSession(user) {
    const token = randomBytes(32).toString("hex");
    insertSession.run(token, user.id);
    return { token, user: { id: user.id, username: user.username } };
  }

  return {
    async register(username, password) {
      const error = validateCredentials(username, password);
      if (error) return { error };
      if (findUserByName.get(username)) return { error: "Ce pseudo est déjà pris." };
      const { lastInsertRowid } = insertUser.run(username, await hashPassword(password));
      return openSession({ id: Number(lastInsertRowid), username });
    },

    async login(username, password) {
      const user = typeof username === "string" ? findUserByName.get(username) : null;
      if (!user || typeof password !== "string" || !(await verifyPassword(password, user.password))) {
        return { error: "Pseudo ou mot de passe incorrect." };
      }
      return openSession(user);
    },

    userFromToken(token) {
      if (typeof token !== "string") return null;
      const user = findSession.get(token);
      return user ? { id: user.id, username: user.username } : null;
    },

    logout(token) {
      deleteSession.run(token);
    },
  };
}
