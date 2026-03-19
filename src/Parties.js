import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { io } from "socket.io-client";
import "./Partie.css";

const socket = io.connect("http://localhost:3001");

const Parties = () => {
  const [listeParties, setListeParties] = useState([]);
  const [listePartiesSauvegardees,setListePartiesSauvegardees] = useState([]);  
  const [nbj, setNbj] = useState(0);
  const [id, setId] = useState(0);
  
  const [salon, setSalon] = useState(false);
  const historique = useNavigate();

  useEffect(()=>{
    socket.emit("partiesDisponibles",sessionStorage.getItem("typePartie"));
    socket.emit("partiesSauvegardeesDispo",{"typePartie":sessionStorage.getItem("typePartie"),
    "nomJoueur":sessionStorage.getItem("login")});
  },[]);

  const creerPartie = () => {
    sessionStorage.setItem("nbJMax", nbj); // Stocker nbJMax dans sessionStorage
    sessionStorage.setItem("createur",1); //
    sessionStorage.setItem("sauvegarde",0);
    socket.emit("creerPartie", {
      login: sessionStorage.getItem("login"),
      nbJMax: nbj,
      typePartie: sessionStorage.getItem("typePartie")
    });
  };

  const rejoindrePartie = () => {
    console.log(listeParties);
    console.log(typeof id);
    console.log(typeof listeParties[0]);
    if(listeParties.includes(parseInt(id))||listePartiesSauvegardees.includes(parseInt(id)) ){
      sessionStorage.setItem("idPartie", id);
      sessionStorage.setItem("createur", 0);
      if(listePartiesSauvegardees.includes(parseInt(id))){
        sessionStorage.setItem("sauvegarde",1);
      } else {
        sessionStorage.setItem("sauvegarde",0);
      } 
      socket.emit("rejoindrePartie", {
        login: sessionStorage.getItem("login"),
        idP: id,
        typePartie: sessionStorage.getItem("typePartie")
      });
  } else {
    console.log("la partie "+ id +" n'est pas disponible");
  }
  };

  useEffect(() => {
    socket.on("creationReussie", (idP) => { //stockage en session des variables necessaires
      console.log(idP);
      sessionStorage.setItem("idPartie", idP);
      setSalon(true);
    });
  
    socket.on("rejoint", (v) => {
      if (v === 1) {
        setSalon(true);
      }
    });

    socket.on("partiesDisponibles", (parties) => {
      console.log("partie" + parties);
      setListeParties(parties);
    });

    socket.on("nouvellesparties", (parties) => {
      setListeParties(parties);
    });

    socket.on("partiesSauvegardeesDispo",(parties)=>{
      setListePartiesSauvegardees(parties);
    });

  }, [socket]);

  if (salon) {
    historique("/Salon");
  }

  return (
    <div className="partie">
      <h4>{sessionStorage.getItem("typePartie")}</h4>
      <div className="creer">
        <input
          type="number"
          placeholder="Nombre de joueurs"
          min="2"
          max="10"
          onChange={(event) => {
            setNbj(event.target.value);   
          }}
          className="form-control"
        />
        <button onClick={creerPartie} className="btn btn-outline-dark" style={{ marginTop: "10px" }}>
          Créer partie
        </button>
      </div>
      <div className="rejoindre">
        <input
          placeholder="ID partie"
          onChange={(event) => {
            setId(event.target.value);
          }}
          className="form-control"
        />
    
        <button onClick={rejoindrePartie} className="btn btn-outline-dark">
          Rejoindre partie
        </button>
      </div>  
      <center>
        <h4>Toutes les parties disponibles avec leur ID :</h4>
      </center>
      {<p>Partie numéro : </p>}
      <ul>
        {listeParties && listeParties.map((partie, index) => (
          <li key={index}>{partie}</li>
        ))}
      </ul>
      <center>
        <h4>Vos parties sauvegardees :</h4>
      </center>
      {<p>Partie numéro : </p>}
      <ul>
        {listePartiesSauvegardees && listePartiesSauvegardees.map((partie, index) => (
          <li key={index}>{partie}</li>
        ))}
      </ul>
    </div>
  );
};

export default Parties;
