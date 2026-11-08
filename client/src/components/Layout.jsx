import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSession } from "../lib/session.jsx";

export default function Layout() {
  const { user, logout } = useSession();
  const navigate = useNavigate();

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <img src="/icon.png" alt="" />
          <span>Ace Arena</span>
        </Link>
        <nav className="topnav">
          <NavLink to="/jouer">Jouer</NavLink>
          <NavLink to="/classement">Classement</NavLink>
        </nav>
        <div className="topbar-user">
          {user ? (
            <>
              <span className="avatar" aria-hidden="true">
                {user.username[0].toUpperCase()}
              </span>
              <span className="username">{user.username}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link to="/connexion" className="btn btn-primary btn-sm">
              Se connecter
            </Link>
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
