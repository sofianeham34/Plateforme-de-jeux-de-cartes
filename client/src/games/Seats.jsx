// Bandeau des joueurs autour de la table.
export default function Seats({ players, names, me, active, render }) {
  return (
    <ul className="table-seats">
      {players.map((p) => (
        <li key={p.id} className={`table-seat ${active?.(p) ? "is-active" : ""} ${p.id === me ? "is-me" : ""}`}>
          <span className="seat-label">
            {names[p.id] ?? "?"}
            {p.id === me && " (vous)"}
          </span>
          <span className="seat-info">{render(p)}</span>
        </li>
      ))}
    </ul>
  );
}
