import commonWords from "./common_words.json";

export function generateText(wordCount = 50) {
  const words = [];

  for (let i = 0; i < wordCount; i++) {
    const word = commonWords[Math.floor(Math.random() * commonWords.length)];
    words.push(word);
  }

  return words.join(" ");
}
