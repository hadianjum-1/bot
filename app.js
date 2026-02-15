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
  baseURL: "https://api.groq.com/openai/v1", // Important: use Groq baseURL
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "Message is required" });
    }
     const systemPrompt = `
You are NexGenByte AI Assistant.

Company:
NexGenByte – Web & AI Agency

Services:
- Web Development
- AI Chatbots
- Graphic Design
- Digital Marketing

Rules:
- Answer only business-related questions
- If user asks for service, ask for:
  Name, Email, Service Type, Brief
- Be professional and friendly

Founder: Hadi Anjum (CEO)
Contact: Contact@nexgenbyte.com
Personal Ceo Email : hadi@nexgenbyte.com
`;


    // Send message to Groq API
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    res.json({ reply: completion.choices[0].message.content });

  } catch (error) {
    console.error("API ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
