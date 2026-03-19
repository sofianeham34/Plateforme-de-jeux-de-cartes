import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { io } from "socket.io-client";

const socket = io.connect("http://localhost:3001");

const Salon = () => {
  const historique = useNavigate();
  const [nbj, setNbj] = useState(0);
  const [listeJ, setListeJ] = useState([sessionStorage.getItem("login")]);
  const [passerJeu, setPasserJeu] = useState(false);
  const [paquet,setPaquet] = useState([]); 
  const idP = sessionStorage.getItem("idPartie");
  const [nbBots, setNbBots] = useState(0);
  console.log("idp salon "+idP);
  const partieSauvegardee = sessionStorage.getItem("sauvegarde");
  useEffect(()=>{
    if(partieSauvegardee == 1){
      socket.emit("demandePaquet",idP);
      socket.emit("demandeCreateur",idP);
    } 
    socket.emit("rejRoom", idP);
    socket.emit("joueursDansPartie", idP);

  },[]);
  
  const Demarrer = () => {
    console.log("createur ?",sessionStorage.getItem("createur"));
    if (sessionStorage.getItem("createur")==1) {
      if (nbj >= 2 && nbj <= 10) {
        console.log("tentative de demarrage partie");
        socket.emit("demarrerPartie", { "idP": idP });
      } else {
        if(partieSauvegardee==1 &&  paquet.length == nbj){
          console.log('demarrage partie sauvegarde');
          socket.emit("demarrerPartie", { "idP": idP });
        } else{
          alert("Il doit y avoir entre 2 et 10 joueurs pour lancer la partie.");
        } 
        
      }
    }
  };

  useEffect(() => {

    socket.on("demandeCreateur",nom=>{
      if(nom == sessionStorage.getItem("login")){
        console.log("le createur kho");
        sessionStorage.setItem("createur",1);
      }else {
        sessionStorage.setItem("createur",0);
      }
    });
    socket.on("demandePaquet",(paquet)=>{
      sessionStorage.setItem("paquetSauvegarde",paquet);
      setPaquet(paquet);
    });
    socket.on("ok", () => {
      console.log("joueur a rejoint la room");
    });
   
    socket.on("nouveauJoueur", (joueurs) => {
      console.log("joueurs",joueurs);
      const liste = joueurs;
      setListeJ(liste);
      setNbj(liste.length);
    });

    socket.on("infoDemarrageP", () => {
      console.log("on lance");
      setPasserJeu(true);
    });

    socket.on("joueurRejRoom",()=>{
      console.log("vous avez rejoint la room");
    });

  }, [socket]);
 
  useEffect(()=>{
      let listejoueurs=JSON.stringify(listeJ);
      sessionStorage.setItem("listeJoueurs",listejoueurs);
  },[listeJ]);

  // Effet pour mettre à jour sessionStorage lorsque nbj change
  useEffect(() => {
    sessionStorage.setItem("nbJMax", nbj); // Mettre à jour nbJMAX dans sessionStorage
  }, [nbj]);


  if (passerJeu) {
    switch(sessionStorage.getItem("typePartie")){
      case "bataille":
        historique("/Jeu");
        break;
      
      case "6quiprend":
        historique("/QuiPrend");
        
        break;

      case "HuitAmericain":
        historique("/HuitAmericain");
        break;
    }
    /*if(sessionStorage.getItem("typePartie") === "bataille"){
    historique("/Jeu");
    }
    else {
      if(sessionStorage.getItem("typePartie")=== "6quiprend"){
        historique("/QuiPrend");
      }
    }*/
  }
  
  return (
    <div className="partie">
      <h2 className="partie-title">ID de la partie : {idP}</h2>
      <div className="lancer">
        <button
          onClick={Demarrer}
          disabled={nbj < 2 || nbj > 10}
          className="btn btn-outline-dark"
        >
          Lancer la partie
        </button>
      </div>
      <h3 className="joueurs-title">Joueurs dans la partie</h3>
      <ul className="joueurs-list">
        {listeJ && listeJ.map((joueur, index) => (
          <li key={index}>{joueur}</li>
        ))}
      </ul>
      {sessionStorage.getItem("typePartie") === "6quiprend" && ( // Condition pour afficher uniquement si le type de partie est "6quiprend"
      <div className="bouton-6quiprend">        

      <h6>Ajoutez des bots:</h6>
      <br></br>
      <div style={{ display: 'flex' }}>
        <div>
          
            <input
              type="button"
              value="Ajouter bots"
              onChange={(event) => {
                setNbBots(event.target.value);   
              }}
            />
        </div>
        <div style={{ marginLeft: '20px' }}>
          
        <input
              type="button"
              value="Ajouter Dogubots"
              onChange={(event) => {
                setNbBots(event.target.value);   
              }}
            />
        </div>
      </div>
    </div>
    )}
    </div>
      );
};

export default Salon;