import { useState } from "react";
import TypingBox from "../components/game/TypingBox";
import { generateText } from "../utils/generateText";

export default function Practice() {
  const [wordCount, setWordCount] = useState("50");
  const [time, setTime] = useState("60");
  const [started, setStarted] = useState(false);
  const [practiceText, setPracticeText] = useState("");

  const handleStart = () => {
    const wordNum = parseInt(wordCount);
    const timeNum = parseInt(time);
    if (wordNum > 0 && timeNum > 0) {
      const text = generateText(wordNum);
      setPracticeText(text);
      setStarted(true);
    }
  };

  const isValid = () =>
    /^\d+$/.test(wordCount) &&
    /^\d+$/.test(time) &&
    parseInt(wordCount) > 0 &&
    parseInt(time) > 0;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {!started ? (
        <>
          <h2 className="text-2xl font-bold mb-4 text-zinc-800 dark:text-white">
            ⚡ Practice Mode
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Number of Words
              </label>
              <input
                type="number"
                min={1}
                value={wordCount}
                onChange={(e) => setWordCount(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-zinc-700 dark:text-white no-spinner"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Time Limit (seconds)
              </label>
              <input
                type="number"
                min={1}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-zinc-700 dark:text-white no-spinner"
              />
            </div>

            <button
              onClick={handleStart}
              disabled={!isValid()}
              className={`w-full font-bold py-2 px-4 rounded ${
                isValid()
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-400 text-white cursor-not-allowed"
              }`}
            >
              🚀 Start Practice
            </button>
          </div>
        </>
      ) : (
        <TypingBox
          user={{ name: "You", uid: "practice" }}
          room={null}
          socket={null}
          opponentInfo={null}
          isPractice={true}
          text={practiceText}
          timeLimit={parseInt(time)}
        />
      )}
    </div>
  );
}
