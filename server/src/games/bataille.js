// Bataille ouverte : chaque joueur voit sa main et choisit une carte en secret.
// La plus forte remporte les cartes posées ; en cas d'égalité ("bataille"),
// le pot est remis en jeu au tour suivant. Quand les mains sont vides,
// le joueur ayant remporté le plus de cartes gagne.
import { createDeck, shuffle, RANK_VALUE, cardLabel } from "./deck.js";

const bataille = {
  id: "bataille",
  name: "Bataille ouverte",
  minPlayers: 2,
  maxPlayers: 6,

  create(players, rng) {
    const deck = shuffle(createDeck(), rng);
    const perPlayer = Math.floor(deck.length / players.length);
    return {
      players: players.map((p, i) => ({
        id: p.id,
        hand: sortHand(deck.slice(i * perPlayer, (i + 1) * perPlayer)),
        won: 0,
      })),
      phase: "choose",
      round: 1,
      choices: {},
      pot: 0,
      lastResult: null,
      finished: false,
      winners: [],
      log: [],
    };
  },

  canAct(state, playerId) {
    return state.phase === "choose" && !state.choices[playerId] && !!findPlayer(state, playerId);
  },

  act(state, playerId, action) {
    if (action?.type !== "play") return "Action inconnue.";
    if (!this.canAct(state, playerId)) return "Vous avez déjà joué ce tour.";
    const player = findPlayer(state, playerId);
    const index = player.hand.findIndex((c) => c.id === action.cardId);
    if (index === -1) return "Cette carte n'est pas dans votre main.";

    state.choices[playerId] = player.hand.splice(index, 1)[0];
    if (Object.keys(state.choices).length === state.players.length) resolveRound(state);
    return null;
  },

  needsAdvance(state) {
    return state.phase === "reveal";
  },

  advance(state) {
    state.choices = {};
    state.round += 1;
    if (state.players.every((p) => p.hand.length === 0)) {
      const best = Math.max(...state.players.map((p) => p.won));
      state.winners = state.players.filter((p) => p.won === best).map((p) => p.id);
      state.finished = true;
      state.phase = "finished";
    } else {
      state.phase = "choose";
    }
  },

  botAction(state, playerId, rng) {
    const hand = findPlayer(state, playerId).hand;
    return { type: "play", cardId: hand[Math.floor(rng() * hand.length)].id };
  },

  view(state, playerId) {
    const revealed = state.phase !== "choose";
    return {
      phase: state.phase,
      round: state.round,
      pot: state.pot,
      lastResult: state.lastResult,
      hand: findPlayer(state, playerId)?.hand ?? [],
      canPlay: this.canAct(state, playerId),
      players: state.players.map((p) => ({
        id: p.id,
        handCount: p.hand.length,
        won: p.won,
        hasChosen: !!state.choices[p.id],
        // Les cartes choisies restent cachées tant que tout le monde n'a pas joué.
        choice: revealed ? state.choices[p.id] ?? null : null,
      })),
      winners: state.winners,
      log: state.log,
    };
  },
};

function findPlayer(state, playerId) {
  return state.players.find((p) => p.id === playerId);
}

function sortHand(hand) {
  return hand.sort((a, b) => RANK_VALUE[a.rank] - RANK_VALUE[b.rank] || a.suit.localeCompare(b.suit));
}

function resolveRound(state) {
  const entries = Object.entries(state.choices);
  const best = Math.max(...entries.map(([, c]) => RANK_VALUE[c.rank]));
  const leaders = entries.filter(([, c]) => RANK_VALUE[c.rank] === best);
  state.pot += entries.length;

  if (leaders.length === 1) {
    const [winnerId, card] = leaders[0];
    findPlayer(state, winnerId).won += state.pot;
    state.lastResult = { type: "win", playerId: winnerId, cards: state.pot };
    state.log.push({ playerId: winnerId, text: `remporte ${state.pot} cartes avec le ${cardLabel(card)}` });
    state.pot = 0;
  } else {
    state.lastResult = { type: "bataille", playerIds: leaders.map(([id]) => id) };
    state.log.push({ text: `Bataille ! ${state.pot} cartes restent en jeu` });
  }
  state.log = state.log.slice(-20);
  state.phase = "reveal";
}

export default bataille;
