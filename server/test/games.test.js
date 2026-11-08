import { test } from "node:test";
import assert from "node:assert/strict";
import { GAMES } from "../src/games/index.js";
import { seededRng } from "../src/games/deck.js";
import { bullHeads, targetRow } from "../src/games/sixQuiPrend.js";

const players = (n) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `J${i}` }));

// Fait jouer uniquement des bots jusqu'à la fin de la partie.
function playOut(game, n, seed) {
  const rng = seededRng(seed);
  const state = game.create(players(n), rng);
  for (let steps = 0; !state.finished; steps++) {
    assert.ok(steps < 20_000, "la partie doit se terminer");
    if (game.needsAdvance(state)) {
      game.advance(state, rng);
      continue;
    }
    const actor = state.players.find((p) => game.canAct(state, p.id));
    assert.ok(actor, `un joueur doit pouvoir agir (phase ${state.phase})`);
    const error = game.act(state, actor.id, game.botAction(state, actor.id, rng), rng);
    assert.equal(error, null);
  }
  return state;
}

for (const game of Object.values(GAMES)) {
  test(`${game.name} : des parties complètes entre bots se terminent avec un gagnant`, () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const n of [game.minPlayers, game.maxPlayers]) {
        const state = playOut(game, n, seed);
        assert.ok(state.winners.length >= 1);
      }
    }
  });

  test(`${game.name} : un joueur ne voit pas la main des autres`, () => {
    const state = game.create(players(3), seededRng(7));
    const view = game.view(state, "p0");
    assert.ok(Array.isArray(view.hand) && view.hand.length > 0);
    for (const p of view.players) assert.equal(p.hand, undefined);
  });
}

// ----- Bataille ouverte -------------------------------------------------------

test("Bataille : les cartes choisies restent cachées jusqu'à ce que tout le monde ait joué", () => {
  const game = GAMES.bataille;
  const state = game.create(players(2), seededRng(1));
  game.act(state, "p0", { type: "play", cardId: state.players[0].hand[0].id });
  const view = game.view(state, "p1");
  assert.equal(view.players[0].hasChosen, true);
  assert.equal(view.players[0].choice, null);
  assert.equal(game.act(state, "p0", { type: "play", cardId: state.players[0].hand[0].id }), "Vous avez déjà joué ce tour.");
});

test("Bataille : la carte la plus forte remporte le pot, l'égalité le reporte", () => {
  const game = GAMES.bataille;
  const state = game.create(players(2), seededRng(1));
  state.players[0].hand = [{ id: "as-coeur", rank: "as", suit: "coeur" }, { id: "5-coeur", rank: "5", suit: "coeur" }];
  state.players[1].hand = [{ id: "as-pique", rank: "as", suit: "pique" }, { id: "2-pique", rank: "2", suit: "pique" }];

  game.act(state, "p0", { type: "play", cardId: "as-coeur" });
  game.act(state, "p1", { type: "play", cardId: "as-pique" });
  assert.equal(state.lastResult.type, "bataille");
  assert.equal(state.pot, 2);
  game.advance(state);

  game.act(state, "p0", { type: "play", cardId: "5-coeur" });
  game.act(state, "p1", { type: "play", cardId: "2-pique" });
  assert.equal(state.players[0].won, 4);
  game.advance(state);
  assert.deepEqual(state.winners, ["p0"]);
});

// ----- 6 qui prend -------------------------------------------------------------

test("6 qui prend : nombre de têtes de bœuf", () => {
  assert.equal(bullHeads(55), 7);
  assert.equal(bullHeads(22), 5);
  assert.equal(bullHeads(30), 3);
  assert.equal(bullHeads(15), 2);
  assert.equal(bullHeads(7), 1);
  const total = Array.from({ length: 104 }, (_, i) => bullHeads(i + 1)).reduce((a, b) => a + b);
  assert.equal(total, 171);
});

test("6 qui prend : la carte va sur la rangée la plus proche par en dessous", () => {
  const rows = [[10], [20], [5], [30]];
  assert.equal(targetRow(rows, 25), 1);
  assert.equal(targetRow(rows, 7), 2);
  assert.equal(targetRow(rows, 3), -1);
});

test("6 qui prend : la 6e carte fait ramasser la rangée", () => {
  const game = GAMES["6quiprend"];
  const state = game.create(players(2), seededRng(3));
  state.rows = [[1, 2, 3, 4, 5], [50], [60], [70]];
  state.players[0].hand = [6, 80];
  state.players[1].hand = [90, 100];
  game.act(state, "p0", { type: "play", card: 6 });
  game.act(state, "p1", { type: "play", card: 90 });
  game.advance(state); // pose des cartes
  assert.deepEqual(state.rows[0], [6]);
  assert.equal(state.players[0].score, 6); // 1+1+1+1+2
  assert.deepEqual(state.rows[3], [70, 90]);
});

test("6 qui prend : une carte trop petite oblige à choisir une rangée", () => {
  const game = GAMES["6quiprend"];
  const state = game.create(players(2), seededRng(3));
  state.rows = [[40, 41], [50], [60], [55]];
  state.players[0].hand = [2, 80];
  state.players[1].hand = [90, 100];
  game.act(state, "p0", { type: "play", card: 2 });
  game.act(state, "p1", { type: "play", card: 90 });
  game.advance(state);
  assert.equal(state.phase, "takeRow");
  assert.equal(game.canAct(state, "p1"), false);
  assert.equal(game.act(state, "p0", { type: "takeRow", row: 3 }), null);
  assert.equal(state.players[0].score, 7);
  assert.deepEqual(state.rows[3], [2]);
  assert.deepEqual(state.rows[2], [60, 90]);
});

// ----- 8 américain ------------------------------------------------------------

function huitState(hands, top, extra = {}) {
  const game = GAMES.huitamericain;
  const state = game.create(players(hands.length), seededRng(5));
  const card = (id) => {
    const [rank, suit] = id.split("-");
    return { id, rank, suit };
  };
  state.players.forEach((p, i) => (p.hand = hands[i].map(card)));
  state.discard = [card(top)];
  state.currentSuit = card(top).suit;
  state.turn = 0;
  Object.assign(state, extra);
  return { game, state };
}

test("8 américain : il faut suivre la couleur ou la valeur", () => {
  const { game, state } = huitState([["5-pique", "9-coeur", "3-trefle"], ["4-pique"]], "9-trefle");
  assert.equal(game.act(state, "p0", { type: "play", cardId: "5-pique" }), "Cette carte ne peut pas être jouée.");
  assert.equal(game.act(state, "p0", { type: "play", cardId: "9-coeur" }), null);
  assert.equal(state.turn, 1);
});

test("8 américain : le 8 change la couleur demandée", () => {
  const { game, state } = huitState([["8-pique", "2-coeur"], ["4-carreau", "5-carreau"]], "9-trefle");
  assert.equal(game.act(state, "p0", { type: "play", cardId: "8-pique" }), "Choisissez une couleur.");
  game.act(state, "p0", { type: "play", cardId: "8-pique", suit: "carreau" });
  assert.equal(state.currentSuit, "carreau");
  assert.equal(game.act(state, "p1", { type: "play", cardId: "4-carreau" }), null);
});

test("8 américain : les as se cumulent et obligent à piocher", () => {
  const { game, state } = huitState(
    [["as-trefle", "2-coeur"], ["as-coeur", "3-coeur"], ["4-pique", "5-pique"]],
    "9-trefle"
  );
  game.act(state, "p0", { type: "play", cardId: "as-trefle" });
  game.act(state, "p1", { type: "play", cardId: "as-coeur" });
  assert.equal(state.pendingDraw, 4);
  assert.equal(game.act(state, "p2", { type: "play", cardId: "4-pique" }), "Jouez un as ou piochez 4 cartes.");
  game.act(state, "p2", { type: "draw" });
  assert.equal(state.players[2].hand.length, 6);
  assert.equal(state.pendingDraw, 0);
});

test("8 américain : le 7 fait passer un tour, le valet inverse le sens", () => {
  const { game, state } = huitState(
    [["7-trefle", "valet-trefle", "2-coeur"], ["3-pique"], ["4-pique"], ["5-pique"]],
    "9-trefle"
  );
  game.act(state, "p0", { type: "play", cardId: "7-trefle" });
  assert.equal(state.turn, 2);
  state.turn = 0;
  game.act(state, "p0", { type: "play", cardId: "valet-trefle" });
  assert.equal(state.direction, -1);
  assert.equal(state.turn, 3);
});

test("8 américain : poser sa dernière carte fait gagner", () => {
  const { game, state } = huitState([["2-trefle"], ["3-pique", "4-pique"]], "9-trefle");
  game.act(state, "p0", { type: "play", cardId: "2-trefle" });
  assert.equal(state.finished, true);
  assert.deepEqual(state.winners, ["p0"]);
});
