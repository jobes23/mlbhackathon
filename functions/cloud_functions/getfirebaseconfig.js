const functions = require("firebase-functions");

// Cloud Function to expose Firebase config securely
exports.getfirebaseconfig = functions.https.onRequest((req, res) => {
  res.json({
    apiKey: functions.config().custom.api_key,
    authDomain: functions.config().custom.auth_domain,
    projectId: functions.config().custom.project_id,
    storageBucket: functions.config().custom.storage_bucket,
    messagingSenderId: functions.config().custom.messaging_sender_id,
    appId: functions.config().custom.firebase_app_id,
  });
});
