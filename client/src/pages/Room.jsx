import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSession } from "../lib/session.jsx";
import { GAMES } from "../lib/games.js";
import Chat from "../components/Chat.jsx";
import Modal, { RulesModal } from "../components/Modal.jsx";
import BatailleTable from "../games/BatailleTable.jsx";
import SixQuiPrendTable from "../games/SixQuiPrendTable.jsx";
import HuitAmericainTable from "../games/HuitAmericainTable.jsx";

const TABLES = { bataille: BatailleTable, "6quiprend": SixQuiPrendTable, huitamericain: HuitAmericainTable };

export default function Room() {
  const { code } = useParams();
  const { socket, connected, emit } = useSession();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [copied, setCopied] = useState(false);

  // Rejoint la salle (ou s'y reconnecte) à chaque (re)connexion du socket.
  useEffect(() => {
    if (!socket || !connected) return;
    const onState = (state) => state.code === code && setRoom(state);
    socket.on("room:state", onState);
    emit("room:join", { code }).then((res) => res.error && setJoinError(res.error));
    return () => socket.off("room:state", onState);
  }, [socket, connected, code, emit]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Envoie une action ; les erreurs (coup illégal…) s'affichent en notification.
  const send = useCallback(
    async (event, payload = {}) => {
      const res = await emit(event, { code, ...payload });
      if (res?.error) setToast(res.error);
      return res;
    },
    [emit, code]
  );
  const act = useCallback((action) => send("game:action", { action }), [send]);

  const leave = async () => {
    await emit("room:leave");
    navigate("/jouer");
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setToast(`Code de la salle : ${code}`);
    }
  };

  if (joinError) {
    return (
      <div className="page center">
        <div className="panel empty-state">
          <h1>Impossible de rejoindre</h1>
          <p className="muted">{joinError}</p>
          <Link to="/jouer" className="btn btn-primary">
            Retour au salon
          </Link>
        </div>
      </div>
    );
  }
  if (!room) return <div className="page-loading">Connexion à la salle…</div>;

  const game = GAMES[room.gameId];
  const isHost = room.hostId === room.you;
  const names = Object.fromEntries(room.players.map((p) => [p.id, p.name]));
  const Table = TABLES[room.gameId];

  return (
    <div className="room" style={{ "--accent": game.accent }}>
      <div className="room-bar">
        <div className="room-title">
          <h1>{game.name}</h1>
          <button className="code-pill" onClick={copyCode} title="Copier le code">
            {copied ? "Copié !" : `Code ${code}`}
          </button>
          {!connected && <span className="chip chip-warn">Reconnexion…</span>}
        </div>
        <div className="room-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowRules(true)}>
            Règles
          </button>
          <button className="btn btn-ghost btn-sm" onClick={leave}>
            {room.status === "playing" ? "Abandonner" : "Quitter"}
          </button>
        </div>
      </div>

      <div className="room-body">
        <div className="room-main">
          {room.status === "lobby" ? (
            <WaitingRoom room={room} isHost={isHost} send={send} />
          ) : (
            <Table view={room.game} me={room.you} names={names} players={room.players} act={act} />
          )}
        </div>
        <Chat code={code} messages={room.chat} />
      </div>

      {room.status === "finished" && (
        <Modal title="Partie terminée">
          <div className="result">
            <p className="result-trophy" aria-hidden="true">
              {room.game.winners.includes(room.you) ? "🏆" : "🃏"}
            </p>
            <p className="result-text">
              {room.game.winners.includes(room.you)
                ? "Bravo, vous avez gagné !"
                : `Victoire de ${room.game.winners.map((id) => names[id]).join(", ")}`}
            </p>
            <div className="result-actions">
              {isHost ? (
                <button className="btn btn-primary" onClick={() => send("room:start")}>
                  Rejouer
                </button>
              ) : (
                <p className="muted small">En attente de l'hôte pour rejouer…</p>
              )}
              <button className="btn btn-ghost" onClick={leave}>
                Quitter la salle
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showRules && <RulesModal game={game} onClose={() => setShowRules(false)} />}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function WaitingRoom({ room, isHost, send }) {
  const game = GAMES[room.gameId];
  const seats = Array.from({ length: room.maxPlayers }, (_, i) => room.players[i]);
  const canStart = room.players.length >= game.minPlayers;

  return (
    <section className="panel waiting">
      <div className="waiting-head">
        <div>
          <h2>Salle d'attente</h2>
          <p className="muted">
            Partagez le code <strong className="code-inline">{room.code}</strong> à vos amis, ou complétez avec des bots.
          </p>
        </div>
        <span className="chip">
          {room.players.length} / {room.maxPlayers}
        </span>
      </div>

      <ul className="seats">
        {seats.map((p, i) =>
          p ? (
            <li key={p.id} className="seat">
              <span className={`avatar ${p.isBot ? "avatar-bot" : ""}`}>{p.isBot ? "🤖" : p.name[0].toUpperCase()}</span>
              <span className="seat-name">
                {p.name}
                {p.id === room.hostId && <span className="chip chip-sm">Hôte</span>}
                {p.id === room.you && <span className="chip chip-sm">Vous</span>}
                {!p.connected && <span className="chip chip-sm chip-warn">Déconnecté</span>}
              </span>
              {isHost && p.isBot && (
                <button
                  className="icon-btn"
                  onClick={() => send("room:removeBot", { botId: p.id })}
                  aria-label={`Retirer ${p.name}`}
                >
                  ✕
                </button>
              )}
            </li>
          ) : (
            <li key={`empty-${i}`} className="seat seat-empty">
              {isHost && i === room.players.length ? (
                <button className="btn btn-ghost btn-sm" onClick={() => send("room:addBot")}>
                  + Ajouter un bot
                </button>
              ) : (
                <span className="muted small">Place libre</span>
              )}
            </li>
          )
        )}
      </ul>

      {isHost ? (
        <button className="btn btn-primary btn-lg" disabled={!canStart} onClick={() => send("room:start")}>
          {canStart ? "Lancer la partie" : `Encore ${game.minPlayers - room.players.length} joueur(s) minimum`}
        </button>
      ) : (
        <p className="muted">En attente du lancement par l'hôte…</p>
      )}
    </section>
  );
}
