// ponytail: thin combiner over score.js — weights live in calculateMainScore,
// rank in rankFor. Quest pairs → proof proxy min(100, pairs*20). No dup math.
import { calculateMainScore, rankFor } from "./score.js";

export function questPairsToProof(pairs = 0) {
  const n = Math.max(0, Math.floor(Number(pairs) || 0));
  return Math.min(100, n * 20);
}

export function combineScores(ats = 0, quiz = 0, questPairs = 0, roleKey = "sde") {
  const main = calculateMainScore(ats, quiz, questPairsToProof(questPairs), roleKey);
  return { main, rank: rankFor(main) };
}
