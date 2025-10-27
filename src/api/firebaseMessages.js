// api/firebaseMessages.js
import { db } from "./firebaseClient";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";

export const sendMessage = async (messageData) => {
  const docRef = await addDoc(collection(db, "messages"), {
    ...messageData,
    created_at: new Date()
  });
  return { id: docRef.id, ...messageData };
};

export const getMessagesByUser = async (userId) => {
  const q = query(
    collection(db, "messages"),
    where("recipient_id", "==", userId),
    orderBy("created_at", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
