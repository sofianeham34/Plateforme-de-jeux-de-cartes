/*IMPORTANT

UTILISER L'ASYNCHRONITE SUR LES FONCTIONS DE REQUETE AUX BDD

LES VARIABLES DE SESSION:
login
createur
typePartie

IMPORTANT*/

const { Console } = require("console");
const { Socket } = require("dgram");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const cors = require("cors");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const md5 = require("md5");
app.use(cors());
const io = new Server(server, {
  cors: {},
});
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = 3001;

var idP = 0; //variable idP qu'on incrémentera à chaque création de partie

server.listen(PORT, () => {
  console.log("Le serveur écoute sur le port " + PORT); //connexion au serveur
});

const sqlite3 = require("sqlite3");
const db = require("./db.js");

//partie fonctions utiles au serveur

//Retourne la liste des joueurs dans une partie "idPartie"
function getListeJoueurs(idPartie) {
  return new Promise((resolve, reject) => {
    let listeJ = [];
    db.all("SELECT login from joueur WHERE idP=" + idPartie, (err, result) => {
      if (err) reject(err);
      console.log(result);
      for (let j of result) {
        listeJ.push(j["login"]);
        console.log(j);
      }
      resolve(listeJ);
    });
  });
}
//retourne si un joueur est dans le paquet
function estDansPaquet(paquet, nomJoueur) {
  let i = false;
  for (let j of paquet) {
    console.log("name", j["nom"], nomJoueur);
    if (j["nom"] == nomJoueur) {
      console.log("dcp on passe a true");
      i = true;
    }
  }
  return i;
}
//Retourne la liste des parties sauvegardees auquel appartient le joueur
function getListePartiesSauvegardees(typePartie, nomJoueur) {
  console.log("entree dans la fonction partie sauvegarde");
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM partiesSauvegardees Where typeP=?",
      [typePartie],
      (err, res) => {
        console.log("le resultat est :", res);
        if (err) reject(err);
        let listeP = [];
        for (let partie of res) {
          console.log("le paquet le paqueta ", partie["paquet"]);
          if (estDansPaquet(JSON.parse(partie["paquet"]), nomJoueur)) {
            console.log("dans le paquet donc on ajoute " + partie["idP"]);
            listeP.push(partie["idP"]);
          }
        }
        resolve(listeP);
      }
    );
  });
}

//Retourne la liste des parties disponibles (parties qui n'ont pas démarrées)
function getListePartiesDispo(typePartie) {
  return new Promise((resolve, reject) => {
    let listeP = [];
    db.all(
      "SELECT idP FROM partie WHERE partieD=0 AND typeP=?",
      [typePartie],
      (err, res) => {
        if (err) {
          reject(err);
        } else {
          console.log("liste" + res);
          for (p of res) {
            console.log(p);
            console.log(p["idP"]);
            listeP.push(p["idP"]);
          }
          console.log(listeP);
          resolve(listeP);
        }
      }
    );
  });
}

//fin partie fonctions

