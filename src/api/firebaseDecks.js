// api/firebaseDecks.js
import { db } from "./firebaseClient";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from "@/firebase";

const decksCollection = collection(db, "decks");

export const createDeck = async (deckData) => {
  const docRef = await addDoc(decksCollection, {
    ...deckData,
    created_at: new Date()
  });
  return { id: docRef.id, ...deckData };
};

export const getDecksByUser = async (userId) => {
  const q = query(decksCollection, where("created_by", "==", userId), orderBy("created_at", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateDeck = async (deckId, data) => {
  const docRef = doc(db, "decks", deckId);
  await updateDoc(docRef, data);
};

export const deleteDeck = async (deckId) => {
  const docRef = doc(db, "decks", deckId);
  await deleteDoc(docRef);
};
