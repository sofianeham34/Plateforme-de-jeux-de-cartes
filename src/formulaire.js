import React, {useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom"; //Bibliothèque qui gère les routes
const socket = io.connect("http://localhost:3001");

const Formulaire = () => {
  const [formData, setFormData] = useState({
    name: "",
    password: "",
  });

  const [connexionReussie, setConnexionReussie] = useState(null); // Nouvel état pour suivre l'état de la connexion

  useEffect(()=>{
    socket.on("connecter", (data) => {
      if (data.connexion === 1) {
        setConnexionReussie(true);
        console.log("connexion reussie");
        sessionStorage.setItem("login", data.login); //on garde le login dans la session
      } else {
        setConnexionReussie(false);
        console.log("connexion echouée");
      }
    });
  },[socket]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    socket.emit("connecter", { login: formData.name, mdp: formData.password });

  };
  const histo = useNavigate();
  if (connexionReussie === true) {
    histo("/Menu");
  }
  return (
    <div
      className="container d-flex flex-column align-items-center justify-content-center w-50"
      style={{ height: "50vh" }}
    >
      <h1 style={{ marginBottom: "10px" }}>Veuillez vous connectez </h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">
            Nom :
          </label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={formData.name}
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
            value={formData.password}
            onChange={handleInputChange}
          />
        </div>
        <button type="submit" className="btn btn-outline-dark" style={{marginLeft:"45px"}}>
          Se connecter
        </button>
      </form>
      {/*{connexionReussie === true && (
        <p style={{ marginTop: "30px" }}>Connexion réussie !</p>
      )}*/}
      {connexionReussie === false && (
        <p style={{ marginTop: "30px" }}> Connexion impossible !</p>
      )}
    </div>
  );
};

export default Formulaire;
