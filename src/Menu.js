import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Menu = () => {
  const historique = useNavigate();
  const [valeurSelect, setValeurSelect] = useState("");

  const Redirection = () => {

    switch (valeurSelect) {
      case "bataille":
        sessionStorage.setItem("typePartie","bataille");
        historique("/Parties");
        break;

      case "6quiprend":
        sessionStorage.setItem("typePartie","6quiprend");
        historique("/Parties");
        break;

      case "HuitAmericain":
        sessionStorage.setItem("typePartie","HuitAmericain");
        historique("/Parties");
        break;
      case "PageDesScores":
        historique("/PageDesScores");
      default :
        console.log("Le jeu n'existe pas");
        break;
    }/*
    if (valeurSelect === "bataille") {
      sessionStorage.setItem("typePartie","bataille");
      historique("/Parties");
    } else {
      if(valeurSelect === "6quiprend"){
        sessionStorage.setItem("typePartie","6quiprend");
        historique("/Parties");
      }
      console.log("Le jeu n'existe pas");
    }*/
  };

  const handleSelectChange = (e) => {
    setValeurSelect(e.target.value);
  };

  return (
    <div className="container mt-5">
      <div className="card text-center"> 
        <div className="card-header">Bienvenue</div>
        <div className="card-body">
          <h5 className="card-title">
            Bonjour : {sessionStorage.getItem("login")}
          </h5>
          <form>
            <div className="form-group">
              <label htmlFor="exampleForm.ControlSelect1">
                Choisissez votre mode de jeu :
              </label>
              <select
                className="form-control"
                value={valeurSelect}
                onChange={handleSelectChange}
              >
                <option value="">Choisissez votre Jeu</option>
                <option value="bataille">Bataille Ouverte</option>
                <option value="6quiprend">6 qui prend</option>
                <option value="HuitAmericain">8 Américain</option>
                <option value="poks">Poker</option>
              </select>
            </div>
            <button
              type="button"
              className="btn btn-outline-dark"
              onClick={Redirection}
              style={{ marginTop: "10px" }}
            >
              Jouez !
            </button>
          </form>
          {valeurSelect === "poks" && (
            <p className="mt-3 text-danger">Le jeu n'existe pas encore !</p>
          )}
        </div>
      </div>
      <a class="btn btn-dark" href="/PageDesScores" role="button" style={{ position: "fixed", bottom: "20px", right: "20px"}}>
      Page des scores</a>
    </div>

  );
};

export default Menu;
