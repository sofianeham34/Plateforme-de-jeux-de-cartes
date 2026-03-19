import React, {useEffect, useState } from "react";
import { Link } from "react-router-dom"; //Bibliothèque qui gère les routes
import { io } from "socket.io-client";
import { Navigate } from "react-router-dom"; //Bibliothèque qui gère les routes
const socket = io.connect("http://localhost:3001");
const Inscription = () => {
  const [inscriptionData, setInscriptionData] = useState({
    name: "",
    password: "",
  });
  const [inscriptionReussie, setInscriptionReussie] = useState(null);

useEffect(()=>{
  socket.on("inscriptionReussie", (con) => {
    if (con.connexion === 1) {
      setInscriptionReussie(true);
      console.log("inscription réussi, bienvenue " + con.login);
    } else {
      setInscriptionReussie(false);
      console.log("inscription échouée");
    }
  });
},[socket]);


  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setInscriptionData({
      ...inscriptionData,
      [name]: value,
    });
  };


  const handleInscriptionSubmit = async (event) => {
    event.preventDefault();

    socket.emit("inscription", {
      login: inscriptionData.name,
      mdp: inscriptionData.password,
    });
  };
  if (inscriptionReussie === true) {
    return <Navigate to="/formulaire" />;
  }
  return (
    <div
      className="container d-flex flex-column align-items-center justify-content-center w-50"
      style={{ height: "50vh" }}
    >
      <h1 style={{ marginBottom: "10px" }}>Veuillez vous inscrire</h1>
      <form onSubmit={handleInscriptionSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">
            Nom :
          </label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={inscriptionData.name}
            onChange={handleInputChange}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Mot de passe :
          </label>
          <input
            type="password"
            className="form-control"
            id="password"
            name="password"
            value={inscriptionData.password}
            onChange={handleInputChange}
          />
        </div>
        <button type="submit" className="btn btn-outline-dark" style={{marginLeft:"65px"}}>
          S'inscrire
        </button>
      </form>
      {inscriptionReussie === false && (
        <p style={{ marginTop: "30px" }}>
          {" "}
          Veuillez choisir un pseudo différent !{" "}
        </p>
      )}
    </div>
  );
};

export default Inscription;
