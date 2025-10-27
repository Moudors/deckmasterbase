// src/auth.ts
import { auth, db, googleProvider } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// Cria documento do usuário no Firestore
async function createUserDocument(user: any) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    await setDoc(userRef, {
      display_name: user.displayName || "",
      email: user.email,
      username: "",
      bio: "",
      friends: [],
      createdAt: serverTimestamp()
    });
  }
}

// Criar usuário com email/senha
export async function signUp(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await createUserDocument(user);
  return user;
}

// Login com email/senha
export async function signIn(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await createUserDocument(user);
  return user;
}

// Login com Google
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  await createUserDocument(user);
  return user;
}
