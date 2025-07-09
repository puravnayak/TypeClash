import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { FaArrowUp, FaArrowDown, FaEquals } from "react-icons/fa";

export default function History() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    if (!user) return;

    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/history/${user.uid}`)
      .then((res) => setMatches(res.data.matchHistory || []))
      .catch(() => {});
  }, [user]);

  if (!user) return <p className="text-center mt-8">Please login to view history.</p>;
  if (!matches || matches.length === 0) return <p className="text-center mt-8">No match history yet.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-zinc-800 dark:text-white">🕘 Match History</h1>
      <div className="space-y-4">
        {matches.map((match, i) => {
          const diff = match.ratingChange;
          const resultColor =
            diff > 0 ? "text-green-500" : diff < 0 ? "text-red-500" : "text-yellow-500";
          const icon =
            diff > 0 ? <FaArrowUp className="inline" /> :
            diff < 0 ? <FaArrowDown className="inline" /> :
            <FaEquals className="inline" />;
          const date = new Date(match.timestamp).toLocaleString();

          return (
            <div key={i} className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-zinc-500">🗓️ {date}</p>
                <p className="text-sm text-zinc-500 capitalize">Result: {match.result}</p>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Opponent</p>
                  <p className="text-lg font-semibold text-zinc-800 dark:text-white">
                    {match.opponent}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-zinc-500 mb-1">WPM</p>
                  <p className="text-lg font-semibold text-blue-500">
                    {match.userWPM} <span className="text-zinc-500">vs</span> {match.opponentWPM}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-zinc-500 mb-1">Rating Change</p>
                  <p className={`text-lg font-semibold ${resultColor}`}>
                    {diff > 0 ? "+" : ""}
                    {diff} {icon}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
