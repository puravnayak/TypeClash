import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.get("/:googleId", async (req, res) => {
  const { googleId } = req.params;

  try {
    const user = await User.findOne({ googleId });

    if (!user) {
      console.warn("❌ No user found for:", googleId);
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      rating: user.rating,
      gamesPlayed: user.stats?.gamesPlayed || 0,
      wins: user.stats?.wins || 0,
      losses: user.stats?.losses || 0,
      draws: user.stats?.draws || 0,
      averageWPM: user.stats?.averageWPM || 0,
      averageAccuracy: user.stats?.averageAccuracy || 0,
    });
  } catch (err) {
    console.error("🔥 Error fetching profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
