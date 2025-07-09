import commonWords from './common_words.json' assert { type: "json" };

// const rankWordMap = {
//   "Newbie": 20,
//   "Pupil": 30,
//   "Specialist": 40,
//   "Expert": 50,
//   "Candidate Master": 60,
//   "Master": 70,
//   "International Master": 80,
//   "Grandmaster": 90,
//   "International Grandmaster": 100,
//   "Legendary Grandmaster": 150,
// };

export function generateBattleText(wordCount) {
  // const wordCount = rankWordMap[rank] || 40;
  const words = [];

  for (let i = 0; i < wordCount; i++) {
    const word = commonWords[Math.floor(Math.random() * commonWords.length)];
    words.push(word);
  }

  return words.join(" ");
}
