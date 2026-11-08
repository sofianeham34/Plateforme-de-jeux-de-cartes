import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GAMES, GAME_LIST } from "../lib/games.js";
import { useSession } from "../lib/session.jsx";
import { GamePreview } from "./Home.jsx";

export default function Lobby() {
  const { socket, emit, connected } = useSession();
  const navigate = useNavigate();
  const [gameId, setGameId] = useState("6quiprend");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [code, setCode] = useState("");
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);
  const game = GAMES[gameId];

  // Liste des salles ouvertes, mise à jour en direct.
  useEffect(() => {
    if (!socket || !connected) return;
    socket.on("lobby:rooms", setRooms);
    socket.emit("lobby:subscribe");
    return () => {
      socket.off("lobby:rooms", setRooms);
      socket.emit("lobby:unsubscribe");
    };
  }, [socket, connected]);

  const pickGame = (id) => {
    setGameId(id);
    setMaxPlayers((n) => Math.min(Math.max(n, GAMES[id].minPlayers), GAMES[id].maxPlayers));
  };

  const go = async (event, payload) => {
    setError(null);
    const res = await emit(event, payload);
    if (res.error) setError(res.error);
    else navigate(`/salle/${res.code}`);
  };

  return (
    <div className="page lobby">
      <h1>Jouer</h1>
      {error && <p className="form-error">{error}</p>}

      <div className="lobby-grid">
        <section className="panel">
          <h2 className="panel-title">Créer une salle</h2>
          <div className="game-picker" role="radiogroup" aria-label="Jeu">
            {GAME_LIST.map((g) => (
              <button
                key={g.id}
                role="radio"
                aria-checked={g.id === gameId}
                className={`game-option ${g.id === gameId ? "is-active" : ""}`}
                style={{ "--accent": g.accent }}
                onClick={() => pickGame(g.id)}
              >
                <GamePreview game={g} />
                <strong>{g.name}</strong>
                <span className="muted small">{g.players}</span>
              </button>
            ))}
          </div>

          <div className="create-row">
            <div className="stepper" aria-label="Nombre de places">
              <span className="muted">Places</span>
              <button
                className="icon-btn"
                onClick={() => setMaxPlayers((n) => Math.max(game.minPlayers, n - 1))}
                aria-label="Moins de places"
              >
                −
              </button>
              <strong>{maxPlayers}</strong>
              <button
                className="icon-btn"
                onClick={() => setMaxPlayers((n) => Math.min(game.maxPlayers, n + 1))}
                aria-label="Plus de places"
              >
                +
              </button>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => go("room:create", { gameId, maxPlayers })}>
              Créer la salle
            </button>
          </div>
        </section>

        <aside className="lobby-side">
          <section className="panel">
            <h2 className="panel-title">Rejoindre avec un code</h2>
            <form
              className="join-form"
              onSubmit={(e) => {
                e.preventDefault();
                go("room:join", { code });
              }}
            >
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="EX : K7Q2"
                maxLength={4}
                aria-label="Code de la salle"
                className="code-input"
              />
              <button className="btn btn-primary" disabled={code.length !== 4}>
                Rejoindre
              </button>
            </form>
          </section>

          <section className="panel">
            <h2 className="panel-title">Salles ouvertes</h2>
            {rooms.length === 0 ? (
              <p className="muted small">Aucune salle en attente. Créez-en une !</p>
            ) : (
              <ul className="room-list">
                {rooms.map((r) => (
                  <li key={r.code}>
                    <div>
                      <strong>{GAMES[r.gameId]?.name}</strong>
                      <span className="muted small">
                        {" "}
                        · {r.host} · {r.players}/{r.maxPlayers}
                      </span>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => go("room:join", { code: r.code })}>
                      Rejoindre
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
