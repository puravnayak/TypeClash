import express from "express";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const router = express.Router();

const TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions";
const TOGETHER_HEADERS = {
  Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
  "Content-Type": "application/json",
};

router.post("/", async (req, res) => {
  const { wpm, accuracy, errors } = req.body;

  if (wpm == null || accuracy == null || errors == null) {
    return res.status(400).json({ error: "Missing performance stats" });
  }

  const prompt = `My typing speed was ${wpm} WPM with ${accuracy}% accuracy and ${errors} mistakes.
Give me 3 short personalized tips to improve my typing performance. Be concise and practical.`;

  try {
    const response = await axios.post(
      TOGETHER_API_URL,
      {
        model: "mistralai/Mistral-7B-Instruct-v0.1",
        messages: [{ role: "user", content: prompt }],
      },
      { headers: TOGETHER_HEADERS, timeout: 30000 }
    );

    const tips = response.data?.choices?.[0]?.message?.content || "No tips returned.";
    res.json({ tips });
  } catch (error) {
    console.error("❌ Together AI Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    res.status(500).json({ error: "Failed to generate tips" });
  }
});

export default router;