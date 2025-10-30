// src/pages/FriendDecks.jsx
import React from "react";
import { supabase } from "@/supabase";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils/createPageUrl";
import DeckCard from "../components/deck/DeckCard";

export default function FriendDecks() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const friendId = urlParams.get("friendId");
  const friendName = decodeURIComponent(urlParams.get("friendName") || "Amigo");

  const { data: decks = [], isLoading } = useQuery({
    queryKey: ["friend-decks", friendId],
    queryFn: async () => {
      if (!friendId) return [];
      const { data, error } = await supabase
        .from("decks")
        .select("*")
        .eq("owner_id", friendId)
        .order("created_at", { ascending: false });
      console.log('[DEBUG] FriendDecks - friendId:', friendId);
      console.log('[DEBUG] FriendDecks - decks data:', data);
      if (error) {
        console.error("Erro ao buscar decks do amigo:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!friendId,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
      {/* ... resto do JSX igual ao que você já tinha ... */}
    </div>
  );
}
