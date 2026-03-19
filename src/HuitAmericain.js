import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import "./index.css";
import { height } from "@mui/system";
const socket = io.connect("http://localhost:3001");


const Chat = () => {
  const [message, setMessage] = useState("");
  const [listeMessage, setlisteMessage] = useState([]);
  const MAX_MESSAGES = 20;
  useEffect(() => {
    socket.emit("rejRoom", sessionStorage.getItem("idPartie"));

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
      pseudo: sessionStorage.getItem("login"), // Remplacez par le vrai pseudo
      message: message,
      idP: sessionStorage.getItem("idPartie"),
    });
    setMessage("");
  };

  const toucheEntre = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      envoiMessage();
    }
  };
  return (
    <div id="messagerie" style={{ marginTop: "35px" }}>
      <form action="" method="GET" style={{ textAlign: "right" }}>
        <label htmlFor="chat" style={{ marginRight: "150px", color: "white" }}>
          Chat :
        </label>
        <div>
          <input
            id="chat"
            type="text"
            name="mess"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
            }}
            onKeyDown={toucheEntre}
          />
          <input
            type="button"
            value="Envoyez !"
            id="envoiMessage"
            onClick={envoiMessage}
          ></input>
        </div>
        <div id="messages" style={{ display: "flex", flexDirection: "column" }}>
          {listeMessage.map((msg, index) => (
            <div key={index} style={{ color: "white" }}>
              <strong>{msg.pseudo}:</strong> {msg.message}
            </div>
          ))}
        </div>
      </form>
    </div>
  );
};

