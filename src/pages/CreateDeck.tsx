// src/pages/CreateDeck.tsx - Online-First Version
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthState } from "../hooks/useAuthState";
import { useConnectivity } from "@/lib/connectivityManager";
import { deckOperations } from "@/lib/supabaseOperations";
import { supabase } from "@/supabase";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CardToAdd {
  card_name: string;
  scryfall_id: string;
  image_url: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  card_faces?: any;
}

interface LocationState {
  cardToAdd?: CardToAdd;
}

const CreateDeck = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState();
  const { isOnline, canSaveData } = useConnectivity();
  const queryClient = useQueryClient();

  const [deckName, setDeckName] = useState("");
  const [format, setFormat] = useState("commander");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const cardToAdd = (location.state as LocationState)?.cardToAdd;

  // 🎨 Helper para converter URL para art_crop (arte sem frame)
  const getArtCropUrl = (imageUrl: string | undefined) => {
    if (!imageUrl) return null;
    if (imageUrl.includes("/normal/")) {
      return imageUrl.replace("/normal/", "/art_crop/");
    }
    return imageUrl;
  };

  // Bloqueia criação de deck se estiver offline
  useEffect(() => {
    if (!canSaveData) {
      setError("Criação de decks não disponível offline. Conecte-se à internet.");
    } else {
      setError("");
    }
  }, [canSaveData]);

  // Monitora o erro da criação
  useEffect(() => {
    if (error) {
      console.error("❌ Erro na criação:", error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckName || !format) return;

    if (!canSaveData) {
      setError("Não é possível criar decks offline. Conecte-se à internet.");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      console.log("🔧 Criando deck online...");
      
      // 🔍 Obter o usuário autenticado do Supabase
      const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !supabaseUser) {
        throw new Error("Usuário não autenticado no Supabase. Faça login novamente.");
      }
      
      console.log("👤 Usuário autenticado:", supabaseUser.email, "ID:", supabaseUser.id);
      
      // 🔒 Verificação de formatos especiais (apenas um por usuário)
      if (format === "Coleção de cartas" || format === "Trades") {
        console.log("🔍 Verificando duplicata de formato especial:", format);
        
        const { data: existingDecks, error: queryError } = await supabase
          .from("decks")
          .select("id, name, format")
          .eq("owner_id", supabaseUser.id)
          .eq("format", format);
        
        if (queryError) {
          console.error("❌ Erro ao verificar duplicata:", queryError);
        }
        
        if (existingDecks && existingDecks.length > 0) {
          const message = format === "Coleção de cartas" 
            ? "Você já tem uma Coleção de cartas criada" 
            : "Você já tem um deck de Trades criado";
          
          console.log("⚠️ Formato especial duplicado detectado:", existingDecks[0]);
          navigate("/", { state: { message, type: "warning" } });
          return;
        }
      }
      
      // 🎯 Cria o deck ONLINE diretamente
      const newDeck = await deckOperations.createDeck({
        name: deckName,
        format,
        owner_id: supabaseUser.id, // Usar o ID do Supabase Auth
        // 🎨 Define a capa como art_crop (arte sem frame) da primeira carta
        cover_image_url: getArtCropUrl(cardToAdd?.image_url) || "",
      });

      console.log("✅ Deck criado online com sucesso:");
      console.log("   ID:", newDeck.id);
      console.log("   Nome:", newDeck.name);
      console.log("   Formato:", newDeck.format);
      console.log("   Owner ID:", newDeck.owner_id);
      console.log("   Deck completo:", newDeck);
      
      if (cardToAdd?.image_url) {
        console.log("🎨 Capa do deck definida:", cardToAdd.image_url);
      }

      // Invalida o cache de decks para forçar atualização
      await queryClient.invalidateQueries({ queryKey: ["decks"] });
      console.log("🔄 Cache de decks invalidado");
      
      // Força o refetch dos decks
      await queryClient.refetchQueries({ queryKey: ["decks"] });
      console.log("🔄 Decks recarregados");

      // 🎴 Se for Coleção de cartas, redireciona para a página Collection
      if (format === "Coleção de cartas") {
        console.log("📚 Redirecionando para página Collection");
        // Aguarda mais tempo para garantir que o deck está carregado
        await new Promise(resolve => setTimeout(resolve, 2000));
        navigate("/collection");
        return;
      }

      // 🎴 Se há uma carta para adicionar, redireciona com a carta no state
      if (cardToAdd && newDeck.id) {
        console.log("🎯 Redirecionando para deck com carta:", cardToAdd.card_name);
        
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
        navigate(`/deckbuilder/${newDeck.id}`, {
          state: {
            addCard: cardForDeckbuilder
          }
        });
      } else {
        // Se não há carta, apenas navega para o deck vazio
        navigate(`/deckbuilder/${newDeck.id}`);
      }
    } catch (error: any) {
      console.error("❌ Erro ao criar deck:", error);
      setError(error.message || "Erro ao criar deck. Tente novamente.");
    } finally {
      setIsCreating(false);
    }
  };

  // Se não há usuário logado, verifica pelo Supabase Auth
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setAuthChecked(true);
    };
    
    checkAuth();
  }, []);

  if (!authChecked) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Você precisa estar logado para criar decks</p>
          <button 
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-4">
        <button
          onClick={() => navigate(-1)}
          className="text-orange-500 hover:text-orange-400"
        >
          ← Voltar
        </button>
        
        {/* Status de conectividade */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-sm">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
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

        {/* Aviso de offline */}
        {!canSaveData && (
          <div className="mt-4 bg-red-500/20 border border-red-500 rounded-lg px-4 py-2">
            <p className="text-sm text-red-300">
              ⚠️ Criação de decks indisponível offline. Conecte-se à internet.
            </p>
          </div>
        )}

        {/* Mensagem de erro */}
        {error && (
          <div className="mt-4 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center px-6">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nome do Deck
            </label>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Digite o nome do deck..."
              required
              disabled={!canSaveData || isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Formato
            </label>
            <Select value={format} onValueChange={setFormat} disabled={!canSaveData || isCreating}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-600">
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent 
                className="bg-gray-800 border-gray-600 max-h-[300px] overflow-y-auto" 
                position="popper"
                side="bottom" 
                align="start"
                sideOffset={5}
                avoidCollisions={false}
              >
                <SelectItem value="commander">Commander</SelectItem>
                <SelectItem value="commander 300">Commander 300</SelectItem>
                <SelectItem value="commander 500">Commander 500</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="legacy">Legacy</SelectItem>
                <SelectItem value="vintage">Vintage</SelectItem>
                <SelectItem value="pauper">Pauper</SelectItem>
                <SelectItem value="historic">Historic</SelectItem>
                <SelectItem value="pioneer">Pioneer</SelectItem>
                <SelectItem value="alchemy">Alchemy</SelectItem>
                <SelectItem value="brawl">Brawl</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="Coleção de cartas">Coleção de cartas</SelectItem>
                <SelectItem value="Trades">Trades</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button
            type="submit"
            disabled={!deckName || !format || !canSaveData || isCreating}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            {isCreating ? "Criando..." : "Criar Deck"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateDeck;