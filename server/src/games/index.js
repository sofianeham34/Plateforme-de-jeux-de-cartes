import bataille from "./bataille.js";
import sixQuiPrend from "./sixQuiPrend.js";
import huitAmericain from "./huitAmericain.js";

// Chaque jeu expose la même interface : create, view, act, canAct,
// needsAdvance/advance (transitions temporisées) et botAction.
export const GAMES = Object.fromEntries([bataille, sixQuiPrend, huitAmericain].map((g) => [g.id, g]));
