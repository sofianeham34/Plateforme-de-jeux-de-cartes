import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
//import './style.css';
import io from 'socket.io-client';
const socket = io.connect("http://localhost:3001");


const Chat = () => {
  const [message, setMessage] = useState("");
  const [listeMessage, setlisteMessage] = useState([]);
  const MAX_MESSAGES = 20;  
  useEffect(() => {
    socket.emit('rejRoom', sessionStorage.getItem("idPartie"));

    socket.on("messageRecu", (data) => {
      console.log("Message reçu:", data);
      setlisteMessage((messagePrecedent) => {
        const nouveauxMessages = [...messagePrecedent, data];
        if (nouveauxMessages.length > MAX_MESSAGES) {
          nouveauxMessages.shift(); // Supprimer message le plus ancien
        }
        return nouveauxMessages;
      });
    });
  }, [socket]);

  const envoiMessage = () => {
    socket.emit("messageEnvoye", {
      pseudo: sessionStorage.getItem('login'), // Remplacez par le vrai pseudo
      message: message,
      idP: sessionStorage.getItem("idPartie"),
    });
    setMessage("");
  };

  const toucheEntre = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      envoiMessage();
    }
  };

  return (
    
    <div id='messagerie' style={{marginTop:"35px"}}>
      <form action="" method='GET' style={{ textAlign: 'right' }}>
        <label htmlFor='chat' style={{ marginRight: '150px', color: 'white' }}>Chat :</label>
        <div>
          <input id="chat" type="text" name="mess" value={message} onChange={(event) => { setMessage(event.target.value); }} onKeyDown={toucheEntre} />
          <input type="button" value="Envoyez !" id="envoiMessage" onClick={envoiMessage}></input>
        </div>
        <div id="messages" style={{ display: 'flex', flexDirection: 'column' }}>
          {listeMessage.map((msg, index) => (
            <div key={index} style={{ color: 'white' }}>
              <strong>{msg.pseudo}:</strong> {msg.message}
            </div>
          ))}
        </div>
      </form>
    </div>
  );
}


  const JeuDeCartes = ({ nombreDeJoueurs, onTourComplete }) => {
    
    const [forme] = useState(["coeur", "carreau", "trefle", "pique"]);
    const [nombre] = useState(["as", "2", "3", "4", "5", "6", "7", "8", "9", "10", "valet", "dame", "roi"]);
  
    const paquet = forme.flatMap(c =>
      nombre.map(n => ({
        valeur: n,
        forme: c,
        image: `./carte/${n}_de_${c}.jpeg`
      }))
    );
  
    const melangerPaquet = (paquet) => {
      const paquetMelange = [...paquet].sort(() => Math.random() - 0.5);
      return paquetMelange;
    };
  
    const paquetMelange = melangerPaquet(paquet);
    const nombreDeCartesParJoueur = Math.floor(paquet.length / nombreDeJoueurs);
    let listeJ=JSON.parse(sessionStorage.getItem("listeJoueurs"));
    console.log(listeJ);
    const joueurs = Array.from({ length: nombreDeJoueurs }, (_, index) => ({

      id: index + 1,
      nom: listeJ[index],
      cartes: paquetMelange.slice(index * nombreDeCartesParJoueur, (index + 1) * nombreDeCartesParJoueur),
      score: 0,
    }));

    useEffect(()=>{
        socket.emit('deckDeDepart',{'joueurs':joueurs,'idP':sessionStorage.getItem('idPartie')});
        
    },[]);
    

    const [joueursState,setJoueurs] = useState([]);


    //RECEVOIR LES INFORMATIONS DU SERVEUR
    useEffect(() => {
      socket.on("deckDeDepart", (deck) => {
        console.log('reçu');
        setJoueurs(deck);
        console.log("le deck est",deck);
      });
      
      socket.on("cartesselectionnees",cartes=>{
        console.log("les cartes choisies sont",cartes.cartes);
        setCartesSelectionnees(cartes.cartes);
        const nouvellesCartesSelectionnees = cartes.cartes;
        if (nouvellesCartesSelectionnees.length === nombreDeJoueurs) {
          console.log("Tous les joueurs ont effectué leur sélection. Fin du tour.");
          setTourTermine(true);
  
          
  
  
          // Vérifier s'il y a une BATAILLE
          const carteMaximale = obtenirCarteMaximale(nouvellesCartesSelectionnees, cartes.jstate);
          if (carteMaximale === "BATAILLE") {
            //demarrerNouveauTourAutomatiqueBataille();
            // BATAILLE - Supprimer les cartes sélectionnées de la main de tous les joueurs
            const nouveauxJoueurs = enleverCartesSelectionnees(cartes.jstate, nouvellesCartesSelectionnees);
            setJoueurs(nouveauxJoueurs);    
            // Afficher la nouvelle taille de la main des joueurs
            nouveauxJoueurs.forEach((joueur) => {
              console.log(`${joueur.nom} - Nouvelle taille de la main : ${joueur.cartes.length}`);
            });
          } else {
            const nouveauxJoueurs = [...cartes.jstate];
            const joueurGagnant = nouveauxJoueurs.find((j) => j.nom === carteMaximale.nom);
            joueurGagnant.score += 1;
            const nouveauxJoueursApresBataille = enleverCartesSelectionnees(nouveauxJoueurs, nouvellesCartesSelectionnees);
            setJoueurs(nouveauxJoueursApresBataille);
            console.log(`Le joueur ${joueurGagnant.nom} a remporté la manche. Nouveau score : ${joueurGagnant.score}`);
          } 
        }
      });

      socket.on("selection",selection=>{
        console.log("les selections sont",selection);
        setSelectionsEffectuees(selection);
      });
    }, [socket]);
    

    //const [joueursState, setJoueurs] = useState(joueurs);
    const [cartesSelectionnees, setCartesSelectionnees] = useState([]);
    const [selectionsEffectuees, setSelectionsEffectuees] = useState([]);
    const [tourTermine, setTourTermine] = useState(false);
    const [messageDebutTour, setMessageDebutTour] = useState(true);
    const [carteMaximale, setCarteMaximale] = useState(null);
    const [tour, setTour] = useState(1);
  
    const message = () => {
      if (messageDebutTour) {
            //alert(`Les joueurs peuvent maintenant sélectionner leurs cartes en cliquant dessus.\nTours: ${tour}`,1000);
  
        setMessageDebutTour(false);
      }
    };
  
    const enleverCartesSelectionnees = (joueurs, nouvellesCartesSelectionnees) => {
      const cartesASupprimer = nouvellesCartesSelectionnees.map((selection) => selection.carte);
      const nouveauxJoueurs = joueurs.map((j) => ({
        ...j,
        cartes: j.cartes.filter((carte) => !cartesASupprimer.includes(`${carte.valeur} de ${carte.forme}`)),
      }));
      return nouveauxJoueurs;
    };
  
    const selectionnerCarte = ({ playerId, card }) => {
      if (selectionsEffectuees.includes(playerId)) {
        console.log(`Le joueur ${playerId} a déjà effectué une sélection.`);
        return;
      }
      
      const nouvellesCartesSelectionnees = [...cartesSelectionnees];
      
      const joueur = joueursState.find((j) => j.id === playerId);
      if (joueur) {
        nouvellesCartesSelectionnees.push({
          joueur: joueur.nom,
          carte: `${card.valeur} de ${card.forme}`,
          image: card.image,
          imageTemporaire : "./dosdecarte.png"

        });
      }
      
      socket.emit("cartesChoisies",{"cartes":nouvellesCartesSelectionnees,"idP":sessionStorage.getItem("idPartie"),"jstate":joueursState});
      setCartesSelectionnees(nouvellesCartesSelectionnees);
      setSelectionsEffectuees([...selectionsEffectuees, playerId]);
      socket.emit("selectionEffectues",{"selection":[...selectionsEffectuees, playerId],"idP":sessionStorage.getItem("idPartie")});
      
      console.log("nouv cartes",nouvellesCartesSelectionnees);




      
      /*  if (nouvellesCartesSelectionnees.length === nombreDeJoueurs) {
        console.log("Tous les joueurs ont effectué leur sélection. Fin du tour.");
        setTourTermine(true);

        


        // Vérifier s'il y a une BATAILLE
        const carteMaximale = obtenirCarteMaximale(nouvellesCartesSelectionnees, joueursState);
        if (carteMaximale === "BATAILLE") {
          // BATAILLE - Supprimer les cartes sélectionnées de la main de tous les joueurs
          const nouveauxJoueurs = enleverCartesSelectionnees(joueursState, nouvellesCartesSelectionnees);
          setJoueurs(nouveauxJoueurs);
  
          // Afficher la nouvelle taille de la main des joueurs
          nouveauxJoueurs.forEach((joueur) => {
            console.log(`${joueur.nom} - Nouvelle taille de la main : ${joueur.cartes.length}`);
          });
        } else {
          const nouveauxJoueurs = [...joueursState];
          const joueurGagnant = nouveauxJoueurs.find((j) => j.nom === carteMaximale.nom);
          joueurGagnant.score += 1;
          const nouveauxJoueursApresBataille = enleverCartesSelectionnees(nouveauxJoueurs, nouvellesCartesSelectionnees);
          setJoueurs(nouveauxJoueursApresBataille);
          console.log(`Le joueur ${joueurGagnant.nom} a remporté la manche. Nouveau score : ${joueurGagnant.score}`);
        }
      }*/
    };
  
    const [hoveredCard, setHoveredCard] = useState(null);
  
    const zoomCard = (card) => {
      setHoveredCard(card);
    };
  
    const dezoomCard = () => {
      setHoveredCard(null);
    };
  
   /* const AfficherCartesSelectionnees = ({ cartesSelectionnees }) => (
      <div  style={{ color: 'white' }}>
        <h2 >Cartes Sélectionnées</h2>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {cartesSelectionnees.map((selection, index) => (
            <li key={index}>
              - {selection.joueur} a sélectionné la carte {selection.carte}.
            </li>
          ))}
        </ul>
      </div>
    );*/
  
    const pointsParValeur = {
      as: 14,
      roi: 13,
      dame: 12,
      valet: 11,
      '10': 10,
      '9': 9,
      '8': 8,
      '7': 7,
      '6': 6,
      '5': 5,
      '4': 4,
      '3': 3,
      '2': 2,
    };
  
    const obtenirCarteMaximale = (cartesSelectionnees, joueurs) => {
      let carteMaximale = null;
      let estBataille = false;
  
      for (const selection of cartesSelectionnees) {
        const valeurCarte = selection.carte.split(" ")[0];
        const joueur = joueurs.find((j) => j.nom === selection.joueur);
  
        if (!carteMaximale || pointsParValeur[valeurCarte] > pointsParValeur[carteMaximale.valeur]) {
          carteMaximale = {
            valeur: valeurCarte,
            forme: selection.carte,
            nom: joueur.nom,
            joueurId: joueur.id,
          };
          estBataille = false;
        } else if (pointsParValeur[valeurCarte] === pointsParValeur[carteMaximale.valeur]) {
          estBataille = true;
        }
      }
  
      return estBataille ? "BATAILLE" : carteMaximale;
    };
  
    useEffect(() => {
      if (cartesSelectionnees.length === nombreDeJoueurs) {
        console.log("Tous les joueurs ont effectué leur sélection. Fin du tour.");
        setTourTermine(true);
      }
    }, [cartesSelectionnees, joueursState, nombreDeJoueurs]);
  
    useEffect(() => {
      setCarteMaximale(obtenirCarteMaximale(cartesSelectionnees, joueursState));
    }, [cartesSelectionnees, joueursState]);
  
    const Cartemaximalee = () => (
      <div>
        {carteMaximale === "BATAILLE" ? (
          <h2 style={{ color: 'white' }}>Le résultat est BATAILLE veulliez repiochez!</h2>
        ) : <p></p>}
      </div>
    );
    message();
   
  
    const demarrerNouveauTourAutomatiqueBataille = () => {
      // Réinitialiser les états pour le nouveau tour
      setCartesSelectionnees([]);
      setSelectionsEffectuees([]);
      setTourTermine(false);
      setMessageDebutTour(true);
      setCarteMaximale(null);  
      
    };  
  
  
  
    const demarrerNouveauTourAutomatique = () => {
      // Réinitialiser les états pour le nouveau tour
      setCartesSelectionnees([]);
      setSelectionsEffectuees([]);
      setTourTermine(false);
      setMessageDebutTour(true);
      setCarteMaximale(null);
      setTour((prevTour) => prevTour + 1);
  
      // Vérifier si tous les joueurs ont 0 cartes
      const tousLesJoueursSansCartes = joueursState.every((joueur) => joueur.cartes.length === 0);
      if (tousLesJoueursSansCartes) {
        onTourComplete();
      }
    };
  
    useEffect(() => {
      if (tourTermine && carteMaximale!='BATAILLE') {
        let carteSelectTempo = cartesSelectionnees;
        if(cartesSelectionnees.length != 0){
          for(let c of carteSelectTempo){
            c.imageTemporaire = c.image;
        }
        setCartesSelectionnees(carteSelectTempo);
      }
        const timeoutId = setTimeout(() => {
          demarrerNouveauTourAutomatique();
        }, 2000);
  
        // Nettoyer le timeout lors du démontage du composant
        return () => clearTimeout(timeoutId);
      }
      else{
          let carteSelectTempo = cartesSelectionnees;
          if(cartesSelectionnees.length != 0){
            for(let c of carteSelectTempo){
              c.imageTemporaire = c.image;
          }
          setCartesSelectionnees(carteSelectTempo);
          }
          
          const timeoutId = setTimeout(() => {
            demarrerNouveauTourAutomatiqueBataille();
          }, 2000);
          // Nettoyer le timeout lors du démontage du composant
          return () => clearTimeout(timeoutId);
      }
    }, [tourTermine]);
  
    const [monId,setMonId] = useState(0);
    const [monScore,setMonScore] = useState(0);
    const [monpaquet,setmonpaquet] = useState([]);
  useEffect(()=>{
    for(let j of joueursState){
      if(j.nom == sessionStorage.getItem("login")){
        setmonpaquet(j.cartes);
        setMonScore(j.score);
        setMonId(j.id);
      }
    }
  },[joueursState]);
  
  const [carteZoomed, setCarteZoomed] = useState(null);

  const zoomCarteSelectionner = (playerId, selectionsEffectuees, carte) => {
    if (!selectionsEffectuees.includes(playerId)) {
      setCarteZoomed(carte);
    }
  };
  
  
  socket.on("gagnant", (data) => {
    console.log("Le gagnant est :", data.gagnant);

    setGagnant(data.gagnant);
    setScoreGagnant(data.score);
  });


  
const [gagnant, setGagnant] = useState(null);
  const [pointgagnant, setScoreGagnant] = useState(null);


  const mettreGagnant = (monpaquet) => {          //Défini le gagnant comme celui ayant le moins de points, lorsque un joueur atteint 66 points
    if (monpaquet.length==0) {
      let scoreMaximum = 0;
      let nomJ = "";
      for (let joueur of joueursState) {
        if (joueur.score > scoreMaximum) {
          scoreMaximum = joueur.score;
          nomJ = joueur.nom;
        }
      }

      let joueurGagnant = nomJ;
      console.log("Joueur gagnant :", joueurGagnant);
      let idPartie = sessionStorage.getItem("idPartie");

      socket.emit("gagnant", {
        gagnant: joueurGagnant,
        score: scoreMaximum,
        idP: idPartie,
      });
      setGagnant(joueurGagnant);
      setScoreGagnant(scoreMaximum);
      console.log("gagnant", gagnant);
    }
  };

  useEffect(() => {
    mettreGagnant(monpaquet);
    console.log("gagnant", gagnant);
  }, [monpaquet, gagnant]);


  const [joueurAbandonne, setJoueurAbandonne] = useState(false);
  const abandonnerPartie = () => {
    const confirmation = window.confirm("Êtes-vous sûr de vouloir abandonner la partie ?");
    if (confirmation) {
      const login = sessionStorage.getItem("login"); // Récupérer le login du joueur
      socket.emit('abandonnerPartie', { idPartie: sessionStorage.getItem("idPartie"), login: login });
      window.location.href = "/Menu";
    }
  };

  useEffect(() => {

    socket.on('joueurAbandonne', (login) => {

      alert(login + " a quitté la partie.");

      nombreDeJoueurs=nombreDeJoueurs-1;
    });


    return () => {
      setTourTermine(true);
      socket.off('joueurAbandonne');
    };
  }, []);


  
  const styleObjet = {
    "--bs-scroll-height": "100px"};
    return (
      <div>
      <nav
        className="navbar navbar-expand-lg bg-body-tertiary"
        data-bs-theme="dark"
      >
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            Bataille Ouverte
          </a>

          <div className="collapse navbar-collapse" id="navbarScroll">
            <ul
              className="navbar-nav me-auto my-2 my-lg-0 navbar-nav-scroll"
              style={styleObjet}
            >
              <li className="nav-item">
                <a className="nav-link" href="./Menu">
                  Accueil
                </a>
              </li>
            </ul>
            <ul
              className="navbar-nav ml-auto my-2 my-lg-0 navbar-nav-scroll"
              style={styleObjet}
            >
              <li className="nav-item">
              {!joueurAbandonne && (
                <a className="nav-link" onClick={abandonnerPartie}>
                  Abandonner
                </a>)}
              </li>
            </ul>
            <ul
              className="navbar-nav ml-auto my-2 my-lg-0 navbar-nav-scroll"
              style={styleObjet}
            >
              
            </ul>
          </div>
        </div>
      </nav>
      
      <div style={{ display: 'flex',flexDirection: 'row-reverse' }}>
        {/* Conteneur pour le chat à gauche */}
        <div style={{ marginRight: '20px'}}>
          <Chat />
        </div>
      <div className='Db'>
        <div>
          <h3 style={{ color: 'white' }}>vous êtes : {sessionStorage.getItem("login")}</h3>
          <h2  style={{ color: 'white' }}>Nombre de Tours: {tour} | Mon score : {monScore}</h2>
        </div>
  

        {gagnant && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '85vh' }}>
            <div class="card text-center mb-3" style={{width: "18rem", }}>
                <div class="card-body">
                  <p>{`${gagnant} a gagné avec un score de ${pointgagnant} !`}</p>
                  <a href="/Jeu" class="btn btn-primary">Nouvelle Partie</a>
                </div>
              </div>
            </div>
        )}  


        {tourTermine && (
          <div id="afficherCartesSelectionneesContainer">
            {/*<AfficherCartesSelectionnees cartesSelectionnees={cartesSelectionnees} />*/}
            <div>
              <div>
                <Cartemaximalee />
              </div>
            </div>
          </div>
        )}
        
        
            <div style={{ position: "relative", width: "100vw", height: "50vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <ul style={{ position: "relative", listStyle: "none", padding: 0, display: "flex" }}>
                    {cartesSelectionnees.map(carte => (
                      <li key={carte.valeur} style={{ marginRight: "5px" }}>
                      <img
                        src={carte.imageTemporaire}
                        alt={``}
                        style={{
                          maxWidth: "100px",
                          maxHeight: "100px",
                          marginLeft: "5px",
                          cursor: "pointer",
                        }}
                      />
                    </li>
                    ))}
            </ul>
            </div>
            </div>
          <footer style={{ position: "absolute", bottom: "0", width: "100%" }} >
          <div class="card w-60 card-B">
            <div class="card-body">
            <ul style={{ display: "flex",  padding: 0}}>
                {monpaquet.map((carte, index) => (
                  <li key={index}style={{ marginRight: "30px", marginLeft: index === 0 ? "-15px" : 0}}>
                    <img
                      src={carte.image}
                      alt={`Carte ${carte.valeur}`}
                      style={{
                        width:
                          carteZoomed === carte || hoveredCard === carte
                            ? "90px"
                            : "60px",
                        maxWidth: "100px",
                        maxHeight: "150px",
                        cursor: "pointer",
                        transition: "width 0.3s ease-out",
                        bottom :"0",
                        position:"fixed"
                      }}
                      onClick={() => {
                        selectionnerCarte({ playerId: monId, card: carte });
                        zoomCarteSelectionner(monId, selectionsEffectuees, carte);
                      }}
                      onMouseEnter={() => zoomCard(carte)}
                      onMouseLeave={dezoomCard}
                    />
                  </li>
                ))}
              </ul>
              </div>
              </div>
          </footer>
      
      </div>
      </div>
    );
  };

  const App = () => {
    const [nombreDeJoueurs, setNombreDeJoueurs] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
  
    useEffect(() => {
      // Récupérer la valeur de nbJMax depuis sessionStorage
      const nbJMax = sessionStorage.getItem('nbJMax');
  
      // Vérifier si nbJMax est valide
      if (nbJMax && !isNaN(nbJMax) && nbJMax >= 2 && nbJMax <= 10) {
        setNombreDeJoueurs(parseInt(nbJMax, 10));
      } else {
       // alert('La valeur de nbJMax stockée dans sessionStorage n\'est pas valide.');
      }
    }, []);
  
   
    const handleTourComplete = (winningPlayer) => {
      console.log('handleTourComplete - winningPlayer:', winningPlayer);
      setGameOver(true);
      setWinner(winningPlayer);
      alert(`La partie est terminée! Le gagnant est le joueur : ${winningPlayer && winningPlayer.nom}`);
    };
  
    return (
      <div>
        {!gameOver ? (
          nombreDeJoueurs !== null && <JeuDeCartes nombreDeJoueurs={nombreDeJoueurs} onTourComplete={handleTourComplete} />
        ) : (
          <div>
            <h1>La partie est terminée!</h1>
            <p>Le gagnant est le joueur : {winner && winner.nom}</p>
          </div>
        )}
        <Chat />
      </div>
    );
  };
  
  export default App;
  
  ReactDOM.render(<App />, document.getElementById('root'));