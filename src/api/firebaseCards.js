// api/firebaseCards.js
import { db } from "./firebaseClient";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from "@/firebase";

export const createCard = async (cardData) => {
  const docRef = await addDoc(collection(db, "cards"), {
    ...cardData,
    created_at: new Date()
  });
  return { id: docRef.id, ...cardData };
};

export const getCardsByDeck = async (deckId) => {
  const q = query(collection(db, "cards"), where("deck_id", "==", deckId), orderBy("created_at", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateCard = async (cardId, data) => {
  const docRef = doc(db, "cards", cardId);
  await updateDoc(docRef, data);
};

export const deleteCard = async (cardId) => {
  const docRef = doc(db, "cards", cardId);
  await deleteDoc(docRef);
};
