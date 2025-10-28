// src/utils/userUtils.js
import { db } from "@/firebase";
import { doc, setDoc, getDoc } from "@/firebase";
import { updateDocSilent, deleteDocSilent } from "@/lib/firestoreSilent";
import { v4 as uuidv4 } from "uuid";

/**
 * Garante que o usuário tenha um documento no Firestore
 * com UUID único e campos básicos.
 */
export async function ensureUserProfile(user) {
  if (!user?.uid) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uuid: uuidv4(), // UUID único e imutável
      email: user.email,
      display_name: user.displayName || "",
      username: null,
      bio: "",
      friends: [],
      created_at: new Date(),
    });
  }
}

/**
 * Atualiza o username garantindo unicidade global.
 * - Cria um doc em `usernames/{username}` apontando para o uid.
 * - Atualiza o campo `username` no doc do usuário.
 * - Remove o username antigo, se existir.
 */
export async function updateUsername(uid, newUsername) {
  if (!uid || !newUsername) throw new Error("Dados inválidos");

  const normalized = newUsername.toLowerCase();
  const usernameRef = doc(db, "usernames", normalized);
  const usernameSnap = await getDoc(usernameRef);

  if (usernameSnap.exists()) {
    throw new Error("Este username já está em uso");
  }

  // Buscar usuário atual
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error("Usuário não encontrado");

  const oldUsername = userSnap.data().username;

  // Criar novo username
  await setDoc(usernameRef, { uid });

  // Atualizar usuário
  await updateDocSilent("users", uid, { username: normalized });

  // Remover username antigo (se existir)
  if (oldUsername) {
    await deleteDocSilent("usernames", oldUsername.toLowerCase());
  }
}
