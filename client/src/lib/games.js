// Métadonnées et règles affichées côté client pour chaque jeu.

export const GAMES = {
  "6quiprend": {
    id: "6quiprend",
    name: "6 qui prend !",
    tagline: "Évitez les têtes de bœuf",
    players: "2 à 10 joueurs",
    minPlayers: 2,
    maxPlayers: 10,
    accent: "var(--violet)",
    preview: [{ cow: 55 }, { cow: 12 }, { cow: 89 }],
    rules: [
      "Chaque joueur reçoit 10 cartes. Quatre rangées d'une carte sont posées au centre.",
      "À chaque tour, tout le monde choisit une carte en secret. Les cartes sont ensuite posées de la plus petite à la plus grande.",
      "Une carte va sur la rangée dont la dernière carte est la plus proche par en dessous.",
      "Poser la 6e carte d'une rangée fait ramasser les 5 premières. Une carte plus petite que toutes les rangées oblige à en ramasser une au choix.",
      "Chaque carte ramassée rapporte des têtes de bœuf (des points de pénalité). Quand un joueur atteint 66 têtes, celui qui en a le moins gagne.",
    ],
  },
  bataille: {
    id: "bataille",
    name: "Bataille ouverte",
    tagline: "Bluff et timing",
    players: "2 à 6 joueurs",
    minPlayers: 2,
    maxPlayers: 6,
    accent: "var(--red)",
    preview: [
      { rank: "as", suit: "pique" },
      { rank: "roi", suit: "coeur" },
      { rank: "dame", suit: "carreau" },
    ],
    rules: [
      "Le paquet de 52 cartes est distribué équitablement. Chacun voit sa main.",
      "À chaque tour, tous les joueurs choisissent une carte en même temps, face cachée.",
      "Les cartes sont révélées : la plus forte (l'as est la plus forte) remporte toutes les cartes posées.",
      "En cas d'égalité, c'est la bataille : les cartes restent en jeu et iront au vainqueur du tour suivant.",
      "Quand les mains sont vides, le joueur qui a remporté le plus de cartes gagne.",
    ],
  },
  huitamericain: {
    id: "huitamericain",
    name: "8 américain",
    tagline: "Videz votre main en premier",
    players: "2 à 8 joueurs",
    minPlayers: 2,
    maxPlayers: 8,
    accent: "var(--gold)",
    preview: [
      { rank: "8", suit: "trefle" },
      { rank: "7", suit: "carreau" },
      { rank: "valet", suit: "pique" },
    ],
    rules: [
      "Chacun reçoit 8 cartes (moins à partir de 5 joueurs). Le but : être le premier à ne plus en avoir.",
      "À votre tour, posez une carte de la même couleur ou de la même valeur que la carte visible, ou piochez.",
      "Le 8 est un joker : il se pose sur n'importe quelle carte et vous choisissez la couleur suivante.",
      "L'as oblige le joueur suivant à piocher 2 cartes, sauf s'il pose un as à son tour (les pénalités se cumulent).",
      "Le 7 fait passer son tour au joueur suivant. Le valet inverse le sens du jeu.",
    ],
  },
};

export const GAME_LIST = Object.values(GAMES);

export const SUIT_SYMBOL = { coeur: "♥", carreau: "♦", trefle: "♣", pique: "♠" };
export const SUIT_NAME = { coeur: "Cœur", carreau: "Carreau", trefle: "Trèfle", pique: "Pique" };
export const RANK_SHORT = { as: "A", roi: "R", dame: "D", valet: "V" };
