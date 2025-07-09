import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { nanoid } from "nanoid";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import historyRoutes from "./routes/history.js";
import User from "./models/User.js";
import { calculateElo } from "./utils/elo.js";
import { generateBattleText } from "../client/src/utils/generateBattleText.js";
import tipsRoutes from "./routes/tips.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/user", profileRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/tips", tipsRoutes);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

const players = {};
const socketToGoogleId = {};
const queue = [];

const rankTiers = [
  { name: "Newbie", min: 0, max: 1199 },
  { name: "Pupil", min: 1200, max: 1399 },
  { name: "Specialist", min: 1400, max: 1599 },
  { name: "Expert", min: 1600, max: 1899 },
  { name: "Candidate Master", min: 1900, max: 2099 },
  { name: "Master", min: 2100, max: 2299 },
  { name: "Grandmaster", min: 2300, max: 3000 },
];

function getRank(rating) {
  return rankTiers.find((r) => rating >= r.min && rating <= r.max);
}

io.on("connection", (socket) => {
  socket.on("auth", async ({ googleId }) => {
    const user = await User.findOne({ googleId });
    if (!user) return;
    socket.user = {
      id: user.googleId,
      name: user.name,
      rating: user.rating,
    };
    socketToGoogleId[socket.id] = googleId;
  });

  socket.on("ready", () => {
    if (!socket.user) return;
    if (queue.some((p) => p.socket.id === socket.id)) return;

    const rank = getRank(socket.user.rating);
    if (!rank) return;

    const joinedAt = Date.now();
    queue.push({ socket, joinedAt, rank });
    socket.emit("waiting", "Searching for opponent...");
  });

  socket.on("cancel-ready", () => {
    const index = queue.findIndex((p) => p.socket.id === socket.id);
    if (index !== -1) {
      queue.splice(index, 1);
      socket.emit("cancelled", "Cancelled matchmaking.");
    }
  });

  socket.on("disconnect", () => {
    const index = queue.findIndex((p) => p.socket.id === socket.id);
    if (index !== -1) queue.splice(index, 1);
    delete socketToGoogleId[socket.id];
  });

  socket.on("progress", ({ room, progress }) => {
    socket.to(room).emit("opponent-progress", { progress });
  });

  socket.on("finished", async ({ room, wpm, accuracy, progress }) => {
    if (!players[room]) players[room] = {};
    players[room][socket.id] = { wpm, accuracy, progress };

    if (Object.keys(players[room]).length === 2) {
      const [id1, stats1] = Object.entries(players[room])[0];
      const [id2, stats2] = Object.entries(players[room])[1];

      const score = ({ progress, wpm, accuracy }) =>
        progress + wpm * 0.5 + accuracy * 0.1;

      const winner =
        score(stats1) === score(stats2)
          ? null
          : score(stats1) > score(stats2)
          ? id1
          : id2;

      const user1 = await User.findOne({ googleId: socketToGoogleId[id1] });
      const user2 = await User.findOne({ googleId: socketToGoogleId[id2] });
      if (!user1 || !user2) return;

      const oldRating1 = user1.rating;
      const oldRating2 = user2.rating;

      const newRating1 = calculateElo(
        oldRating1,
        oldRating2,
        winner === null ? 0.5 : winner === id1
      );
      const newRating2 = calculateElo(
        oldRating2,
        oldRating1,
        winner === null ? 0.5 : winner === id2
      );

      user1.rating = newRating1;
      user2.rating = newRating2;

      const match1 = {
        opponent: user2.name,
        userWPM: stats1.wpm,
        opponentWPM: stats2.wpm,
        ratingChange: newRating1 - oldRating1,
        result: winner === id1 ? "win" : winner === id2 ? "loss" : "draw",
      };

      const match2 = {
        opponent: user1.name,
        userWPM: stats2.wpm,
        opponentWPM: stats1.wpm,
        ratingChange: newRating2 - oldRating2,
        result: winner === id2 ? "win" : winner === id1 ? "loss" : "draw",
      };

      user1.matchHistory = [match1, ...(user1.matchHistory || [])].slice(0, 10);
      user2.matchHistory = [match2, ...(user2.matchHistory || [])].slice(0, 10);

      user1.stats = user1.stats || {};
      user2.stats = user2.stats || {};

      user1.stats.gamesPlayed = (user1.stats.gamesPlayed || 0) + 1;
      user2.stats.gamesPlayed = (user2.stats.gamesPlayed || 0) + 1;

      if (winner === id1) {
        user1.stats.wins = (user1.stats.wins || 0) + 1;
        user2.stats.losses = (user2.stats.losses || 0) + 1;
      } else if (winner === id2) {
        user2.stats.wins = (user2.stats.wins || 0) + 1;
        user1.stats.losses = (user1.stats.losses || 0) + 1;
      } else {
        user1.stats.draws = (user1.stats.draws || 0) + 1;
        user2.stats.draws = (user2.stats.draws || 0) + 1;
      }

      function updateAvg(prevAvg, totalGames, newVal) {
        return Math.round((prevAvg * (totalGames - 1) + newVal) / totalGames);
      }

      user1.stats.averageWPM = updateAvg(
        user1.stats.averageWPM || 0,
        user1.stats.gamesPlayed,
        stats1.wpm
      );
      user1.stats.averageAccuracy = updateAvg(
        user1.stats.averageAccuracy || 0,
        user1.stats.gamesPlayed,
        stats1.accuracy
      );
      user2.stats.averageWPM = updateAvg(
        user2.stats.averageWPM || 0,
        user2.stats.gamesPlayed,
        stats2.wpm
      );
      user2.stats.averageAccuracy = updateAvg(
        user2.stats.averageAccuracy || 0,
        user2.stats.gamesPlayed,
        stats2.accuracy
      );

      await user1.save({ overwrite: true });
      await user2.save({ overwrite: true });

      io.to(room).emit("game-result", {
        results: players[room],
        winner,
        players: [id1, id2],
        ratingChanges: {
          [id1]: { before: oldRating1, after: newRating1 },
          [id2]: { before: oldRating2, after: newRating2 },
        },
      });

      delete players[room];
    }
  });
});

