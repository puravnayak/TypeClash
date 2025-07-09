import { useEffect, useRef, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function TypingBox({
  socket,
  room,
  user,
  opponentInfo,
  isPractice = false,
  text = "The quick brown fox jumps over the lazy dog",
  timeLimit = 60,
}) {
  const [countdown, setCountdown] = useState(3);
  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [timerRunning, setTimerRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [opponentStats, setOpponentStats] = useState(null);
  const [winner, setWinner] = useState(null);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [keystrokeLog, setKeystrokeLog] = useState([]);
  const [ratingChanges, setRatingChanges] = useState(null);
  const [aiTips, setAiTips] = useState(null);
  const [loadingTips, setLoadingTips] = useState(false);

  const inputRef = useRef(null);

  const getWPM = (inputValue, start) => {
    if (!start || !inputValue?.length) return 0;
    const elapsedMinutes = (Date.now() - start) / 60000;
    const correctChars = inputValue
      .split("")
      .filter((ch, i) => ch === text[i]).length;
    const words = correctChars / 5;
    return elapsedMinutes > 0 ? Math.round(words / elapsedMinutes) : 0;
  };

  const getStrictAccuracy = () => {
    if (totalKeystrokes === 0) return 0;
    return Math.round((correctKeystrokes / totalKeystrokes) * 100);
  };

  const fetchTipsOnce = (wpm, accuracy, errors) => {
    if (loadingTips || aiTips) return;
    setLoadingTips(true);
    fetch(`${BACKEND_URL}/api/tips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wpm, accuracy, errors }),
    })
      .then((res) => res.json())
      .then((data) => {
        setAiTips(data.tips?.split("\n").filter(Boolean));
        setLoadingTips(false);
      })
      .catch(() => {
        setLoadingTips(false);
      });
  };

  const handleTimeout = () => {
    if (finished) return;
    setFinished(true);
    const wpm = getWPM(input, startTime);
    const accuracy = getStrictAccuracy();
    const finalProgress = Math.floor((input.length / text.length) * 100);
    if (!isPractice && socket) {
      socket.emit("finished", { room, wpm, accuracy, progress: finalProgress });
      fetchTipsOnce(wpm, accuracy, errorCount);
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      setStartTime(Date.now());
      setTimerRunning(true);
      inputRef.current?.focus();
    }
  }, [countdown]);

  useEffect(() => {
    if (!socket || isPractice) return;

    const handleOpponentProgress = ({ progress }) => {
      setOpponentProgress(progress);
    };

    const handleGameResult = ({ results, winner, players, ratingChanges }) => {
      const opponentId = players.find((id) => id !== socket.id);
      if (!opponentId || !results[opponentId]) return;
      setOpponentStats(results[opponentId]);
      setWinner(winner);
      setRatingChanges(ratingChanges);
      setFinished(true);
    };

    socket.on("opponent-progress", handleOpponentProgress);
    socket.on("game-result", handleGameResult);

    return () => {
      socket.off("opponent-progress", handleOpponentProgress);
      socket.off("game-result", handleGameResult);
    };
  }, [socket, isPractice]);

  useEffect(() => {
    if (!timerRunning || finished) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, finished]);

  useEffect(() => {
    if (keystrokeLog.length < 10 || isPractice || !socket) return;
    const last10 = keystrokeLog.slice(-10);
    const timeDiff = last10[9].time - last10[0].time;
    if (timeDiff < 1000) {
      socket.emit("suspicious-behavior", {
        room,
        reason: "fast-typing-burst",
      });
    }
  }, [keystrokeLog, isPractice, socket]);

  const handleChange = (e) => {
    const val = e.target.value;
    const now = Date.now();

    const prevLen = input.length;
    const newLen = val.length;
    const newChar = val[newLen - 1];
    const expectedChar = text[newLen - 1];

    setKeystrokeLog((prev) => [...prev, { char: newChar, time: now }]);
    setTotalKeystrokes((prev) => prev + 1);
    if (newLen < prevLen) {
      setInput(val);
      return;
    }

    if (newChar === expectedChar) {
      setCorrectKeystrokes((prev) => prev + 1);
    } else {
      setErrorCount((prev) => prev + 1);
    }

    setInput(val);
    const newProgress = Math.min(100, Math.floor((val.length / text.length) * 100));
    setProgress(newProgress);

    if (!isPractice && socket) {
      socket.emit("progress", { room, progress: newProgress });
    }

    if (val === text) {
      setFinished(true);
      if (!isPractice && socket) {
        const wpm = getWPM(val, startTime);
        const accuracy = getStrictAccuracy();
        socket.emit("finished", { room, wpm, accuracy, progress: newProgress });
        fetchTipsOnce(wpm, accuracy, errorCount);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 text-center">
      {countdown !== null ? (
        <div className="text-4xl font-bold mb-4 animate-pulse text-zinc-700 dark:text-zinc-100">
          {countdown === 0 ? "Go!" : countdown}
        </div>
      ) : (
        <>
          {!isPractice && opponentInfo && (
            <div className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
              Opponent: <strong>{opponentInfo.name}</strong> (Rating: {opponentInfo.rating})
            </div>
          )}
          <p className="mb-4 text-lg font-medium text-left text-zinc-700 dark:text-zinc-100">
            {text.split("").map((char, i) => {
              let color = "";
              if (i < input.length) {
                color = char === input[i] ? "text-green-500" : "text-red-500";
              }
              return <span key={i} className={color}>{char}</span>;
            })}
          </p>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleChange}
            onPaste={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full p-3 text-lg border rounded-md focus:outline-none bg-white dark:bg-zinc-900 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
            disabled={finished}
            rows={3}
            autoCorrect="off"
            spellCheck="false"
            placeholder="Start typing..."
          />
          {finished && (
            <div className="mt-4 text-lg font-semibold">
              <p className="text-green-600 dark:text-green-300">✅ Finished!</p>
              <p>WPM: {getWPM(input, startTime)}</p>
              <p>Accuracy: {getStrictAccuracy()}%</p>
            </div>
          )}
          {!isPractice && opponentStats && (
            <div className="mt-6 p-4 border rounded-md dark:bg-zinc-800">
              <h3 className="text-lg font-semibold mb-2">🏁 Game Result</h3>
              <p>Opponent WPM: {opponentStats.progress < 100 ? "DNF" : opponentStats.wpm}</p>
              <p>Opponent Accuracy: {opponentStats.progress < 100 ? "DNF" : `${opponentStats.accuracy}%`}</p>
              <p className="mt-2 font-bold text-xl">
                {winner === null ? "🤝 It’s a Draw!" : winner === socket.id ? "🎉 You Won!" : "😔 You Lost!"}
              </p>
            </div>
          )}
          {!isPractice && ratingChanges && opponentInfo && (
            <div className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
              <p>
                Your Rating: <span className="font-medium">{ratingChanges[socket.id]?.before} → {ratingChanges[socket.id]?.after}</span>
              </p>
              <p>
                Opponent Rating: <span className="font-medium">{ratingChanges[opponentInfo?.id]?.before} → {ratingChanges[opponentInfo?.id]?.after}</span>
              </p>
            </div>
          )}
          <div className="mt-6 text-left">
            <div className="mb-1 text-sm">Your Progress</div>
            <div className="w-full h-2 bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mt-2">⏱️ Time Left: {timeLeft}s</div>
            {!isPractice && (
              <>
                <div className="mt-4 mb-1 text-sm">Opponent Progress</div>
                <div className="w-full h-2 bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 transition-all duration-200" style={{ width: `${opponentProgress}%` }} />
                </div>
              </>
            )}
          </div>
          {!isPractice && finished && (
            <div className="mt-6 text-left">
              <h3 className="text-lg font-semibold mb-2 text-zinc-800 dark:text-white">🧠 AI Suggestions</h3>
              {loadingTips ? (
                <p className="text-zinc-500">Generating tips...</p>
              ) : aiTips ? (
                <ul className="list-disc ml-5 space-y-1 text-zinc-700 dark:text-zinc-300">
                  {aiTips.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
              ) : (
                <p className="text-zinc-500">No tips available.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
