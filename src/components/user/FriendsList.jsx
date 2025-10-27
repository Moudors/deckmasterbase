import React from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { updateDocSilent } from "@/lib/firestoreSilent";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FriendsList({ user }) {
  const [friends, setFriends] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchFriends = async () => {
      if (!user?.friends || user.friends.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      const querySnapshot = await getDocs(collection(db, "users"));
      const allUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const userFriends = allUsers.filter(u => user.friends.includes(u.id));
      setFriends(userFriends);
      setLoading(false);
    };

    fetchFriends();
  }, [user?.friends]);

  const handleRemoveFriend = async (friendId) => {
    await updateDocSilent("users", user.id, {
      friends: user.friends.filter(id => id !== friendId),
    });
    setFriends(prev => prev.filter(f => f.id !== friendId));
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleFriendClick = (friend) => {
    navigate(createPageUrl("FriendDecks") + `?friendId=${friend.id}&friendName=${encodeURIComponent(friend.displayName)}`);
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-gray-400" />
        <h3 className="font-semibold text-white">Meus Amigos</h3>
        <span className="text-xs text-gray-500">({friends.length})</span>
      </div>

      <ScrollArea className="h-64 rounded-lg border border-gray-800">
        {loading ? (
          <div className="flex items-center justify-center h-full">Carregando...</div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Users className="w-12 h-12 text-gray-600 mb-2" />
            <p className="text-gray-500 text-sm">Nenhum amigo adicionado</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {friends.map((friend) => (
              <motion.div key={friend.id} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                <div className="flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg group">
                  <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleFriendClick(friend)}>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {getInitials(friend.displayName || friend.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{friend.displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{friend.email}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-orange-500 transition-colors flex-shrink-0" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFriend(friend.id)}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/20 hover:text-red-400"
                  >
                    🗑️
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}