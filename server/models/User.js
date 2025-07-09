import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  name: String,
  email: String,
  avatar: String,
  rating: { type: Number, default: 1200 },
  createdAt: { type: Date, default: Date.now },
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    averageWPM: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
  },
  matchHistory: [
    {
      opponent: String,
      userWPM: Number,
      opponentWPM: Number,
      ratingChange: Number,
      result: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
});


export default mongoose.model("User", userSchema);
