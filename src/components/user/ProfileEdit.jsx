import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { updateDocSilent } from "@/lib/firestoreSilent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, AlertCircle } from "lucide-react";

// 🔗 Import da função que garante unicidade do username
import { updateUsername } from "@/utils/userUtils"; 

export default function ProfileEdit({ userId, onClose }) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const userRef = doc(db, "users", userId);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDisplayName(data.display_name || "");
          setUsername(data.username || "");
          setBio(data.bio || "");
        }
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username.trim()) {
      setError("O username não pode estar vazio");
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username.trim())) {
      setError("Username deve ter 3-20 caracteres (letras, números, _ ou -)");
      return;
    }

    try {
      // Atualiza username garantindo unicidade
      await updateUsername(userId, username.trim());

      // Atualiza outros campos do perfil
      await updateDocSilent("users", userId, {
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
      });

      setSuccess("Perfil atualizado com sucesso!");
      setTimeout(() => {
        setSuccess(null);
        onClose?.();
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao atualizar perfil");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName" className="text-gray-300">Nome de Exibição</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Como você quer ser chamado"
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username" className="text-gray-300">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder="seu_username_unico"
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio" className="text-gray-300">Biografia</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Conte um pouco sobre você..."
          className="bg-gray-800 border-gray-700 text-white resize-none h-20"
        />
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-900/20 border-green-800">
          <Check className="h-4 w-4" />
          <AlertDescription className="text-xs text-green-400">{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-orange-500 hover:bg-orange-600"
        >
          Salvar
        </Button>
      </div>
    </form>
  );
}
