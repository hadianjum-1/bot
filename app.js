const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const websiteKnowledge = require("./knowledge");


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   MongoDB Connection
========================= */
mongoose
  .connect(process.env.MONGO_URI, {
   
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Mongo Error:", err));

/* =========================
   Lead Schema
========================= */
const LeadSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  service: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});

const Lead = mongoose.model("Lead", LeadSchema);

/* =========================
   Email (Hostinger SMTP)
========================= */
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "hadi@nexgenbyte.com",
    pass: process.env.EMAIL_PASSWORD,
  },
});

/* =========================
   OpenAI (Groq)
========================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

/* =========================
   Chat Endpoint
========================= */
// app.post("/chat", async (req, res) => {
//   try {
//     const { message } = req.body;
//     if (!message) {
//       return res.status(400).json({ error: "Message required" });
//     }

//     const systemPrompt = `
// You are NexGenByte Assistant.

// Company: NexGenByte – Web & AI Agency
// Services:
// - Web Development
// - AI Chatbots
// - Graphic Design
// - Digital Marketing

// Rules:
// - Answer business-related queries only
// - If user wants service, ask for:
//   Name, Email, Phone, Service, Brief
// - Be professional, short, friendly
// - After collecting details say:
//   "Thank you, our team will contact you shortly."

// Founder: Hadi Anjum
// Email: contact@nexgenbyte.com
// `;

//     const completion = await openai.chat.completions.create({
//       model: "openai/gpt-oss-120b",
//       messages: [
//         { role: "system", content: systemPrompt },
//         { role: "user", content: message },
//       ],
//     });

//     res.json({
//       reply: completion.choices[0].message.content,
//     });
//   } catch (err) {
//     console.error("❌ AI ERROR:", err);
//     res.status(500).json({ error: "AI failed" });
//   }
// });

const sessions = {};

app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: "Message & sessionId required" });
    }

    const systemPrompt = `
You are NexGenByte AI Assistant.

Use the company knowledge below to answer questions:

${websiteKnowledge}

IMPORTANT RULES:
- Only answer using provided knowledge.
- If user wants a service, collect:
  Name, Email, Phone, Service, Brief.
- Once all details are collected, say EXACTLY:
  "Thank you, our team will contact you shortly."
- Do NOT ask again if already provided.
- Be short and professional.
`;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const aiReply = completion.choices[0].message.content;

    // Detect completion sentence
    const done =
      aiReply.includes("Thank you, our team will contact you shortly.");

    res.json({
      reply: aiReply,
      done: done,
    });

  } catch (err) {
    console.error("❌ CHAT ERROR:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});



/* =========================
   Lead Submission Endpoint
========================= */
app.post("/lead", async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({ error: "Email & message required" });
    }

    // 1️⃣ Save to MongoDB
    const lead = new Lead({
      name,
      email,
      phone,
      service,
      message,
    });
    await lead.save();

    // 2️⃣ Send Email
    await transporter.sendMail({
      from: '"NexGenByte Bot" <hadi@nexgenbyte.com>',
      to: "hadi@nexgenbyte.com",
      subject: "🚀 New Website Lead",
      html: `
        <h2>New Lead Received</h2>
        <hr/>
        <p><strong>Name:</strong> ${name || "N/A"}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Service:</strong> ${service || "N/A"}</p>
        <p><strong>Message:</strong><br/>${message}</p>
        <br/>
        <small>Sent from NexGenByte Chatbot</small>
      `,
    });

    res.json({
      success: true,
      message: "Lead saved & emailed successfully",
    });
  } catch (err) {
    console.error("❌ LEAD ERROR:", err);
    res.status(500).json({ error: "Lead submission failed" });
  }
});

/* =========================
   Server
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
