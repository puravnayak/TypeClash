// routes/history.js
import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.get("/:googleId", async (req, res) => {
  try {
    const user = await User.findOne({ googleId: req.params.googleId });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ matchHistory: user.matchHistory || [] });
  } catch (err) {
    console.error("Error fetching match history:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
