// src/pages/CreateDeck.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUnifiedDecks } from "@/lib/useUnifiedDecks";
import { useAuthState } from "@/hooks/useAuthState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function CreateDeck() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState();
  const { createDeck, decks } = useUnifiedDecks();
  const [deckName, setDeckName] = useState("");
  const [format, setFormat] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // 🎴 Carta para adicionar automaticamente após criar o deck
  const cardToAdd = location.state?.cardToAdd;

  // 🎨 Helper para converter URL para art_crop (arte sem frame)
  const getArtCropUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.includes("/normal/")) {
      return imageUrl.replace("/normal/", "/art_crop/");
    }
    return imageUrl;
  };

  // 🔎 Loga no console sempre que o formato mudar
  useEffect(() => {
    console.log("Formato atual:", format);
  }, [format]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deckName || !format || !user || isCreating) return;

    setIsCreating(true);
    try {
      // 🔒 Verificação simples para formatos especiais
      if (format === "Coleção de cartas" || format === "Trades") {
        const existingDeck = decks?.find(deck => 
          deck.format === format && deck.user_id === user.id
        );
        
        if (existingDeck) {
          const message = format === "Coleção de cartas" 
            ? "Coleção já criada" 
            : "Trades já criado";
          
          navigate("/", { state: { message, type: "warning" } });
          return;
        }
      }

      console.log("🆕 Criando deck:", { name: deckName, format });
      const startTime = performance.now();
      
      // Cria o deck usando o hook unificado
      const newDeck = await createDeck({
        name: deckName,
        format,
        cards: [],
        // 🎨 Define a capa como art_crop (arte sem frame) da primeira carta
        cover_image_url: getArtCropUrl(cardToAdd?.image_url) || null,
        coverImage: getArtCropUrl(cardToAdd?.image_url) || null,
      });

      const endTime = performance.now();
      console.log(`✅ Deck criado em ${Math.round(endTime - startTime)}ms:`, newDeck);
      const deckId = newDeck.id;
      
      if (cardToAdd?.image_url) {
        console.log("🎨 Capa do deck definida:", cardToAdd.image_url);
      }

      // 🎴 Se há uma carta para adicionar, redireciona com a carta no state
      // O Deckbuilder fará a adição silenciosa usando a lógica existente
      if (cardToAdd && deckId) {
        console.log("⏳ Aguardando sincronização do cache antes do redirecionamento...");
        // Aguarda um momento para garantir que o deck está no cache
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log("📋 Redirecionando para deck com carta:", cardToAdd.card_name);
        
        // Prepara os dados da carta no formato que o Deckbuilder espera
        const cardForDeckbuilder = {
          id: cardToAdd.scryfall_id,
          name: cardToAdd.card_name,
          image_uris: cardToAdd.image_url ? { normal: cardToAdd.image_url } : undefined,
          card_faces: cardToAdd.card_faces || undefined,
          mana_cost: cardToAdd.mana_cost || "",
          type_line: cardToAdd.type_line || "",
          oracle_text: cardToAdd.oracle_text || "",
        };
        
        console.log("📤 Dados enviados para Deckbuilder:", cardForDeckbuilder);
        
        // Redireciona para o Deckbuilder com a carta no state
        // A lógica de adição otimista do Deckbuilder cuidará do resto
        navigate(`/deckbuilder/${deckId}`, {
          state: {
            addCard: cardForDeckbuilder
          }
        });
      } else {
        console.log("⏳ Aguardando sincronização do cache antes do redirecionamento...");
        // Aguarda um momento para garantir que o deck está no cache
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Se não há carta, apenas navega para o deck vazio
        console.log("📋 Redirecionando para deck vazio");
        navigate(`/deckbuilder/${deckId}`);
      }
    } catch (error) {
      console.error("❌ Erro ao criar deck:", error);
      alert("Erro ao criar deck. Tente novamente.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 p-4">
        <button
          onClick={() => navigate(-1)}
          className="text-orange-500 hover:text-orange-400"
        >
          ← Voltar
        </button>
      </div>

      <div className="flex flex-col items-center text-center px-6">
        <h1 className="text-2xl font-bold">Criar Novo Deck</h1>
        <p className="text-gray-400 mt-1">
          Preencha as informações do seu deck
        </p>
        
        {/* 🎴 Indicador de carta para adicionar */}
        {cardToAdd && (
          <div className="mt-4 bg-orange-500/20 border border-orange-500 rounded-lg px-4 py-2">
            <p className="text-sm text-orange-300">
              🎴 A carta <span className="font-bold">{cardToAdd.card_name}</span> será adicionada ao deck
            </p>
          </div>
        )}
      </div>

      {/* Formulário */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 px-6 mt-8"
      >
        {/* Nome do Deck */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300">Nome do Deck</label>
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="Ex: Dragões Vermelhos"
            className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
          />
        </div>

        {/* Formato */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300">Formato</label>
          <Select 
            value={format} 
            onValueChange={(value) => {
              console.log("🎯 Formato selecionado:", value);
              setFormat(value);
            }}
            onOpenChange={(open) => console.log("📂 Menu aberto:", open)}
          >
            <SelectTrigger className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none">
              <SelectValue placeholder="Selecione o formato" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border border-gray-700 max-h-[300px] overflow-y-auto">
              <SelectItem value="Commander">Commander</SelectItem>
              <SelectItem value="Commander 300">Commander 300</SelectItem>
              <SelectItem value="Commander 500">Commander 500</SelectItem>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Modern">Modern</SelectItem>
              <SelectItem value="Pioneer">Pioneer</SelectItem>
              <SelectItem value="Pauper">Pauper</SelectItem>
              <SelectItem value="Legacy">Legacy</SelectItem>
              <SelectItem value="Coleção de cartas">🎴 Coleção de cartas</SelectItem>
              <SelectItem value="Trades">🔄 Trades</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botão Avançar */}
        <button
          type="submit"
          disabled={isCreating || !deckName || !format}
          className={`mt-6 flex items-center justify-center gap-2 rounded-md px-4 py-2 font-semibold text-white ${
            isCreating || !deckName || !format
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Criando...
            </>
          ) : (
            'Avançar →'
          )}
        </button>
      </form>
    </div>
  );
}

export default CreateDeck;
