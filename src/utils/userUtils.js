// src/utils/userUtils.js
import { supabase } from '../supabase';
import { userOperations } from '../lib/supabaseOperations';
import { v4 as uuidv4 } from "uuid";

/**
 * Garante que o usuário tenha um documento no Supabase
 * com UUID único e campos básicos.
 */
export async function ensureUserProfile(user) {
  if (!user?.id) return;

  const existingUser = await userOperations.getUser(user.id);

  if (!existingUser) {
    const userData = {
      id: user.id,
      uuid: uuidv4(), // UUID único e imutável
      email: user.email,
      display_name: user.user_metadata?.full_name || "",
      username: null,
      bio: "",
      friends: [],
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  return existingUser;
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
  
  // Verificar se username já existe
  const existingUsername = await userOperations.getUserByUsername(normalized);
  if (existingUsername) {
    throw new Error("Este username já está em uso");
  }

  // Buscar usuário atual
  const currentUser = await userOperations.getUser(uid);
  if (!currentUser) throw new Error("Usuário não encontrado");

  const oldUsername = currentUser.username;

  // Atualizar username do usuário
  await userOperations.updateUser(uid, { username: normalized });

  // Criar entrada na tabela usernames
  const { error: usernameError } = await supabase
    .from('usernames')
    .insert({
      id: normalized,
      uid: uid,
      created_at: new Date().toISOString()
    });

  if (usernameError) {
    console.error('Erro ao criar entrada de username:', usernameError);
    // Reverter mudança no usuário se falhar
    await userOperations.updateUser(uid, { username: oldUsername });
    throw usernameError;
  }

  // Remover username antigo se existir
  if (oldUsername) {
    await supabase
      .from('usernames')
      .delete()
      .eq('id', oldUsername);
  }
}
