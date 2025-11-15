import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";

export default function ImportDeckModal({ isOpen, onClose, onImport }) {
  const [deckText, setDeckText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState("");

  const detectFormat = (text) => {
    const trimmed = text.trim();
    
    // JSON Format
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        JSON.parse(trimmed);
        return 'JSON';
      } catch {
        return 'UNKNOWN';
      }
    }
    
    // CSV Format
    if (trimmed.includes(',') && trimmed.split('\n')[0].toLowerCase().includes('quantity')) {
      return 'CSV';
    }
    
    // MTGA Format (começa com "Deck")
    if (trimmed.startsWith('Deck\n') || trimmed.startsWith('Deck\r\n')) {
      return 'MTGA';
    }
    
    // APP_DECK_FILE Format (tem categorias entre colchetes)
    if (trimmed.includes('[') && trimmed.includes(']') && /\[.*\]/m.test(trimmed)) {
      return 'APP_DECK_FILE';
    }
    
    // TEXT_STANDARD Format (tem categorias com contagem)
    if (/\w+\s*\(\d+\)/m.test(trimmed)) {
      return 'TEXT_STANDARD';
    }
    
    // PLAIN_TXT_FILE Format (lista simples)
    return 'PLAIN_TEXT';
  };

  const parseJSON = (text) => {
    const data = JSON.parse(text);
    const cards = [];
    
    // API_JSON format
    if (data.deck_name && data.cards) {
      data.cards.forEach(card => {
        cards.push({
          name: card.name,
          quantity: card.qty || card.quantity || 1
        });
      });
    }
    // JSON_EXPORT format
    else if (data.commander || Array.isArray(data.cards)) {
      if (data.commander) {
        cards.push({ name: data.commander, quantity: 1 });
      }
      data.cards?.forEach(card => {
        cards.push({
          name: card.name,
          quantity: card.quantity || 1
        });
      });
    }
    // Array direto
    else if (Array.isArray(data)) {
      data.forEach(card => {
        cards.push({
          name: card.name || card.card_name,
          quantity: card.quantity || card.qty || 1
        });
      });
    }
    
    return cards;
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const cards = [];
    
    // Pular header
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 2) {
        const quantity = parseInt(parts[0].trim()) || 1;
        const name = parts[1].trim();
        if (name) {
          cards.push({ name, quantity });
        }
      }
    }
    
    return cards;
  };

  const parseMTGA = (text) => {
    const lines = text.trim().split('\n');
    const cards = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'Deck') continue;
      
      // Formato SIMPLIFICADO: pega APENAS quantidade + nome da carta
      // Ignora tudo depois do nome (set, número, *F*, etc)
      // Exemplos:
      //   "4 Lightning Bolt (LEA) 162" -> 4x "Lightning Bolt"
      //   "1 K'rrik, Son of Yawgmoth (MH3) 274" -> 1x "K'rrik, Son of Yawgmoth"
      //   "16 Swamp (PALP) 10" -> 16x "Swamp"
      
      // Pega: quantidade + tudo até encontrar " (" (espaço + parêntese)
      const match = trimmed.match(/^(\d+)\s+(.+?)(?:\s+\(|$)/);
      if (match) {
        const quantity = parseInt(match[1]);
        const name = match[2].trim();
        cards.push({ name, quantity });
        console.log(`✅ [PARSE MTGA] ${quantity}x ${name}`);
      } else {
        console.warn(`⚠️ [PARSE MTGA] Linha não parseada:`, trimmed);
      }
    }
    
    console.log(`📊 [PARSE MTGA] Total parseado: ${cards.length} cartas únicas`);
    const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0);
    console.log(`📊 [PARSE MTGA] Total de cartas: ${totalCards} (incluindo cópias)`);
    return cards;
  };

  const parseAppDeckFile = (text) => {
    const lines = text.trim().split('\n');
    const cards = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('[')) continue;
      
      // Formato: "4 Lightning Bolt"
      const match = trimmed.match(/^(\d+)\s+(.+)$/);
      if (match) {
        const quantity = parseInt(match[1]);
        const name = match[2].trim();
        cards.push({ name, quantity });
      }
    }
    
    return cards;
  };

  const parseTextStandard = (text) => {
    const lines = text.trim().split('\n');
    const cards = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Pular linhas de categoria "Creatures (10)"
      if (/^\w+\s*\(\d+\)$/.test(trimmed)) continue;
      
      // Formato: "4 Lightning Bolt" ou "4x Lightning Bolt"
      const match = trimmed.match(/^(\d+)x?\s+(.+)$/);
      if (match) {
        const quantity = parseInt(match[1]);
        const name = match[2].trim();
        cards.push({ name, quantity });
      }
    }
    
    return cards;
  };

  const parsePlainText = (text) => {
    const lines = text.trim().split('\n');
    const cards = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Formato: "4 Lightning Bolt" ou "4x Lightning Bolt" ou "4 Card (SET) 123"
      // Pega quantidade + nome, ignora tudo depois de " (" se existir
      const match = trimmed.match(/^(\d+)x?\s+(.+?)(?:\s+\(|$)/);
      
      if (match) {
        const quantity = parseInt(match[1]);
        const name = match[2].trim();
        cards.push({ name, quantity });
      } else {
        // Se não tiver quantidade, assume 1 e remove qualquer " (SET)" do final
        const nameOnly = trimmed.replace(/\s+\(.+$/, '').trim();
        cards.push({ name: nameOnly, quantity: 1 });
      }
    }
    
    return cards;
  };

  const handleImport = async () => {
    if (!deckText.trim()) return;

    setIsImporting(true);
    try {
      const format = detectFormat(deckText);
      let cards = [];

      console.log("📥 Formato detectado:", format);

      switch (format) {
        case 'JSON':
          cards = parseJSON(deckText);
          break;
        case 'CSV':
          cards = parseCSV(deckText);
          break;
        case 'MTGA':
          cards = parseMTGA(deckText);
          break;
        case 'APP_DECK_FILE':
          cards = parseAppDeckFile(deckText);
          break;
        case 'TEXT_STANDARD':
          cards = parseTextStandard(deckText);
          break;
        case 'PLAIN_TEXT':
        default:
          cards = parsePlainText(deckText);
          break;
      }

      console.log("📋 Cartas a importar:", cards);
      
      if (cards.length === 0) {
        alert("Nenhuma carta foi detectada. Verifique o formato.");
        setIsImporting(false);
        return;
      }

      await onImport?.(cards);
      
      // Limpar e fechar
      setDeckText("");
      setDetectedFormat("");
      onClose();
    } catch (error) {
      console.error("❌ Erro ao importar deck:", error);
      alert("Erro ao importar: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleTextChange = (text) => {
    setDeckText(text);
    if (text.trim()) {
      const format = detectFormat(text);
      setDetectedFormat(format);
    } else {
      setDetectedFormat("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <Upload className="w-5 h-5 text-orange-500" />
            Importar Deck
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-2">✨ Formatos Suportados:</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• <strong>Texto Padrão:</strong> 4 Lightning Bolt</li>
              <li>• <strong>MTG Arena:</strong> Deck\n4 Lightning Bolt (LEA) 162</li>
              <li>• <strong>JSON:</strong> {`{"cards": [{"name": "...", "quantity": 4}]}`}</li>
              <li>• <strong>CSV:</strong> Quantity,Name,Set,CollectorNumber</li>
              <li>• <strong>App Deck File:</strong> [Creatures]\n4 Lightning Bolt</li>
            </ul>
          </div>

          {detectedFormat && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Formato detectado:</span>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded font-semibold">
                {detectedFormat}
              </span>
            </div>
          )}

          <textarea
            value={deckText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Cole aqui qualquer formato de deck lista...&#10;&#10;Exemplo:&#10;4 Lightning Bolt&#10;2 Counterspell&#10;1 Black Lotus"
            className="w-full h-80 px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none font-mono text-sm"
          />

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isImporting}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || !deckText.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                "Concluir"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
