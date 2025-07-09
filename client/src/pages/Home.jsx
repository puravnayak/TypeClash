import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaGamepad,
  FaTrophy,
  FaChartLine,
  FaKeyboard,
  FaBolt,
  FaPlay,
} from "react-icons/fa";

export default function Home() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/user/${user.uid}`)
      .then((res) => setProfile(res.data))
      .catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div className="text-center mt-16">
        <h2 className="text-2xl font-semibold text-zinc-700 dark:text-white">
          🔐 Please log in to access your dashboard.
        </h2>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center mt-10">
        <p className="text-zinc-500">Loading dashboard...</p>
      </div>
    );
  }

  const winRate =
    profile.gamesPlayed > 0
      ? Math.round((profile.wins / profile.gamesPlayed) * 100)
      : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between bg-blue-100 dark:bg-zinc-800 p-6 rounded-lg shadow">
        <div className="flex items-center gap-6">
          <img src={profile.picture || profile.avatar} className="w-20 h-20 rounded-full" />
          <div>
            <h2 className="text-3xl font-bold text-zinc-800 dark:text-white">
              Welcome back, {profile.name}!
            </h2>
            {(() => {
              const { rankName, rankColor } = getRank(profile.rating);
              return (
                <p className="font-semibold" style={{ color: rankColor }}>
                  {rankName} • Rating: {profile.rating}
                </p>
              );
            })()}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/battle")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
          >
            <FaPlay /> Start Match
          </button>
          <button
            onClick={() => navigate("/practice")}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-800 text-white rounded-lg font-semibold"
          >
            <FaBolt /> Practice Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Stat label="Games Played" value={profile.gamesPlayed} icon={<FaGamepad />} />
        <Stat label="Wins" value={profile.wins} icon={<FaTrophy />} />
        <Stat label="Win Rate" value={`${winRate}%`} icon={<FaChartLine />} />
        <Stat label="Avg WPM" value={profile.averageWPM} icon={<FaKeyboard />} />
        <Stat label="Avg Accuracy" value={`${profile.averageAccuracy}%`} icon={<FaKeyboard />} />
      </div>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg shadow-md text-center">
      <div className="flex justify-center text-blue-600 text-xl mb-1">{icon}</div>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-lg font-bold text-zinc-800 dark:text-white">{value}</p>
    </div>
  );
}

function getRank(rating) {
  if (rating < 1200) return { rankName: "Newbie", rankColor: "#808080" };
  if (rating < 1400) return { rankName: "Pupil", rankColor: "#008000" };
  if (rating < 1600) return { rankName: "Specialist", rankColor: "#03a89e" };
  if (rating < 1900) return { rankName: "Expert", rankColor: "#0000ff" };
  if (rating < 2100) return { rankName: "Candidate Master", rankColor: "#aa00aa" };
  if (rating < 2300) return { rankName: "Master", rankColor: "#ff8c00" };
  if (rating < 2400) return { rankName: "International Master", rankColor: "#ff8c00" };
  if (rating < 2600) return { rankName: "Grandmaster", rankColor: "#ff0000" };
  if (rating < 3000) return { rankName: "International Grandmaster", rankColor: "#ff0000" };
  return { rankName: "Legendary Grandmaster", rankColor: "#ff0000" };
}
