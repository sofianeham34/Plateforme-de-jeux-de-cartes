import { useState } from "react";
import { CardBack, PlayingCard } from "../components/Cards.jsx";
import Modal from "../components/Modal.jsx";
import { SUIT_NAME, SUIT_SYMBOL } from "../lib/games.js";
import Seats from "./Seats.jsx";
import { Hand } from "./BatailleTable.jsx";

export default function HuitAmericainTable({ view, me, names, act }) {
  // Un 8 en attente du choix de la couleur.
  const [pendingEight, setPendingEight] = useState(null);
  const myTurn = view.canPlay;

  const play = (card) => {
    if (card.rank === "8") setPendingEight(card);
    else act({ type: "play", cardId: card.id });
  };

  let status;
  if (view.phase === "finished") status = "Partie terminée";
  else if (myTurn && view.pendingDraw > 0) status = `Posez un as ou piochez ${view.pendingDraw} cartes`;
  else if (myTurn) status = "À vous de jouer";
  else status = `Au tour de ${names[view.currentPlayer]}`;

  const last = view.log.at(-1);

  return (
    <div className="felt">
      <Seats
        players={view.players}
        names={names}
        me={me}
        active={(p) => p.id === view.currentPlayer}
        render={(p) => (
          <span className={p.handCount === 1 ? "danger" : ""}>
            <strong>{p.handCount}</strong> carte{p.handCount > 1 ? "s" : ""}
            {p.handCount === 1 && " — dernière carte !"}
          </span>
        )}
      />

      <div className="felt-center">
        <p className="round-label">
          Sens {view.direction === 1 ? "↻ horaire" : "↺ anti-horaire"}
          {view.pendingDraw > 0 && <span className="chip chip-sm chip-warn">+{view.pendingDraw} à piocher</span>}
        </p>
        <div className="piles">
          <button
            className="pile"
            onClick={() => act({ type: "draw" })}
            disabled={!myTurn}
            aria-label={view.pendingDraw > 0 ? `Piocher ${view.pendingDraw} cartes` : "Piocher une carte"}
          >
            <CardBack size="lg" />
            <span className="pile-count">{view.drawPileCount}</span>
            {myTurn && <span className="pile-hint">Piocher{view.pendingDraw > 0 ? ` ${view.pendingDraw}` : ""}</span>}
          </button>
          <div className="pile">
            <PlayingCard key={view.topCard.id} card={view.topCard} size="lg" className="flip-in" />
            <span className={`suit-badge suit-${view.currentSuit}`} title="Couleur demandée">
              {SUIT_SYMBOL[view.currentSuit]}
            </span>
          </div>
        </div>
        {last && (
          <p className="last-move">
            {last.playerId ? <strong>{names[last.playerId]}</strong> : null} {last.text}
          </p>
        )}
        <p className="status" aria-live="polite">
          {status}
        </p>
      </div>

      <Hand>
        {view.hand.map((card) => (
          <PlayingCard
            key={card.id}
            card={card}
            onClick={() => play(card)}
            disabled={!card.playable}
            dimmed={myTurn && !card.playable}
            className={card.playable ? "is-playable" : ""}
          />
        ))}
      </Hand>

      {pendingEight && (
        <Modal title="Choisissez la couleur" onClose={() => setPendingEight(null)}>
          <div className="suit-picker">
            {Object.keys(SUIT_SYMBOL).map((suit) => (
              <button
                key={suit}
                className={`suit-choice suit-${suit}`}
                onClick={() => {
                  act({ type: "play", cardId: pendingEight.id, suit });
                  setPendingEight(null);
                }}
              >
                <span>{SUIT_SYMBOL[suit]}</span>
                {SUIT_NAME[suit]}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
