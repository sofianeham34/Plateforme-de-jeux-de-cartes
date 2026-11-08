import { RANK_SHORT, SUIT_SYMBOL } from "../lib/games.js";

const RED_SUITS = new Set(["coeur", "carreau"]);

// Carte classique dessinée en CSS (nette à toutes les tailles).
export function PlayingCard({ card, size = "md", onClick, disabled, selected, dimmed, className = "" }) {
  const rank = RANK_SHORT[card.rank] ?? card.rank;
  const symbol = SUIT_SYMBOL[card.suit];
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`card card-${size} ${RED_SUITS.has(card.suit) ? "card-red" : "card-black"} ${
        selected ? "is-selected" : ""
      } ${dimmed ? "is-dimmed" : ""} ${onClick ? "is-clickable" : ""} ${className}`}
      onClick={onClick}
      disabled={onClick ? disabled : undefined}
      aria-label={`${card.rank} de ${card.suit}`}
    >
      <span className="card-corner">
        <span>{rank}</span>
        <span>{symbol}</span>
      </span>
      <span className="card-center">{symbol}</span>
      <span className="card-corner card-corner-bottom">
        <span>{rank}</span>
        <span>{symbol}</span>
      </span>
    </Tag>
  );
}

// Carte du 6 qui prend (illustrations originales du projet).
export function CowCard({ value, size = "md", onClick, disabled, selected, className = "" }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`card card-${size} card-image ${selected ? "is-selected" : ""} ${onClick ? "is-clickable" : ""} ${className}`}
      onClick={onClick}
      disabled={onClick ? disabled : undefined}
      aria-label={`Carte ${value}`}
    >
      <img src={`/cards/6qp/${value}.png`} alt="" draggable="false" />
    </Tag>
  );
}

export function CardBack({ size = "md", className = "" }) {
  return (
    <div className={`card card-${size} card-image ${className}`} aria-label="Carte cachée">
      <img src="/cards/back.png" alt="" draggable="false" />
    </div>
  );
}

export function CardSlot({ size = "md", label }) {
  return <div className={`card card-${size} card-slot`}>{label}</div>;
}
