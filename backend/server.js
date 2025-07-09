require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; font-src 'self' data:;");
    next();
});

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.post("/generate", async (req, res) => {
    const { message, file } = req.body;

    const contents = [{ parts: [{ text: message }] }];
    if (file?.data) {
        contents[0].parts.push({ inline_data: file });
    }

    try {
        console.log("Request contents:", contents);

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents },
            { headers: { "Content-Type": "application/json" } }
        );

        console.log("Gemini API response:", response.data);

        const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!result) throw new Error("No valid response from Gemini API");

        res.json({ text: result });

    } catch (err) {
        console.error("Gemini API error:", err.response?.data || err.message);
        res.status(500).json({ error: "API Error", details: err.response?.data || err.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});

