import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Copy, Check } from "lucide-react";

const EXPORT_FORMATS = [
  {
    id: "TEXT_STANDARD",
    name: "Texto Padrão",
    description: "MTG Arena, MTGO, Moxfield, Archidekt"
  },
  {
    id: "PLAIN_TXT_FILE",
    name: "Arquivo .txt",
    description: "Arquivo de texto simples para download"
  },
  {
    id: "CSV_EXPORT",
    name: "Planilha CSV",
    description: "Para Excel, Google Sheets, etc."
  },
  {
    id: "JSON_EXPORT",
    name: "JSON Simples",
    description: "Estrutura JSON básica"
  },
  {
    id: "MTGA_EXPORT",
    name: "MTG Arena",
    description: "Formato nativo do Arena"
  },
  {
    id: "APP_DECK_FILE",
    name: "Aplicativos de Mesa",
    description: "Cockatrice, XMage, Forge"
  },
  {
    id: "API_JSON",
    name: "JSON para API",
    description: "Estrutura para integração com APIs"
  }
];

export default function ExportDeckModal({ isOpen, onClose, deckName, deckFormat, cards }) {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [exportedText, setExportedText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleExport = (formatId) => {
    console.log("📤 Exportando deck:", { formatId, deckName, totalCards: cards.length });
    console.log("📋 Cartas recebidas:", cards.slice(0, 3)); // Log das primeiras 3 cartas para debug
    
    setSelectedFormat(formatId);
    const text = generateExport(formatId, deckName, deckFormat, cards);
    console.log("✅ Texto gerado (primeiros 200 chars):", text.substring(0, 200));
    setExportedText(text);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extension = selectedFormat === "CSV_EXPORT" ? "csv" : 
                     selectedFormat === "JSON_EXPORT" || selectedFormat === "API_JSON" ? "json" : "txt";
    const blob = new Blob([exportedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deckName}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBack = () => {
    setSelectedFormat(null);
    setExportedText("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Download className="w-6 h-6 text-blue-500" />
              <div>
                <h2 className="text-xl font-bold text-white">Exportar Deck</h2>
                <p className="text-sm text-gray-400">{deckName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {!selectedFormat ? (
              /* Format Selection */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EXPORT_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => handleExport(format.id)}
                    className="p-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-500 rounded-xl transition-all text-left group"
                  >
                    <div className="flex flex-col gap-2">
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {format.name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {format.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Export Preview */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleBack}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    ← Voltar aos formatos
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      <span className="text-sm">{copied ? "Copiado!" : "Copiar"}</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Baixar</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-950 border border-gray-700 rounded-lg p-4 overflow-auto max-h-[500px]">
                  <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                    {exportedText}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Função para gerar exportação baseada no formato
function generateExport(formatId, deckName, deckFormat, cards) {
  console.log("🔍 Gerando exportação:", { formatId, deckName, cards: cards.length });
  
  switch (formatId) {
    case "TEXT_STANDARD":
    case "PLAIN_TXT_FILE":
      return generateTextStandard(cards);
      
    case "CSV_EXPORT":
      return generateCSV(cards);
      
    case "JSON_EXPORT":
      return generateJSONExport(deckName, cards);
      
    case "MTGA_EXPORT":
      return generateMTGAExport(cards);
      
    case "APP_DECK_FILE":
      return generateAppDeckFile(cards);
      
    case "API_JSON":
      return generateAPIJSON(deckName, deckFormat, cards);
      
    default:
      return "Formato não implementado";
  }
}

function generateTextStandard(cards) {
  let output = "";
  
  cards.forEach(card => {
    const quantity = card.quantity || 1;
    output += `${quantity} ${card.card_name || card.name}\n`;
  });
  
  return output.trim();
}

function generateCSV(cards) {
  let csv = "Quantity,Name,Set,CollectorNumber\n";
  cards.forEach(card => {
    const name = card.card_name || card.name || "Unknown";
    const set = card.set || "";
    const number = card.collector_number || "";
    const quantity = card.quantity || 1;
    csv += `${quantity},${name},${set},${number}\n`;
  });
  return csv;
}

function generateJSONExport(deckName, cards) {
  const cardList = cards.map(card => ({
    name: card.card_name || card.name,
    quantity: card.quantity || 1
  }));
  
  return JSON.stringify({ deck_name: deckName, cards: cardList }, null, 2);
}

function generateMTGAExport(cards) {
  let output = "Deck\n";
  cards.forEach(card => {
    const name = card.card_name || card.name;
    const quantity = card.quantity || 1;
    const set = card.set ? ` (${card.set.toUpperCase()})` : "";
    const number = card.collector_number ? ` ${card.collector_number}` : "";
    output += `${quantity} ${name}${set}${number}\n`;
  });
  return output;
}

function generateAppDeckFile(cards) {
  let output = "";
  
  cards.forEach(card => {
    const name = card.card_name || card.name;
    const quantity = card.quantity || 1;
    output += `${quantity} ${name}\n`;
  });
  
  return output.trim();
}

function generateAPIJSON(deckName, deckFormat, cards) {
  const cardList = cards.map(card => ({
    id: card.scryfall_id || card.id || "",
    name: card.card_name || card.name,
    qty: card.quantity || 1
  }));
  
  return JSON.stringify({
    deck_name: deckName,
    format: deckFormat,
    cards: cardList
  }, null, 2);
}
