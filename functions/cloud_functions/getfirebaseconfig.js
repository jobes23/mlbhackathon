const functions = require("firebase-functions");

// Cloud Function to expose Firebase config securely
exports.getFirebaseConfig = functions.https.onRequest((req, res) => {
  res.json({
    apiKey: functions.config().custom.firebase_api_key,
    authDomain: functions.config().custom.firebase_auth_domain,
    projectId: functions.config().custom.firebase_project_id,
    storageBucket: functions.config().custom.firebase_storage_bucket,
    messagingSenderId: functions.config().custom.firebase_messaging_sender_id,
    appId: functions.config().custom.firebase_app_id,
  });
});
