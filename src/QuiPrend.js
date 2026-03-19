import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import "./index.css";
const socket = io.connect("http://localhost:3001");

const Chat2 = () => {
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
      pseudo: sessionStorage.getItem('login'),
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
    <div id='messagerie2'>
      <br></br>
      <br></br>
      <form action="" method='GET' style={{ textAlign: 'right' }}>
        <label htmlFor='chat' style={{ marginRight: '150px', color: 'darkblue' }}><h4>Chat </h4></label>
        <div>
          <input id="chat" type="text" name="mess" value={message} onChange={(event) => { setMessage(event.target.value); }} onKeyDown={toucheEntre} />
          <input type="button" value="Envoyez !" id="envoiMessage" onClick={envoiMessage}></input>
        </div>
        <div id="messages" style={{ display: 'flex', flexDirection: 'column' }}>
          {listeMessage.map((msg, index) => (
            <div key={index} style={{ color: 'dark' }}>
              <strong>{msg.pseudo}:</strong> {msg.message}
            </div>
          ))}
        </div>
      </form>
    </div>
  );
}

const QuiPrend = ({ nombreDeJoueurs }) => {
  window.addEventListener("beforeunload", function (e) {
    socket.emit("deconnexion", { login: this.sessionStorage.getItem("login") });
  });


  useEffect(() => {
    socket.emit("rejRoom", sessionStorage.getItem("idPartie")); //Pour rejoindre la room idPartie
  },[]);

  const createur = sessionStorage.getItem("createur");
  const idPartie = sessionStorage.getItem("idPartie");
  const [nombres, setNombres] = useState(
    Array.from({ length: 104 }, (_, index) => (index + 1).toString())
  );
  const [tourTermine, setTourTermine] = useState(false);

  const boeuf = (valeur) => {                           //Fonction pour détérminer le nb de boeuf d'une carte a partir de sa valeur 
    const dernierChiffre = valeur.toString().slice(-1); // Récupérer la dernière chiffre de la valeur

    if (valeur.toString() === "55") {
      return 7;
    } else if (dernierChiffre === "5") {
      return 2;
    } else if (dernierChiffre === "0") {
      return 3;
    } else if (parseInt(valeur) % 11 === 0 && valeur !== "55") {
      return 5;
    } else return 1;
  };

// Création du paquet 
  const paquet = nombres.map((n) => ({
    valeur: n,
    image: `./cartesboeuf/${n}.png`,
    boeuf: boeuf(n),
  }));


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

  //On mélange le paquet 
  const paquetMelange = melangerPaquet(paquet);
  const nombreDeCartesParJoueur = 10;
  const listeJ = JSON.parse(sessionStorage.getItem("listeJoueurs"));

  //Distribution des cartes aux joueurs 
  const joueurs = Array.from(
    { length: sessionStorage.getItem("nbJMax") },
    (_, index) => ({
      id: index + 1,
      nom: listeJ[index],
      cartes: paquetMelange.slice(
        index * nombreDeCartesParJoueur,
        (index + 1) * nombreDeCartesParJoueur
      ),
      score: 0,
    })
  );


  const pioche_ = (joueurs, paquetMelange) => {           //Fonction pour créer la pioche sans les cartes distribuées aux joueurs
    const pioche = [...paquetMelange]; 

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

  const [pioche, setPioche] = useState([]);
  const [cartesSelectionnees, setCartesSelectionnees] = useState([]);
  const [selectionsEffectuees, setSelectionsEffectuees] = useState([]);
  const [peutJouer, setPeutJouer] = useState(false);
  const [cartesTrieesLigne, setCartesTrieesLigne] = useState([]);
  const [CarteAChoisir, setCarteAChoisir] = useState(null);
  const [paquetJoueurs, setPaquetJoueurs] = useState([]);     // Liste des joueurs avec leur cartes, leur score, et leur iD
  const partieSauvegardee = sessionStorage.getItem("sauvegarde");
  const [revenirAuMenu,setRevenirAuMenu] = useState(false);


  useEffect(() => {
    if(createur == 1){
    if(partieSauvegardee == 0){ 
      socket.emit("deckDepartQuiPrend", {
        deck: joueurs,
        idP: idPartie,
        pioche: pioche_(joueurs, paquetMelange),
      });
    } else{
      let paquetS = JSON.parse(sessionStorage.getItem("paquetSauvegarde"));
      socket.emit("deckDepartQuiPrend", {
        deck: paquetS,
        idP: idPartie,
        pioche: pioche_(paquetS, paquetMelange),
      });
    } ;
  }
  }, []);



  const peutEtrePlace = (carte, tableDeJeu) => {    //Fonction pour verifier si une carte peut être placée
    for (let i = 0; i < tableDeJeu.length; i++) {
      let ligne = tableDeJeu[i];
      if (carte.valeur > ligne[ligne.length - 1].valeur) {
        return true;
      }
    }
    return false;
  };

  



  useEffect(() => {                             
    socket.on("deckDepartQuiPrend", (deck) => {
      setPaquetJoueurs(deck.deck);
      console.log("le deck est", deck.deck);
      setPioche(deck.pioche);
    });

    socket.on("cartesselectionnees", (cartes) => {
      console.log("LES CARTES ON ETE SELECTIONNEES");
      let nouvpaquet=cartes.paquet;
      const nbJ = sessionStorage.getItem("nbJMax");

      console.log("le nombre de joueurs est", nbJ);
      console.log("les cartes choisies sont", cartes.cartes);
      setCartesSelectionnees(cartes.cartes);
      const nouvellesCartesSelectionnees = cartes.cartes;
      console.log(
        "le nombre de cartes selectionnees est de ",
        nouvellesCartesSelectionnees.length
      );

      if (nouvellesCartesSelectionnees.length == nbJ) {     //Si tout les joueurs ont choisi leur carte
        console.log(
          "Tous les joueurs ont effectué leur sélection. Fin du tour."
        );
        const cartestriees = trieCarteJoue(nouvellesCartesSelectionnees);    //On trie les carte séléctionnées
        console.log("cartes triees", cartestriees);
        var piocheA = cartes.pioche;
        var ligneAPlacer = -1;
         //Si la plus petite carte ne peut être placer, on devra la placer manuellement et toutes les autres carte pourront être placer automatiquement par la suite 
        if (!peutEtrePlace(cartestriees[0], piocheA)) {                
          if(cartestriees[0].joueur==sessionStorage.getItem("login")){
            console.log("A MOI DE CHOISIR UNE CARTE");
            setCarteAChoisir(cartestriees[0]);
            setCartesTrieesLigne(cartestriees);
            setPeutJouer(true);
          }
        } else {
          for (const carte of cartestriees) {   //pour toute les cartes ont cherches leur ligne sur le tableau de jeu 
            var ecartM = 200;
            console.log(
              "taille de la pioche pour placer carte",
              piocheA.length
            );

            for (let i = 0; i < piocheA.length; i++) {
              let ligneA = piocheA[i];
              console.log("ligne A", ligneA);
              let ecartA = carte.valeur - ligneA[ligneA.length - 1].valeur;
              console.log(
                "valeur derniere carte ligneA",
                carte.valeur - ligneA[ligneA.length - 1].valeur
              );
              if (ecartA > 0) {
                if (ecartM > ecartA) {
                  ecartM = ecartA;
                  ligneAPlacer = i;
                }
              }
            }
            console.log("changement valeur ligneAPlacer", ligneAPlacer);

            if (ligneAPlacer === -1) {
              console.log("ne peut pas placer une carte");
              setPeutJouer(true);
            } else {
              var ligne = piocheA[ligneAPlacer];
              console.log("ligne de pioche", ligne);
              if (ligne.length == 5) {
                var score = 0;
                for (let c of ligne) {
                  score += c.boeuf;
                }
                console.log("LA CARTEEEE KHOYA", carte);
                var nouveauPaquetJoueurs = nouvpaquet;
                for (let joueur of nouveauPaquetJoueurs) {
                  if (joueur.nom == carte.joueur) {
                    joueur.score += score;
                  }
                }
                //socket.emit("scoreUpdate", {paquetscore: nouveauPaquetJoueurs,idP: idPartie, });
                nouvpaquet=nouveauPaquetJoueurs;
                let nouvListePioche = [];
                for (let i = 0; i < piocheA.length; i++) {
                  if (ligneAPlacer == i) {
                    nouvListePioche.push([carte]);
                  } else {
                    nouvListePioche.push(piocheA[i]);
                  }
                }
                settableDeJeu(nouvListePioche);
                piocheA = nouvListePioche;
                console.log("PICHE               A", piocheA);
              } else {
                let nouvListePioche = piocheA;
                nouvListePioche[ligneAPlacer].push(carte);
                settableDeJeu(nouvListePioche);
              }
            }
          }
          console.log("létat de la pioche", piocheA);
          setTourTermine(true);
          const nouveauPaquetJoueur = enleverCartesSelectionnees(
            nouvpaquet,
            nouvellesCartesSelectionnees
          );
          setPaquetJoueurs(nouveauPaquetJoueur);
        }
      }
    });

    socket.on("selection", (selection) => {
      console.log("les selections sont", selection);
      setSelectionsEffectuees(selection);
    });

    socket.on("scoreUpdate", (paquet) => {
      setPaquetJoueurs(paquet);
    });

    socket.on("carteChoisie", (data) => {
      let nouvpaquet = data.paquet;
      console.log("paquetaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", nouvpaquet);
      let piocheA = data.pioche;
      var score = 0;
      let ligneAPlacer = data.index;
      let carte = data.carte;
      let ligne = piocheA[ligneAPlacer];
      let cartestriees = data.cartestriees;
      for (let carte of ligne) {
        score += carte.boeuf;
      }
      var nouveauPaquetJoueurs = nouvpaquet;
      for (let joueur of nouveauPaquetJoueurs) {
        if (joueur.nom == carte.joueur) {
          joueur.score += score;
        }
      }
      
      console.log("Ceci est un EASTEREGG");
      //socket.emit("scoreUpdate", {paquetscore: nouveauPaquetJoueurs,idP: idPartie,});
      nouvpaquet = nouveauPaquetJoueurs;
      let nouvListePioche = [];
      for (let i = 0; i < piocheA.length; i++) {
        if (ligneAPlacer == i) {
          nouvListePioche.push([carte]);
        } else {
          nouvListePioche.push(piocheA[i]);
        }
      }
      settableDeJeu(nouvListePioche);
      piocheA = nouvListePioche;

      for (const carte of cartestriees) {
        var ecartM = 200;
        console.log("taille de la pioche pour placer carte", piocheA.length);
        ligneAPlacer = -1;
        for (let i = 0; i < piocheA.length; i++) {
          let ligneA = piocheA[i];
          console.log("ligne A", ligneA);
          let ecartA = carte.valeur - ligneA[ligneA.length - 1].valeur;
          console.log(
            "valeur derniere carte ligneA",
            carte.valeur - ligneA[ligneA.length - 1].valeur
          );
          if (ecartA > 0) {
            if (ecartM > ecartA) {
              ecartM = ecartA;
              ligneAPlacer = i;
            }
          }
        }
        console.log("changement valeur ligneAPlacer", ligneAPlacer);

        ligne = piocheA[ligneAPlacer];
        console.log("ligne de pioche", ligne);
        if (ligne.length == 5) {
          var score = 0;
          for (let carte of ligne) {
            score += carte.boeuf;
          }
          var nouveauPaquetJoueurs = nouvpaquet;
          for (let joueur of nouveauPaquetJoueurs) {
            if (joueur.nom == carte.joueur) {
              joueur.score += score;
            }
          }
          //socket.emit("scoreUpdate", {  paquetscore: nouveauPaquetJoueurs,  idP: idPartie,});
          nouvpaquet = nouveauPaquetJoueurs;
          let nouvListePioche = [];
          for (let i = 0; i < piocheA.length; i++) {
            if (ligneAPlacer == i) {
              nouvListePioche.push([carte]);
            } else {
              nouvListePioche.push(piocheA[i]);
            }
          }
          settableDeJeu(nouvListePioche);
          piocheA = nouvListePioche;
          console.log("PICHE               A", piocheA);
        } else {
          let nouvListePioche = piocheA;
          nouvListePioche[ligneAPlacer].push(carte);
          settableDeJeu(nouvListePioche);
        }
      }
      console.log("létat de la pioche", piocheA);
      setTourTermine(true);
      cartestriees.push(carte);
      const nouveauPaquetJoueur = enleverCartesSelectionnees(
        nouvpaquet,
        cartestriees
      );
      setPaquetJoueurs(nouveauPaquetJoueur);
    });
    socket.on("gagnant", (data) => {
      console.log("Le gagnant est :", data.gagnant);
      setGagnant(data.gagnant);
      setScoreGagnant(data.score);
      socket.emit("resultat",{"typePartie" : sessionStorage.getItem("typePartie"),
      "login" : sessionStorage.getItem("login"),
      "gagnant" : data.gagnant});
    });

    socket.on("sauvegarde",()=>{
      socket.emit("deconnexion",{login : sessionStorage.getItem("login")});
      setRevenirAuMenu(true);
    });


    //ABANDON
    /*
    socket.on('joueurAbandonne', (login) => {
      alert(login + " a quitté la partie.");
      let nbj = sessionStorage.getItem("nbJMax");
      sessionStorage.setItem("nbJMax", nbj - 1);
      let paquetTemp = paquetJoueurs;
      let p = paquetTemp.filter(joueur => joueur.nom !== login);
      setPaquetJoueurs(p);
      console.log("paquet sans le joueur parti",p);
    });
    */
  }, [socket]);





  const [monpaquet, setmonpaquet] = useState([]);
  const [monscore, setmonscore] = useState(0);
  const [monId, setMonId] = useState(null);
  useEffect(() => {
    for (let i of paquetJoueurs) {   
      if(i.cartes.length == 0){                           // Si les joueurs n'ont plus de cartes alors 
          setTimeout(()=>{
        if(createur == 1){                                // On remélange et on redistribue les cartes 
          let nouvpaquetmelange = melangerPaquet(paquet);
          let joueursInter = Array.from(
            { length: sessionStorage.getItem("nbJMax") },
            (_, index) => ({
              id: index + 1,
              nom: listeJ[index],
              cartes: nouvpaquetmelange.slice(
                index * nombreDeCartesParJoueur,
                (index + 1) * nombreDeCartesParJoueur
              ),
              score: 0,
            })
          );

          for(let i = 0; i<joueursInter.length; i ++){        //On garde le même score 
            joueursInter[i].score = paquetJoueurs[i].score;
          }
          let piocheInter = pioche_(joueursInter,nouvpaquetmelange);
          socket.emit("deckDepartQuiPrend",{"idP":idPartie,"deck":joueursInter,"pioche":piocheInter});
        }
          },2000);  
      }

      if (i.nom == sessionStorage.getItem("login")) {
        setmonpaquet(i.cartes);
        setmonscore(i.score);
        setMonId(i.id);
      }
    }
  }, [paquetJoueurs]);

  /*
  const joueurId = (listeJ) => {
    for (let i of listeJ) {
      if (i == sessionStorage.getItem("login")) {
        return i;
      }
    }
  };
*/

  const [hoveredCard, setHoveredCard] = useState(null);

  const zoomCard = (card) => {
    setHoveredCard(card);
  };

  const dezoomCard = () => {
    setHoveredCard(null);
  };

  const selectionnerCarte = ({ playerId, card }) => {
    if (selectionsEffectuees.includes(playerId)) {
      console.log(`Le joueur ${playerId} a déjà effectué une sélection.`);
      return;
    }

    const nouvellesCartesSelectionnees = [...cartesSelectionnees];

    const joueur = paquetJoueurs.find((j) => j.id === playerId);
    if (joueur) {
      nouvellesCartesSelectionnees.push({
        joueur: joueur.nom,
        carte: `Carte ${card.valeur}`,
        valeur: parseInt(card.valeur),
        boeuf: card.boeuf,
        image: card.image,
        imageTemporaire : "dosdecarte.png"
      });
    }

    socket.emit("cartesChoisies", {
      cartes: nouvellesCartesSelectionnees,
      idP: sessionStorage.getItem("idPartie"),
      jstate: paquetJoueurs,
      pioche: tableDeJeu,
      paquet: paquetJoueurs,
    });

    setCartesSelectionnees(nouvellesCartesSelectionnees);
    setSelectionsEffectuees([...selectionsEffectuees, playerId]);
    socket.emit("selectionEffectues", {
      selection: [...selectionsEffectuees, playerId],
      idP: sessionStorage.getItem("idPartie"),
    });

    console.log("nouv cartes", nouvellesCartesSelectionnees);
  };

  const enleverCartesSelectionnees = (      //Retire les cartes séléctionnées du paquet des joueurs 
    joueurs,
    nouvellesCartesSelectionnees
  ) => {
    console.log("SUPPRESSION DES CARTES");
    const cartesASupprimer = nouvellesCartesSelectionnees.map(
      (selection) => selection.carte
    );
    const nouveauxJoueurs = joueurs.map((j) => ({
      ...j,
      cartes: j.cartes.filter(
        (carte) => !cartesASupprimer.includes(`Carte ${carte.valeur}`)
      ),
    }));
    return nouveauxJoueurs;
  };

 
  const demarrerNouveauTourAutomatique = () => {
    setCarteChoisieText(``);
    setCartesSelectionnees([]);
    setSelectionsEffectuees([]);
    setTourTermine(false);
    setCountdown(10);


    // Vérifier si tous les joueurs ont 0 cartes
    /*const tousLesJoueursSansCartes = paquetJoueurs.every((joueur) => joueur.cartes.length === 0);
        if (tousLesJoueursSansCartes) {
          onTourComplete();
        }*/
  };

  useEffect(() => {
    if (tourTermine) {
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
      return () => clearTimeout(timeoutId);
    }
  }, [tourTermine]);

  
  const [cartesTrie, setCartesTrie] = useState([]);
  const trierQuatrePremieresCartes = (pioche) => {
    const cartesTrie = pioche
      .slice(0, 4)
      .sort((a, b) => parseInt(a.valeur) - parseInt(b.valeur));
    return cartesTrie;
  };

  const [tableDeJeu, settableDeJeu] = useState([]);
  useEffect(() => {
    // Trier les 4 premières cartes de la pioche
    const cartesTrie = trierQuatrePremieresCartes(pioche);
    setCartesTrie(cartesTrie);


    const tableDeJeu = [];

    for (let i = 0; i < 4; i++) {
      const sousListe = cartesTrie.slice(i, i + 1);
      tableDeJeu.push(sousListe);
    }
    console.log("la pioche est", tableDeJeu[0]);
    settableDeJeu(tableDeJeu);
  }, [pioche]);

  const [carteZoomed, setCarteZoomed] = useState(null);

  const zoomCarteSelectionner = (playerId, selectionsEffectuees, carte) => {
    if (!selectionsEffectuees.includes(playerId)) {
      setCarteZoomed(carte);
    }
  };

  const trieCarteJoue = (listeCartes) => {
    if (listeCartes) {
      const nouvListe = listeCartes.sort((carteA, carteB) => {
        const valeurA = parseInt(carteA.valeur);
        const valeurB = parseInt(carteB.valeur);
        return valeurA - valeurB;
      });
      return nouvListe;
    } else {
      console.error("Liste de cartes non définie.");
      return [];
    }
  };

  const selectionnerLigne = (index) => {          //Permet de selectionner une ligne en cliquant dessus quand on doit choisir une ligne 
    if (peutJouer) {
      console.log("J AI CHOISI LA LIGNE", index);
      console.log("peut jouer");
      let cartestriees = [];
      for (let i = 1; i < cartesTrieesLigne.length; i++) {
        //on enleve la premiere carte des cartes triees
        cartestriees.push(cartesTrieesLigne[i]);
      }
      socket.emit("carteChoisie", {
        idP: idPartie,
        carte: CarteAChoisir,
        cartestriees: cartestriees,
        index: index,
        pioche: tableDeJeu,
        paquet: paquetJoueurs,
      });
      setPeutJouer(false);
    }
  };

  const styleObjet = {
    "--bs-scroll-height": "100px",
  };

  const [gagnant, setGagnant] = useState(null);
  const [pointgagnant, setScoreGagnant] = useState(null);

  const mettreGagnant = (score) => {          //Défini le gagnant comme celui ayant le moins de points, lorsque un joueur atteint 66 points
    if (score >= 66) {
      let scoreMinimum = 66;
      let nomJ = "";
      for (let joueur of paquetJoueurs) {
        if (joueur.score < scoreMinimum) {
          scoreMinimum = joueur.score;
          nomJ = joueur.nom;
        }
      }

      const joueurGagnant = nomJ;
      console.log("Joueur gagnant :", joueurGagnant);

      socket.emit("gagnant", {
        gagnant: joueurGagnant,
        score: scoreMinimum,
        idP: idPartie,
      });
      //socket.emit("resultatPartie",{paquet : paquetJoueurs, login : sessionStorage.getItem("login")});
      setGagnant(joueurGagnant);
      setScoreGagnant(score);
      console.log("gagnant", gagnant);
    }
  };

  useEffect(() => {
    mettreGagnant(monscore);
    
    console.log("gagnant", gagnant);
  }, [monscore, gagnant]);

  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown > 0) {
      const intervalId = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 2000);
  
      return () => clearInterval(intervalId);
    }
  }, [countdown]);

  const [carteChoisieText, setCarteChoisieText] = useState("");
  useEffect(() => {
    if (countdown === 0 && !tourTermine) {      //Si la countdown arrive a 0 et qu'un joueur n'a toujours pas choisi, on choisi une carte de manière aléatoire

      let randomIndex = Math.floor(Math.random() * monpaquet.length);
      let carteRandom = monpaquet[randomIndex];
      console.log("la carte random",carteRandom);
      console.log(monpaquet);

      setCarteChoisieText(`La carte choisie aleatoirement est la ${carteRandom.valeur}`);
      selectionnerCarte({playerId : monId, card : carteRandom});
    }
  }, [countdown,monpaquet]);

  const sauvegarder = ()=>{
    console.log("sauvegarde en cours");
    if(createur == 1){
      socket.emit("sauvegarde", {"paquet":JSON.stringify(paquetJoueurs),
      "idP":idPartie,
      "typePartie":sessionStorage.getItem("typePartie"),
      "login":sessionStorage.getItem("login")});
      
  }
}
let histo = useNavigate();

