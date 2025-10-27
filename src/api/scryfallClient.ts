// src/api/scryfallClient.ts
export interface ScryfallCardFace {
  name: string;
  type_line: string;
  text: string;
  rules: string;
  imageUrl: string;
}

export interface CardResult {
  faces: ScryfallCardFace[];
}

// Autocomplete usando Scryfall
export async function getAutocomplete(query: string): Promise<string[]> {
  const url = `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao buscar sugestões");
  const data = await res.json();
  return data.data || [];
}

// Buscar carta pelo nome
export async function getCardByName(name: string): Promise<CardResult> {
  const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Carta não encontrada");

  const data = await res.json();

  // Tratar cartas de duas faces
  const faces: ScryfallCardFace[] = [];

  if (data.card_faces && Array.isArray(data.card_faces)) {
    for (const face of data.card_faces) {
      faces.push({
        name: face.name,
        type_line: face.type_line,
        text: face.oracle_text || "",
        rules: (face.oracle_text || ""), // pode ser ajustado para regras adicionais
        imageUrl: face.image_uris?.normal || "",
      });
    }
  } else {
    faces.push({
      name: data.name,
      type_line: data.type_line,
      text: data.oracle_text || "",
      rules: data.oracle_text || "",
      imageUrl: data.image_uris?.normal || "",
    });
  }

  return { faces };
}
