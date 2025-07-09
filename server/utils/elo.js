export function calculateElo(playerRating, opponentRating, didWin, k = 32) {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actualScore = didWin ? 1 : didWin === 0.5 ? 0.5 : 0;
  const newRating = playerRating + k * (actualScore - expectedScore);
  return Math.round(newRating);
}
