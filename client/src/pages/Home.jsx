import { Link } from "react-router-dom";
import { GAME_LIST } from "../lib/games.js";
import { CowCard, PlayingCard } from "../components/Cards.jsx";
import { useSession } from "../lib/session.jsx";

export function GamePreview({ game }) {
  return (
    <div className="fan">
      {game.preview.map((c, i) =>
        c.cow ? (
          <CowCard key={i} value={c.cow} size="sm" />
        ) : (
          <PlayingCard key={i} card={c} size="sm" />
        )
      )}
    </div>
  );
}

export default function Home() {
  const { user } = useSession();
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">Jeux de cartes multijoueurs en temps réel</p>
          <h1>
            Réunissez vos amis
            <br />
            autour de la table.
          </h1>
          <p className="lead">
            Créez une salle, partagez son code et lancez une partie de 6 qui prend, de Bataille ouverte ou de
            8 américain. Pas assez de joueurs ? Ajoutez des bots.
          </p>
          <div className="hero-actions">
            <Link to={user ? "/jouer" : "/inscription"} className="btn btn-primary btn-lg">
              {user ? "Lancer une partie" : "Créer un compte"}
            </Link>
            <Link to="/classement" className="btn btn-ghost btn-lg">
              Voir le classement
            </Link>
          </div>
        </div>
        <div className="hero-cards" aria-hidden="true">
          <PlayingCard card={{ rank: "as", suit: "pique" }} size="xl" className="hero-card hero-card-1" />
          <CowCard value={55} size="xl" className="hero-card hero-card-2" />
          <PlayingCard card={{ rank: "8", suit: "coeur" }} size="xl" className="hero-card hero-card-3" />
        </div>
      </section>

      <section className="games-grid">
        {GAME_LIST.map((game) => (
          <article key={game.id} className="game-tile" style={{ "--accent": game.accent }}>
            <GamePreview game={game} />
            <h2>{game.name}</h2>
            <p className="muted">{game.tagline}</p>
            <span className="chip">{game.players}</span>
          </article>
        ))}
      </section>

      <section className="features">
        <div>
          <h3>Temps réel</h3>
          <p className="muted">Les coups de chaque joueur sont synchronisés instantanément via WebSocket.</p>
        </div>
        <div>
          <h3>Serveur arbitre</h3>
          <p className="muted">Le serveur distribue les cartes et applique les règles : impossible de tricher.</p>
        </div>
        <div>
          <h3>Bots intégrés</h3>
          <p className="muted">Complétez la table avec des bots, qui prennent aussi le relais si quelqu'un quitte.</p>
        </div>
      </section>
    </div>
  );
}
