import { useEffect, useState } from "react";
import io from "socket.io-client";
import TypingBox from "../components/game/TypingBox";
import { useAuth } from "../context/AuthContext";

export default function Battle() {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [opponentInfo, setOpponentInfo] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState("Click 'Ready' to find a match...");
  const [battleText, setBattleText] = useState("");

  useEffect(() => {
    if (!user) return;

    const newSocket = io(import.meta.env.VITE_BACKEND_URL);

    newSocket.on("connect", () => {
      newSocket.emit("auth", { googleId: user.uid });
    });

    newSocket.on("match-found", ({ room, players, text }) => {
      setRoom(room);
      setBattleText(text);
      const opponent = players.find((p) => p.id !== newSocket.id);
      if (opponent) setOpponentInfo(opponent);
    });

    newSocket.on("waiting", (msg) => setStatus(msg));
    newSocket.on("cancelled", (msg) => setStatus(msg));

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [user]);

  const handleReadyToggle = () => {
    if (!socket || !user) return;

    if (!isReady) {
      socket.emit("ready", { googleId: user.uid });
      setStatus("🔍 Searching for a match...");
    } else {
      socket.emit("cancel-ready", { googleId: user.uid });
      setStatus("❌ Matchmaking canceled.");
    }

    setIsReady((prev) => !prev);
  };

  return (
    <div className="text-center mt-10">
      {room && socket ? (
        <TypingBox
          socket={socket}
          room={room}
          user={user}
          opponentInfo={opponentInfo}
          text={battleText}
          timeLimit={60}
        />
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-4 text-zinc-800 dark:text-white">
            TypeClash Matchmaking
          </h2>
          <p className="mb-6 text-zinc-500">{status}</p>
          <button
            onClick={handleReadyToggle}
            className={`px-6 py-2 rounded text-white font-semibold ${
              isReady
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isReady ? "Cancel" : "Ready"}
          </button>
        </>
      )}
    </div>
  );
}