io.on("connection", (socket) => {
  //QUAND UN JOUEUR FERME LA FENETRE ON NE L ASSOCIE PLUS A LA PARTIE
  socket.on("deconnexion", (data) => {
    db.run(
      "UPDATE joueur SET idP=NULL WHERE login=?",
      [data.login],
      function (err) {
        if (err) throw err;
      }
    );
  });

  //INSCRIPTION D'UN JOUEUR
  socket.on("inscription", (ins) => {
    // inscription d'un joueur
    console.log(ins.login, ins.mdp);
    const mdpcrypte = md5(ins.mdp); //securisation du mot de passe avec md5
    db.run(
      "INSERT INTO joueur(login,mdp) VALUES (?,?)",
      [ins.login, mdpcrypte],
      (err) => {
        if (err) {
          socket.emit("inscriptionReussie", { login: ins.login, connexion: 0 }); //si erreur l'inscription n'est pas possible
          console.log("impossible de s'inscrire");
        } else {
          socket.emit("inscriptionReussie", { login: ins.login, connexion: 1 }); //validation de l'inscription et envoi au joueur
        }
      }
    );
  });

  //CONNEXION D'UN JOUEUR
  socket.on("connecter", (con) => {
    console.log(con.login, con.mdp);
    const mdpcrypte = md5(con.mdp); //securisation du mot de passe avec md5
    db.get(
      "SELECT * FROM joueur WHERE login= '" +
        con.login +
        "' AND mdp='" +
        mdpcrypte +
        "'",
      (err, data) => {
        console.log(data);
        if (err) throw err;
        if (data === undefined) {
          //si le joueur n'est pas dans la bdd
          socket.emit("connecter", { connexion: 0 }); //connexion échouée
        } else {
          socket.emit("connecter", { login: con.login, connexion: 1 }); //validation de la connexion et envoi au joueur
        }
      }
    );
    db.run(
      "UPDATE joueur SET idP=NULL WHERE login=?",
      [con.login],
      function (err) {
        if (err) throw err;
      }
    );
  });

  //LISTE DES PARTIES DISPONIBLES
  socket.on("partiesDisponibles", async (typePartie) => {
    //revoie au client l'id des parties disponibles
    console.log("demandes de parties");
    let listeparties = await getListePartiesDispo(typePartie);
    console.log("listepartie", listeparties);
    socket.emit("partiesDisponibles", listeparties);
  });

  //CREATION D'UNE PARTIE
  socket.on("creerPartie", async (infos) => {
    let idPartie = idP;
    console.log(
      "demande de creation partie par " +
        infos.login +
        " avec " +
        infos.nbJMax +
        " joueurs"
    );

    db.run(
      "INSERT INTO partie(idP,nbJMax,partieD,typeP,loginC) VALUES (?,?,?,?,?)",
      [idP, infos.nbJMax, 0, infos.typePartie, infos.login], //creation partie
      function (err) {
        if (err) throw err;
      }
    );
    console.log("partie créée");

    db.run(
      "UPDATE joueur SET idP=? WHERE login=?",
      [idPartie, infos.login], //on ajoute au joueur l'idP de la partie qu'il a renjoint
      function (err) {
        if (err) throw err;
      }
    );
    db.get(
      "SELECT * FROM partie WHERE partieD=0 AND typeP=?",
      [infos.typePartie],
      (err, res) => {
        if (err) throw err;
        console.log(res);
        console.log("resultat req");
      }
    );
    console.log("idPartie" + idPartie);
    socket.emit("creationReussie", idPartie); //renvoie de la confirmation de la creation de la partie a son createur

    let nouvelleListeParties = await getListePartiesDispo(infos.typePartie);
    io.emit("partiesDisponibles", nouvelleListeParties); //on renvoie la liste des parties
    idP++; //on incrémente idP
  });

  //ENTREE DANS LA PARTIE D'UN JOUEUR
  socket.on("rejoindrePartie", async (partie) => {
    db.run(
      "UPDATE joueur SET idP=? WHERE login= ?",
      [partie.idP, partie.login],
      function (err) {
        if (err) throw err;
      }
    );
    socket.emit("rejoint", 1);
    console.log("socket emit");
    let nouvelleListeJoueurs = await getListeJoueurs(partie.idP);
    console.log("novlisteJ", nouvelleListeJoueurs);
    io.to(String(partie.idP)).emit("nouveauJoueur", nouvelleListeJoueurs); //on renvoie la liste des joueurs actualisée à tous le monde
  });

  //DEMARRAGE DE LA PARTIE
  socket.on("demarrerPartie", async (partie) => {
    console.log("ON VA LANCER LA PARTIE" + partie.idP);
    db.run(
      "UPDATE partie SET partieD=? WHERE idP= ?",
      [1, partie.idP],
      function (err) {
        if (err) throw err;
      }
    );
    let nouvListeParties = await getListePartiesDispo();
    io.emit("partiesDisponibles", nouvListeParties); //on actualise la liste des parties
    io.to(String(partie.idP)).emit("infoDemarrageP");
  });

  //RENVOIE LA LISTE DES JOUEURS DE LA PARTIE
  socket.on("joueursDansPartie", async (idP) => {
    let listeJ = await getListeJoueurs(idP);
    console.log("liste j deja presents", listeJ);
    socket.emit("nouveauJoueur", listeJ);
  });

  //AJOUTE LE JOUEUR A LA ROOM idP
  socket.on("rejRoom", (idP) => {
    console.log(idP);
    socket.join(String(idP));
    console.log("un joueur a rejoint la room");
    io.to(String(idP)).emit("joueurRejRoom");
  });

  //RENVOIE LE MESSAGE AUX JOUEURS DE LA PARTIE
  socket.on("messageEnvoye", (message) => {
    // Diffusez le message à tous les joueurs dans la même salle (idP)
    io.to(String(message.idP)).emit("messageRecu", {
      pseudo: message.pseudo,
      message: message.message,
    });
    console.log("Événement messageRecu émis avec succès !");
    console.log(message.message);
  });

  //PARTIE JEU BATAILLE
  socket.on("deckDeDepart", (deck) => {
    console.log(deck);
    io.to(String(deck.idP)).emit("deckDeDepart", deck.joueurs);
  });

  //RENVOIE LA LISTE DES CARTES CHOISIES A TOUT LES JOUEURS
  socket.on("cartesChoisies", (data) => {
    console.log("cartes", data);
    io.to(String(data.idP)).emit("cartesselectionnees", {
      cartes: data.cartes,
      jstate: data.jstate,
      pioche: data.pioche,
      paquet: data.paquet,
    });
  });

  //RENVOIE LA LISTE DES IDS DES JOUEURS AYANT DEJA CHOISI UNE CARTE
  socket.on("selectionEffectues", (data) => {
    console.log("selection", data);
    io.to(String(data.idP)).emit("selection", data.selection);
  });
  //FIN PARTIE JEU BATAILLE

  socket.on("sauvegarde", (partie) => {
    console.log("demande de saugarde de la partie", partie.idP);
    db.run(
      "INSERT INTO partiesSauvegardees VALUES(?,?,?,?)",
      [partie.idP, partie.paquet, partie.typePartie, partie.login],
      (err) => {
        if (err) throw err;
        io.to(String(partie.idP)).emit("sauvegarde", 1);
      }
    );
  });

  socket.on("resultatPartie", (partie) => {
    db.run(
      "UPDATE user SET victoires=victoires + 1 WHERE login=?",
      [partie.login],
      (err) => {
        if (err) throw err;
      }
    );
    for (let j of partie.paquet) {
      if (j.score < 66) {
        db.run(
          "UPDATE user SET defaites=defaites + 1 WHERE login=?",
          [j.nom],
          (err) => {
            if (err) throw err;
          }
        );
      }
    }
  });
  //PARTIE JEU 6 QUI PREND

  socket.on("partiesSauvegardeesDispo", async (data) => {
    db.all("SELECT * FROM partiesSauvegardees", (err, res) => {
      if (err) throw err;
      console.log(res);
    });
    let listeP = await getListePartiesSauvegardees(
      data.typePartie,
      data.nomJoueur
    );
    console.log(
      "liste des parties sauvegardees",
      data.typePartie,
      data.nomJoueur
    );
    socket.emit("partiesSauvegardeesDispo", listeP);
  });

  socket.on("demandePaquet", (idP) => {
    db.get(
      "SELECT paquet FROM partiesSauvegardees WHERE idP =?",
      [idP],
      (err, res) => {
        if (err) throw err;
        socket.emit("demandePaquet", res["paquet"]);
      }
    );
  });

  socket.on("demandeCreateur", (idP) => {
    db.get(
      "SELECT * FROM partiesSauvegardees WHERE idP=?",
      [idP],
      (err, res) => {
        if (err) throw err;
        socket.emit("demandeCreateur", res["loginC"]);
      }
    );
  });
  socket.on("deckDepartQuiPrend", (deck) => {
    io.to(String(deck.idP)).emit("deckDepartQuiPrend", {
      deck: deck.deck,
      pioche: deck.pioche,
    });
    console.log(deck.deck);
  });

  socket.on("scoreUpdate", (data) => {
    io.to(String(data.idP)).emit("scoreUpdate", data.paquetscore);
  });

  socket.on("choisirSaCarte", (data) => {
    io.to(String(data.idP)).emit("choisirSaCarte", {
      cartestriees: data.cartestriees,
      carte: data.carte,
    });
  });

  socket.on("carteChoisie", (data) => {
    io.to(String(data.idP)).emit("carteChoisie", {
      paquet: data.paquet,
      cartestriees: data.cartestriees,
      carte: data.carte,
      index: data.index,
      pioche: data.pioche,
    });
  });

  socket.on("gagnant", (data) => {
    io.to(String(data.idP)).emit("gagnant", {
      gagnant: data.gagnant,
      score: data.score,
    });
  });

  //FIN PARTIE 6 QUI PREND

  //PARTIE 8 AMERICAIN

  socket.on("deckDepart8Americain", (data) => {
    console.log("le deck du huit americain", data.joueurs);
    io.to(String(data.idP)).emit("deckDepart8Americain", {
      deck: data.joueurs,
      pioche: data.pioche,
    });
  });

  socket.on("carteChoisieAmericain", (data) => {
    io.to(String(data.idP)).emit("carteChoisieAmericain", {
      carte: data.carte,
      paquet: data.paquet,
      prochainJoueur: data.prochainJoueur,
      nbCartes: data.nbCartes,
    });
  });
  socket.on("piocher", (data) => {
    io.to(String(data.idP)).emit("cartesPiochees", {
      cartes: data.cartes,
      id: data.id,
      prochainTour: data.prochainTour,
      pioche: data.pioche,
      paquet: data.paquet,
    });
  });
  socket.on("nouvelleCouleur", (data) => {
    io.to(String(data.idP)).emit("nouvelleCouleur", {
      carte: data.carte,
      prochainTour: data.prochainTour,
      carteAEnlever: data.carteAEnlever,
      paquet: data.paquet,
    });
  });
  socket.on("messageEnvoyer", (data) => {
    // Diffuser le message dans le chat
    io.emit("messageRecuu", data);
  });


//PAGE DES SCORES
socket.on("resultat",data=>{
  if(data.login === data.gagnant){
    db.run("UPDATE joueur SET V"+data.typePartie+"=V"+data.typePartie+"+1 WHERE login=?",[data.login],
    err=>{
      if(err) throw err;
    });
  } else {
    db.run("UPDATE joueur SET D"+data.typePartie+"=D"+data.typePartie+"+1 WHERE login=?",[data.login],
    err=>{
      if(err) throw err;
    });
  }
});

socket.on("demandeScores",()=>{
  db.all("SELECT * FROM joueur",(err,res)=>{
    if (err) throw err;
    socket.emit("demandeScores",res);
  });
});
});