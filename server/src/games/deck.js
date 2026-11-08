// Outils communs aux jeux utilisant un jeu classique de 52 cartes.

export const SUITS = ["coeur", "carreau", "trefle", "pique"];
export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "valet", "dame", "roi", "as"];

// Force d'une carte (as fort), utilisée par la bataille.
export const RANK_VALUE = Object.fromEntries(RANKS.map((r, i) => [r, i + 2]));

export function createDeck() {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ id: `${rank}-${suit}`, rank, suit })));
}

// Mélange de Fisher-Yates. `rng` est injectable pour rendre les tests déterministes.
export function shuffle(cards, rng = Math.random) {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Générateur pseudo-aléatoire reproductible (mulberry32), utile pour les tests.
export function seededRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cardLabel(card) {
  return `${card.rank} de ${card.suit}`;
}