if(revenirAuMenu){
  socket.emit("deconnexion",{ login : sessionStorage.getItem("login")});
  histo("/Menu");
}


// PARTIE ABANDON
/*
const abandonnerPartie = () => {
  const confirmation = window.confirm("Êtes-vous sûr de vouloir abandonner la partie ?");
  if (confirmation) {
    let login = sessionStorage.getItem("login");
     // Récupérer le login du joueur
    socket.emit('abandonnerPartie', { idPartie: sessionStorage.getItem("idPartie"), login: login });
    window.location.href = "/Menu";
  }
};
*/
const nbJMax = sessionStorage.getItem("nbJMax");
  //const [nbJ, setNbJ] = useState(nbJMax);
  const [joueurAbandonne, setJoueurAbandonne] = useState(false);
  const abandonnerPartie = () => {

    const confirmation = window.confirm("Êtes-vous sûr de vouloir abandonner la partie ?");
    if (confirmation) {
      const login = sessionStorage.getItem("login");
       // Récupérer le login du joueur
      socket.emit('abandonnerPartie', { idPartie: sessionStorage.getItem("idPartie"), login: login });
      window.location.href = "/Menu";
    }
  };

  useEffect(() => {

    socket.on('joueurAbandonne', (login) => {

      alert(login + " a quitté la partie.");
      let nbj = sessionStorage.getItem("nbJMax")-1;
      sessionStorage.setItem("nbJMax",nbj);
    });

    return () => {
      setTourTermine(true);
      socket.off('joueurAbandonne');
    };
  }, []);

