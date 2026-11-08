import { useEffect, useState } from "react";
import { GAME_LIST } from "../lib/games.js";

export default function Leaderboard() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="page">
      <h1>Classement</h1>
      <p className="muted">Victoires cumulées sur tous les jeux.</p>
      <div className="panel table-wrap">
        {rows === null ? (
          <p className="muted">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="muted">Aucune partie terminée pour l'instant. Soyez le premier !</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Joueur</th>
                {GAME_LIST.map((g) => (
                  <th key={g.id} className="num">
                    {g.name}
                  </th>
                ))}
                <th className="num">Victoires</th>
                <th className="num">Taux</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.username}>
                  <td className="rank">{i + 1}</td>
                  <td>
                    <strong>{p.username}</strong>
                  </td>
                  {GAME_LIST.map((g) => (
                    <td key={g.id} className="num muted">
                      {p.games[g.id] ? `${p.games[g.id].wins} / ${p.games[g.id].wins + p.games[g.id].losses}` : "—"}
                    </td>
                  ))}
                  <td className="num">
                    <strong>{p.wins}</strong>
                  </td>
                  <td className="num">{p.winRate} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
