import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  FaTrophy,
  FaGamepad,
  FaCheck,
  FaTimes,
  FaChartLine,
  FaKeyboard,
} from "react-icons/fa";

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) return;

    axios
      .get(`http://localhost:3000/api/user/${user.uid}`)
      .then((res) => setProfile(res.data))
      .catch((err) => console.error("❌ Error loading profile:", err));
  }, [user]);

  if (!profile) return <p className="text-center mt-8">Loading...</p>;

  const winRate =
    profile.gamesPlayed > 0
      ? Math.round((profile.wins / profile.gamesPlayed) * 100)
      : 0;

  const { rankName, rankColor } = getRank(profile.rating);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-6 mb-8">
        <img
          src={profile.picture || profile.avatar}
          alt="avatar"
          className="w-24 h-24 rounded-full border-4 border-blue-500"
        />
        <div>
          <h1 className="text-3xl font-bold" style={{ color: rankColor }}>
            {profile.name}
          </h1>
          <p className="text-zinc-500">{profile.email}</p>
          <p className="mt-1 text-md font-medium" style={{ color: rankColor }}>
            {rankName}
          </p>
          <p className="mt-1 text-xl font-semibold text-blue-600">
            Rating: {profile.rating}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Games Played" value={profile.gamesPlayed} icon={<FaGamepad />} />
        <StatCard label="Wins" value={profile.wins} icon={<FaCheck />} />
        <StatCard label="Losses" value={profile.losses} icon={<FaTimes />} />
        <StatCard label="Draws" value={profile.draws} icon={<FaTrophy />} />
        <StatCard label="Win Rate" value={`${winRate}%`} icon={<FaChartLine />} />
        <StatCard label="Avg WPM" value={profile.averageWPM} icon={<FaKeyboard />} />
        <StatCard label="Avg Accuracy" value={`${profile.averageAccuracy}%`} icon={<FaKeyboard />} />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg shadow-md text-center">
      <div className="flex justify-center text-blue-600 text-xl mb-2">{icon}</div>
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
