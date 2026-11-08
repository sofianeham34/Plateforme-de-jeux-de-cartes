import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SessionProvider, useSession } from "./lib/session.jsx";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Lobby from "./pages/Lobby.jsx";
import Room from "./pages/Room.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import "./styles.css";

function RequireAuth({ children }) {
  const { user, ready } = useSession();
  const location = useLocation();
  if (!ready) return <div className="page-loading">Chargement…</div>;
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  return children;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="connexion" element={<Auth mode="login" />} />
            <Route path="inscription" element={<Auth mode="register" />} />
            <Route path="classement" element={<Leaderboard />} />
            <Route
              path="jouer"
              element={
                <RequireAuth>
                  <Lobby />
                </RequireAuth>
              }
            />
            <Route
              path="salle/:code"
              element={
                <RequireAuth>
                  <Room />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  </StrictMode>
);
