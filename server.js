import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

/* =========================
   VARIABLES
========================= */

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GOOGLE_API_KEY;

/* =========================
   TEST ROUTE
========================= */

app.get("/", (req, res) => {
  res.send("Server is running!");
});

/* =========================
   AI CHAT ENDPOINT
========================= */

app.options("/api/chat", cors());

app.post("/api/chat", async (req, res) => {

  try {

    console.log("=== /api/chat called ===");
    console.log("BODY:", req.body);

    const question = req.body.question;

    /* ===== CHECK API KEY ===== */

    if (!API_KEY) {
      return res.status(500).json({
        answer: "GOOGLE_API_KEY غير موجود."
      });
    }

    /* ===== CHECK QUESTION ===== */

    if (!question || !question.trim()) {
      return res.status(400).json({
        answer: "الرجاء كتابة سؤال."
      });
    }

    /* ===== SEND TO GEMINI ===== */

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: question
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    console.log("GEMINI RESPONSE:", data);

    /* ===== GEMINI ERROR ===== */

    if (!response.ok) {

      return res.status(response.status).json({
        answer:
          data?.error?.message ||
          "حدث خطأ أثناء الاتصال بـ Gemini."
      });

    }

    /* ===== GET ANSWER ===== */

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "لم يتم الحصول على رد.";

    /* ===== RETURN ANSWER ===== */

    return res.json({
      answer
    });

  } catch (error) {

    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      answer: "حدث خطأ في السيرفر."
    });

  }

});

/* =========================
   START SERVER
========================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
