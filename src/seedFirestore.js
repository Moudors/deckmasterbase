// seedFirestore.js
const admin = require("firebase-admin");

// Inicializa o Firebase Admin com o serviceAccount.json
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seed() {
  try {
    // USERS
    const usersRef = db.collection("users");
    await usersRef.doc("user1").set({
      display_name: "Lucas",
      username: "lucas123",
      bio: "Jogador de Magic",
      friends: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // MESSAGES
    const messagesRef = db.collection("messages");
    await messagesRef.doc("message1").set({
      sender_id: "user1",
      recipient_id: "user2",
      type: "friend_request",
      message: "Vamos jogar juntos?",
      status: "pending",
      read: false,
      created_date: admin.firestore.FieldValue.serverTimestamp()
    });

    // DECKS
    const decksRef = db.collection("decks");
    await decksRef.doc("deck1").set({
      user_id: "user1",
      name: "Meu Primeiro Deck",
      cards: ["Lightning Bolt", "Forest", "Island"],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log("Firestore seeded com sucesso!");
  } catch (err) {
    console.error("Erro ao criar coleções:", err);
  }
}

seed();
