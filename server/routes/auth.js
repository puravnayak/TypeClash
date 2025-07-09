import express from "express";
import admin from "../firebaseAdmin.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/sync", async (req, res) => {
  const { token, userData } = req.body;

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const googleId = decoded.uid;

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.create({
        googleId,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
      });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Unauthorized" });
  }
});

export default router;
