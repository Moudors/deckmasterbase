import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { deckOperations } from "../lib/supabaseOperations";
import { supabase } from "../supabase";

function FriendDecksPage() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [friendName, setFriendName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFriendProfile() {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("display_name")
          .eq("id", friendId)
          .single();
        
        if (error) throw error;
        if (data) {
          setFriendName(data.display_name || "Amigo");
        }
      } catch (err) {
        console.error("[FriendDecksPage] erro ao buscar perfil:", err);
        setFriendName("Amigo");
      }
    }

    if (friendId) fetchFriendProfile();
  }, [friendId]);

  useEffect(() => {
    async function fetchDecks() {
      setIsLoading(true);
      setError(null);
      try {
        console.log("[FriendDecksPage] friendId recebido:", friendId);
        const result = await deckOperations.getUserDecks(friendId);
        console.log("[FriendDecksPage] decks retornados:", result);
        setDecks(result);
      } catch (err) {
        setError("Erro ao carregar decks do amigo.");
        console.error("[FriendDecksPage] erro:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (friendId) fetchDecks();
  }, [friendId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 flex flex-col items-center pt-20 px-4 text-white">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
      >
        ← Voltar
      </button>
      <h1 className="mb-6 text-3xl font-bold">
        Decks de {friendName || "Amigo"}
      </h1>
      {isLoading && <p>Carregando decks...</p>}
      {error && <div className="mb-4 w-full max-w-md text-red-400">{error}</div>}
      {!isLoading && decks.length === 0 && !error && (
        <p>Nenhum deck encontrado para este usuário.</p>
      )}
      {decks.length > 0 && (
        <div className="w-full max-w-lg overflow-y-auto max-h-[calc(100vh-200px)] pb-24 scrollbar-hide space-y-6">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="relative overflow-hidden rounded-xl shadow-lg min-h-[240px] flex-shrink-0 cursor-pointer"
              onClick={() => navigate(`/deckbuilder/${deck.id}`)}
            >
              <div
                className="h-56 w-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${deck.cover_image_url || "https://placehold.co/400x200"})`,
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-5">
                <h2 className="text-2xl font-bold">{deck.name}</h2>
                <p className="text-base text-gray-300">{deck.format}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FriendDecksPage;
