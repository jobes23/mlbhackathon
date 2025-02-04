const functions = require("firebase-functions");
const cors = require("cors");
const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Load allowed origins dynamically from Firebase Config
const allowedOriginsString = functions.config().app?.allowed_origins || "";
const allowedOrigins = allowedOriginsString ? allowedOriginsString.split(",") : [];

// CORS Configuration (Allows only specified origins in production)
const corsOptions = cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`Blocked request from origin: ${origin}`);
      callback(new Error("CORS Not Allowed"));
    }
  },
});

// Secure Firebase Config API
exports.getfirebaseconfig = functions.https.onRequest((req, res) => {
  corsOptions(req, res, async () => {
    try {
      res.status(200).json({
        apiKey: functions.config().custom.api_key,
        authDomain: functions.config().custom.auth_domain,
        projectId: functions.config().custom.project_id,
        storageBucket: functions.config().custom.storage_bucket,
        messagingSenderId: functions.config().custom.messaging_sender_id,
        appId: functions.config().custom.app_id,
      });

    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve Firebase config." });
    }
  });
});
