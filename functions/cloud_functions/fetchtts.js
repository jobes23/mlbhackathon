const functions = require("firebase-functions");
const admin = require("firebase-admin");
const textToSpeech = require("@google-cloud/text-to-speech");
const crypto = require("crypto");
const cors = require("cors");

if (!admin.apps.length) {
  admin.initializeApp();
}

// **1. Environment Variables**
const allowedOriginsString = process.env.VITE_APP_ALLOWED_ORIGINS || functions.config()?.app?.allowed_origins || "";
const allowedOrigins = allowedOriginsString ? allowedOriginsString.split(',') : [];

// **2. CORS Configuration**
const corsOptions = cors({
  origin: function (origin, callback) {
    if (process.env.FUNCTIONS_EMULATOR === "true") {
      callback(null, true);
    } else if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS Not Allowed"));
    }
  },
});

const db = admin.firestore();
const client = new textToSpeech.TextToSpeechClient();

const fetchtts = functions.https.onRequest(async (req, res) => {
  corsOptions(req, res, async () => {
    // The middleware handles OPTIONS preflight requests

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed. Use POST instead." });
    }

    try {
      const { ssml, language } = req.body;
      if (!ssml) {
        return res.status(400).json({ error: "SSML input is required." });
      }

      // Generate Hash for Caching
      const ssmlHash = crypto.createHash("sha256").update(ssml).digest("hex");

      // Check Firestore Cache
      const cacheDoc = await db.collection("ttsCache").doc(ssmlHash).get();
      if (cacheDoc.exists) {
        console.log("Cache hit. Returning cached audio.");
        return res.json({ audioContent: cacheDoc.data().audioContent });
      }

      // Fetch from Google Cloud TTS API
      console.log("Cache miss. Fetching from Google TTS...");
      let ssmlLanguage;
      if (language == 'ja') {
        ssmlLanguage = 'ja-JP';
      } else if (language == 'es') {
        ssmlLanguage = 'es-ES';
      } else {
        ssmlLanguage = 'en-US';
      }
      const request = {
        input: { ssml },
        voice: { languageCode: ssmlLanguage, ssmlGender: "MASCULINE" },
        audioConfig: { audioEncoding: "MP3" },
      };

      const [response] = await client.synthesizeSpeech(request);
      const audioBase64 = Buffer.from(response.audioContent).toString("base64");

      // Store in Firestore Cache
      await db.collection("ttsCache").doc(ssmlHash).set({
        audioContent: audioBase64,
      });

      return res.json({ audioContent: audioBase64 });
    } catch (error) {
      console.error("Error synthesizing speech:", error);
      return res.status(500).json({ error: "Text-to-Speech API failed." });
    }
  });
});

// Export Cloud Function
exports.fetchtts = functions.https.onRequest(fetchtts);