function getWordCountFromRating(rating) {
  if (rating < 1200) return 10;
  if (rating < 1400) return 15;
  if (rating < 1600) return 20;
  if (rating < 1900) return 25;
  if (rating < 2100) return 30;
  if (rating < 2300) return 35;
  if (rating < 2400) return 40;
  if (rating < 2600) return 45;
  return 50;
}

function tryToMatchPlayers() {
  const now = Date.now();

  for (let i = 0; i < queue.length; i++) {
    for (let j = i + 1; j < queue.length; j++) {
      const p1 = queue[i];
      const p2 = queue[j];

      const tierDiff = Math.abs(
        rankTiers.findIndex((r) => r.name === p1.rank.name) -
        rankTiers.findIndex((r) => r.name === p2.rank.name)
      );

      const waitEnough = now - p1.joinedAt > 10000 || now - p2.joinedAt > 10000;

      if (tierDiff <= 1 || waitEnough) {
        const roomId = `room-${nanoid(6)}`;
        p1.socket.join(roomId);
        p2.socket.join(roomId);

        const maxRating = Math.max(
          p1.socket.user.rating,
          p2.socket.user.rating
        );
        const wordCount = getWordCountFromRating(maxRating);
        const generatedText = generateBattleText(wordCount);

        io.to(roomId).emit("match-found", {
          room: roomId,
          text: generatedText,
          players: [
            {
              id: p1.socket.id,
              name: p1.socket.user.name,
              rating: p1.socket.user.rating,
            },
            {
              id: p2.socket.id,
              name: p2.socket.user.name,
              rating: p2.socket.user.rating,
            },
          ],
        });

        queue.splice(j, 1);
        queue.splice(i, 1);
        return;
      }
    }
  }
}

setInterval(tryToMatchPlayers, 2000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
