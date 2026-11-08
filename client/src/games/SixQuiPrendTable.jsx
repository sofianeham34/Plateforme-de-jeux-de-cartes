import { CardBack, CardSlot, CowCard } from "../components/Cards.jsx";
import Seats from "./Seats.jsx";
import { Hand } from "./BatailleTable.jsx";

function bullHeads(n) {
  if (n === 55) return 7;
  if (n % 11 === 0) return 5;
  if (n % 10 === 0) return 3;
  if (n % 5 === 0) return 2;
  return 1;
}

export default function SixQuiPrendTable({ view, me, names, act }) {
  const choosingRow = view.phase === "takeRow" && view.waitingFor === me;

  let status;
  if (view.phase === "finished") status = "Partie terminée";
  else if (choosingRow) status = "Votre carte est trop petite : cliquez sur la rangée à ramasser";
  else if (view.phase === "takeRow") status = `${names[view.waitingFor]} choisit une rangée à ramasser…`;
  else if (view.phase === "reveal" || view.phase === "endOfTurn") status = "Placement des cartes…";
  else if (view.canPlay) status = "Choisissez une carte";
  else status = "En attente des autres joueurs…";

  return (
    <div className="felt">
      <Seats
        players={view.players}
        names={names}
        me={me}
        active={(p) => (view.phase === "choose" ? !p.hasChosen : view.waitingFor === p.id)}
        render={(p) => (
          <span className={p.score >= view.endScore * 0.75 ? "danger" : ""}>
            🐮 <strong>{p.score}</strong> / {view.endScore}
          </span>
        )}
      />

      <div className="felt-center">
        <p className="round-label">Manche {view.manche}</p>
        <div className="rows">
          {view.rows.map((row, i) => {
            const heads = row.reduce((s, c) => s + bullHeads(c), 0);
            const Tag = choosingRow ? "button" : "div";
            return (
              <Tag
                key={i}
                className={`cow-row ${choosingRow ? "is-pickable" : ""}`}
                onClick={choosingRow ? () => act({ type: "takeRow", row: i }) : undefined}
                aria-label={choosingRow ? `Ramasser la rangée ${i + 1} (${heads} têtes)` : undefined}
              >
                {Array.from({ length: 6 }, (_, j) =>
                  row[j] ? (
                    <CowCard key={row[j]} value={row[j]} size="sm" />
                  ) : (
                    <CardSlot key={`slot-${j}`} size="sm" label={j === 5 ? "6" : ""} />
                  )
                )}
                <span className="row-heads">🐮 {heads}</span>
              </Tag>
            );
          })}
        </div>

        {view.pending.length > 0 && (
          <div className="pending">
            {view.pending.map(({ playerId, card }) => (
              <figure key={card} className={`played ${view.waitingFor === playerId ? "is-winner" : ""}`}>
                <CowCard value={card} size="sm" className="flip-in" />
                <figcaption>{names[playerId]}</figcaption>
              </figure>
            ))}
          </div>
        )}
        {view.phase === "choose" && (
          <div className="pending">
            {view.players
              .filter((p) => p.hasChosen)
              .map((p) => (
                <figure key={p.id} className="played">
                  <CardBack size="sm" />
                  <figcaption>{names[p.id]}</figcaption>
                </figure>
              ))}
          </div>
        )}

        <p className={`status ${choosingRow ? "status-alert" : ""}`} aria-live="polite">
          {status}
        </p>
      </div>

      <Hand>
        {view.hand.map((card) => (
          <CowCard
            key={card}
            value={card}
            onClick={() => act({ type: "play", card })}
            disabled={!view.canPlay || view.phase !== "choose"}
            className={!view.canPlay || view.phase !== "choose" ? "is-dimmed" : ""}
          />
        ))}
      </Hand>
    </div>
  );
}
