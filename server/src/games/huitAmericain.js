// 8 américain : se débarrasser de toutes ses cartes en jouant sur la carte
// visible une carte de même couleur ou de même valeur.
// Cartes spéciales : 8 = joker (change la couleur), as = +2 cumulable,
// 7 = le joueur suivant passe son tour, valet = inverse le sens.
import { createDeck, shuffle, cardLabel, SUITS } from "./deck.js";

const huitAmericain = {
  id: "huitamericain",
  name: "8 américain",
  minPlayers: 2,
  maxPlayers: 8,

  create(players, rng) {
    const deck = shuffle(createDeck(), rng);
    const perPlayer = players.length <= 4 ? 8 : players.length <= 6 ? 6 : 5;
    const state = {
      players: players.map((p) => ({ id: p.id, hand: deck.splice(0, perPlayer) })),
      drawPile: deck,
      discard: [],
      currentSuit: null,
      turn: 0,
      direction: 1,
      pendingDraw: 0,
      phase: "play",
      finished: false,
      winners: [],
      log: [],
    };
    // La première carte retournée ne doit pas être spéciale.
    const start = state.drawPile.findIndex((c) => !["8", "as", "7", "valet"].includes(c.rank));
    const [first] = state.drawPile.splice(start, 1);
    state.discard.push(first);
    state.currentSuit = first.suit;
    return state;
  },

  canAct(state, playerId) {
    return !state.finished && state.players[state.turn].id === playerId;
  },

  isPlayable(state, card) {
    const top = state.discard.at(-1);
    if (state.pendingDraw > 0) return card.rank === "as";
    return card.rank === "8" || card.suit === state.currentSuit || card.rank === top.rank;
  },

  act(state, playerId, action, rng) {
    if (!this.canAct(state, playerId)) return "Ce n'est pas votre tour.";
    const player = state.players[state.turn];

    if (action?.type === "draw") {
      const count = Math.max(1, state.pendingDraw);
      const drawn = drawCards(state, count, rng);
      player.hand.push(...drawn);
      state.log.push({ playerId, text: `pioche ${drawn.length} carte(s)` });
      state.pendingDraw = 0;
      nextTurn(state, 1);
      return null;
    }

    if (action?.type !== "play") return "Action inconnue.";
    const index = player.hand.findIndex((c) => c.id === action.cardId);
    if (index === -1) return "Cette carte n'est pas dans votre main.";
    const card = player.hand[index];
    if (!this.isPlayable(state, card)) {
      return state.pendingDraw > 0
        ? `Jouez un as ou piochez ${state.pendingDraw} cartes.`
        : "Cette carte ne peut pas être jouée.";
    }
    if (card.rank === "8" && !SUITS.includes(action.suit)) return "Choisissez une couleur.";

    player.hand.splice(index, 1);
    state.discard.push(card);
    state.currentSuit = card.rank === "8" ? action.suit : card.suit;

    let step = 1;
    let text = `joue le ${cardLabel(card)}`;
    if (card.rank === "8") text += ` et demande du ${action.suit}`;
    if (card.rank === "as") {
      state.pendingDraw += 2;
      text += ` (+${state.pendingDraw} pour le suivant)`;
    }
    if (card.rank === "7") {
      step = 2;
      text += " : le joueur suivant passe son tour";
    }
    if (card.rank === "valet") {
      state.direction *= -1;
      text += " : changement de sens";
    }
    state.log.push({ playerId, text });
    state.log = state.log.slice(-20);

    if (player.hand.length === 0) {
      state.finished = true;
      state.phase = "finished";
      state.winners = [playerId];
      return null;
    }
    nextTurn(state, step);
    return null;
  },

  needsAdvance() {
    return false;
  },

  advance() {},

  botAction(state, playerId) {
    const hand = state.players[state.turn].hand;
    const playable = hand.filter((c) => this.isPlayable(state, c));
    if (playable.length === 0) return { type: "draw" };
    // Garder les 8 pour la fin, ils servent de joker.
    const card = playable.find((c) => c.rank !== "8") ?? playable[0];
    if (card.rank !== "8") return { type: "play", cardId: card.id };
    const counts = SUITS.map((s) => hand.filter((c) => c.suit === s && c.rank !== "8").length);
    return { type: "play", cardId: card.id, suit: SUITS[counts.indexOf(Math.max(...counts))] };
  },

  view(state, playerId) {
    const me = state.players.find((p) => p.id === playerId);
    const myTurn = this.canAct(state, playerId);
    return {
      phase: state.phase,
      topCard: state.discard.at(-1),
      currentSuit: state.currentSuit,
      direction: state.direction,
      pendingDraw: state.pendingDraw,
      drawPileCount: state.drawPile.length,
      currentPlayer: state.players[state.turn].id,
      canPlay: myTurn,
      hand: (me?.hand ?? []).map((c) => ({ ...c, playable: myTurn && this.isPlayable(state, c) })),
      players: state.players.map((p) => ({ id: p.id, handCount: p.hand.length })),
      winners: state.winners,
      log: state.log,
    };
  },
};

function nextTurn(state, step) {
  const n = state.players.length;
  state.turn = (((state.turn + step * state.direction) % n) + n) % n;
}

// Pioche des cartes ; quand la pioche est vide, on remélange la défausse
// (sauf la carte visible).
function drawCards(state, count, rng) {
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (state.drawPile.length === 0) {
      const top = state.discard.pop();
      state.drawPile = shuffle(state.discard, rng);
      state.discard = [top];
    }
    if (state.drawPile.length === 0) break;
    drawn.push(state.drawPile.pop());
  }
  return drawn;
}

export default huitAmericain;
