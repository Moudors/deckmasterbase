// src/pages/FriendDecks.jsx
import React from "react";
import { db } from "../firebase"; // ✅ corrigido
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where, orderBy } from "@/firebase";
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
      const q = query(
        collection(db, "decks"),
        where("created_by", "==", friendId),
        orderBy("created_at", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!friendId,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
      {/* ... resto do JSX igual ao que você já tinha ... */}
    </div>
  );
}
