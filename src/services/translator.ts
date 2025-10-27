// src/services/translator.ts
import { saveTranslation, getTranslation } from "@/lib/translationCache";

// Tipagem básica da carta do Scryfall
export type ScryfallCard = {
  id: string;
  oracle_id?: string;
  name: string;
  oracle_text?: string;
  printed_name?: string;
  printed_text?: string;
  lang?: string;
  type_line?: string;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
    png?: string;
  };
  card_faces?: Array<{
    name: string;
    oracle_text?: string;
    printed_text?: string;
    printed_name?: string;
    type_line?: string;
    image_uris?: {
      small?: string;
      normal?: string;
      large?: string;
      png?: string;
    };
  }>;
  prints_search_uri: string;
  rulings_uri?: string;
  rulings?: { published_at: string; comment: string; source?: string }[];
};

// Tipagem da lista de resultados do Scryfall
interface ScryfallList<T> {
  object: string;
  total_cards?: number;
  has_more?: boolean;
  next_page?: string;
  data: T[];
}

// --------------------
// Azure Translator API
// --------------------
export async function translateText(text: string, to: string = "pt"): Promise<string> {
  if (!text) return "";
  const endpoint = process.env.REACT_APP_TRANSLATOR_ENDPOINT!;
  const key = process.env.REACT_APP_TRANSLATOR_KEY!;
  const region = process.env.REACT_APP_TRANSLATOR_REGION!;

  const res: Response = await fetch(`${endpoint}translate?api-version=3.0&to=${to}`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Ocp-Apim-Subscription-Region": region,
      "Content-type": "application/json",
    },
    body: JSON.stringify([{ text }]),
  });

  const data: any = await res.json();
  return data?.[0]?.translations?.[0]?.text ?? text;
}

// --------------------
// Função principal
// --------------------
async function findPortugueseEdition(printsSearchUri: string): Promise<ScryfallCard | null> {
  let nextUrl: string | null = printsSearchUri;

  while (nextUrl) {
    const res: Response = await fetch(nextUrl);
    if (!res.ok) break;

    const data: ScryfallList<ScryfallCard> = await res.json();
    const found = data.data.find((c) => c.lang === "pt");
    if (found) return found;

    nextUrl = data.has_more ? data.next_page ?? null : null;
  }

  return null;
}

// --------------------
// Função principal
// --------------------
export async function traduzirCarta(carta: ScryfallCard) {
  const cardId = carta.oracle_id ?? carta.id;
  
  // 🔍 1. Verifica cache do IndexedDB primeiro
  const cached = await getTranslation(cardId, carta.name);
  if (cached) {
    console.log(`💾 Usando tradução em cache: ${carta.name}`);
    return {
      ...carta,
      name: cached.translatedName,
      oracle_text: cached.translatedText,
      card_faces: cached.faces || carta.card_faces,
    };
  }

  // 2. Tenta achar edição em português no Scryfall
  const edicaoPt = await findPortugueseEdition(carta.prints_search_uri);

  if (edicaoPt) {
    // Se achou edição PT, usa o texto traduzido oficial
    const nomeFinal = edicaoPt.printed_name || edicaoPt.name;
    const textoFinal = edicaoPt.printed_text || edicaoPt.oracle_text || "";
    
    // Traduz as faces também, se houver
    let facesTraduzidas = carta.card_faces;
    if (edicaoPt.card_faces && edicaoPt.card_faces.length > 0) {
      facesTraduzidas = edicaoPt.card_faces.map((face) => ({
        ...face,
        name: face.printed_name || face.name,
        oracle_text: face.printed_text || face.oracle_text || "",
      }));
    } else if (carta.card_faces && carta.card_faces.length > 0) {
      // Se a edição PT não tem faces mas a original tem, traduz via Azure
      facesTraduzidas = await Promise.all(
        carta.card_faces.map(async (face) => ({
          ...face,
          name: await translateText(face.name, "pt"),
          oracle_text: await translateText(face.oracle_text ?? "", "pt"),
        }))
      );
    }

    // 💾 Salva no cache do IndexedDB
    await saveTranslation(cardId, carta.name, nomeFinal, textoFinal, facesTraduzidas);

    return {
      ...carta,
      name: nomeFinal,
      oracle_text: textoFinal,
      card_faces: facesTraduzidas,
    };
  }

  // 3. Se não achou edição PT, traduz via Azure
  const payload = [
    { text: carta.name },
    { text: carta.oracle_text ?? "" },
  ];

  const endpoint = process.env.REACT_APP_TRANSLATOR_ENDPOINT!;
  const key = process.env.REACT_APP_TRANSLATOR_KEY!;
  const region = process.env.REACT_APP_TRANSLATOR_REGION!;

  const res: Response = await fetch(`${endpoint}translate?api-version=3.0&to=pt`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Ocp-Apim-Subscription-Region": region,
      "Content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data: any = await res.json();
  const nomeTraduzido = data?.[0]?.translations?.[0]?.text ?? carta.name;
  const textoTraduzido = data?.[1]?.translations?.[0]?.text ?? (carta.oracle_text ?? "");

  // 4. Traduz as faces via Azure se houver
  let facesTraduzidas = carta.card_faces;
  if (carta.card_faces && carta.card_faces.length > 0) {
    facesTraduzidas = await Promise.all(
      carta.card_faces.map(async (face) => {
        const faceNomeTrad = await translateText(face.name, "pt");
        const faceTextoTrad = await translateText(face.oracle_text ?? "", "pt");
        
        return {
          ...face,
          name: faceNomeTrad,
          oracle_text: faceTextoTrad,
        };
      })
    );
  }

  // 💾 Salva tudo no cache do IndexedDB
  await saveTranslation(cardId, carta.name, nomeTraduzido, textoTraduzido, facesTraduzidas);

  return {
    ...carta,
    name: nomeTraduzido ?? carta.name,
    oracle_text: textoTraduzido ?? carta.oracle_text,
    card_faces: facesTraduzidas,
  };
}
