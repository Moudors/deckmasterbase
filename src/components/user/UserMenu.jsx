import React, { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Users,
  Copy,
  Check,
  UserPlus,
  LogOut,
  MessageSquare,
  Edit,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import MessagesPanel from "./MessagesPanel";
import FriendsList from "./FriendsList";
import ProfileEdit from "./ProfileEdit";

import { auth, db } from "@/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  // onSnapshot removido - usando React Query agora
} from "@/firebase";
import { addDocSilent } from "@/lib/firestoreSilent";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function UserMenu() {
  const [friendId, setFriendId] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showMessagesPanel, setShowMessagesPanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const navigate = useNavigate();

  // ✅ Current User - React Query ao invés de onSnapshot (economia de ~10.800 leituras/hora)
  const { data: user } = useQuery({
    queryKey: ["currentUser", auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser) return null;
      const userRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(userRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutos
    refetchInterval: 5 * 60 * 1000, // Polling a cada 5 minutos (ao invés de tempo real)
    enabled: !!auth.currentUser,
  });

  // ✅ All Users - Cacheia por 30 minutos (economia de N leituras por abertura)
  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const usersSnap = await getDocs(collection(db, "users"));
      return usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    staleTime: 30 * 60 * 1000, // Cache 30 minutos
    gcTime: 60 * 60 * 1000, // Garbage collect após 1 hora
  });

  // ✅ Messages - Só busca quando painel está ABERTO (economia de ~3.600 leituras/hora quando fechado)
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const q = query(collection(db, "messages"), where("recipient_id", "==", user.id));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    staleTime: 2 * 60 * 1000, // Cache 2 minutos
    refetchInterval: showMessagesPanel ? 30 * 1000 : false, // Polling apenas quando painel aberto
    enabled: !!user?.id && showMessagesPanel, // SÓ busca se painel está aberto
  });

  const unreadCount = messages.filter((m) => !m.read).length;

  const handleCopyId = () => {
    const idToCopy = user?.username || user?.uuid || user?.id;
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddFriend = async () => {
    setError(null);
    setSuccess(null);
    const searchInput = friendId.trim();
    if (!searchInput) {
      setError("Por favor, insira um ID ou username");
      return;
    }

    try {
      const searchLower = searchInput.toLowerCase();
      const friendUser = allUsers.find(
        (u) =>
          u.id === searchInput ||
          u.uuid === searchInput ||
          (u.username && u.username.toLowerCase() === searchLower)
      );

      if (!friendUser) {
        setError(`Usuário não encontrado: "${searchInput}"`);
        return;
      }

      if (friendUser.id === user.id) {
        setError("Você não pode adicionar a si mesmo");
        return;
      }

      if (user.friends?.includes(friendUser.id)) {
        setError("Este usuário já está na sua lista de amigos");
        return;
      }

      await addDocSilent("messages", {
        recipient_id: friendUser.id,
        sender_id: user.id,
        sender_name: user.display_name || user.full_name || user.email,
        message: `${user.display_name || user.full_name || user.email} quer adicionar você como amigo.`,
        type: "friend_request",
        status: "pending",
        created_at: new Date(),
      });

      setSuccess("Solicitação de amizade enviada com sucesso!");
      setFriendId("");
    } catch (err) {
      console.error(err);
      setError(`Erro: ${err.message || "Não foi possível enviar a solicitação"}`);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayUserName = user?.display_name || user?.full_name;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full border-2 border-gray-700 hover:border-orange-500 transition-colors"
        >
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-500 text-white text-xs">
              {unreadCount}
            </Badge>
          )}
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-purple-600 text-white font-semibold">
              {getInitials(displayUserName || user?.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-96 bg-gray-900 border-gray-800 text-white p-4"
        align="end"
      >
        {/* User Info */}
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-purple-600 text-white font-semibold text-lg">
              {getInitials(displayUserName || user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{displayUserName}</p>
            <p className="text-sm text-gray-400 truncate">{user?.email}</p>
            {user?.bio && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{user.bio}</p>
            )}
            {user?.role === "admin" && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                Admin
              </span>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="bg-gray-800 mb-4" />

        {/* Tabs */}
        <Tabs 
          defaultValue="profile" 
          className="w-full"
          onValueChange={(value) => {
            // Ativa busca de mensagens APENAS quando aba é aberta
            setShowMessagesPanel(value === "messages");
          }}
        >
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="profile" className="data-[state=active]:bg-gray-700">
              <User className="w-4 h-4 mr-1" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="friends" className="data-[state=active]:bg-gray-700">
              <Users className="w-4 h-4 mr-1" />
              Amigos
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="data-[state=active]:bg-gray-700 relative"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Mensagens
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 bg-orange-500 text-white text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

                    {/* Perfil */}
          <TabsContent value="profile" className="space-y-4 pt-4">
            {!showEditProfile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-400">Username</Label>
                  <span className="text-sm text-gray-200">
                    {user?.username || (
                      <span className="italic text-gray-500">
                        (use seu UUID até definir um username)
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-gray-400">UUID</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 truncate max-w-[140px]">
                      {user?.uuid || user?.id}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCopyId}
                      className="h-6 w-6 text-gray-400 hover:text-white"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() => setShowEditProfile(true)}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              </div>
            ) : (
              <ProfileEdit
                userId={user?.id}
                onClose={() => setShowEditProfile(false)}
              />
            )}
          </TabsContent>

          {/* Amigos */}
          <TabsContent value="friends" className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddFriend(!showAddFriend)}
                className="flex items-center gap-2 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <UserPlus className="w-4 h-4" />
                Adicionar Amigo
              </Button>
            </div>

            <AnimatePresence>
              {showAddFriend && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="friendId" className="text-gray-300">
                      ID, UUID ou Username
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="friendId"
                        value={friendId}
                        onChange={(e) => setFriendId(e.target.value)}
                        placeholder="Digite o identificador do amigo"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <Button
                        onClick={handleAddFriend}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        Enviar
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-800">
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-900/20 border-green-800">
                <AlertDescription className="text-xs text-green-400">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <FriendsList userId={user?.id} />
          </TabsContent>

          {/* Mensagens */}
          <TabsContent value="messages" className="pt-4">
            <MessagesPanel userId={user?.id} />
          </TabsContent>
        </Tabs>

        <DropdownMenuSeparator className="bg-gray-800 my-4" />

        {/* Botão Sair */}
        <Button
          variant="ghost"
          onClick={async () => {
            await auth.signOut();
            navigate("/login");
          }}
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