const HuitAmericain = () => {
  useEffect(() => {
    socket.emit("rejRoom", sessionStorage.getItem("idPartie")); //Pour rejoindre la room idPartie
  }, []);
  const [nbJ, setNbj] = useState(sessionStorage.getItem("nbjMax"));
  const [forme] = useState(["coeur", "carreau", "trefle", "pique"]);
  const [nombre] = useState([
    "as",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "valet",
    "dame",
    "roi",
  ]);
  const [listeJ] = useState(JSON.parse(sessionStorage.getItem("listeJoueurs")));
  const [idP] = useState(sessionStorage.getItem("idPartie"));
  const [paquetJoueurs, setPaquetJoueurs] = useState([]);
  const [pioche, setPioche] = useState([]);
  const [monId, setMonId] = useState(0);
  const [IdTourActuel, setIdTourActuel] = useState(1);
  const [fausse, setFausse] = useState([]);
  const [cartePosee, setCartePosee] = useState({
    valeur: "dame",
    forme: "coeur",
    image: `./carte/dame_de_coeur.jpeg`,
  });
  const [sens, setSens] = useState("droite");
  const [nbCartes, setNbCartes] = useState(0);
  const [monpaquet, setmonpaquet] = useState([]);
  const [tour, setTour] = useState(0);
  const [prochaineCouleur, setProchaineCouleur] = useState(null);
  const [openDialog, handleDisplay] = React.useState(false);
  const [as, setAs] = useState(false);
  const [carteAEnlever, setCarteAEnlever] = useState(null);
  //Creer le paquet
  const paquet = forme.flatMap((c) =>
    nombre.map((n) => ({
      valeur: n,
      forme: c,
      image: `./carte/${n}_de_${c}.jpeg`,
    }))
  );

  const melangerPaquet = (paquet) => {
    const paquetMelange = [...paquet];
    for (let i = paquetMelange.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [paquetMelange[i], paquetMelange[j]] = [
        paquetMelange[j],
        paquetMelange[i],
      ];
    }
    return paquetMelange;
  };

  const [paquetMelange] = useState(melangerPaquet(paquet));

  const [nombreDeCartesParJoueur] = useState(8);
  let cartesDesJoueurs = Array.from(
    { length: sessionStorage.getItem("nbJMax") },
    (_, index) => ({
      id: index + 1,
      nom: listeJ[index],
      cartes: paquetMelange.slice(
        index * nombreDeCartesParJoueur,
        (index + 1) * nombreDeCartesParJoueur
      ),
    })
  );
  // console.log(listeJ);

  const creerPioche = (joueurs, paquetMelange) => {
    //Fonction pour créer la pioche sans les cartes distribuées aux joueurs
    let pioche = [...paquetMelange];

    joueurs.forEach((joueur) => {
      joueur.cartes.forEach((carteJoueur) => {
        const indexCarteDansPioche = pioche.findIndex(
          (cartePioche) => cartePioche.valeur === carteJoueur.valeur
        );
        if (indexCarteDansPioche !== -1) {
          pioche.splice(indexCarteDansPioche, 1); // Retire la carte du paquet pioche
        }
      });
    });
    return pioche;
  };

  useEffect(() => {
    socket.emit("deckDepart8Americain", {
      joueurs: cartesDesJoueurs,
      idP: idP,
      pioche: creerPioche(cartesDesJoueurs, paquetMelange),
    });
  }, []);

  useEffect(() => {
    for (let i of paquetJoueurs) {
      if (i.nom == sessionStorage.getItem("login")) {
        setmonpaquet(i.cartes);
        setMonId(i.id);
      }
    }
  }, [paquetJoueurs]);

  // SERVEUR REACT
  useEffect(() => {
    socket.on("deckDepart8Americain", (deck) => {
      setPaquetJoueurs(deck.deck);
      console.log("le deck est", deck.deck);
      setPioche(deck.pioche);
      console.log("la pioche est", deck.pioche);
    });

    socket.on("carteChoisieAmericain", (data) => {
      console.log("la carte posée est ", data.carte);
      if (data.carte.valeur == "as") {
        let nbc = data.nbCartes;
        console.log("le nombre de cartes a piocher est", nbc);
        setNbCartes(nbc + 2);
        setAs(true);
      } else {
        setNbCartes(0);
      }
      if(data.carte.valeur=="valet"){
        if(sens=="droite"){
          setSens("gauche");
        }else{setSens("droite");}
      }
      setCartePosee(data.carte);
      setFausse([...fausse, data.carte]);
      let c = [data.carte];

      let paquetTemp = enleverCartesSelectionnees(data.paquet, [data.carte]);
      setPaquetJoueurs(paquetTemp);
      setIdTourActuel(data.prochainJoueur);
      console.log("au tour de ", data.prochainJoueur);
    });

    socket.on("cartesPiochees", (data) => {
      console.log("au tour de ", data.prochainTour);
      setIdTourActuel(data.prochainTour);
      console.log(data.cartes);
      let cartesPiochees = data.cartes;
      let id = data.id;
      let paquet = data.paquet;
      let p = enleverCartesPioche(data.pioche, cartesPiochees);
      setPioche(p);
      let paqJ = ajouterCartes(id, cartesPiochees, paquet);
      setPaquetJoueurs(paqJ);
      setNbCartes(0);
      setAs(false);
    });

    socket.on("nouvelleCouleur", (carte) => {
      setCartePosee(carte.carte);
      setIdTourActuel(carte.prochainTour);
      console.log("C EST AU TOUR DE ", carte.prochainTour);
      let paquetTemp = enleverCartesSelectionnees(carte.paquet, [
        carte.carteAEnlever,
      ]);
      setPaquetJoueurs(paquetTemp);
    });

    socket.on("gagnant", (data) => {
      console.log("Le gagnant est :", data.gagnant);
      setGagnant(data.gagnant);
      if(data.gagnant!=null){
        console.log("le GAGNANT EST MEGA DOGUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU");
        socket.emit("resultat",{"typePartie" : sessionStorage.getItem("typePartie"),
        "login" : sessionStorage.getItem("login"),
        "gagnant" : data.gagnant});
      }
      
    });
  }, [socket]);


  useEffect(() => {
    console.log(pioche);
  }, [pioche]);

  const ajouterCartes = (id, cartes, paquet) => {
    let p = paquet;
    for (let j of p) {
      if (j.id == id) {
        for (let c of cartes) {
          j.cartes.push(c);
        }
      }
    }
    return p;
  };

  const piocher = (id) => {
    if (id == IdTourActuel) {
      let cartesPiochees = [];
      let piocheTemp = [...pioche];
      let nbCartesAPiocher = nbCartes;
      if (nbCartes == 0) {
        nbCartesAPiocher = 1;
      }
      for (let i = 1; i <= nbCartesAPiocher; i++) {
        cartesPiochees.push(piocheTemp[piocheTemp.length - i]);
      }
      let prochainTour = avancer(monId, 1,sens);
      socket.emit("piocher", {
        cartes: cartesPiochees,
        id: id,
        idP: idP,
        prochainTour: prochainTour,
        pioche: pioche,
        paquet: paquetJoueurs,
      });
    }
  };

  const [hoveredCard, setHoveredCard] = useState(null);

  const zoomCard = (card) => {
    setHoveredCard(card);
  };

  const dezoomCard = () => {
    setHoveredCard(null);
  };

  const [carteZoomed, setCarteZoomed] = useState(null);

  const enleverCartesPioche = (joueurs, nouvellesCartesSelectionnees) => {
    let p = joueurs;
    let cartesASupprimer = nouvellesCartesSelectionnees.map(
      (selection) => selection.image
    );
    console.log(joueurs);
    let nouveauxJoueurs = p.filter(
      (carte) => !cartesASupprimer.includes(carte.image)
    );
    return nouveauxJoueurs;
  };

  const enleverCartesSelectionnees = (
    joueurs,
    nouvellesCartesSelectionnees
  ) => {
    let cartesASupprimer = nouvellesCartesSelectionnees.map(
      (selection) => selection.image
    );
    let nouveauxJoueurs = joueurs.map((j) => ({
      ...j,
      cartes: j.cartes.filter(
        (carte) => !cartesASupprimer.includes(carte.image)
      ),
    }));
    return nouveauxJoueurs;
  };

  const avancer = (id, pas,sens) => {
    console.log("le sens est", sens);
    if (sens == "droite") {
      let prochaintour = id + pas;
      let nbJ = parseInt(sessionStorage.getItem("nbJMax"));
      console.log("le nbj", nbJ);
      if (prochaintour > nbJ) {
        return prochaintour - nbJ;
      } else {
        return prochaintour;
      }
    } else {
      let prochaintour = id - pas;
      let nbJ = parseInt(sessionStorage.getItem("nbJMax"));
      if (prochaintour <= 0) {
        return prochaintour+ nbJ;
      } else {
        return prochaintour;
      }
    }
  };

  const selectionnerCarte = ({ playerId, card }) => {
    if (monId !== IdTourActuel) {
      console.log("ce n'est pas mon tour");
    } else {
      let prochainTour = playerId;
      console.log(card.forme, card.valeur);
      console.log(
        "la carte est de meme forme ?",
        card.forme === cartePosee.forme
      );
      if (
        (card.forme === cartePosee.forme ||
          card.valeur === cartePosee.valeur) &&
        (cartePosee.valeur != "as" || !as) &&
        card.valeur != "8"
      ) {
        console.log(cartePosee.valeur, "valeur posee", cartePosee.forme);
        switch (card.valeur) {
          case "10":
            break;

          case "7":
            prochainTour = avancer(playerId, 2,sens);
            if (playerId > nbJ) {
              prochainTour = prochainTour - nbJ;
            }
            break;

          case "valet":
            if (sens == "droite") {
              setSens("gauche");
              prochainTour = avancer(playerId, 1,"gauche");
            } else {
              setSens("droite");
              prochainTour = avancer(playerId, 1,"droite");
            }

            break;

          default:
            prochainTour = avancer(playerId, 1,sens);
            break;
        }
        // Envoyer un message dans le chat
        if (card.valeur == "dame") {
          const message = ` a joué une ${card.valeur} de ${card.forme}`;
          socket.emit("messageEnvoyer", {
            pseudo: sessionStorage.getItem("login"),
            message,
          });
        } else if (card.valeur == "7") {
          const message = ` a joué un ${card.valeur} de ${card.forme} et bloque le tour du prochain joueur`;
          socket.emit("messageEnvoyer", {
            pseudo: sessionStorage.getItem("login"),
            message,
          });
        } else if (card.valeur == "valet") {
          const message = ` a joué un ${card.valeur} de ${card.forme} et change ainsi le sens`;
          socket.emit("messageEnvoyer", {
            pseudo: sessionStorage.getItem("login"),
            message,
          });
        } else {
          const message = ` a joué un ${card.valeur} de ${card.forme}`;
          socket.emit("messageEnvoyer", {
            pseudo: sessionStorage.getItem("login"),
            message,
          });
        }
        socket.emit("carteChoisieAmericain", {
          carte: card,
          idP: idP,
          prochainJoueur: prochainTour,
          paquet: paquetJoueurs,
          nbCartes: nbCartes,
        });
      } else {
        let prochainTour = avancer(playerId, 1,sens);
        if (
          (card.valeur === "as" && as) ||
          (card.valeur === "as" && card.forme === cartePosee.forme)
        ) {
          socket.emit("carteChoisieAmericain", {
            carte: card,
            idP: idP,
            prochainJoueur: prochainTour,
            paquet: paquetJoueurs,
            nbCartes: nbCartes,
          });
        } else if (card.valeur == "8") {
          openDialogBox();
          setCarteAEnlever(card);
        }
      }
    }
  };

  // PARTIE ALERTE
  const handleClose = () => {
    handleDisplay(false);
  };

  const openDialogBox = () => {
    handleDisplay(true);
  };
  const dialogStyle = {
    padding: "20px",
  };
  const buttonStyle = {
    width: "10rem",
    fontsize: "1.5rem",
    height: "2rem",
    padding: "5px",
    borderRadius: "10px",
    backgroundColor: "green",
    color: "White",
    border: "2px solid yellow",
  };

  const actionButton1 = () => {
    console.log("Prochaine carte est un carreau");
    let carte = { valeur: null, forme: "carreau", image: "./carreau.png" };
    let prochainTour = avancer(monId, 1,sens);
    socket.emit("nouvelleCouleur", {
      idP: idP,
      carte: carte,
      prochainTour: prochainTour,
      carteAEnlever: carteAEnlever,
      paquet: paquetJoueurs,
    });
    handleClose();
  };

  const actionButton2 = () => {
    console.log("Prochaine carte est un coeur");
    let carte = { valeur: null, forme: "coeur", image: "./coeur.png" };
    let prochainTour = avancer(monId, 1,sens);
    socket.emit("nouvelleCouleur", {
      idP: idP,
      carte: carte,
      prochainTour: prochainTour,
      carteAEnlever: carteAEnlever,
      paquet: paquetJoueurs,
    });
    handleClose();
  };

  const actionButton3 = () => {
    console.log("Prochaine carte est un trèfle");
    let carte = { valeur: null, forme: "trefle", image: "./trefle.png" };
    let prochainTour = avancer(monId, 1,sens);
    socket.emit("nouvelleCouleur", {
      idP: idP,
      carte: carte,
      prochainTour: prochainTour,
      carteAEnlever: carteAEnlever,
      paquet: paquetJoueurs,
    });
    handleClose();
  };

  const actionButton4 = () => {
    console.log("Prochaine carte est un pic");
    let carte = { valeur: null, forme: "pique", image: "./pic.png" };
    let prochainTour = avancer(monId, 1,sens);
    socket.emit("nouvelleCouleur", {
      idP: idP,
      carte: carte,
      prochainTour: prochainTour,
      carteAEnlever: carteAEnlever,
      paquet: paquetJoueurs,
    });
    handleClose();
  };

  const [gagnant, setGagnant] = useState(null);

  const mettreGagnant = (paquetJoueurs) => {
    const joueurGagnant = paquetJoueurs.find(
      (joueur) => joueur.cartes.length === 0
    );
    if (joueurGagnant && (joueurGagnant.nom == sessionStorage.getItem("login"))) {
      console.log("Joueur gagnant c'est moi :", joueurGagnant.nom);
      let idPartie = sessionStorage.getItem("idPartie");

      socket.emit("gagnant", {
        gagnant: joueurGagnant.nom,
        idP: idPartie,
      });
      setGagnant(joueurGagnant.nom);
    }
  };

  useEffect(() => {
    mettreGagnant(paquetJoueurs);
    console.log("gagnant", gagnant);
  }, [paquetJoueurs]);

  const styleObjet = {
    "--bs-scroll-height": "100px",
  };


  const [openRulesDialog, setOpenRulesDialog] = useState(false);

  const handleOpenRulesDialog = () => {
    setOpenRulesDialog(true);
  };
  const handleCloseRulesDialog = () => {
    setOpenRulesDialog(false);
  };
  useEffect(() => {
    const helpButton = document.getElementById("help-button");
    const closeDialogButton = document.getElementById("close-dialog");

    const handleOpenRulesDialog = () => {
      setOpenRulesDialog(true);
    };

    const handleCloseRulesDialog = () => {
      setOpenRulesDialog(false);
    };

    if (helpButton && closeDialogButton) {
      helpButton.addEventListener("click", handleOpenRulesDialog);
      closeDialogButton.addEventListener("click", handleCloseRulesDialog);
    }

    return () => {
      if (helpButton && closeDialogButton) {
        helpButton.removeEventListener("click", handleOpenRulesDialog);
        closeDialogButton.removeEventListener("click", handleCloseRulesDialog);
      }
    };
  }, []);


  //FIN PARTIE ALERTE
  return (
    <div>
      <nav
        className="navbar navbar-expand-lg bg-body-tertiary"
        data-bs-theme="dark"
      >
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            8 Américain
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
              <div>
                <button
                  className="help-button"
                  id="help-button"
                  onClick={handleOpenRulesDialog}
                  
                >
                  ?
                </button>
                <Dialog onClose={handleCloseRulesDialog} open={openRulesDialog}>
                  {
                    <div className="rules-dialog">
                      <p className="rule-title">Les règles du 8 Américain :</p>
                      <p> On distribue toutes les cartes à tous les joueurs,</p>
                      <p>
                        chaque joueurs pose une carte de la même couleur ou de
                        la même forme, on ne peut poser qu'une carte de couleur
                        ou de forme similaire.
                      </p>
                      <p>
                        {" "}
                        Or dans tout ça il y a certaines cartes qui ont
                        plusieurs utilisés qu'être poser bêtement.
                      </p>
                      <p> Il y a :</p>
                      <p>
                        {" "}
                        <strong>L'As</strong> : Il a comme spécifité que
                        lorsqu'il est posé le prochain joueur pioche 2 cartes
                        s'il n'a pas de As ou de 8 à poser. De plus les As sont
                        cumulatives en fonction des As poser le prochain joueur
                        peut récupérer 2, 4, 6, 8 cartes.
                      </p>
                      <p>
                        {" "}
                        <strong>Le 8</strong> : Il a comme spécifité de pouvoir
                        être mis n'importe quand, de plus il peut contrer l'As.
                        Aussi le 8 a comme effet de pouvoir choisir la couleur
                        de la future carte.
                      </p>
                      <p>
                        {" "}
                        <strong>Le 7</strong> : Il saute le tour du prochain
                        joueur.
                      </p>
                      <p>
                        {" "}
                        <strong>Le Valet</strong> : Il change le sens de tour.
                      </p>
                      <p>
                        <strong>Le 10 </strong>: Lorsqu'on pose un 10 le joueur
                        qui vient de le poser a la possibilité de poser une
                        autre carte de forme ou de couleur similaire. Si
                        celui-ci ne possède pas de carte possible à mettre il
                        pioche.
                      </p>

                      <p>La partie se finit ainsi lorsqu'un joueur n'a plus de cartes.</p>

                      <p> Le vainqueur est celui qui n'a plus de cartes dans sa main, ainsi on arrête le jeu et on le désigne en tant que vainqueur.</p>
                    </div>
                  }
                </Dialog>
              </div>
              </li>
              <li className="nav-item">
                <a className="nav-link">Sauvegarder</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div style={{ display: "flex", flexDirection: "row-reverse" }}>
        <div style={{ marginRight: "20px" }}>
         <Chat />
        </div>
        <div className="Db">
          {gagnant && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "85vh",
              }}
            >
              <div class="card text-center mb-3" style={{ width: "18rem" }}>
                <div class="card-body">
                  <p>{`${gagnant} a gagné !`}</p>
                  <a href="/HuitAmericain" class="btn btn-primary">
                    Nouvelle Partie
                  </a>
                </div>
              </div>
            </div>
          )}
          <div>
            <br></br>
            <br></br>
            <h5 style={{ color: "white" }}>
              Vous êtes : {sessionStorage.getItem("login")} - {monpaquet.length}{" "}
              cartes restantes
            </h5>
          </div>
          {paquetJoueurs.map(
            (joueur, index) =>
              joueur.id !== monId && (
                <div key={index} style={{ color: "white" }}>
                  <strong>{joueur.nom}:</strong> {joueur.cartes.length} cartes
                  restantes
                </div>
              )
          )}

          <div>
            {monId === IdTourActuel && (
              <h5 style={{ color: "white" }}> A votre tour ! </h5>
            )}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "55vh",
            }}
          >
            {cartePosee && (
              <img
                src={cartePosee.image}
                alt={`Carte ${cartePosee.valeur}`}
                style={{
                  width: "100px",
                  maxHeight: "150px",
                  cursor: "pointer",
                  transition: "width 0.3s ease-out",
                }}
              />
            )}
            <div style={{ marginLeft: "150px" }}>
              {
                <img
                  src={"dosdecarte.png"}
                  style={{
                    maxWidth: "100px",
                    maxHeight: "150px",
                    cursor: "pointer",
                    transition: "width 0.3s ease-out",
                  }}
                  onClick={() => {
                    piocher(monId);
                  }}
                />
              }
            </div>
          </div>
          <Dialog onClose={handleClose} open={openDialog}>
            <DialogTitle> Choix de la future couleur </DialogTitle>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <button onClick={actionButton1}>Choisir les carreaux</button>
              <button onClick={actionButton2}>Choisir les coeurs</button>
              <button onClick={actionButton3}>Choisir les trèfles</button>
              <button onClick={actionButton4}>Choisir les pics</button>
            </div>
          </Dialog>
        </div>
        <footer style={{ position: "absolute", bottom: "0", width: "100%" }}>
          <ul style={{ display: "flex", listStyle: "none", padding: 0 }}>
            {monpaquet.map((carte, index) => (
              <li
                key={index}
                style={{
                  marginRight: "60px",
                  marginLeft: index === 0 ? "-15px" : 0,
                }}
              >
                <img
                  src={carte.image}
                  alt={`Carte ${carte.valeur}`}
                  style={{
                    width:
                      carteZoomed === carte || hoveredCard === carte
                        ? "120px"
                        : "80px",
                    //maxWidth: "100px",
                    maxHeight: "250px",
                    cursor: "pointer",
                    transition: "width 0.3s ease-out",
                    bottom: "0",
                    position: "fixed",
                  }}
                  onClick={() => {
                    selectionnerCarte({ playerId: monId, card: carte });
                  }}
                  onMouseEnter={() => zoomCard(carte)}
                  onMouseLeave={dezoomCard}
                />
              </li>
            ))}
          </ul>
        </footer>
      </div>
    </div>
  );
};
export default HuitAmericain;