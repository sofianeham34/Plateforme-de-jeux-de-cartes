import { CardBack, CardSlot, PlayingCard } from "../components/Cards.jsx";
import Seats from "./Seats.jsx";

export default function BatailleTable({ view, me, names, act }) {
  const reveal = view.phase !== "choose";
  const result = view.lastResult;

  let status;
  if (view.phase === "finished") status = "Partie terminée";
  else if (reveal && result?.type === "bataille") status = `Bataille ! ${view.pot} cartes restent en jeu`;
  else if (reveal && result?.type === "win") status = `${names[result.playerId]} remporte ${result.cards} cartes`;
  else if (view.canPlay) status = "Choisissez une carte";
  else status = "En attente des autres joueurs…";

  return (
    <div className="felt">
      <Seats
        players={view.players}
        names={names}
        me={me}
        active={(p) => !reveal && !p.hasChosen}
        render={(p) => (
          <>
            <strong>{p.won}</strong> cartes gagnées · {p.handCount} en main
          </>
        )}
      />

      <div className="felt-center">
        <p className="round-label">
          Tour {view.round}
          {view.pot > 0 && !reveal && <span className="chip chip-sm">Pot : {view.pot}</span>}
        </p>
        <div className="played-row">
          {view.players.map((p) => {
            const winner = view.phase === "reveal" && result?.type === "win" && result.playerId === p.id;
            return (
              <figure key={p.id} className={`played ${winner ? "is-winner" : ""}`}>
                {p.choice ? (
                  <PlayingCard card={p.choice} size="lg" className="flip-in" />
                ) : p.hasChosen ? (
                  <CardBack size="lg" />
                ) : (
                  <CardSlot size="lg" />
                )}
                <figcaption>{names[p.id]}</figcaption>
              </figure>
            );
          })}
        </div>
        <p className="status" aria-live="polite">
          {status}
        </p>
      </div>

      <Hand>
        {view.hand.map((card) => (
          <PlayingCard
            key={card.id}
            card={card}
            onClick={() => act({ type: "play", cardId: card.id })}
            disabled={!view.canPlay}
            dimmed={!view.canPlay}
          />
        ))}
      </Hand>
    </div>
  );
}

export function Hand({ children, label = "Votre main" }) {
  return (
    <div className="hand-wrap">
      <span className="hand-label">{label}</span>
      <div className="hand">{children}</div>
    </div>
  );
}