useEffect(()=>{
  console.log("la table de jeu",tableDeJeu);
},[tableDeJeu]);

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

  return (
    <div>
      <nav
        className="navbar navbar-expand-lg bg-body-tertiary"
        data-bs-theme="dark"
      >
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            6 Qui Prend
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
                  <div className="rules-dialog">
                    <p className="rule-title">
                      <strong>Les règles du 6 Qui Prend :</strong>
                    </p>
                    <p>
                      Chaque joueur reçoit <strong>10 cartes</strong>,
                    </p>
                    <p>
                      4 cartes sont posées <strong>face visible </strong>sur la
                      table pour former 4 lignes.
                    </p>
                    <p>
                      Chaque joueur choisit une carte et la pose face cachée.
                      quand tous les joueurs ont choisi, les cartes sont
                      retournées.
                    </p>
                    <p>
                      On prend les cartes dans{" "}
                      <strong>l'ordre croissant</strong>, puis on les place tour à
                      tour dans une ligne en respectant les contraintes
                      ci-dessous :
                    </p>
                    <p>
                      <strong>-</strong> Chaque ligne reste{" "}
                      <strong>croissante</strong>,
                    </p>
                    <p>
                      <strong>-</strong> L'écart entre la dernière carte de la
                      ligne et la carte posée est minimal (par rapport aux
                      autres lignes).
                    </p>
                    <p>
                      Or, quand un joueur se retrouve à placer sa carte en 6ème
                      position il y a :
                    </p>
                    <p>
                      <strong>-</strong> Il prend les 5 cartes de la ligne,
                    </p>
                    <p>
                      <strong>-</strong> La carte posée devient la nouvelle tête
                      de ligne.
                    </p>
                    <p>
                      Si un joueur doit placer une carte plus petite que toutes
                      les fins de ligne alors :
                    </p>
                    <p>
                      <strong>-</strong> Il doit récupérer une ligne complète de
                      son choix (et marquer des points),
                    </p>
                    <p>
                      <strong>-</strong> Sa carte devient la nouvelle tête de
                      ligne.
                    </p>
                    <p>
                      La partie se termine dès qu'un joueur atteint{" "}
                      <strong>66 points</strong>, le vainqueur est alors celui
                      qui a le moins de points.
                    </p>
                    <p>
                      Si aucun joueur n'a atteint les <strong>66 points</strong>{" "}
                      alors que toutes les cartes ont été jouées, on reprend les
                      104 cartes et on recommence une manche.
                    </p>
                  </div>
                </Dialog>
              </div>
              </li>
            </ul>
            <ul
              className="navbar-nav ml-auto my-2 my-lg-0 navbar-nav-scroll"
              style={styleObjet}
            >
              <li className="nav-item">
                <a className="nav-link" onClick={sauvegarder} >
                  Sauvegarder
                </a>
              </li>
            </ul>
            <ul
              className="navbar-nav ml-auto my-2 my-lg-0 navbar-nav-scroll"
              style={styleObjet}
            >
              <li className="nav-item">
                <a className="nav-link" onClick={abandonnerPartie} >
                  Abandonner
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div style={{ marginRight: "20px" }}>
        <Chat2 />
      </div>

      <div className="backQuiPrend">
        <br></br>
        <div style={{ position: 'absolute', bot:'50%', left:'40%', color:"darkblue"}}>
                  <h4>Temps pour choisir une carte: {countdown}</h4>
              </div>

              <div style={{ position: 'absolute', bot:'50%', left:'40%', color:"darkblue"}}>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <ul style={{ display: "flex", listStyle: "none", padding: 0 }}>
                    {cartesSelectionnees.map(carte => (
                      <li key={carte.valeur} style={{ marginRight: "5px" }}>
                      <img
                        src={carte.imageTemporaire}
                        alt={``}
                        style={{
                          maxWidth: "100px",
                          maxHeight: "100px",
                          marginRight: "5px",
                          cursor: "pointer",
                        }}
                      />
                    </li>
                    ))}
            </ul>
              </div>
        
       {} {gagnant && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '85vh' }}>
            <div class="card text-center mb-3" style={{width: "18rem", }}>
                <div class="card-body">
                  <p>{`${gagnant} a gagné avec un score de ${pointgagnant} !`}</p>
                  <a href="/QuiPrend" class="btn btn-primary">Nouvelle Partie</a>
                </div>
              </div>
            </div>
        )}  

        {tableDeJeu.map((sousListe, listeIndex) => (
          <div>
            <ul
              key={listeIndex}
              style={{ display: "flex", listStyle: "none", padding: 0 }}
            >
              {sousListe.map((carte, index) => (
                <li key={carte.valeur} style={{ marginRight: "5px" }}>
                  <img
                    src={carte.image}
                    alt={`Carte ${carte.valeur}`}
                    style={{
                      maxWidth: "100px",
                      maxHeight: "100px",
                      marginRight: "5px",
                      cursor: "pointer",
                      transition: "width 0.3s ease-out",
                    }}
                    onClick={() => {
                      selectionnerLigne(listeIndex);
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <footer style={{ position: "absolute", bottom: "0", width: "100%" }}>
        <div class="card w-60 card-gris">
          <div class="card-body">
            <h3 style={{ color: "white" }}>
              <br></br>
              <div style={{color:"white", left:"50%", bot:'0%'}}>
                {<h6>{carteChoisieText}</h6>}
            </div>
              <p>
                {" "}
                <center>
                  {" "}
                  Deck de : {sessionStorage.getItem("login")} - Score:{" "}
                  {monscore}{" "}
                </center>
              </p>
            </h3>
            <ul style={{ display: "flex", listStyle: "none", padding: 0 }}>
              {monpaquet.map((carte, index) => (
                <li key={index} style={{ marginRight: "5px" }}>
                  <img
                    src={carte.image}
                    alt={`Carte ${carte.valeur}`}
                    style={{
                      width:
                        carteZoomed === carte || hoveredCard === carte
                          ? "80px"
                          : "70px",
                      maxWidth: "100px",
                      maxHeight: "150px",
                      cursor: "pointer",
                      transition: "width 0.3s ease-out",
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
  );
};

export default QuiPrend;