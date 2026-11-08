import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const TOKEN_KEY = "ace-arena-token";
const SessionContext = createContext(null);

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Stockage indisponible (navigation privée) : la session durera le temps de l'onglet.
  }
}

async function request(path, { token, body, method = body ? "POST" : "GET" } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return {};
  return res.json().catch(() => ({ error: "Réponse inattendue du serveur." }));
}

// Fournit l'utilisateur connecté et une connexion Socket.IO authentifiée.
export function SessionProvider({ children }) {
  const [token, setToken] = useState(readToken);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!token);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  // Vérifie la session enregistrée au démarrage.
  useEffect(() => {
    if (!token) return;
    request("/api/me", { token }).then((data) => {
      if (data.user) setUser(data.user);
      else {
        writeToken(null);
        setToken(null);
      }
      setReady(true);
    });
  }, [token]);

  useEffect(() => {
    if (!user || !token) return;
    const s = io({ auth: { token } });
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [user, token]);

  const authenticate = useCallback(async (mode, username, password) => {
    const data = await request(`/api/${mode}`, { body: { username, password } });
    if (data.error) return data.error;
    writeToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return null;
  }, []);

  const logout = useCallback(async () => {
    await request("/api/logout", { token, method: "POST" });
    writeToken(null);
    setToken(null);
    setUser(null);
  }, [token]);

  // Émet un événement et attend la réponse du serveur ({ ok } ou { error }).
  const emit = useCallback(
    (event, payload) =>
      new Promise((resolve) => {
        if (!socket) return resolve({ error: "Connexion au serveur en cours…" });
        socket.timeout(8000).emit(event, payload, (err, res) =>
          resolve(err ? { error: "Le serveur ne répond pas." } : res)
        );
      }),
    [socket]
  );

  const value = useMemo(
    () => ({ user, ready, socket, connected, emit, authenticate, logout }),
    [user, ready, socket, connected, emit, authenticate, logout]
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
