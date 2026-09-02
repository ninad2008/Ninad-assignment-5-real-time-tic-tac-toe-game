const admin = require('firebase-admin');

// ============================================================================
// Firebase Service Account Configuration
// Configured directly in config/db.js (without .env) as requested
// ============================================================================
const serviceAccount = {
  type: "service_account",
  project_id: "tic-tac-toe-26926",
  private_key_id: "c1815e80d330398a60a5bb9ff8dcc6c1a9d9f2c9",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDKiaoCfWX6LQ7e\nJQNFWkk2A/vTmDT9hzLXJU+XAI0wohxh1zUdbhSQoejChZ5lCd8RLbNqfDCd0VFr\n5JwD+mY9cbLcUxk2+5OI3Zcl2ikocnGxdohnMOYVU9peKThYICV/110hckT9vVUE\nENW29gXJllmkO7d4krvDjMKsu3wwtnFGkhT+Ve4jQ2HeCPm/czZvIilUq2OtUHsO\n5memuOjao9EIJPWDpUpfQ8Px/Iwvgq0vY/pTxj0mTrxQE8iFEoZwtyErNDXXtaOi\nnIEJ0Ult6gotUmVntbGw0Dvbz+FzOtZucfFN9CX+GupDcjvNNmXmGBK6xEb3xM6Q\n9ZJYspA1AgMBAAECggEAKjTyfBbYPcCOiN4TNqxoNcyyOafOISg/wMR6d8gKZEBg\nJEaF/9ZNDE/lUsYoGjuqo+iPa0kqk3THoDGRjqWrkTHkuVPK3SGjnuG4qg9yxMZG\nqZn/NmvjAr5I8xbpcjnuvpupgXsP5AXE1fZRJxHRZm9Byn8UTpjbbpaiif7/FCJN\n2fFwMmu5Dng+1+CqPmY8k4e0vYghC9imz0T2I+Pp9ajOtlM/CMchACykcVo2dUXa\nYHUowdmLCjKtX94HCWdNrN0eoxC7GXXRA4u+T1N2gk4An5yPgMYDJWnsfP2CqKpY\nvHJMnChRc2ehe8EfmzpuJ1qM5GGweqpjDXIhLVTyAQKBgQDxoiqRyeJaIVkyoYL+\nwr7UsW1XlIJ2z8tTjBx7mkrQ8zN50gWILfUAUpZ2U7tA2RpDaOs+ru/zAQyEuwpU\nKrJ37KWVplkTdx7dKE7QIYdQRLPckWHebc1G6t9/zT5ks31iGxFIb/feOyY7GuXa\nq3rzEP3FzIOewz0+VDO8p422NQKBgQDWlG7lMLtvo6lBs8bIcht0Sd0r45lZb0Pm\nwR+klmOzyaOlqOzLuj24ueSyMBg83L10aWYx+U3YS6mOC6xppX4bh+kMFu0Kq9AN\n/umEjmmqBonem5gRuOpRBPyRqH6XBV3qNunHue1F8Z53OgHIxzuEyzhyVjtuDrIv\nQq6GhSSyAQKBgQCR5bvUaVSt3SLxikoBL29wF22RCw+3U4JOgPQVwbTY82+qZ6CF\neFJNjpBhA++1mSDdgPVB1Pj2/jQj1JfI+DroZFAayuVP9oYBPTxROV1tnv4G+RVh\n62SeJGUs0q2QujvDx9oopcrBOW+9EmGlJhNHvoOsMe9rJjHNd6QBjh3n3QKBgBZJ\njochm6ZJ0m+vk4sIRw+6CE3hsvDWHLBgCMBYmnx3ChdPx2CVtIl2TWmwkyPnLYpk\n1CeGpG491ZuaXMsQVFvZrvwBeZdtJwv9GRYakKEHUtSbRp04nqXRpcYfQR7AgPOt\nxnRnPFzSbsolbUAEaYsubGt7x2pz/k/oViZEt/4BAoGAAkPnMlvBaB3igZ/jZ2u2\n4Q6FUcjE3Ut1CuGM8RLe95BRZOoJHm4Zmn5TC2+vTe+Sthgv1UtfBigPR8ZQ8SQT\nQoNuezAWcwBEjAYeW7t+vm996C4LMp+aqdQkOoHFQ80PzCErCfTkKkPaEo/rd+bW\nVhtus51XVKcqWR6Y41lwZJk=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@tic-tac-toe-26926.iam.gserviceaccount.com",
  client_id: "111636780416107950436",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40tic-tac-toe-26926.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

let db = null;

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  db = admin.firestore();
  console.log(`🔥 Firebase Firestore connected successfully for project: ${serviceAccount.project_id}`);
} catch (err) {
  console.error('⚠️ Firebase initialization error:', err.message);
}

// In-memory fallback in case of offline/network issues
const localGameHistory = [];

/**
 * Save game record into Firebase Firestore collection ('game_history')
 * @param {Object} gameData { playerX, playerO, winner, totalMoves }
 */
async function saveGameRecord({ playerX, playerO, winner, totalMoves }) {
  const record = {
    player_x: playerX,
    player_o: playerO,
    winner: winner,
    total_moves: totalMoves,
    created_at: new Date().toISOString()
  };

  if (db) {
    try {
      const docRef = await db.collection('game_history').add(record);
      console.log(`💾 Game record saved to Firebase Firestore with Doc ID: ${docRef.id}`);
      return { id: docRef.id, ...record };
    } catch (err) {
      console.error('❌ Firestore Save Error:', err.message);
      localGameHistory.unshift(record);
      return record;
    }
  } else {
    localGameHistory.unshift(record);
    return record;
  }
}

/**
 * Fetch recent game history records from Firebase Firestore
 * @returns {Array} List of game records
 */
async function fetchGameHistory() {
  if (db) {
    try {
      const snapshot = await db
        .collection('game_history')
        .orderBy('created_at', 'desc')
        .limit(20)
        .get();

      if (snapshot.empty) {
        return localGameHistory.slice(0, 20);
      }

      const records = [];
      snapshot.forEach(doc => {
        records.push({ id: doc.id, ...doc.data() });
      });
      return records;
    } catch (err) {
      console.error('❌ Firestore Fetch Error:', err.message);
      return localGameHistory.slice(0, 20);
    }
  }
  return localGameHistory.slice(0, 20);
}

module.exports = {
  admin,
  db,
  saveGameRecord,
  fetchGameHistory
};
