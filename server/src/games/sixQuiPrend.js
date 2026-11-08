// 6 qui prend ! — 104 cartes, 4 rangées. Tout le monde choisit une carte en
// même temps, puis les cartes sont posées de la plus petite à la plus grande.
// Poser la 6e carte d'une rangée (ou une carte trop petite) fait ramasser des
// têtes de bœuf. La partie s'arrête à la fin d'une manche où un joueur atteint
// 66 têtes : celui qui en a le moins gagne.

const HAND_SIZE = 10;
const ROW_LIMIT = 5;
export const END_SCORE = 66;

export function bullHeads(n) {
  if (n === 55) return 7;
  if (n % 11 === 0) return 5;
  if (n % 10 === 0) return 3;
  if (n % 5 === 0) return 2;
  return 1;
}

const sumHeads = (cards) => cards.reduce((sum, c) => sum + bullHeads(c), 0);

const sixQuiPrend = {
  id: "6quiprend",
  name: "6 qui prend !",
  minPlayers: 2,
  maxPlayers: 10,

  create(players, rng) {
    const state = {
      players: players.map((p) => ({ id: p.id, hand: [], score: 0 })),
      rows: [],
      phase: "choose",
      manche: 0,
      choices: {},
      queue: [],
      waitingFor: null,
      finished: false,
      winners: [],
      log: [],
    };
    deal(state, rng);
    return state;
  },

  canAct(state, playerId) {
    if (state.phase === "choose") return !state.choices[playerId] && !!findPlayer(state, playerId);
    if (state.phase === "takeRow") return state.waitingFor === playerId;
    return false;
  },

  act(state, playerId, action) {
    if (!this.canAct(state, playerId)) return "Ce n'est pas à vous de jouer.";

    if (state.phase === "choose") {
      if (action?.type !== "play") return "Choisissez une carte.";
      const player = findPlayer(state, playerId);
      const index = player.hand.indexOf(action.card);
      if (index === -1) return "Cette carte n'est pas dans votre main.";
      state.choices[playerId] = player.hand.splice(index, 1)[0];
      if (Object.keys(state.choices).length === state.players.length) {
        state.queue = Object.entries(state.choices)
          .map(([id, card]) => ({ playerId: id, card }))
          .sort((a, b) => a.card - b.card);
        state.phase = "reveal";
      }
      return null;
    }

    if (action?.type !== "takeRow" || !state.rows[action.row]) return "Choisissez une rangée.";
    const { card } = state.queue.shift();
    takeRow(state, playerId, action.row, card);
    state.waitingFor = null;
    placeQueue(state);
    return null;
  },

  needsAdvance(state) {
    return state.phase === "reveal" || state.phase === "endOfTurn";
  },

  advance(state, rng) {
    if (state.phase === "reveal") {
      placeQueue(state);
      return;
    }
    // endOfTurn
    state.choices = {};
    if (state.players[0].hand.length > 0) {
      state.phase = "choose";
    } else if (state.players.some((p) => p.score >= END_SCORE)) {
      const best = Math.min(...state.players.map((p) => p.score));
      state.winners = state.players.filter((p) => p.score === best).map((p) => p.id);
      state.finished = true;
      state.phase = "finished";
    } else {
      deal(state, rng);
    }
  },

  botAction(state, playerId) {
    if (state.phase === "takeRow") {
      // Ramasser la rangée qui coûte le moins de têtes.
      const costs = state.rows.map(sumHeads);
      return { type: "takeRow", row: costs.indexOf(Math.min(...costs)) };
    }
    // Choisir la carte qui se place le plus "serré" sans compléter une rangée.
    const hand = findPlayer(state, playerId).hand;
    let best = null;
    for (const card of hand) {
      const rowIndex = targetRow(state.rows, card);
      let risk;
      if (rowIndex === -1) risk = 100 + Math.min(...state.rows.map(sumHeads));
      else {
        const row = state.rows[rowIndex];
        risk = row.length >= ROW_LIMIT ? 50 + sumHeads(row) : (card - row.at(-1)) / 10 + row.length;
      }
      if (!best || risk < best.risk) best = { card, risk };
    }
    return { type: "play", card: best.card };
  },

  view(state, playerId) {
    const revealed = state.phase !== "choose";
    return {
      phase: state.phase,
      manche: state.manche,
      endScore: END_SCORE,
      rows: state.rows,
      hand: findPlayer(state, playerId)?.hand ?? [],
      canPlay: this.canAct(state, playerId),
      waitingFor: state.waitingFor,
      // Cartes encore à poser ce tour (visibles une fois toutes choisies).
      pending: revealed ? state.queue : [],
      players: state.players.map((p) => ({
        id: p.id,
        score: p.score,
        handCount: p.hand.length,
        hasChosen: !!state.choices[p.id],
      })),
      winners: state.winners,
      log: state.log,
    };
  },
};

function findPlayer(state, playerId) {
  return state.players.find((p) => p.id === playerId);
}

function deal(state, rng) {
  const deck = Array.from({ length: 104 }, (_, i) => i + 1);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  state.players.forEach((p, i) => {
    p.hand = deck.slice(i * HAND_SIZE, (i + 1) * HAND_SIZE).sort((a, b) => a - b);
  });
  const offset = state.players.length * HAND_SIZE;
  state.rows = deck.slice(offset, offset + 4).map((c) => [c]);
  state.manche += 1;
  state.choices = {};
  state.phase = "choose";
}

// Rangée où la carte doit aller : celle dont la dernière carte est la plus
// grande tout en restant inférieure à la carte jouée (-1 si aucune).
export function targetRow(rows, card) {
  let best = -1;
  rows.forEach((row, i) => {
    const last = row.at(-1);
    if (last < card && (best === -1 || last > rows[best].at(-1))) best = i;
  });
  return best;
}

function takeRow(state, playerId, rowIndex, card) {
  const taken = state.rows[rowIndex];
  const heads = sumHeads(taken);
  findPlayer(state, playerId).score += heads;
  state.rows[rowIndex] = [card];
  state.log.push({ playerId, text: `ramasse ${taken.length} carte(s) : +${heads} têtes` });
  state.log = state.log.slice(-20);
}

// Pose les cartes en attente, jusqu'à la fin du tour ou jusqu'à ce qu'un
// joueur doive choisir une rangée à ramasser.
function placeQueue(state) {
  while (state.queue.length > 0) {
    const { playerId, card } = state.queue[0];
    const rowIndex = targetRow(state.rows, card);
    if (rowIndex === -1) {
      state.phase = "takeRow";
      state.waitingFor = playerId;
      return;
    }
    state.queue.shift();
    if (state.rows[rowIndex].length >= ROW_LIMIT) takeRow(state, playerId, rowIndex, card);
    else state.rows[rowIndex].push(card);
  }
  state.phase = "endOfTurn";
}

export default sixQuiPrend;
