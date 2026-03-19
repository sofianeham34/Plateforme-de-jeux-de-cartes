import React from "react";
import ReactDOM from "react-dom"; //Bibliothèque qui fournit des méthodes pour manipuler le DOM
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom"; //Bibliothèque qui gère les routes
import Inscription from "./inscription"; //Pour allez à la route /inscription
import Formulaire from "./formulaire"; //Pour allez à la route /formulaire
import "bootstrap/dist/css/bootstrap.min.css"; //Importation de la bibliothèque bootstrap
import Button from "react-bootstrap/Button"; //Imporation du "Button" de bootstrap pour faciliter l'utilisation de bootstrap sur react
import Menu from "./Menu";
//import Test from "./partiebataille";
import Parties from "./Parties";
import Salon from "./salon";
import App from "./regle";
import Chat from "./regle";
import QuiPrend from "./QuiPrend";
import "./index.css";
import HuitAmericain from "./HuitAmericain";
import PageDesScores from "./PageDesScores";
const Index = () => {
  return (
    //Router est le composant racine
    //Routes contient les définitions des routes
    //Route définit chaque route individuelle
    //Link est utilisé pour créer des liens entre ces routes
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div
              className="container d-flex flex-column align-items-center justify-content-center"
              style={{ height: "50vh" }}
            >
              <div className="row">
                <div className="col text-center">
                  <h2 style={{ marginBottom: "20px" }}>
                    Bienvenue dans la ACE ARENA!
                  </h2>
                  <h3 style={{ marginBottom: "20px" }}>
                    Un site qui regroupe plusieurs jeux de cartes.
                  </h3>
                </div>
              </div>
              <div className="row">
                <div className="col text-center">
                  <Link to="/inscription">
                    <Button variant="outline-dark">
                      {" "}
                      Allez à l'inscription{" "}
                    </Button>
                  </Link>

                  <Link to="/formulaire">
                    <Button
                      variant="outline-dark"
                      style={{ marginLeft: "10px" }}
                    >
                      Se connecter
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="fixed-bottom text-center">
                <h5 style={{ marginBottom: "15px" }}>
                  Ce site a été créé par Aly HACHEM REDA, Sofiane HAAMAR, Sami
                  CHBICHEB, Dogukan TOKMAK
                </h5>
              </div>
            </div>
          }
        />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/formulaire" element={<Formulaire />} />
        <Route path="/Menu" element={<Menu />} />
        <Route path="/Parties" element={<Parties />} />
        <Route path="/Salon" element={<Salon />} />
        <Route path="/Jeu" element={<App/>}/>
        <Route path="/Jeu" element={<Chat/>}/>
        <Route path="/QuiPrend" element={<QuiPrend/>}/>
        <Route path="/HuitAmericain" element={<HuitAmericain/>}/>
        <Route path="/PageDesScores" element={<PageDesScores/>}/>

        </Routes>
    </Router>
  );  
};

const root=ReactDOM.createRoot( document.getElementById("root"));
root.render(<Index />);