import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";

// Se futuramente quiser salvar trades no Firestore:
// import { db } from "@/api/firebase";
// import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function TradeConfirmDialog({ isOpen, onClose, card, onConfirm }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="bg-gray-900 border-gray-800 text-white w-[95vw] max-w-[400px] px-5 py-5 rounded-xl m-auto" style={{ borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.4)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ArrowLeftRight className="w-5 h-5 text-purple-500" />
            Oferecer Trade
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-400">
            Confirmar que tenho esta carta disponível para trade?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={card?.image_url}
              alt={card?.card_name}
              className="w-24 h-auto rounded-lg"
              loading="lazy"
              decoding="async"
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
            <div>
              <h3 className="font-semibold text-white mb-1">{card?.card_name}</h3>
              <p className="text-sm text-gray-400">{card?.type_line}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Não
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            Sim, Oferecer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
