import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useSession } from "../lib/session.jsx";

export default function Auth({ mode }) {
  const { user, authenticate } = useSession();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  if (user) return <Navigate to={location.state?.from ?? "/jouer"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(await authenticate(isLogin ? "login" : "register", username.trim(), password));
    setBusy(false);
  };

  return (
    <div className="auth">
      <form className="panel auth-card" onSubmit={submit}>
        <h1>{isLogin ? "Bon retour !" : "Créer un compte"}</h1>
        <p className="muted">
          {isLogin ? "Connectez-vous pour rejoindre une partie." : "Un pseudo et un mot de passe suffisent."}
        </p>
        <label>
          Pseudo
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            minLength={3}
            maxLength={20}
            autoFocus
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={6}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-lg" disabled={busy}>
          {isLogin ? "Se connecter" : "S'inscrire"}
        </button>
        <p className="muted small">
          {isLogin ? (
            <>
              Pas encore de compte ? <Link to="/inscription" state={location.state}>Inscrivez-vous</Link>
            </>
          ) : (
            <>
              Déjà inscrit ? <Link to="/connexion" state={location.state}>Connectez-vous</Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
