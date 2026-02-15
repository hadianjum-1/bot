const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "Message is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: "You are a helpful website assistant." },
        { role: "user", content: userMessage },
      ],
    });

    res.json({ reply: completion.choices[0].message.content });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI service error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
